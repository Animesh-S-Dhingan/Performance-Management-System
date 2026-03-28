import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const AdminFlagsPage = () => {
    const [flags, setFlags] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFlags = async () => {
            try {
                const res = await client.get('/feedback/flags/');
                setFlags(res.data);
            } catch (err) {
                console.error('Failed to fetch flags', err);
            } finally {
                setLoading(false);
            }
        };
        fetchFlags();
    }, []);

    const handleResolve = async (id) => {
        const comments = prompt('Enter resolution comments:');
        if (comments === null) return;
        try {
            await client.post(`/feedback/${id}/resolve_flag/`, { comments });
            setFlags(flags.filter(f => f.id !== id));
        } catch (err) {
            alert('Failed to resolve flag');
        }
    };

    const getAgingData = (triggeredAt) => {
        const diffMs = new Date() - new Date(triggeredAt);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 7) return { color: '#b91c1c', label: `${diffDays}d (Critical)`, pulse: true };
        if (diffDays >= 3) return { color: '#ef4444', label: `${diffDays}d (High)`, pulse: false };
        return { color: 'var(--text-main)', label: `${diffDays}d`, pulse: false };
    };

    if (loading) return <Layout><div className="loading">Loading governance queue...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Governance Review Queue
                    </h1>
                    <span className="badge badge-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                        {flags.length} Open Flags
                    </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    Autonomous Red-Flag Monitoring & SLA Tracking
                </p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Target Employee</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Triggered By</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Flag Reason</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Sentiment</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Aging / SLA</th>
                            <th style={{ padding: '1.25rem 1.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {flags.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                    <div>All clear. No unresolved red flags found.</div>
                                </td>
                            </tr>
                        ) : (
                            flags.map(flag => {
                                const aging = getAgingData(flag.flag_triggered_at);
                                return (
                                    <tr key={flag.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }} className="hover-row">
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{flag.target_name}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.875rem' }}>{flag.submitted_by_name}</td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ color: 'var(--danger)', fontSize: '0.875rem', fontWeight: 500, maxWidth: '300px' }}>
                                                {flag.flag_reason}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ 
                                                display: 'inline-flex', 
                                                alignItems: 'center', 
                                                gap: '0.5rem',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                backgroundColor: flag.sentiment_score < 0 ? '#fee2e2' : '#dcfce7',
                                                color: flag.sentiment_score < 0 ? '#991b1b' : '#166534'
                                            }}>
                                                {flag.sentiment_score}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <div style={{ 
                                                fontSize: '0.875rem', 
                                                color: aging.color, 
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}>
                                                {aging.pulse && <span className="pulse-dot"></span>}
                                                {aging.label}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1.5rem' }}>
                                            <button 
                                                className="btn btn-primary btn-sm"
                                                style={{ borderRadius: '8px', padding: '0.4rem 1rem' }}
                                                onClick={() => handleResolve(flag.id)}
                                            >
                                                Resolve
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <style>{`
                .hover-row:hover {
                    background-color: #f8fafc;
                }
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #ef4444;
                    border-radius: 50%;
                    box-shadow: 0 0 0 rgba(239, 68, 68, 0.4);
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
        </Layout>
    );
};

export default AdminFlagsPage;
