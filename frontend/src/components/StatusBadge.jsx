import React from 'react';

const StatusBadge = ({ status }) => {
    const configs = {
        draft: { label: 'Draft', class: 'badge-muted' },
        pending: { label: 'Pending Approval', class: 'badge-warning' },
        active: { label: 'Active', class: 'badge-info' },
        completed: { label: 'Completed', class: 'badge-success' },
        rejected: { label: 'Rejected', class: 'badge-danger' },
        archived: { label: 'Archived', class: 'badge-muted' },
    };

    const config = configs[status.toLowerCase()] || configs.draft;

    return (
        <span className={`badge ${config.class}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
