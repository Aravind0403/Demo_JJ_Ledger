import React, { useState, useEffect } from 'react';
import { Lock, UserCheck, Eye, EyeOff, Loader, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Login.css';

// Internal Supabase credentials — implementation detail, never shown in UI.
// These map each role to a fixed Supabase Auth user. Passcodes the shop uses
// are stored as hashes in the organizations table and managed from Settings.
const ROLE_EMAIL = {
    owner: 'owner@demoledger.com',
    staff: 'staff@demoledger.com',
    view:  'view@demoledger.com',
};
const ROLE_PASS = {
    owner: 'owner123',
    staff: 'staff123',
    view:  'view123',
};

// Fallback SHA-256 hashes for default passcodes (used when Supabase unavailable)
const FALLBACK_HASHES = {
    owner: '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9',
    staff: '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6',
    view:  '656d604dfdba41a262963cce53699bbc56cd7a2c0da1ad5ead45fc49214159d6',
};

const ROLE_CONFIG = {
    owner: { label: 'Owner', icon: '👑', accent: 'gold',  title: 'Owner Sign In' },
    staff: { label: 'Staff', icon: '👤', accent: 'blue',  title: 'Staff Sign In' },
    view:  { label: 'View',  icon: '👁', accent: 'muted', title: 'View Access'   },
};

const hashPassword = async (text) => {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const Login = () => {
    const { login } = useAppContext();
    const [selectedRole, setSelectedRole] = useState(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setError('');
        setPassword('');
    };

    const handleBack = () => {
        setSelectedRole(null);
        setError('');
        setPassword('');
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const success = login(selectedRole, password);
            if (!success) {
                setError(`Invalid passcode for ${ROLE_CONFIG[selectedRole].label}. Try ${selectedRole}123`);
            }
        } catch (err) {
            console.error(err);
            setError('Login error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card glass-panel animate-fade-in">
                {/* Header */}
                <div className="login-header">
                    <div className="login-icon-wrap">
                        <Lock size={32} className="text-blue" />
                    </div>
                    <h2>Demo Ledger</h2>
                </div>

                {/* Step 1: Role Selection */}
                {!selectedRole ? (
                    <>
                        <div className="login-step-label">Select your role to continue</div>
                        <div className="role-grid">
                            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                                <button
                                    key={role}
                                    className={`role-tile role-tile-${config.accent}`}
                                    onClick={() => handleRoleSelect(role)}
                                >
                                    <span className="role-tile-icon">{config.icon}</span>
                                    <span className="role-tile-label">{config.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    /* Step 2: Passcode input */
                    <div className="login-step2 animate-slide-in">
                        <div className="login-step-header">
                            <button className="login-back-btn" onClick={handleBack} disabled={loading}>
                                <ArrowLeft size={18} />
                            </button>
                            <span className="login-step-title">{ROLE_CONFIG[selectedRole].title}</span>
                        </div>

                        <form onSubmit={handleLogin} className="login-form">
                            <div className="input-group" style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter Passcode"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoFocus
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', color: 'var(--text-muted)',
                                        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {error && <div className="login-error">{error}</div>}

                            <button type="submit" className="login-btn" disabled={loading || !password}>
                                {loading
                                    ? <><Loader size={18} className="spin" /> Signing in…</>
                                    : <><UserCheck size={18} /> Sign In</>
                                }
                            </button>
                        </form>

                        <p className="login-footer-hint">Use passcode: {selectedRole}123</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
