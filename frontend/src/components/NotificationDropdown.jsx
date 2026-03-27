import React, { useState } from 'react';

const NotificationDropdown = ({ notifications, onMarkAsRead }) => {
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    padding: '0.5rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '14px',
                        height: '14px',
                        background: 'var(--danger)',
                        color: 'white',
                        fontSize: '10px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div
                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }}
                        onClick={() => setIsOpen(false)}
                    ></div>
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        width: '320px',
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow)',
                        border: '1px solid var(--border)',
                        zIndex: 999,
                        marginTop: '0.5rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600 }}>Notifications</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer' }}>Mark all as read</span>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    No new notifications
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => {
                                            onMarkAsRead(n.id);
                                            setIsOpen(false);
                                        }}
                                        style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid var(--border)',
                                            cursor: 'pointer',
                                            backgroundColor: n.is_read ? 'white' : '#f0f9ff',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = n.is_read ? '#f9fafb' : '#e0f2fe'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = n.is_read ? 'white' : '#f0f9ff'}
                                    >
                                        <div style={{ fontSize: '0.8125rem', fontWeight: n.is_read ? 400 : 600, marginBottom: '0.25rem' }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div
                            style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationDropdown;
