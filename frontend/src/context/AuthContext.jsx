import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

// 1. Context ko export mat karo (internal rakho)
const AuthContext = createContext(null);

// 2. Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await client.get('/auth/me/');
            setUser(res.data);
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        const res = await client.post('/token/', { username: email, password });
        const { access } = res.data;
        localStorage.setItem('token', access);
        await checkAuth();
        return res.data;
    };

    const register = async (userData) => {
        const res = await client.post('/auth/register/', userData);
        const { access, user: registeredUser } = res.data;
        localStorage.setItem('token', access);
        setUser(registeredUser);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Value object ko memoize karne ki zaroorat nahi hai yahan but clean rakhte hain
    const value = {
        user,
        login,
        logout,
        register,
        loading,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 3. Hook ko export karo
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};