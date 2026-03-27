import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GoalsPage from './pages/GoalsPage';
import GoalFormPage from './pages/GoalFormPage';
import GoalDetailPage from './pages/GoalDetailPage';
import ApprovalsPage from './pages/ApprovalsPage';
import FeedbackPage from './pages/FeedbackPage';
import Layout from './components/Layout';

const DashboardRouter = () => {
    const { user } = useAuth();

    if (user?.role === 'admin') return <AdminDashboard />;
    if (user?.role === 'manager') return <ManagerDashboard />;
    return <EmployeeDashboard />;
};

const Placeholder = ({ title }) => (
    <Layout>
        <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h2>
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>This page is currently under development.</p>
        </div>
    </Layout>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardRouter />
                        </ProtectedRoute>
                    } />

                    <Route path="/goals" element={
                        <ProtectedRoute>
                            <GoalsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/goals/new" element={
                        <ProtectedRoute>
                            <GoalFormPage onSave={() => window.location.href = '/goals'} onCancel={() => window.location.href = '/goals'} />
                        </ProtectedRoute>
                    } />

                    <Route path="/goals/:id" element={
                        <ProtectedRoute>
                            <GoalDetailPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/approvals" element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                            <ApprovalsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/feedback" element={
                        <ProtectedRoute>
                            <FeedbackPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/probation" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Placeholder title="Probation Tracking" />
                        </ProtectedRoute>
                    } />

                    <Route path="/cycles" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Placeholder title="Review Cycles" />
                        </ProtectedRoute>
                    } />

                    <Route path="/audit" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Placeholder title="Audit Logs" />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin-config" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <Placeholder title="Admin Settings" />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
