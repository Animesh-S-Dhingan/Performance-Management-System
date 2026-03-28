import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import client from '../api/client';

const AdminConfigPage = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const navigate = useNavigate();

    const fetchConfigs = async () => {
        try {
            const res = await client.get('/admin-config/');
            setConfigs(res.data.results || res.data || []);
        } catch (err) {
            console.error('Failed to load admin config', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async (id, value) => {
        setSaving(id);
        let parsedValue = value;
        if (typeof value === 'string') {
            try {
                parsedValue = JSON.parse(value);
            } catch (e) {
                alert('Invalid JSON format');
                setSaving(null);
                return;
            }
        }
        
        try {
            await client.patch(`/admin-config/${id}/`, { value: parsedValue });
            await fetchConfigs();
            alert('Configuration saved successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to save configuration');
        } finally {
            setSaving(null);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const key = e.target.key.value;
        const valueStr = e.target.value.value;
        
        if (!key || !valueStr) return alert('Key and value required');
        
        let value;
        try {
            value = JSON.parse(valueStr);
        } catch(err) {
            return alert('Value must be valid JSON object, e.g. {"threshold": 2}');
        }

        try {
            await client.post('/admin-config/', { key, value });
            e.target.reset();
            fetchConfigs();
        } catch (err) {
            alert('Failed to create configuration');
        }
    };

    if (loading) return <Layout><div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading admin settings...</div></Layout>;

    return (
        <Layout>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Admin Settings</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configure platform-wide settings such as cycle parameters, default targets, and thresholds.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {configs.length === 0 ? (
                        <div className="card">
                            <p style={{ color: 'var(--text-muted)' }}>No configurations found.</p>
                        </div>
                    ) : (
                        configs.map(config => (
                            <ConfigCard 
                                key={config.id} 
                                config={config} 
                                onSave={(val) => handleSave(config.id, val)} 
                                saving={saving === config.id} 
                            />
                        ))
                    )}
                </div>

                <div>
                    <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)', backgroundColor: '#eef2ff' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>Administrative Control</h2>
                        <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem', color: '#475569' }}>Access advanced tools to manage users, roles, and platform integrity.</p>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginBottom: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => navigate('/admin/users')}
                        >
                            👥 User Management
                        </button>
                        <button 
                            className="btn" 
                            style={{ width: '100%', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => navigate('/audit')}
                        >
                            📜 System Audit Logs
                        </button>
                    </div>

                    <div className="card" style={{ backgroundColor: '#f8fafc' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Add New Key</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#64748b', textTransform: 'uppercase' }}>Config Key</label>
                                <input 
                                    name="key"
                                    type="text"
                                    className="input"
                                    placeholder="e.g. flag_thresholds"
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem', color: '#64748b', textTransform: 'uppercase' }}>Value (JSON Object)</label>
                                <textarea
                                    name="value"
                                    className="input"
                                    rows="4"
                                    placeholder='{"max_score": 5}'
                                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'monospace' }}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                Create Setting
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

const ConfigCard = ({ config, onSave, saving }) => {
    const [val, setVal] = useState(JSON.stringify(config.value, null, 2));

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--primary)' }}>
                {config.key}
            </h3>
            <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    minHeight: '100px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    marginBottom: '1rem'
                }}
            />
            <button 
                className="btn btn-primary" 
                onClick={() => onSave(val)}
                disabled={saving || val === JSON.stringify(config.value, null, 2)}
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default AdminConfigPage;
