import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const DIMENSIONS = [
    { key: 'quality', label: 'Quality of Work', description: 'Accuracy, thoroughness, and output quality' },
    { key: 'ownership', label: 'Ownership', description: 'Takes initiative and accountability' },
    { key: 'communication', label: 'Communication', description: 'Clarity, collaboration, and responsiveness' },
    { key: 'timeliness', label: 'Timeliness', description: 'Meets deadlines and manages time well' },
    { key: 'initiative', label: 'Initiative', description: 'Goes beyond requirements, problem-solves' },
];

const RatingButton = ({ value, selected, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(value)}
        style={{
            width: '40px', height: '40px', borderRadius: '50%', border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: selected ? 'var(--primary)' : 'white', color: selected ? 'white' : 'var(--text-main)',
            cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s'
        }}
    >{value}</button>
);

const FeedbackPage = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [selectedGoal, setSelectedGoal] = useState('');
    const [feedbackType, setFeedbackType] = useState('member');
    const [ratings, setRatings] = useState({});
    const [text, setText] = useState('');
    const [isDraft, setIsDraft] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [pastFeedback, setPastFeedback] = useState([]);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const [goalsRes, fbRes] = await Promise.all([
                    client.get('/goals/?status=active'),
                    client.get('/feedback/')
                ]);
                setGoals(goalsRes.data.results || goalsRes.data);
                setPastFeedback(fbRes.data.results || fbRes.data);
            } catch (err) { console.error(err); }
        };
        fetchGoals();
    }, []);

    const handleRating = (dim, val) => setRatings(r => ({ ...r, [dim]: val }));

    const handleSubmit = async (asDraft) => {
        if (!selectedGoal) return alert('Please select a goal');
        const allRated = DIMENSIONS.every(d => ratings[d.key]);
        if (!asDraft && !allRated) return alert('Please rate all 5 dimensions before submitting');

        setLoading(true);
        setSuccess(false);
        try {
            await client.post('/feedback/', {
                goal: parseInt(selectedGoal),
                feedback_type: feedbackType,
                ratings: ratings,
                text: text,
                is_draft: asDraft,
            });
            setSuccess(true);
            setRatings({});
            setText('');
            setSelectedGoal('');
            const fbRes = await client.get('/feedback/');
            setPastFeedback(fbRes.data.results || fbRes.data);
        } catch (err) {
            const d = err.response?.data;
            alert(d ? Object.values(d).flat().join(' | ') : 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    const avgRating = Object.values(ratings).length > 0
        ? (Object.values(ratings).reduce((a, b) => a + b, 0) / Object.values(ratings).length).toFixed(1)
        : null;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Feedback & Reviews</h1>
                <p style={{ color: 'var(--text-muted)' }}>Submit structured self-assessments or evaluation feedback for active goals.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
                {/* Form */}
                <div>
                    {success && (
                        <div style={{ padding: '1rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '10px', marginBottom: '1.5rem', fontWeight: 500 }}>
                            ✅ Feedback submitted successfully!
                        </div>
                    )}

                    <div className="card">
                        {/* Goal & Type Selection */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Select Goal</label>
                                <select value={selectedGoal} onChange={e => setSelectedGoal(e.target.value)} required
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <option value="">-- Select Active Goal --</option>
                                    {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Feedback Type</label>
                                <select value={feedbackType} onChange={e => setFeedbackType(e.target.value)}
                                    style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <option value="member">Self Review (Member)</option>
                                    {(user.role === 'manager' || user.role === 'admin') && <option value="evaluator">Evaluator Review</option>}
                                </select>
                            </div>
                        </div>

                        {/* Dimension Ratings */}
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Rate Each Dimension (1–5)</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            {DIMENSIONS.map(dim => (
                                <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{dim.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dim.description}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {[1, 2, 3, 4, 5].map(v => (
                                            <RatingButton key={v} value={v} selected={ratings[dim.key] === v} onClick={val => handleRating(dim.key, val)} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Overall Average Preview */}
                        {avgRating && (
                            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0369a1' }}>Overall Average Rating</span>
                                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0369a1' }}>{avgRating} / 5</span>
                            </div>
                        )}

                        {/* Text */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Accomplishments & Comments</label>
                            <textarea rows="5" value={text} onChange={e => setText(e.target.value)}
                                placeholder="Describe your progress, key achievements, challenges faced, and results delivered this cycle..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }} />
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn" style={{ flex: 1, border: '1px solid var(--border)', padding: '0.75rem' }} onClick={() => handleSubmit(true)} disabled={loading}>
                                💾 Save as Draft
                            </button>
                            <button className="btn btn-primary" style={{ flex: 2, padding: '0.75rem' }} onClick={() => handleSubmit(false)} disabled={loading}>
                                {loading ? 'Submitting...' : '📤 Submit Feedback'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Past Feedback */}
                <div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Submitted Feedback</h2>
                    {pastFeedback.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No feedback submitted yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {pastFeedback.map(fb => {
                                const ratingsArr = Object.values(fb.ratings || {});
                                const avg = ratingsArr.length > 0 ? (ratingsArr.reduce((a, b) => a + b, 0) / ratingsArr.length).toFixed(1) : '—';
                                return (
                                    <div key={fb.id} className="card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.8125rem', backgroundColor: fb.feedback_type === 'member' ? '#f0fdf4' : '#f0f9ff', color: fb.feedback_type === 'member' ? '#166534' : '#0369a1', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                                                {fb.feedback_type === 'member' ? 'Self Review' : 'Evaluator'}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Avg: <strong>{avg}</strong>/5</span>
                                        </div>
                                        {fb.is_draft && <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 600, marginBottom: '0.25rem' }}>📝 Draft</div>}
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{fb.text?.slice(0, 100) || 'No comments'}{fb.text?.length > 100 ? '...' : ''}</div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Cross-share notice */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', fontSize: '0.8125rem', color: '#6d28d9' }}>
                        <strong>ℹ️ Cross-Share Policy</strong><br />
                        Your self-feedback and your manager's feedback are only shared with each other after <strong>both parties</strong> have submitted.
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default FeedbackPage;
