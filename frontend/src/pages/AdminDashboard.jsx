import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        submissionRate: 85,
        pendingFlags: 12,
        activeCycles: 1,
        probationAlerts: 4
    });
    const [loading, setLoading] = useState(false);

    // In a real app, we'd fetch this from a specialized dashboard API
    // useEffect(() => { ... }, []);

    const alerts = [
        { type: 'danger', message: 'SLA Breach: 3 goals pending approval for > 3 days', time: '2h ago' },
        { type: 'warning', message: 'Feedback Missing: Q1 reviews for Design team incomplete', time: '5h ago' },
        { type: 'info', message: 'Cycle Trigger: Semi-annual review cycle starts in 2 days', time: '1d ago' },
    ];

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Organization Analytics</h1>
                <p style={{ color: 'var(--text-muted)' }}>Real-time compliance monitoring, cycle status, and performance trends.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Cycle Submission Rate</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.submissionRate}%</div>
                    <ProgressBar progress={stats.submissionRate} label="" />
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Red Flags</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.pendingFlags}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Requires HR intervention</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Probation Alerts</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{stats.probationAlerts}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--warning)' }}>Milestones overdue</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Compliance Metric</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>98%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Within target range</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <section>
                    <div className="card" style={{ height: '100%' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Flagged Submissions Queue</h3>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EMPLOYEE</th>
                                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>REASON</th>
                                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AGING</th>
                                    <th style={{ padding: '0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4].map(i => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem 0', fontSize: '0.875rem' }}>John Doe</td>
                                        <td style={{ padding: '1rem 0' }}>
                                            <span className="badge badge-danger">Repeated Low Score</span>
                                        </td>
                                        <td style={{ padding: '1rem 0', fontSize: '0.875rem', color: 'var(--danger)' }}>5 days</td>
                                        <td style={{ padding: '1rem 0' }}>
                                            <button className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', border: '1px solid var(--border)' }}>Review</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Priority Escalations</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {alerts.map((alert, index) => (
                                <div key={index} style={{
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    backgroundColor: alert.type === 'danger' ? '#fef2f2' : alert.type === 'warning' ? '#fffbeb' : '#f0f9ff',
                                    borderLeft: `4px solid ${alert.type === 'danger' ? 'var(--danger)' : alert.type === 'warning' ? 'var(--warning)' : 'var(--primary)'}`
                                }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>{alert.message}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{alert.time}</div>
                                </div>
                            ))}
                        </div>
                        <button className="btn" style={{ width: '100%', marginTop: '1.5rem', fontSize: '0.875rem', border: '1px solid var(--border)' }}>View All Escalations</button>
                    </div>

                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Active Cycle Tracker</h3>
                        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Annual Performance Cycle 2024</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 1rem 0' }}>Ending in 14 days</div>
                            <ProgressBar progress={72} label="Submission Progress" />
                        </div>
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
