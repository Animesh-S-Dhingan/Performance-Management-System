import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GoalCard from '../components/GoalCard';
import TimelineWidget from '../components/TimelineWidget';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const res = await client.get('/goals/');
                setGoals(res.data.results || res.data);
            } catch (err) {
                console.error('Failed to fetch goals', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, []);

    const stats = {
        total: goals.length,
        active: goals.filter(g => g.status === 'active').length,
        pending: goals.filter(g => g.status === 'pending').length,
        completed: goals.filter(g => g.status === 'completed').length,
        avgProgress: goals.length > 0
            ? Math.round(goals.reduce((acc, g) => acc + g.target_completion, 0) / goals.length)
            : 0
    };

    const timelineEvents = [
        { title: 'Probation Day 30', date: 'Mar 15, 2024', description: 'Initial review with manager', status: 'completed' },
        { title: 'Goal Setting Sync', date: 'Apr 02, 2024', description: 'Quarterly objective alignment', status: 'pending' },
        { title: 'Probation Day 60', date: 'Apr 15, 2024', description: 'Interim progress evaluation', status: 'pending' },
    ];

    if (loading) return <Layout><div>Loading dashboard...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome back, {user?.first_name}!</h1>
                <p style={{ color: 'var(--text-muted)' }}>Here's an overview of your current performance and goals.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Goals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.active}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>↑ {stats.completed} completed recently</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Avg. Progress</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.avgProgress}%</div>
                    <ProgressBar progress={stats.avgProgress} label="" />
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Waiting for manager review</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>My Goals</h2>
                        <button className="btn btn-primary" style={{ fontSize: '0.875rem' }}>+ Create Goal</button>
                    </div>

                    {goals.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>You haven't set any goals yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {goals.slice(0, 4).map(goal => (
                                <GoalCard key={goal.id} goal={goal} />
                            ))}
                        </div>
                    )}
                </section>

                <aside>
                    <TimelineWidget events={timelineEvents} />

                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Upcoming Deadlines</h3>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Q2 Review Cycle</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Due in 5 days</div>
                            </li>
                            <li style={{ padding: '0.75rem 0' }}>
                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Self-Assessment</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Opens next week</div>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default EmployeeDashboard;
