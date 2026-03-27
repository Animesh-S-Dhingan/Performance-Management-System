import React from 'react';

const TimelineWidget = ({ events }) => {
    return (
        <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Timeline</h3>
            <div style={{ position: 'relative' }}>
                {/* Vertical line mapping the dots */}
                <div style={{
                    position: 'absolute',
                    left: '7px',
                    top: '4px',
                    bottom: '4px',
                    width: '2px',
                    background: 'var(--border)',
                    zIndex: 0
                }}></div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {events.map((event, index) => {
                        const isCompleted = event.status === 'completed';
                        const isOverdue = event.status === 'overdue';

                        return (
                            <li key={index} style={{
                                marginBottom: index === events.length - 1 ? 0 : '1.5rem',
                                paddingLeft: '2rem',
                                position: 'relative'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '4px',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    background: isCompleted ? 'var(--success)' : isOverdue ? 'var(--danger)' : 'white',
                                    border: isCompleted || isOverdue ? 'none' : '2px solid var(--border)',
                                    zIndex: 1
                                }}></div>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{event.title}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.date}</span>
                                    </div>
                                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {event.description}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default TimelineWidget;
