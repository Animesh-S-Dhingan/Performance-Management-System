import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [pending, setPending] = useState([]);
    const [cycles, setCycles] = useState([]);
    const [probations, setProbations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchAll = async () => {
        try {
            const [goalsRes, pendingRes, cyclesRes, probRes, notifRes] = await Promise.all([
                client.get('/goals/'),
                client.get('/goals/?status=pending'),
                client.get('/cycles/'),
                client.get('/probation/'),
                client.get('/notifications/'),
            ]);
            setGoals(goalsRes.data.results || goalsRes.data);
            setPending(pendingRes.data.results || pendingRes.data);
            setCycles(cyclesRes.data.results || cyclesRes.data);
            setProbations(probRes.data.results || probRes.data);
            setNotifications((notifRes.data.results || notifRes.data).slice(0, 5));
        } catch (err) {
            console.error('Admin dashboard fetch failed', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await client.post(`/goals/${id}/approve/`);
            fetchAll();
        } catch (err) { alert('Failed to approve'); }
        finally { setActionLoading(null); }
    };

    const activeCycles = cycles.filter(c => c.status === 'in_progress');
    const overdueProbs = probations.filter(p =>
        [p.day30_status, p.day60_status, p.day80_status].includes('overdue')
    );
    const avgProgress = goals.length > 0
        ? Math.round(goals.reduce((a, g) => a + g.target_completion, 0) / goals.length)
        : 0;

    const statCards = [
        { label: 'Org Goal Progress', value: `${avgProgress}%`, sub: `${goals.length} total goals`, bar: avgProgress, color: 'var(--primary)' },
        { label: 'Pending Approvals', value: pending.length, sub: 'Awaiting action', color: pending.length > 0 ? 'var(--warning)' : 'var(--success)' },
        { label: 'Probation Alerts', value: overdueProbs.length, sub: 'Overdue milestones', color: overdueProbs.length > 0 ? 'var(--danger)' : 'var(--success)' },
        { label: 'Active Cycles', value: activeCycles.length, sub: `${cycles.length} configured`, color: 'var(--primary)' },
    ];

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading admin dashboard...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Organization Analytics</h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time compliance monitoring, cycle status, and performance trends.</p>
            </div>

            {/* Live Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {statCards.map(s => (
                    <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: s.color }}>{s.value}</div>
                        {s.bar !== undefined ? <ProgressBar progress={s.bar} label="" /> : <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.sub}</div>}
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem' }}>
                {/* Pending Approvals Table */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Pending Goal Approvals</h2>
                        <button className="btn" style={{ fontSize: '0.8125rem', border: '1px solid var(--border)' }} onClick={() => navigate('/approvals')}>Full Queue →</button>
                    </div>
                    {pending.length === 0 ? (
                        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--success)', fontWeight: 600 }}>✅ No pending approvals!</p>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        {['Employee', 'Goal', 'Weightage', 'Due', 'Action'].map(h => (
                                            <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {pending.slice(0, 8).map(goal => (
                                        <tr key={goal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{goal.assigned_to_name}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 500 }} onClick={() => navigate(`/goals/${goal.id}`)}>{goal.title}</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{goal.weightage}%</td>
                                            <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{goal.due_date}</td>
                                            <td style={{ padding: '0.75rem 1rem' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--success)' }}
                                                    onClick={() => handleApprove(goal.id)}
                                                    disabled={actionLoading === goal.id}
                                                >
                                                    {actionLoading === goal.id ? '...' : '✓ Approve'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Probation Overview */}
                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Probation Overview</h2>
                            <button className="btn" style={{ fontSize: '0.8125rem', border: '1px solid var(--border)' }} onClick={() => navigate('/probation')}>View All →</button>
                        </div>
                        {probations.length === 0 ? (
                            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No employees on probation.</p>
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                            {['Employee', 'Day 30', 'Day 60', 'Day 80', 'Status'].map(h => (
                                                <th key={h} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {probations.slice(0, 5).map(p => {
                                            const badge = (s) => {
                                                const colors = { pending: '#fef9c3', submitted: '#dcfce7', overdue: '#fee2e2', waived: '#f1f5f9' };
                                                const text = { pending: '#a16207', submitted: '#166534', overdue: '#b91c1c', waived: '#64748b' };
                                                return <span style={{ background: colors[s] || '#f1f5f9', color: text[s] || '#64748b', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{s}</span>;
                                            };
                                            return (
                                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 500 }}>{p.user_name}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>{badge(p.day30_status)}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>{badge(p.day60_status)}</td>
                                                    <td style={{ padding: '0.75rem 1rem' }}>{badge(p.day80_status)}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: p.is_paused ? 'var(--warning)' : 'var(--success)' }}>{p.is_paused ? '⏸ Paused' : '● Active'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Column */}
                <aside>
                    {/* Review Cycles */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Review Cycles</h3>
                            <button className="btn" style={{ fontSize: '0.75rem', border: '1px solid var(--border)', padding: '0.25rem 0.75rem' }} onClick={() => navigate('/cycles')}>Manage →</button>
                        </div>
                        {activeCycles.length === 0 ? (
                            <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No active cycles.</p>
                                <button className="btn btn-primary" style={{ marginTop: '0.75rem', fontSize: '0.8125rem' }} onClick={() => navigate('/cycles')}>+ Create Cycle</button>
                            </div>
                        ) : (
                            activeCycles.map(cycle => {
                                const daysLeft = Math.ceil((new Date(cycle.close_date) - new Date()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={cycle.id} style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{cycle.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: daysLeft < 7 ? 'var(--danger)' : 'var(--text-muted)', margin: '0.25rem 0' }}>
                                            {daysLeft > 0 ? `Closes in ${daysLeft} days` : `Closed ${Math.abs(daysLeft)} days ago`}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', backgroundColor: cycle.cycle_type === 'quarterly' ? '#ede9fe' : '#dbeafe', color: cycle.cycle_type === 'quarterly' ? '#6d28d9' : '#1d4ed8', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                                            {cycle.cycle_type === 'quarterly' ? 'Quarterly' : 'Bi-Annual'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Recent Notifications */}
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Recent Activity</h3>
                        {notifications.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No recent notifications.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {notifications.map(n => (
                                    <div key={n.id} style={{ padding: '0.75rem', borderRadius: '8px', backgroundColor: n.is_read ? '#f8fafc' : '#f0f9ff', border: `1px solid ${n.is_read ? 'var(--border)' : '#bae6fd'}`, fontSize: '0.8125rem' }}>
                                        <div style={{ color: '#1e293b', fontWeight: n.is_read ? 400 : 600 }}>{n.message}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Admin Actions */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { label: '🎯 Manage All Goals', path: '/goals' },
                                { label: '📋 Approvals Queue', path: '/approvals' },
                                { label: '👥 Probation Tracking', path: '/probation' },
                                { label: '🗓️ Review Cycles', path: '/cycles' },
                                { label: '📊 Audit Logs', path: '/audit' },
                                { label: '⚙️ Admin Settings', path: '/admin-config' },
                            ].map(a => (
                                <button key={a.path} className="btn" style={{ border: '1px solid var(--border)', textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem', width: '100%' }} onClick={() => navigate(a.path)}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
