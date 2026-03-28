import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const CYCLE_STATUS_STYLE = {
    not_started: { bg: '#f1f5f9', color: '#64748b', label: 'Not Started' },
    in_progress: { bg: '#dbeafe', color: '#1d4ed8', label: 'In Progress' },
    completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
    escalated: { bg: '#fee2e2', color: '#b91c1c', label: 'Escalated' },
};

const CycleStatusBadge = ({ status }) => {
    const s = CYCLE_STATUS_STYLE[status] || CYCLE_STATUS_STYLE.not_started;
    return <span style={{ backgroundColor: s.bg, color: s.color, padding: '2px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>{s.label}</span>;
};

const ReviewCyclesPage = () => {
    const { user } = useAuth();
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '', cycle_type: 'quarterly', trigger_date: '', close_date: '', status: 'not_started'
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchCycles = async () => {
        try {
            const res = await client.get('/cycles/');
            setCycles(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch cycles', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCycles(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await client.post('/cycles/', formData);
            setShowForm(false);
            setFormData({ name: '', cycle_type: 'quarterly', trigger_date: '', close_date: '', status: 'not_started' });
            fetchCycles();
        } catch (err) {
            const d = err.response?.data;
            setError(d ? Object.values(d).flat().join(' | ') : 'Failed to create cycle');
        } finally {
            setSaving(false);
        }
    };

    const getDaysLeft = (closeDate) => {
        const diff = Math.ceil((new Date(closeDate) - new Date()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading review cycles...</div></Layout>;

    const isAdmin = user.role === 'admin';

    return (
        <Layout>
            {/* Create Cycle Form Modal */}
            {showForm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '520px', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create Review Cycle</h3>
                        {error && <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>}
                        <form onSubmit={handleCreate}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cycle Name</label>
                                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Q2 2026 Review" style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Cycle Type</label>
                                    <select value={formData.cycle_type} onChange={e => setFormData({ ...formData, cycle_type: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="biannual">Bi-Annual</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Status</label>
                                    <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                        <option value="not_started">Not Started</option>
                                        <option value="in_progress">In Progress</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Trigger Date</label>
                                    <input type="date" required value={formData.trigger_date} onChange={e => setFormData({ ...formData, trigger_date: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Close Date</label>
                                    <input type="date" required value={formData.close_date} onChange={e => setFormData({ ...formData, close_date: e.target.value })}
                                        style={{ width: '100%', padding: '0.625rem', borderRadius: '8px', border: '1px solid var(--border)', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Cycle'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Review Cycles</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isAdmin ? 'Manage bi-annual and quarterly performance review cycles.' : 'View your active and upcoming review cycles.'}
                    </p>
                </div>
                {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Create Cycle</button>}
            </div>

            {/* Info Cards for Cycle Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '1px solid #bae6fd' }}>
                    <h3 style={{ fontWeight: 600, color: '#0369a1', marginBottom: '0.75rem' }}>📅 Bi-Annual Schedule</h3>
                    <div style={{ fontSize: '0.875rem', color: '#0369a1', lineHeight: '1.8' }}>
                        <div><strong>Cycle 1:</strong> Apr–Sep → Trigger Aug 1, Close Aug 25</div>
                        <div><strong>Cycle 2:</strong> Oct–Mar → Trigger Feb 1, Close Feb 25</div>
                    </div>
                </div>
                <div className="card" style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
                    <h3 style={{ fontWeight: 600, color: '#6d28d9', marginBottom: '0.75rem' }}>🗓️ Quarterly Schedule</h3>
                    <div style={{ fontSize: '0.875rem', color: '#6d28d9', lineHeight: '1.8' }}>
                        <div><strong>Q1:</strong> Trigger Apr 1 · <strong>Q2:</strong> Trigger Jul 1</div>
                        <div><strong>Q3:</strong> Trigger Oct 1 · <strong>Q4:</strong> Trigger Jan 1</div>
                    </div>
                </div>
            </div>

            {/* Reminders info */}
            <div style={{ marginBottom: '2rem', padding: '1rem 1.25rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '0.875rem', color: '#92400e' }}>
                <strong>⏰ Reminder Schedule:</strong> Gentle nudge on 5th · Urgent on 15th · Escalation to Admin on 22nd if still pending
            </div>

            {/* Cycles Table */}
            {cycles.length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No review cycles configured yet.</p>
                    {isAdmin && <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create First Cycle</button>}
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                {['Cycle Name', 'Type', 'Trigger Date', 'Close Date', 'Days Left', 'Status'].map(h => (
                                    <th key={h} style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {cycles.map(cycle => {
                                const daysLeft = getDaysLeft(cycle.close_date);
                                return (
                                    <tr key={cycle.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{cycle.name}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.8125rem', backgroundColor: cycle.cycle_type === 'quarterly' ? '#ede9fe' : '#dbeafe', color: cycle.cycle_type === 'quarterly' ? '#6d28d9' : '#1d4ed8', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                                {cycle.cycle_type === 'quarterly' ? 'Quarterly' : 'Bi-Annual'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cycle.trigger_date}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{cycle.close_date}</td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600, color: daysLeft < 0 ? 'var(--danger)' : daysLeft < 7 ? 'var(--warning)' : 'var(--text-main)' }}>
                                            {daysLeft < 0 ? `Closed ${Math.abs(daysLeft)}d ago` : `${daysLeft}d`}
                                        </td>
                                        <td style={{ padding: '1rem' }}><CycleStatusBadge status={cycle.status} /></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </Layout>
    );
};

export default ReviewCyclesPage;
