import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'employee' // default role
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth(); // Maan ke chal rahe hain ki AuthContext mein register function hai
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.password_confirm) {
            return setError("Passwords do not match!");
        }

        setLoading(true);
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            // Extract all validation errors from the response
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                const messages = Object.entries(data)
                    .map(([field, errors]) => {
                        const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
                        const msg = Array.isArray(errors) ? errors[0] : errors;
                        return `${label}: ${msg}`;
                    })
                    .join('\n');
                setError(messages || 'Registration failed. Please try again.');
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.625rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        outline: 'none',
        marginTop: '0.25rem'
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)', padding: '20px' }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>Create Account</h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Join the PMS Platform</p>
                </div>

                {error && (
                    <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>First Name</label>
                            <input name="first_name" type="text" required onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Last Name</label>
                            <input name="last_name" type="text" required onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Username</label>
                        <input name="username" type="text" required onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email Address</label>
                        <input name="email" type="email" required onChange={handleChange} style={inputStyle} />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Role</label>
                        <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                            <input name="password" type="password" required onChange={handleChange} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Confirm</label>
                            <input name="password_confirm" type="password" required onChange={handleChange} style={inputStyle} />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;