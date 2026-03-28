import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await client.get('/notifications/');
            setNotifications(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to fetch notifications', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await client.post(`/notifications/${id}/mark_read/`);
            fetchNotifications();
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    if (loading) return <Layout><div style={{ padding: '2rem' }}>Loading notifications...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Notifications</h1>
            </div>

            <div className="card" style={{ padding: '0' }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        You have no notifications.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {notifications.map(n => (
                            <div key={n.id} style={{
                                padding: '1rem 1.5rem',
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: n.is_read ? 'transparent' : '#f0f9ff',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontWeight: n.is_read ? 400 : 600, color: '#1e293b' }}>
                                        {n.message}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {new Date(n.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {!n.is_read && (
                                    <button 
                                        className="btn" 
                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', border: '1px solid var(--border)' }}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        Mark as Read
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default NotificationsPage;
