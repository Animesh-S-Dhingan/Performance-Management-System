import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItemsByRole = {
        employee: [
            { name: 'Dashboard', path: '/' },
            { name: 'My Goals', path: '/goals' },
            { name: 'Feedback', path: '/feedback' },
        ],
        manager: [
            { name: 'Dashboard', path: '/' },
            { name: 'Team Goals', path: '/goals' },
            { name: 'Approvals', path: '/approvals' },
            { name: 'Feedback', path: '/feedback' },
        ],
        admin: [
            { name: 'Dashboard', path: '/' },
            { name: 'Org Goals', path: '/goals' },
            { name: 'Probation', path: '/probation' },
            { name: 'Review Cycles', path: '/cycles' },
            { name: 'Audit Logs', path: '/audit' },
            { name: 'Settings', path: '/admin-config' },
        ],
    };

    const navItems = user ? navItemsByRole[user.role] || [] : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside style={{
                width: 'var(--sidebar-width)',
                backgroundColor: '#1e293b',
                color: 'white',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh'
            }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', color: '#818cf8' }}>
                    PMS Platform
                </div>

                <nav style={{ flex: 1 }}>
                    <ul style={{ listStyle: 'none' }}>
                        {navItems.map((item) => (
                            <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                                <Link
                                    to={item.path}
                                    style={{
                                        display: 'block',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        color: location.pathname === item.path ? 'white' : '#94a3b8',
                                        backgroundColor: location.pathname === item.path ? '#334155' : 'transparent',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {item.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                        {user?.first_name} {user?.last_name}
                        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>{user?.role}</div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: '1px solid #334155',
                            color: '#94a3b8',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: 'var(--sidebar-width)',
                padding: '2rem',
                backgroundColor: 'var(--bg-main)'
            }}>
                <header style={{
                    height: 'var(--header-height)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    borderBottom: '1px solid var(--border)',
                    margin: '-2rem -2rem 2rem -2rem',
                    padding: '0 2rem',
                    backgroundColor: 'white'
                }}>
                    {/* Header content: Role switch, Notifications bell */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Add notifications bell / role switch here if needed */}
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
};

export default Layout;
