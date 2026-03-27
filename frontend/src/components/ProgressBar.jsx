import React from 'react';

const ProgressBar = ({ progress, label }) => {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{progress}%</span>
            </div>
            <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    );
};

export default ProgressBar;
