import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
    pending: { bg: '#fef9c3', color: '#a16207', label: 'Pending' },
    submitted: { bg: '#dcfce7', color: '#166534', label: 'Submitted' },
    overdue: { bg: '#fee2e2', color: '#b91c1c', label: 'Overdue' },
    waived: { bg: '#f1f5f9', color: '#64748b', label: 'Waived' },
};

const MilestoneBadge = ({ status }) => {
    const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
    return (
        <span style={{ backgroundColor: s.bg, color: s.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</span>
    );
};

const ProbationPage = () => {
    const { user } = useAuth();
    const [probations, setProbations] = useState([]);
    const [myProbation, setMyProbation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pauseModal, setPauseModal] = useState(null);
    const [pauseReason, setPauseReason] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await client.get('/probation/');
                const data = res.data.results || res.data;
                if (user.role === 'employee') {
                    setMyProbation(data.find(p => p.user === user.id) || null);
                } else {
                    setProbations(data);
                }
            } catch (err) {
                console.error('Failed to fetch probation data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handlePause = async (id) => {
        if (!pauseReason.trim()) return alert('Please enter a reason');
        try {
            await client.post(`/probation/${id}/pause/`, { reason: pauseReason });
            setProbations(probations.map(p => p.id === id ? { ...p, is_paused: true, pause_reason: pauseReason } : p));
            setPauseModal(null);
            setPauseReason('');
        } catch (err) { alert('Failed to pause probation'); }
    };

    const MilestoneCard = ({ day, status, date }) => (
        <div style={{ flex: 1, padding: '1.25rem', borderRadius: '12px', backgroundColor: STATUS_COLORS[status]?.bg || '#f8fafc', border: `1px solid ${status === 'overdue' ? '#fca5a5' : status === 'submitted' ? '#86efac' : '#e2e8f0'}`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Day {day}</div>
            <MilestoneBadge status={status} />
            {date && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{new Date(date).toLocaleDateString()}</div>}
        </div>
    );

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading probation data...</div></Layout>;

    // Employee View
    if (user.role === 'employee') {
        return (
            <Layout>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>My Probation Tracker</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track your probation milestones and submission status.</p>
                </div>
                {!myProbation ? (
                    <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ color: 'var(--text-muted)' }}>You are not currently in a probation period.</p>
                    </div>
                ) : (
                    <>
                        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>Probation Period</h2>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Start date: {myProbation.start_date}</div>
                                </div>
                                {myProbation.is_paused && (
                                    <span style={{ backgroundColor: '#fef9c3', color: '#a16207', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 600 }}>⏸ Paused</span>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <MilestoneCard day={30} status={myProbation.day30_status} date={myProbation.day30_date} />
                                <MilestoneCard day={60} status={myProbation.day60_status} date={myProbation.day60_date} />
                                <MilestoneCard day={80} status={myProbation.day80_status} date={myProbation.day80_date} />
                            </div>
                            {myProbation.is_paused && (
                                <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', fontSize: '0.875rem' }}>
                                    <strong>Pause Reason:</strong> {myProbation.pause_reason}
                                    {myProbation.revised_end_date && <> · <strong>Revised End:</strong> {myProbation.revised_end_date}</>}
                                </div>
                            )}
                        </div>
                        <div className="card" style={{ padding: '1.5rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#0369a1' }}>ℹ️ What happens at each milestone?</h3>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#0369a1', fontSize: '0.875rem', lineHeight: '1.8' }}>
                                <li><strong>Day 30:</strong> Initial check-in form — share your early experience and challenges</li>
                                <li><strong>Day 60:</strong> Mid-probation review — progress assessment with your manager</li>
                                <li><strong>Day 80:</strong> Final form — 10 days before your confirmation discussion</li>
                            </ul>
                        </div>
                    </>
                )}
            </Layout>
        );
    }

    // Manager / Admin View
    return (
        <Layout>
            {/* Pause Modal */}
            {pauseModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '480px', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>⏸ Pause Probation</h3>
                        <textarea
                            rows="3"
                            placeholder="Reason for pausing (e.g., medical leave)..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem', boxSizing: 'border-box' }}
                            value={pauseReason}
                            onChange={e => setPauseReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => { setPauseModal(null); setPauseReason(''); }}>Cancel</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--warning)', color: 'white' }} onClick={() => handlePause(pauseModal)}>Confirm Pause</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Probation Tracking</h1>
                <p style={{ color: 'var(--text-muted)' }}>Monitor Day 30/60/80 milestones for all employees on probation.</p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total on Probation', value: probations.length, color: 'var(--primary)' },
                    { label: 'Overdue Milestones', value: probations.filter(p => [p.day30_status, p.day60_status, p.day80_status].includes('overdue')).length, color: 'var(--danger)' },
                    { label: 'Paused', value: probations.filter(p => p.is_paused).length, color: 'var(--warning)' },
                    { label: 'All Submitted', value: probations.filter(p => p.day80_status === 'submitted').length, color: 'var(--success)' },
                ].map(s => (
                    <div key={s.label} className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, margin: '0.25rem 0' }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {probations.length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No employees are currently on probation.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                {['Employee', 'Start Date', 'Day 30', 'Day 60', 'Day 80', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {probations.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{p.user_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{p.start_date}</td>
                                    <td style={{ padding: '1rem' }}><MilestoneBadge status={p.day30_status} /></td>
                                    <td style={{ padding: '1rem' }}><MilestoneBadge status={p.day60_status} /></td>
                                    <td style={{ padding: '1rem' }}><MilestoneBadge status={p.day80_status} /></td>
                                    <td style={{ padding: '1rem' }}>
                                        {p.is_paused
                                            ? <span style={{ color: 'var(--warning)', fontSize: '0.8125rem', fontWeight: 600 }}>⏸ Paused</span>
                                            : <span style={{ color: 'var(--success)', fontSize: '0.8125rem', fontWeight: 600 }}>● Active</span>
                                        }
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {!p.is_paused && (
                                            <button className="btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--warning)', color: 'var(--warning)' }} onClick={() => { setPauseModal(p.id); setPauseReason(''); }}>
                                                Pause
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default ProbationPage;
