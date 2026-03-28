import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GoalCard from '../components/GoalCard';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Team Data
    const [teamGoals, setTeamGoals] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [users, setUsers] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [complianceStats, setComplianceStats] = useState({ probationOverdue: 0, cyclesEscalated: 0 });

    const fetchData = async () => {
        try {
            const [goalsRes, approvalsRes, usersRes] = await Promise.all([
                client.get('/goals/'),
                client.get('/goals/?status=pending'),
                client.get('/users/'),
            ]);
            
            setTeamGoals(goalsRes.data.results || goalsRes.data);
            setApprovals(approvalsRes.data.results || approvalsRes.data);
            setUsers(usersRes.data.results || usersRes.data);

            // Fetch Compliance Data
            try {
                const [probRes, cycleRes] = await Promise.all([
                    client.get('/probation/'),
                    client.get('/cycles/')
                ]);
                const probations = probRes.data.results || probRes.data;
                const cycles = cycleRes.data.results || cycleRes.data;
                
                setComplianceStats({
                    probationOverdue: probations.filter(p => [p.day30_status, p.day60_status, p.day80_status].includes('overdue')).length,
                    cyclesEscalated: cycles.filter(c => c.status === 'escalated').length
                });
            } catch (e) { console.error("Compliance fetch error", e); }

        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = async (id) => {
        setActionLoading(id);
        try {
            await client.post(`/goals/${id}/approve/`);
            setApprovals(approvals.filter(a => a.id !== id));
            fetchData();
        } catch (err) { alert('Failed to approve goal'); }
        finally { setActionLoading(null); }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return alert('Please enter a rejection reason');
        setActionLoading(rejectModal);
        try {
            await client.post(`/goals/${rejectModal}/reject/`, { comment: rejectReason });
            setApprovals(approvals.filter(a => a.id !== rejectModal));
            setRejectModal(null);
            setRejectReason('');
        } catch (err) { alert('Failed to reject goal'); }
        finally { setActionLoading(null); }
    };

    const teamStats = {
        teamSize: users.filter(u => u.role === 'employee').length,
        avgProgress: teamGoals.length > 0
            ? Math.round(teamGoals.reduce((acc, g) => acc + g.target_completion, 0) / teamGoals.length)
            : 0,
        pendingApprovals: approvals.length,
        activeGoals: teamGoals.filter(g => g.status === 'active').length,
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading manager dashboard...</div></Layout>;

    return (
        <Layout>
            {/* Reject Modal */}
            {rejectModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '480px', padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--danger)' }}>❌ Reject Goal</h3>
                        <textarea
                            rows="4"
                            placeholder="Please provide a reason for rejection (required)..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', marginBottom: '1rem', boxSizing: 'border-box' }}
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn" style={{ border: '1px solid var(--border)' }} onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
                            <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={handleReject} disabled={actionLoading}>
                                {actionLoading ? 'Rejecting...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Team Performance Oversight</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Monitor team goals, approve submissions, and track overall progress.
                    </p>
                </div>
                
                {/* Switch to Personal View */}
                <button 
                    className="btn btn-secondary" 
                    style={{ fontSize: '0.8125rem', padding: '0.625rem 1.25rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f1f5f9', color: 'var(--primary)', border: '1px solid #e2e8f0' }}
                    onClick={() => navigate('/dashboard')}
                >
                    👤 Switch to My Performance
                </button>
            </div>

            {/* Compliance Alerts */}
            {(complianceStats.probationOverdue > 0 || complianceStats.cyclesEscalated > 0) && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #ef4444', backgroundColor: '#fef2f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
                    <div>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#991b1b', marginBottom: '0.25rem' }}>🚀 Team Compliance Alert</h3>
                        <p style={{ fontSize: '0.875rem', color: '#b91c1c', margin: 0 }}>
                            {complianceStats.probationOverdue > 0 && `${complianceStats.probationOverdue} probation milestones are overdue. `}
                            {complianceStats.cyclesEscalated > 0 && `${complianceStats.cyclesEscalated} review cycles require urgent attention.`}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn btn-sm" style={{ backgroundColor: 'white', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }} onClick={() => navigate('/probation')}>Probation Queue</button>
                        <button className="btn btn-sm" style={{ backgroundColor: 'white', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600 }} onClick={() => navigate('/cycles')}>Review Cycles</button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Team Goal Progress</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{teamStats.avgProgress}%</div>
                    <ProgressBar progress={teamStats.avgProgress} label="" />
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approvals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: teamStats.pendingApprovals > 0 ? 'var(--warning)' : 'var(--success)' }}>{teamStats.pendingApprovals}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires your review</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Goals</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0', color: 'var(--success)' }}>{teamStats.activeGoals}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Currently in progress</div>
                </div>
                <div className="card" style={{ padding: '1.25rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Team Members</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>{teamStats.teamSize}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct reports</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Team Goals</h2>
                        <button className="btn btn-primary" style={{ fontSize: '0.875rem' }} onClick={() => navigate('/goals/new')}>+ Create Goal</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {teamGoals.slice(0, 6).map(goal => (
                            <GoalCard key={goal.id} goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
                        ))}
                    </div>
                </section>
                <aside>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Approval Queue</h3>
                        {approvals.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>✅ No pending approvals.</p> : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {approvals.map(goal => (
                                    <li key={goal.id} style={{ padding: '1rem', borderRadius: '10px', backgroundColor: '#fffbeb', marginBottom: '0.75rem', border: '1px solid #fde68a' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)' }}>{goal.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem' }}>by {goal.assigned_to_name}</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary btn-sm" style={{ flex: 1, backgroundColor: 'var(--success)' }} onClick={() => handleApprove(goal.id)}>Approve</button>
                                            <button className="btn btn-sm" style={{ flex: 1, color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => setRejectModal(goal.id)}>Reject</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </Layout>
    );
};

export default ManagerDashboard;
