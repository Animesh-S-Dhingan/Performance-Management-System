import React, { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';

const ChatPage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [chatMode, setChatMode] = useState(null); // 'person' or 'bot'
    const [activeContact, setActiveContact] = useState(null); // 'bot' or user_id
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    
    // File and Voice
    const [attachedFile, setAttachedFile] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Mentions
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const inputRef = useRef(null);
    
    // Reactions
    const [hoveringMsgId, setHoveringMsgId] = useState(null);
    const [reactingToMessageId, setReactingToMessageId] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        client.get('/users/').then(res => setUsers(res.data.results || res.data));
        fetchMessages();

        // Check if we came from the floating button
        if (localStorage.getItem('autoOpenBot') === 'true') {
            setChatMode('bot');
            setActiveContact('bot');
            localStorage.removeItem('autoOpenBot');
        }
    }, []);

    const fetchMessages = async () => {
        const res = await client.get('/chat/');
        setMessages(res.data.results || res.data);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeContact]);

    const handleSend = async () => {
        if (!inputText.trim() && !attachedFile) return;

        const formData = new FormData();
        formData.append('text', inputText);
        if (attachedFile) {
            formData.append('file_attachment', attachedFile);
        }

        try {
            if (activeContact === 'bot') {
                const res = await client.post('/chat/bot/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                setMessages(prev => [...prev, res.data.user_message, res.data.bot_message]);
            } else {
                formData.append('receiver', activeContact);
                const res = await client.post('/chat/', formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                setMessages(prev => [...prev, res.data]);
            }
            setInputText('');
            setAttachedFile(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleVoiceRecord = async () => {
        if (isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        } else {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const formData = new FormData();
                formData.append('voice_note', audioBlob, 'voice.webm');
                if (activeContact !== 'bot') {
                    formData.append('receiver', activeContact);
                } else {
                    formData.append('text', '🎤 Voice message');
                }
                
                try {
                    const endpoint = activeContact === 'bot' ? '/chat/bot/' : '/chat/';
                    const res = await client.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
                    if (activeContact === 'bot') {
                        setMessages(prev => [...prev, res.data.user_message, res.data.bot_message]);
                    } else {
                        setMessages(prev => [...prev, res.data]);
                    }
                } catch(err) { console.error(err); }
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorder.start();
            setIsRecording(true);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);

        const lastWord = val.split(' ').pop();
        if (lastWord.startsWith('@')) {
            setMentionSearch(lastWord.slice(1).toLowerCase());
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (username) => {
        const words = inputText.split(' ');
        words.pop();
        words.push(`@${username} `);
        setInputText(words.join(' '));
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const handleReact = async (msgId, emojiStr) => {
        try {
            const payload = emojiStr ? { emoji: emojiStr } : {};
            const res = await client.post(`/chat/${msgId}/react/`, payload);
            setMessages(prev => {
                const updated = prev.map(m => m.id === msgId ? res.data.message : m);
                if (res.data.bot_reply) {
                    updated.push(res.data.bot_reply);
                }
                return updated;
            });
            setReactingToMessageId(null);
        } catch(err) { console.error(err); }
    };

    const filteredMessages = messages.filter(m => {
        if (!activeContact) return false;
        if (activeContact === 'bot') return m.is_bot || (m.receiver === null && !m.is_bot);
        return (m.sender === activeContact || m.receiver === activeContact) && !m.is_bot;
    });

    const renderChatArea = () => (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: 'white' }}>
            {/* Header with Back button */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button 
                    onClick={() => { setChatMode(null); setActiveContact(null); }} 
                    style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', fontSize: '1.25rem', cursor: 'pointer', padding: '0.25rem 0.5rem', borderRadius: '8px' }}
                    title="Back to options"
                >
                    ⬅
                </button>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                    {activeContact === 'bot' 
                        ? '🧠 Performance AI Intelligence' 
                        : activeContact 
                            ? users.find(u => u.id === activeContact)?.first_name + ' ' + users.find(u => u.id === activeContact)?.last_name 
                            : 'Select a Contact'}
                </h3>
            </div>

            {/* Messages Feed */}
            {activeContact ? (
                <>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {filteredMessages.map(m => {
                            const isMe = m.sender === user.id && !m.is_bot;
                            return (
                                <div key={m.id} 
                                     onMouseEnter={() => setHoveringMsgId(m.id)}
                                     onMouseLeave={() => setHoveringMsgId(null)}
                                     style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', position: 'relative', paddingLeft: isMe ? '48px' : '0px', paddingRight: isMe ? '0px' : '48px' }}>
                                    
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', textAlign: isMe ? 'right' : 'left' }}>
                                        {m.is_bot ? 'Intelligence Bot' : m.sender_name} • {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <div style={{
                                            backgroundColor: isMe ? 'var(--primary)' : 'white',
                                            color: isMe ? 'white' : '#1e293b',
                                            padding: '1rem',
                                            borderRadius: '16px',
                                            borderBottomRightRadius: isMe ? '0' : '16px',
                                            borderBottomLeftRadius: !isMe ? '0' : '16px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                            lineHeight: 1.5
                                        }}>
                                            {m.text && <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>}
                                            {m.file_attachment && (
                                                <a href={m.file_attachment} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: isMe ? 'white' : 'var(--primary)', textDecoration: 'underline' }}>
                                                    📎 View Attachment
                                                </a>
                                            )}
                                            {m.voice_note && (
                                                <audio controls src={m.voice_note} style={{ marginTop: '0.5rem', maxHeight: '40px', maxWidth: '100%' }} />
                                            )}
                                        </div>

                                        {/* Hover Reaction Button */}
                                        <div 
                                            onClick={() => setReactingToMessageId(reactingToMessageId === m.id ? null : m.id)}
                                            style={{ 
                                                position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                                                right: isMe ? 'auto' : '-40px', left: isMe ? '-40px' : 'auto',
                                                display: (hoveringMsgId === m.id || reactingToMessageId === m.id) ? 'flex' : 'none',
                                                alignItems: 'center', justifyContent: 'center',
                                                background: 'white', border: '1px solid var(--border)', borderRadius: '50%',
                                                width: '24px', height: '24px', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                                                fontSize: '0.85rem', color: '#64748b', zIndex: 10
                                            }}
                                            title="React"
                                        >
                                            ☺
                                        </div>

                                        {/* Reactions display */}
                                        {m.reactions && Object.keys(m.reactions).length > 0 && (
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '-8px', marginBottom: '8px', zIndex: 5, position: 'absolute', bottom: '-16px', right: isMe ? '10px' : 'auto', left: isMe ? 'auto' : '10px' }}>
                                                {Object.entries(m.reactions).map(([uid, emo]) => (
                                                    <span key={uid} onClick={() => uid === String(user.id) && handleReact(m.id, null)} 
                                                          style={{ background: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '0.85rem', border: '1px solid var(--border)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: uid === String(user.id) ? 'pointer' : 'default' }}>
                                                        {emo}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Emoji Picker Popup */}
                                        {reactingToMessageId === m.id && (
                                            <div 
                                                onMouseLeave={() => setReactingToMessageId(null)}
                                                style={{ position: 'absolute', zIndex: 30, top: '65%', right: isMe ? '25px' : 'auto', left: isMe ? 'auto' : '25px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', padding: '0px' }}>
                                                <EmojiPicker onEmojiClick={(em) => handleReact(m.id, em.emoji)} width={280} height={320} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Mentions Dropdown */}
                    {showMentions && (
                        <div style={{ position: 'absolute', bottom: '90px', left: '24px', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '250px', overflowY: 'auto', width: '300px' }}>
                            <div style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', backgroundColor: '#f8fafc' }}>
                                Tag a person
                            </div>
                            {users.filter(u => u.username.toLowerCase().includes(mentionSearch) || u.first_name.toLowerCase().includes(mentionSearch)).map(u => (
                                <div key={u.id} onClick={() => insertMention(u.username)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'white'}>
                                    <strong style={{ color: 'var(--primary)' }}>{u.first_name} {u.last_name}</strong> <span style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Emoji Picker */}
                    {showEmoji && (
                        <div style={{ position: 'absolute', bottom: '90px', right: '24px', zIndex: 10, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                            <EmojiPicker onEmojiClick={(em) => { setInputText(prev => prev + em.emoji); setShowEmoji(false); inputRef.current?.focus(); }} />
                        </div>
                    )}

                    {/* Input Area */}
                    <div style={{ padding: '1rem 1.5rem', backgroundColor: 'white', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button onClick={() => setShowEmoji(!showEmoji)} style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border)', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Add Emoji">
                            😀
                        </button>
                        
                        <label style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '50%', border: '1px solid var(--border)', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Attach File">
                            📎
                            <input type="file" style={{ display: 'none' }} onChange={e => setAttachedFile(e.target.files[0])} />
                        </label>

                        {attachedFile && <div style={{ fontSize: '0.75rem', backgroundColor: '#e2e8f0', padding: '0.35rem 0.75rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                            <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#ef4444', padding: 0 }}>×</button>
                        </div>}

                        <input 
                            ref={inputRef}
                            value={inputText}
                            onChange={handleInputChange}
                            onKeyPress={e => e.key === 'Enter' && handleSend()}
                            placeholder={activeContact === 'bot' ? "Ask the performance intelligence bot something..." : "Type a message or use @ to tag someone..."}
                            style={{ flex: 1, padding: '0.85rem 1.25rem', borderRadius: '24px', border: '1px solid var(--border)', backgroundColor: '#f8fafc', outline: 'none', fontSize: '0.95rem' }}
                            onClick={() => setShowEmoji(false)}
                        />

                        <button onClick={handleVoiceRecord} style={{ background: isRecording ? '#fee2e2' : '#f8fafc', padding: '0.5rem', borderRadius: '50%', border: isRecording ? '1px solid #fca5a5' : '1px solid var(--border)', fontSize: '1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isRecording ? '#ef4444' : 'var(--text-muted)' }} title="Record Voice Note">
                            {isRecording ? '⏹' : '🎤'}
                        </button>
                        
                        <button className="btn btn-primary" onClick={handleSend} style={{ borderRadius: '24px', padding: '0.75rem 1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>Send</span>
                            <span>➤</span>
                        </button>
                    </div>
                </>
            ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>👋</div>
                    <h3 style={{ fontSize: '1.5rem', color: '#1e293b' }}>Select someone to start chatting!</h3>
                    <p style={{ marginTop: '0.5rem' }}>Choose a contact from the panel on the left.</p>
                </div>
            )}
        </div>
    );

    return (
        <Layout>
            <div style={{ display: 'flex', height: 'calc(100vh - 120px)', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px var(--shadow-color)' }}>
                
                {!chatMode ? (
                    // START SPLASH SCREEN (No sidebar)
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', backgroundColor: '#f8fafc' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '3rem' }}>How would you like to chat?</h2>
                        
                        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <div 
                                onClick={() => setChatMode('person')}
                                style={{ 
                                    padding: '3rem', backgroundColor: 'white', borderRadius: '24px', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', cursor: 'pointer', 
                                    textAlign: 'center', width: '300px', border: '3px solid transparent',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; e.currentTarget.style.borderColor = 'transparent'; }}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👥</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Chat with a Person</h3>
                                <p style={{ color: '#64748b', lineHeight: 1.5 }}>Discuss goals, exchange feedback, and collaborate with your peers.</p>
                            </div>

                            <div 
                                onClick={() => { setChatMode('bot'); setActiveContact('bot'); }}
                                style={{ 
                                    padding: '3rem', backgroundColor: 'var(--primary)', borderRadius: '24px', 
                                    boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)', cursor: 'pointer', 
                                    textAlign: 'center', width: '300px', color: 'white',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(79, 70, 229, 0.5)'; }}
                                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(79, 70, 229, 0.4)'; }}
                            >
                                <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🧠</div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Talk with Intelligence</h3>
                                <p style={{ color: '#e0e7ff', lineHeight: 1.5 }}>Ask our AI assistant for help regarding performance tracking and advice.</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {chatMode === 'person' && (
                            <div style={{ width: '300px', borderRight: '1px solid var(--border)', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>Contacts</h2>
                                    <button onClick={() => {setChatMode(null); setActiveContact(null);}} style={{ background: 'var(--bg-main)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1rem', color: 'var(--text-muted)', borderRadius: '8px', padding: '0.25rem 0.5rem' }}>🏠 Home</button>
                                </div>
                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {users.filter(u => u.id !== user.id).map(u => (
                                        <div 
                                            key={u.id}
                                            onClick={() => setActiveContact(u.id)}
                                            style={{ padding: '1rem 1.5rem', cursor: 'pointer', backgroundColor: activeContact === u.id ? '#e2e8f0' : 'transparent', borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }}
                                            onMouseOver={e => { if (activeContact !== u.id) e.currentTarget.style.backgroundColor = '#f1f5f9' }}
                                            onMouseOut={e => { if (activeContact !== u.id) e.currentTarget.style.backgroundColor = 'transparent' }}
                                        >
                                            <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.role}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {renderChatArea()}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default ChatPage;
