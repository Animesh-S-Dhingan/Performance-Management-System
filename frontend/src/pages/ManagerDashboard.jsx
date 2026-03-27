import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GoalCard from '../components/GoalCard';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';

const ManagerDashboard = () => {
    const [teamGoals, setTeamGoals] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [goalsRes, approvalsRes] = await Promise.all([
                    client.get('/goals/'), // API handles user-based filtering
                    client.get('/goals/?status=pending')
                ]);
                setTeamGoals(goalsRes.data.results || goalsRes.data);
                setApprovals(approvalsRes.data.results || approvalsRes.data);
            } catch (err) {
                console.error('Failed to fetch manager data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const stats = {
        teamSize: 8,
        avgProgress: teamGoals.length > 0
            ? Math.round(teamGoals.reduce((acc, g) => acc + g.target_completion, 0) / teamGoals.length)
            : 0,
        pendingApprovals: approvals.length,
        feedbackPending: 3
    };

    if (loading) return <Layout><div>Loading manager dashboard...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Team Performance Oversight</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor team goals, approve submissions, and track overall progress.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Team Goal Progress</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.avgProgress}%</div>
                    <ProgressBar progress={stats.avgProgress} label="" />
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.pendingApprovals}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Requires your review</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Team Sentiment</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>Above</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Based on last review cycle</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Team Goals</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                <option>All Members</option>
                                <option>Alex Johnson</option>
                                <option>Sam Smith</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {teamGoals.slice(0, 6).map(goal => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </div>
                </section>

                <aside>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Approval Queue</h3>
                        {approvals.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No pending approvals.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {approvals.map(goal => (
                                    <li key={goal.id} style={{ padding: '1rem', borderRadius: '8px', backgroundColor: '#f8fafc', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{goal.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>by {goal.assigned_to_name}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Approve</button>
                                            <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border)' }}>Reject</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Team Distribution</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                <span>Above Expectations</span>
                                <span style={{ fontWeight: 600 }}>30%</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '6px' }}><div className="progress-bar-fill" style={{ width: '30%', backgroundColor: 'var(--success)' }}></div></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                <span>Meets Expectations</span>
                                <span style={{ fontWeight: 600 }}>60%</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '6px' }}><div className="progress-bar-fill" style={{ width: '60%', backgroundColor: 'var(--primary)' }}></div></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginTop: '0.5rem' }}>
                                <span>Below Expectations</span>
                                <span style={{ fontWeight: 600 }}>10%</span>
                            </div>
                            <div className="progress-bar-bg" style={{ height: '6px' }}><div className="progress-bar-fill" style={{ width: '10%', backgroundColor: 'var(--danger)' }}></div></div>
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default ManagerDashboard;
