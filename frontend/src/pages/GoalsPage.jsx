import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import GoalCard from '../components/GoalCard';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoalsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const params = filter !== 'all' ? { status: filter } : {};
                const res = await client.get('/goals/', { params });
                setGoals(res.data.results || res.data);
            } catch (err) {
                console.error('Failed to fetch goals', err);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, [filter]);

    if (loading) return <Layout><div>Loading goals...</div></Layout>;

    return (
        <Layout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                            {user?.role === 'admin' ? 'Organization Goals' : 'My Performance Goals'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Manage and track objectives for the current cycle.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => navigate('/goals/new')}>+ Create New Goal</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['all', 'draft', 'pending', 'active', 'completed', 'rejected'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: filter === s ? 'var(--primary)' : 'white',
                            color: filter === s ? 'white' : 'var(--text-main)',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textTransform: 'capitalize'
                        }}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {goals.length === 0 ? (
                <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No goals found for the selected filter.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {goals.map(goal => (
                        <GoalCard key={goal.id} goal={goal} onClick={() => navigate(`/goals/${goal.id}`)} />
                    ))}
                </div>
            )}
        </Layout>
    );
};

export default GoalsPage;
