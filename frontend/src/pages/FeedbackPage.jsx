import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const FeedbackPage = () => {
    const [goals, setGoals] = useState([]);
    const [selectedGoal, setSelectedGoal] = useState('');
    const [feedback, setFeedback] = useState({
        rating: 5,
        text: '',
        feedback_type: 'member' // or 'evaluator'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGoals = async () => {
            const res = await client.get('/goals/?status=active');
            setGoals(res.data.results || res.data);
        };
        fetchGoals();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedGoal) return alert('Please select a goal');
        setLoading(true);
        try {
            await client.post('/feedback/', {
                goal: selectedGoal,
                ...feedback
            });
            alert('Feedback submitted successfully');
            setFeedback({ rating: 5, text: '', feedback_type: 'member' });
            setSelectedGoal('');
        } catch (err) {
            alert('Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Feedback & Reviews</h1>
                <p style={{ color: 'var(--text-muted)' }}>Submit self-assessments or provide evaluation feedback for active goals.</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Select Goal</label>
                        <select
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                            value={selectedGoal}
                            onChange={(e) => setSelectedGoal(e.target.value)}
                            required
                        >
                            <option value="">-- Select an Active Goal --</option>
                            {goals.map(g => (
                                <option key={g.id} value={g.id}>{g.title}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Rating (1-5)</label>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {[1, 2, 3, 4, 5].map(r => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setFeedback({ ...feedback, rating: r })}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: feedback.rating === r ? 'var(--primary)' : 'white',
                                        color: feedback.rating === r ? 'white' : 'var(--text-main)',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Accomplishments & Comments</label>
                        <textarea
                            rows="5"
                            placeholder="Describe your progress, challenges, and results..."
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none' }}
                            value={feedback.text}
                            onChange={(e) => setFeedback({ ...feedback, text: e.target.value })}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                        {loading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                </form>
            </div>
        </Layout>
    );
};

export default FeedbackPage;
