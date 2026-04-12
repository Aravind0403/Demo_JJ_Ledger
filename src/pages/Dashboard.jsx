import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './Dashboard.css';

const fmt  = (v) => Math.abs(parseFloat(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtG = (v) => Math.abs(parseFloat(v || 0)).toFixed(3);
const n    = (v) => parseFloat(v || 0);

function NetRow({ label, value, isGrams }) {
  const abs = Math.abs(n(value));
  if (abs < 0.0001) return null;
  const pos = n(value) >= 0;
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '6px 0',
      fontSize: '0.85rem',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, color: pos ? '#22c55e' : '#f43f5e' }}>
        {pos ? '+' : '-'}{isGrams ? `${fmtG(abs)}g` : `₹${fmt(abs)}`}
        {!isGrams && ' ' + (pos ? 'CR' : 'DR')}
      </span>
    </div>
  );
}

function KPICard({ emoji, title, color, rows }) {
  return (
    <div className="kpi-card glass-panel" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="kpi-title" style={{ color }}>{emoji} {title}</div>
      <div className="kpi-rows">
        {rows.map((r, i) => <NetRow key={i} {...r} />)}
        {rows.every(r => Math.abs(n(r.value)) < 0.0001) && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '4px' }}>No activity</div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { customers, transactions } = useAppContext();

  const stats = useMemo(() => {
    const retail = { cash: 0, gold: 0 };
    const silver = { cash: 0, silver: 0 };
    const chit   = { cash: 0 };
    customers.forEach(c => {
      retail.cash   += n(c.retailCash);
      retail.gold   += n(c.retailGold);
      silver.cash   += n(c.silverCash);
      silver.silver += n(c.silverSilver);
      chit.cash     += n(c.chitCash);
    });
    return { retail, silver, chit };
  }, [customers]);

  const activeTx = transactions.filter(t => !t.deleted_at).length;

  const quickNav = [
    { label: 'Customers', sub: `${customers.length} registered`,  path: '/customers',    color: '#6366f1' },
    { label: 'Add Entry', sub: 'Record a transaction',            path: '/transactions', color: '#f59e0b' },
    { label: 'Ledger',    sub: 'View all transactions',           path: '/ledger',       color: '#10b981' },
    { label: 'Dues',      sub: 'Pending collections',             path: '/due',          color: '#ef4444' },
  ];

  return (
    <div className="dashboard-page animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Financial Position</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {customers.length} customers · {activeTx} active transactions
        </p>
      </div>

      <div className="kpi-grid">
        <KPICard emoji="🏪" title="Retail" color="#6366f1" rows={[
          { label: 'Cash', value: stats.retail.cash, isGrams: false },
          { label: 'Gold', value: stats.retail.gold, isGrams: true  },
        ]} />
        <KPICard emoji="🥈" title="Silver" color="#94a3b8" rows={[
          { label: 'Cash',   value: stats.silver.cash,   isGrams: false },
          { label: 'Silver', value: stats.silver.silver, isGrams: true  },
        ]} />
        <KPICard emoji="📋" title="Chit" color="#f59e0b" rows={[
          { label: 'Cash', value: stats.chit.cash, isGrams: false },
        ]} />
      </div>

      <div className="quick-nav-grid">
        {quickNav.map(({ label, sub, path, color }) => (
          <div
            key={path}
            onClick={() => navigate(path)}
            className="quick-nav-card glass-panel"
            style={{ borderLeft: `3px solid ${color}` }}
          >
            <div className="quick-nav-label" style={{ color }}>{label}</div>
            <div className="quick-nav-sub">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
