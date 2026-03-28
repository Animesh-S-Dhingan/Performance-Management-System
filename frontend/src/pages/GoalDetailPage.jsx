import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const GoalDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [goal, setGoal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchGoal();
    }, [id]);

    const fetchGoal = async () => {
        try {
            const res = await client.get(`/goals/${id}/`);
            setGoal(res.data);
        } catch (err) {
            console.error('Failed to fetch goal', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action, data = {}) => {
        try {
            await client.post(`/goals/${id}/${action}/`, data);
            fetchGoal();
            setIsRejecting(false);
            setRejectionReason('');
        } catch (err) {
            alert(`Failed to ${action} goal`);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        try {
            await client.post('/goals/' + id + '/comments/', { text: comment });
            setComment('');
            fetchGoal();
        } catch (err) {
            alert('Failed to add comment');
        }
    };

    if (loading) return <Layout><div>Loading goal details...</div></Layout>;
    if (!goal) return <Layout><div>Goal not found.</div></Layout>;

    const canApprove = (user.role === 'manager' || user.role === 'admin') && goal.status === 'pending';
    const isOwner = user.id === goal.assigned_to;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        ← Back to Goals
                    </button>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>{goal.title}</h1>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <StatusBadge status={goal.status} />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Assigned to: <strong>{goal.assigned_to_name}</strong></span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {goal.status === 'draft' && isOwner && (
                        <button className="btn btn-primary" onClick={() => handleAction('submit')}>Submit for Approval</button>
                    )}
                    {canApprove && (
                        <>
                            <button className="btn btn-primary" onClick={() => handleAction('approve')} style={{ backgroundColor: 'var(--success)' }}>Approve</button>
                            <button className="btn" onClick={() => setIsRejecting(true)} style={{ border: '1px solid var(--danger)', color: 'var(--danger)' }}>Reject</button>
                        </>
                    )}
                </div>
            </div>

            {isRejecting && (
                <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--danger)', backgroundColor: '#fef2f2' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Rejection Reason</h3>
                    <textarea
                        rows="3"
                        placeholder="Please provide a reason for rejection..."
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1rem' }}
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={() => setIsRejecting(false)}>Cancel</button>
                        <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)' }} onClick={() => handleAction('reject', { comment: rejectionReason })}>Confirm Reject</button>
                    </div>
                </div>
            )}

            {/* Hierarchy Visualization */}
            {(goal.parent_goal || (goal.sub_goals && goal.sub_goals.length > 0)) && (
                <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '1.25rem', letterSpacing: '0.05em' }}>Goal Hierarchy & Cascade</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {goal.parent_goal && (
                            <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>CASCADE FROM (PARENT)</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>↑</span>
                                    <button 
                                        onClick={() => navigate(`/goals/${goal.parent_goal}`)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '1rem', textAlign: 'left' }}
                                    >
                                        {goal.parent_goal_title}
                                    </button>
                                </div>
                            </div>
                        )}

                        {goal.sub_goals && goal.sub_goals.length > 0 && (
                            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '1rem' }}>ROLL-UP CONTRIBUTIONS (SUB-GOALS)</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {goal.sub_goals.map(sub => (
                                        <div key={sub.id} style={{ padding: '0.75rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ color: '#94a3b8' }}>↳</span>
                                                <button 
                                                    onClick={() => navigate(`/goals/${sub.id}`)}
                                                    style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '0.875rem', textAlign: 'left' }}
                                                >
                                                    {sub.title}
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontWeight: 700 }}>WEIGHT</div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{sub.weightage}%</div>
                                                </div>
                                                <StatusBadge status={sub.status} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <section>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Description</h3>
                        <p style={{ color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>{goal.description || 'No description provided.'}</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Weightage</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{goal.weightage}%</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Due Date</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{new Date(goal.due_date).toLocaleDateString()}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <ProgressBar progress={goal.target_completion} label="Current Progress" />
                            {isOwner && goal.status === 'active' && (
                                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={goal.target_completion}
                                        onChange={(e) => setGoal({ ...goal, target_completion: e.target.value })}
                                        style={{ flex: 1 }}
                                    />
                                    <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => handleAction('progress', { target_completion: goal.target_completion })}>Update</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Discussion</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                            {goal.comments?.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No comments yet.</p>
                            ) : (
                                goal.comments?.map(c => (
                                    <div key={c.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.user_name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.created_at).toLocaleString()}</span>
                                        </div>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)' }}>{c.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <form onSubmit={handleAddComment}>
                            <textarea
                                placeholder="Write a comment..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', marginBottom: '1rem' }}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>Post Comment</button>
                            </div>
                        </form>
                    </div>
                </section>

                <aside>
                    <div className="card" style={{ marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority</div>
                                <div style={{ textTransform: 'capitalize' }}>{goal.priority}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Period</div>
                                <div style={{ textTransform: 'capitalize' }}>{goal.goal_period}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Entity</div>
                                <div style={{ textTransform: 'capitalize' }}>{goal.entity}</div>
                            </div>
                        </div>
                    </div>

                    {goal.rejection_comment && (
                        <div className="card" style={{ border: '1px solid var(--danger)', backgroundColor: '#fef2f2' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger)', marginBottom: '0.5rem' }}>Rejection Feedback</h3>
                            <p style={{ fontSize: '0.875rem' }}>{goal.rejection_comment}</p>
                        </div>
                    )}
                </aside>
            </div>
        </Layout>
    );
};

export default GoalDetailPage;
