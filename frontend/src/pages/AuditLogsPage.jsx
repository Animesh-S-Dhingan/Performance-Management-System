import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    const fetchLogs = async (pageNum = 1) => {
        try {
            const res = await client.get(`/audit/?page=${pageNum}`);
            if (res.data && res.data.results) {
                setLogs(res.data.results);
                setHasNext(res.data.next !== null);
            } else {
                setLogs(res.data || []);
                setHasNext(false);
            }
        } catch (err) {
            console.error('Failed to load audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const formatDetails = (details) => {
        if (!details) return '-';
        if (typeof details === 'object') {
            return JSON.stringify(details);
        }
        return details.toString();
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading audit logs...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Audit Logs</h1>
                <p style={{ color: 'var(--text-muted)' }}>Organization-wide tracking of system actions and changes.</p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                                <th key={h} style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 600, textAlign: 'left', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No audit logs found.</td>
                            </tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>
                                        {log.user_name || `User ID: ${log.user}`}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>
                                        {log.action}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                        <span style={{ backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                            {log.entity_type} #{log.entity_id}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formatDetails(log.details)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', alignItems: 'center' }}>
                <button 
                    className="btn" 
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                >
                    ← Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Page {page}</span>
                <button 
                    className="btn" 
                    style={{ border: '1px solid var(--border)' }}
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasNext}
                >
                    Next →
                </button>
            </div>
        </Layout>
    );
};

export default AuditLogsPage;
