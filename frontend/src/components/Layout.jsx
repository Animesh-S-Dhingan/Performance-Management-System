import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isChatRoute = location.pathname.startsWith('/chat');

    const getDashboardPath = (role) => {
        switch (role) {
          case 'admin':
            return '/admin-dashboard';
          case 'manager':
            return '/team-dashboard';
          default:
            return '/dashboard';
        }
      };


    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItemsByRole = {
        employee: [
            { name: 'Dashboard', path: getDashboardPath(user?.role) },
            { name: 'My Goals', path: '/goals' },
            { name: 'Feedback', path: '/feedback' },
            { name: 'Chat', path: '/chat' },
        ],
        manager: [
            { name: 'Dashboard', path: getDashboardPath(user?.role) },
            { name: 'Team Goals', path: '/goals' },
            { name: 'Probation', path: '/probation' },
            { name: 'Review Cycles', path: '/cycles' },
            { name: 'Approvals', path: '/approvals' },
            { name: 'Feedback', path: '/feedback' },
            { name: 'Chat', path: '/chat' },
        ],
        admin: [
            { name: 'Dashboard', path: getDashboardPath(user?.role)},
            { name: 'Org Goals', path: '/goals' },
            { name: 'User Management', path: '/admin/users' },
            { name: 'Probation', path: '/probation' },
            { name: 'Review Cycles', path: '/cycles' },
            { name: 'Reports', path: '/reports' },
            { name: 'Audit Logs', path: '/audit' },
            { name: 'Chat', path: '/chat' },
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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link to="/notifications" style={{ textDecoration: 'none', color: '#64748b', fontSize: '1.25rem', padding: '0.25rem' }}>
                            🔔
                        </Link>
                    </div>
                </header>

                {children}
            </main>

            {/* Bouncing Floating AI Button */}
            {!isChatRoute && (
                <Link 
                    to="/chat" 
                    onClick={() => localStorage.setItem('autoOpenBot', 'true')}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        padding: '1rem 1.5rem',
                        backgroundColor: 'var(--primary)',
                        color: 'white',
                        borderRadius: '30px',
                        boxShadow: '0 10px 15px -3px rgba(79,70,229,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textDecoration: 'none',
                        fontWeight: 600,
                        zIndex: 50,
                        animation: 'float 3s ease-in-out infinite'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>🧠</span>
                    <span>Have a question? I am here!</span>
                </Link>
            )}
            
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
};

export default Layout;
