import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Login.css';

export default function Login() {
  const { login } = useAppContext();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 400));
    if (login(pw)) {
      navigate('/dashboard');
    } else {
      setError('Incorrect password. Hint: demo123');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-logo">💎</div>
        <h1 className="login-title">JJ Ledger Pro</h1>
        <p className="login-sub">Interactive Demo</p>

        <div className="demo-hint">
          <span>👋</span> Explore the full app experience. All data is local to your browser.
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label>Demo Password</label>
            <input
              type="password"
              value={pw}
              onChange={e => { setPw(e.target.value); setError(''); }}
              placeholder="Enter demo password"
              autoComplete="off"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading || !pw}>
            {loading ? 'Entering…' : 'Enter Demo →'}
          </button>
        </form>

        <p className="login-footer">
          No account needed · No data saved to cloud · Refresh to reset
        </p>
      </div>
    </div>
  );
}
