import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);

    const fetchUsers = async () => {
        try {
            const res = await client.get('/users/');
            setUsers(res.data.results || res.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await client.patch(`/users/${editingUser.id}/`, data);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert('Failed to update user');
        }
    };

    if (loading) return <Layout><div style={{ padding: '2rem' }}>Loading users...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>User Management</h1>
                <p style={{ color: 'var(--text-muted)' }}>Promote roles, assign managers, and manage organizational structure.</p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Name</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Current Role</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Manager (Evaluator)</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Department</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{u.first_name} {u.last_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{u.username}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ 
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 600,
                                        backgroundColor: u.role === 'admin' ? '#fef2f2' : u.role === 'manager' ? '#eff6ff' : '#f0fdf4',
                                        color: u.role === 'admin' ? '#b91c1c' : u.role === 'manager' ? '#1e40af' : '#166534'
                                    }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                                    {users.find(m => m.id === u.evaluator)?.first_name || '—'}
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>{u.department || 'N/A'}</td>
                                <td style={{ padding: '1rem' }}>
                                    <button 
                                        className="btn btn-sm" 
                                        style={{ border: '1px solid var(--border)' }}
                                        onClick={() => setEditingUser(u)}
                                    >
                                        Edit
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingUser && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="card" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Edit User: {editingUser.username}</h3>
                        <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Role</label>
                                <select name="role" defaultValue={editingUser.role} className="input" style={{ width: '100%', padding: '0.5rem' }}>
                                    <option value="employee">Employee</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Manager (Evaluator)</label>
                                <select name="evaluator" defaultValue={editingUser.evaluator || ""} className="input" style={{ width: '100%', padding: '0.5rem' }}>
                                    <option value="">None</option>
                                    {users.filter(u => u.role !== 'employee' && u.id !== editingUser.id).map(m => (
                                        <option key={m.id} value={m.id}>{m.first_name} {m.last_name} ({m.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Department</label>
                                <input name="department" defaultValue={editingUser.department} className="input" style={{ width: '100%', padding: '0.5rem' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" className="btn" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => setEditingUser(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default UserManagementPage;
