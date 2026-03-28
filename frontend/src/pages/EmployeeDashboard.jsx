import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GoalCard from '../components/GoalCard';
import TimelineWidget from '../components/TimelineWidget';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [goalsRes, notifRes] = await Promise.all([
                    client.get('/goals/'),
                    client.get('/notifications/')
                ]);
                setGoals(goalsRes.data.results || goalsRes.data);
                setNotifications((notifRes.data.results || notifRes.data).filter(n => !n.is_read).slice(0, 5));
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const markRead = async (id) => {
        await client.post(`/notifications/${id}/mark_read/`);
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const stats = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        pending: goals.filter(g => g.status === 'pending').length,
        completed: goals.filter(g => g.status === 'completed').length,
        avgProgress: goals.length > 0
            ? Math.round(goals.reduce((acc, g) => acc + g.target_completion, 0) / goals.length)
            : 0
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading dashboard...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome back, {user?.first_name}! 👋</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Here's an overview of your current performance and goals.</p>
                </div>
                
                {/* Switch to Team View (Only for Managers) */}
                {user?.role === 'manager' && (
                    <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.8125rem', padding: '0.625rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: 'var(--primary)', border: '1px solid #e2e8f0' }}
                        onClick={() => navigate('/team-dashboard')}
                    >
                        👥 Switch to Team Dashboard
                    </button>
                )}
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Goals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--success)' }}>{stats.active}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stats.completed} completed</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Avg. Progress</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.avgProgress}%</div>
                    <ProgressBar progress={stats.avgProgress} label="" />
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: stats.pending > 0 ? 'var(--warning)' : 'var(--text-main)' }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting manager review</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Goals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.total}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all cycles</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Goals Section */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Goals</h2>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn" style={{ fontSize: '0.875rem', border: '1px solid var(--border)' }} onClick={() => navigate('/goals')}>View All</button>
                            <button className="btn btn-primary" style={{ fontSize: '0.875rem' }} onClick={() => navigate('/goals/new')}>+ Create Goal</button>
                        </div>
                    </div>

                    {goals.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>You haven't set any goals yet.</p>
                            <button className="btn btn-primary" onClick={() => navigate('/goals/new')}>Create Your First Goal</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {goals.slice(0, 4).map(goal => (
                                <GoalCard key={goal.id} goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
                            ))}
                        </div>
                    )}
                </section>

                {/* Right Sidebar */}
                <aside>
                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <div className="card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>🔔 Notifications</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {notifications.map(n => (
                                    <div key={n.id} style={{ padding: '0.75rem', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.8125rem' }}>
                                        <div style={{ color: '#0369a1', fontWeight: 500, marginBottom: '0.25rem' }}>{n.message}</div>
                                        <button onClick={() => markRead(n.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>Mark as read</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Goal Status Summary */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Goal Status Breakdown</h3>
                        {[
                            { label: 'Active', count: stats.active, color: 'var(--success)' },
                            { label: 'Pending', count: stats.pending, color: 'var(--warning)' },
                            { label: 'Completed', count: stats.completed, color: 'var(--primary)' },
                            { label: 'Draft', count: goals.filter(g => g.status === 'draft').length, color: 'var(--text-muted)' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ fontSize: '0.875rem' }}>{s.label}</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>{s.count}</span>
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button className="btn btn-primary" style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem' }} onClick={() => navigate('/goals/new')}>🎯 Create New Goal</button>
                            <button className="btn" style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: '1px solid var(--border)' }} onClick={() => navigate('/feedback')}>📋 Submit Feedback</button>
                            <button className="btn" style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', border: '1px solid var(--border)' }} onClick={() => navigate('/goals')}>📊 View All Goals</button>
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default EmployeeDashboard;
