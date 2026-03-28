import React from 'react';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

const GoalCard = ({ goal, onClick }) => {
    return (
        <div className="card" onClick={onClick} style={{ cursor: 'pointer', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem' }}>{goal.title}</h3>
                    <span style={{ 
                        fontSize: '0.625rem', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        padding: '2px 6px', 
                        borderRadius: '4px', 
                        backgroundColor: goal.entity === 'company' ? '#fee2e2' : goal.entity === 'team' ? '#e0f2fe' : '#f0fdf4',
                        color: goal.entity === 'company' ? '#991b1b' : goal.entity === 'team' ? '#075985' : '#166534',
                        fontWeight: 700
                    }}>
                        {goal.entity || 'Individual'}
                    </span>
                </div>
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
