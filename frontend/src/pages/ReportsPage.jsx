import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import client from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const ReportsPage = () => {
    const [stats, setStats] = useState({ goals: [], flags: [] });
    const [sla, setSla] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [goalsRes, logsRes, slaRes] = await Promise.all([
                    client.get('/goals/'),
                    client.get('/audit-logs/'),
                    client.get('/feedback/sla_report/')
                ]);
                setStats({
                    goals: goalsRes.data.results || goalsRes.data,
                    flags: (logsRes.data.results || logsRes.data).filter(l => l.action === 'RED_FLAG')
                });
                setSla(slaRes.data);
            } catch (err) {
                console.error("Failed to fetch reporting data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <Layout><div style={{ padding: '2rem' }}>Loading analytics...</div></Layout>;

    // Prepare chart data
    const statusData = [
        { name: 'Draft', value: stats.goals.filter(g => g.status === 'draft').length },
        { name: 'Pending', value: stats.goals.filter(g => g.status === 'pending').length },
        { name: 'Active', value: stats.goals.filter(g => g.status === 'active').length },
        { name: 'Completed', value: stats.goals.filter(g => g.status === 'completed').length },
    ];

    const priorityData = [
        { name: 'Low', value: stats.goals.filter(g => g.priority === 'low').length },
        { name: 'Medium', value: stats.goals.filter(g => g.priority === 'medium').length },
        { name: 'High', value: stats.goals.filter(g => g.priority === 'high').length },
        { name: 'Critical', value: stats.goals.filter(g => g.priority === 'critical').length },
    ];

    const completionTrend = stats.goals.map(g => ({
        name: g.title.substring(0, 10) + '...',
        completion: g.target_completion
    })).slice(0, 10);

    return (
        <Layout>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Analytics & Reports</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Organization-wide performance insights.</p>
                </div>
                <button className="btn btn-primary">Export CSV</button>
            </div>

            {/* SLA Scorecard */}
            {sla && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Avg. Flag Resolution</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{sla.avg_flag_resolve_hours} hrs</div>
                    </div>
                    <div className="card" style={{ borderLeft: sla.flag_sla_breaches > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Flag SLA Breaches</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: sla.flag_sla_breaches > 0 ? '#ef4444' : 'inherit' }}>{sla.flag_sla_breaches}</div>
                    </div>
                    <div className="card" style={{ borderLeft: sla.goal_approval_breaches > 0 ? '4px solid #ef4444' : '4px solid #10b981' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Goal SLA Breaches</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: sla.goal_approval_breaches > 0 ? '#ef4444' : 'inherit' }}>{sla.goal_approval_breaches}</div>
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gov. Health Score</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>88%</div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Status Distribution */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Goal Status Distribution</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Priority Breakdown */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Goal Priority Breakdown</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priorityData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Completion Trends */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Top 10 Goals Completion %</h3>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={completionTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" hide />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="completion" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Red Flags Summary */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1.5rem' }}>🚩 Organizational Red Flags</h3>
                    <div style={{ fontSize: '3rem', fontWeight: 800, textAlign: 'center', margin: '2rem 0', color: stats.flags.length > 5 ? '#ef4444' : '#f59e0b' }}>
                        {stats.flags.length}
                    </div>
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        Active red flags detected across all performance ratings.
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default ReportsPage;
