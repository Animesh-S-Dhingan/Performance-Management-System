import React from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

const GoalCard = ({ goal, onClick }) => {
    return (
        <div className="card" onClick={onClick} style={{ cursor: 'pointer', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{goal.title}</h3>
                <StatusBadge status={goal.status} />
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {goal.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                <span>Weightage: <strong>{goal.weightage}%</strong></span>
                <span>Due: <strong>{new Date(goal.due_date).toLocaleDateString()}</strong></span>
            </div>

            <ProgressBar progress={goal.target_completion} label="Completion" />

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                Updated {new Date(goal.updated_at).toLocaleDateString()}
            </div>
        </div>
    );
};

export default GoalCard;
