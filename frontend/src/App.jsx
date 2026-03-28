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
import RegisterPage from './pages/RegisterPage';
import ProbationPage from './pages/ProbationPage';
import ReviewCyclesPage from './pages/ReviewCyclesPage';
import AuditLogsPage from './pages/AuditLogsPage';
import AdminConfigPage from './pages/AdminConfigPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import AdminFlagsPage from './pages/AdminFlagsPage';
import ChatPage from './pages/ChatPage';
import UserManagementPage from './pages/UserManagementPage';

const DashboardRouter = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <Navigate to="/admin-config" replace />; 
    if (user?.role === 'manager') return <Navigate to="/team-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
};


function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <DashboardRouter />
                        </ProtectedRoute>
                    } />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <EmployeeDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/team-dashboard" element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                            <ManagerDashboard />
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
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                            <ProbationPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/cycles" element={
                        <ProtectedRoute allowedRoles={['manager', 'admin']}>
                            <ReviewCyclesPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/users" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <UserManagementPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/audit" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AuditLogsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin-config" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminConfigPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/notifications" element={
                        <ProtectedRoute>
                            <NotificationsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/admin/flags" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminFlagsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/reports" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <ReportsPage />
                        </ProtectedRoute>
                    } />

                    <Route path="/chat" element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
