import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const GoalFormPage = ({ goalId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        entity: 'individual',
        weightage: 0,
        due_date: '',
        goal_period: 'quarterly',
    });
    const [totalWeightage, setTotalWeightage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch total current weightage to validate
        const fetchTotalWeightage = async () => {
            try {
                const res = await client.get('/goals/');
                const goals = res.data.results || res.data;
                const total = goals.reduce((acc, g) => acc + parseFloat(g.weightage), 0);
                setTotalWeightage(total);
            } catch (err) {
                console.error('Failed to fetch weightage', err);
            }
        };
        fetchTotalWeightage();

        if (goalId) {
            const fetchGoal = async () => {
                try {
                    const res = await client.get(`/goals/${goalId}/`);
                    setFormData(res.data);
                } catch (err) {
                    console.error('Failed to fetch goal', err);
                }
            };
            fetchGoal();
        }
    }, [goalId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation: Weightage must total 100% (simplified check for new/edit)
        // Calculating what the total would be AFTER this edit/addition
        let currentTotalWithoutThisGoal = totalWeightage;
        if (goalId) {
            // If editing, we need to subtract the OLD weight of this goal
            const oldGoal = (await client.get(`/goals/${goalId}/`)).data;
            currentTotalWithoutThisGoal -= parseFloat(oldGoal.weightage || 0);
        }

        const newTotal = currentTotalWithoutThisGoal + parseFloat(formData.weightage || 0);
        
        if (newTotal > 100) {
            setError(`Total weightage cannot exceed 100%! (Current Total without this goal: ${currentTotalWithoutThisGoal}%, Proposed: ${formData.weightage}%)`);
            setLoading(false);
            return;
        }

        // Optional: Warn if not 100
        if (newTotal < 100) {
             const proceed = window.confirm(`Total weightage is only ${newTotal}%. PRD requires 100% for approval. Save as Draft anyway?`);
             if (!proceed) {
                 setLoading(false);
                 return;
             }
        }
        try {
            if (goalId) {
                await client.put(`/goals/${goalId}/`, formData);
            } else {
                await client.post('/goals/', formData);
            }
            onSave();
        } catch (err) {
            setError('Failed to save goal. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                    {goalId ? 'Edit Goal' : 'Create New Goal'}
                </h2>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Title</label>
                        <input
                            type="text"
                            required
                            className="btn"
                            style={{ width: '100%', border: '1px solid var(--border)', textAlign: 'left', background: 'white' }}
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Description</label>
                        <textarea
                            rows="3"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Priority</label>
                            <select
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Entity</label>
                            <select
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={formData.entity}
                                onChange={(e) => setFormData({ ...formData, entity: e.target.value })}
                            >
                                <option value="individual">Individual</option>
                                <option value="team">Team</option>
                                <option value="company">Company</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Proposed Weightage (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={formData.weightage}
                                onChange={(e) => setFormData({ ...formData, weightage: e.target.value })}
                            />
                            <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Total: {totalWeightage + parseFloat(formData.weightage || 0)}% (Final weightage set by manager)
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Due Date</label>
                            <input
                                type="date"
                                required
                                style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                                value={formData.due_date}
                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onCancel} className="btn" style={{ border: '1px solid var(--border)' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Save Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default GoalFormPage;
