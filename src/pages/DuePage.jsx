import React, { useMemo, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import './DuePage.css';

const n    = (v) => parseFloat(v || 0);
const fmt  = (v) => Math.abs(n(v)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtG = (v) => Math.abs(n(v)).toFixed(3);

const CATS = ['ALL', 'RETAIL', 'SILVER', 'CHIT'];

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function hasDue(c, cat) {
  if (cat === 'RETAIL' || cat === 'ALL') {
    if (n(c.retailCash) < -0.01 || n(c.retailGold) < -0.0001) return true;
  }
  if (cat === 'SILVER' || cat === 'ALL') {
    if (n(c.silverCash) < -0.01 || n(c.silverSilver) < -0.0001) return true;
  }
  if (cat === 'CHIT' || cat === 'ALL') {
    if (n(c.chitCash) < -0.01) return true;
  }
  if (c.dueDate) return true;
  return false;
}

export default function DuePage() {
  const { customers } = useAppContext();
  const [cat, setCat] = useState('ALL');

  const dues = useMemo(() =>
    customers.filter(c => hasDue(c, cat))
      .sort((a, b) => {
        // overdue first
        const aOver = a.dueDate && isOverdue(a.dueDate);
        const bOver = b.dueDate && isOverdue(b.dueDate);
        if (aOver && !bOver) return -1;
        if (!aOver && bOver) return 1;
        return (a.name || '').localeCompare(b.name || '');
      }),
  [customers, cat]);

  const sendWhatsApp = (c) => {
    const lines = [];
    lines.push(`Dear ${c.name},`);
    lines.push('');
    lines.push('This is a gentle reminder from JJ Ledger Pro regarding your outstanding balance:');
    if (n(c.retailCash) < -0.01)      lines.push(`  • Retail Cash: ₹${fmt(c.retailCash)} DR`);
    if (n(c.retailGold) < -0.0001)    lines.push(`  • Retail Gold: ${fmtG(c.retailGold)}g DR`);
    if (n(c.silverCash) < -0.01)      lines.push(`  • Silver Cash: ₹${fmt(c.silverCash)} DR`);
    if (n(c.silverSilver) < -0.0001)  lines.push(`  • Silver: ${fmtG(c.silverSilver)}g DR`);
    if (n(c.chitCash) < -0.01)        lines.push(`  • Chit: ₹${fmt(c.chitCash)} DR`);
    if (c.dueDate)                     lines.push(`  • Due Date: ${c.dueDate}`);
    lines.push('');
    lines.push('Please clear the dues at your earliest convenience.');
    lines.push('Thank you 🙏 — JJ Jewellers');

    const phone = (c.mobile || '').replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(lines.join('\n'))}`
      : `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank');
  };

  return (
    <div className="due-page animate-fade-in">
      <div className="due-header">
        <h2 className="due-title">Dues & Reminders</h2>
        <p className="due-sub">{dues.length} customer{dues.length !== 1 ? 's' : ''} with outstanding balances</p>
      </div>

      {/* Category tabs */}
      <div className="due-tabs">
        {CATS.map(c => (
          <button key={c} className={`due-tab ${cat === c ? 'due-tab-active' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
      </div>

      {dues.length === 0 ? (
        <div className="due-empty glass-panel">
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <div style={{ fontWeight: 600, color: '#22c55e' }}>All clear!</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>No outstanding dues in this category.</div>
        </div>
      ) : (
        <div className="due-list">
          {dues.map(c => {
            const overdue = c.dueDate && isOverdue(c.dueDate);
            return (
              <div key={c.id} className="due-card glass-panel">
                <div className="due-card-top">
                  <div>
                    <div className="due-cust-name">{c.name}</div>
                    {c.mobile && <div className="due-cust-mobile">{c.mobile}</div>}
                  </div>
                  <button className="due-wa-btn" onClick={() => sendWhatsApp(c)}>
                    📲 Remind
                  </button>
                </div>

                {c.dueDate && (
                  <div className={`due-date-chip ${overdue ? 'due-overdue' : 'due-upcoming'}`}>
                    {overdue ? '⚠️ Overdue' : '📅 Due'}: {c.dueDate}
                  </div>
                )}

                <div className="due-balances">
                  {n(c.retailCash) < -0.01 && (
                    <div className="due-bal-row">
                      <span>Retail Cash</span>
                      <span className="due-neg">−₹{fmt(c.retailCash)}</span>
                    </div>
                  )}
                  {n(c.retailGold) < -0.0001 && (
                    <div className="due-bal-row">
                      <span>Retail Gold</span>
                      <span className="due-neg">−{fmtG(c.retailGold)}g</span>
                    </div>
                  )}
                  {n(c.silverCash) < -0.01 && (
                    <div className="due-bal-row">
                      <span>Silver Cash</span>
                      <span className="due-neg">−₹{fmt(c.silverCash)}</span>
                    </div>
                  )}
                  {n(c.silverSilver) < -0.0001 && (
                    <div className="due-bal-row">
                      <span>Silver</span>
                      <span className="due-neg">−{fmtG(c.silverSilver)}g</span>
                    </div>
                  )}
                  {n(c.chitCash) < -0.01 && (
                    <div className="due-bal-row">
                      <span>Chit Cash</span>
                      <span className="due-neg">−₹{fmt(c.chitCash)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
