import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import client from '../api/client';

const ApprovalsPage = () => {
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localWeightages, setLocalWeightages] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                const res = await client.get('/goals/?status=pending');
                const data = res.data.results || res.data;
                setApprovals(data);
                // Initialize local weightages
                const weights = {};
                data.forEach(a => { weights[a.id] = a.weightage; });
                setLocalWeightages(weights);
            } catch (err) {
                console.error('Failed to fetch approvals', err);
            } finally {
                setLoading(false);
            }
        };
        fetchApprovals();
    }, []);

    const handleAction = async (id, action) => {
        try {
            if (action === 'reject') {
                const reason = prompt('Please enter rejection reason:');
                if (!reason) return;
                await client.post(`/goals/${id}/reject/`, { comment: reason });
            } else {
                await client.post(`/goals/${id}/approve/`, { weightage: localWeightages[id] });
            }
            setApprovals(approvals.filter(a => a.id !== id));
        } catch (err) {
            alert(`Failed to ${action} goal`);
        }
    };

    if (loading) return <Layout><div>Loading approvals...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Approval Queue</h1>
                <p style={{ color: 'var(--text-muted)' }}>Review and act on goal submissions. PRD: Set final weightage during approval.</p>
            </div>

            {approvals.length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No pending approvals at this time.</p>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Employee</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Goal Title</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Final Weightage (%)</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Due Date</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvals.map(approval => (
                                <tr key={approval.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{approval.assigned_to_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', color: 'var(--primary)' }} onClick={() => navigate(`/goals/${approval.id}`)}>{approval.title}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        <input 
                                            type="number" 
                                            value={localWeightages[approval.id]} 
                                            onChange={(e) => setLocalWeightages({...localWeightages, [approval.id]: e.target.value})}
                                            style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{new Date(approval.due_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-primary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', backgroundColor: 'var(--success)' }} onClick={() => handleAction(approval.id, 'approve')}>Approve</button>
                                            <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', border: '1px solid var(--border)', color: 'var(--danger)' }} onClick={() => handleAction(approval.id, 'reject')}>Reject</button>
                                        </div>
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

export default ApprovalsPage;
