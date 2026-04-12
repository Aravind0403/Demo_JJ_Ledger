import React, { useState, useMemo } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const fmt  = (v) => Math.abs(parseFloat(v || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtG = (v) => Math.abs(parseFloat(v || 0)).toFixed(3);
const n    = (v) => parseFloat(v || 0);

const CAT_COLORS = { RETAIL: '#6366f1', SILVER: '#94a3b8', CHIT: '#f59e0b' };
const CAT_EMOJIS = { RETAIL: '🏪', SILVER: '🥈', CHIT: '📋' };

const FILTERS = ['ALL', 'RETAIL', 'SILVER', 'CHIT'];

function formatDisplayDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short' });
  } catch {
    return dateStr;
  }
}

function TransactionRow({ tx, customerName, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const isGrams = tx.sub_type === 'METAL' || tx.sub_type === 'SILVER';
  const jamaVal = n(tx.jama);
  const naveVal = n(tx.nave);
  const hasJama = Math.abs(jamaVal) > 0.0001;
  const hasNave = Math.abs(naveVal) > 0.0001;

  const color = CAT_COLORS[tx.category] || '#8899b4';

  const handleDelete = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    onDelete(tx.id);
    setConfirming(false);
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderLeft: `3px solid ${color}`,
      borderRadius: '12px',
      padding: '0.85rem 0.9rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      {/* Left: info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '6px',
            background: `${color}22`,
            color,
          }}>
            {CAT_EMOJIS[tx.category]} {tx.category}
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>·</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.sub_type}</span>
        </div>

        <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '1px' }}>
          {customerName}
        </div>

        {tx.description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            {tx.description}
          </div>
        )}

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          {tx.time || ''}
        </div>
      </div>

      {/* Right: amounts + delete */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          {hasJama && (
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#22c55e' }}>
              +{isGrams ? `${fmtG(jamaVal)}g` : `₹${fmt(jamaVal)}`}
            </div>
          )}
          {hasNave && (
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f43f5e' }}>
              -{isGrams ? `${fmtG(naveVal)}g` : `₹${fmt(naveVal)}`}
            </div>
          )}
          {!hasJama && !hasNave && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹0</div>
          )}
        </div>

        <button
          onClick={handleDelete}
          title={confirming ? 'Tap again to confirm delete' : 'Delete transaction'}
          style={{
            background: confirming ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${confirming ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: '8px',
            padding: '6px',
            cursor: 'pointer',
            color: confirming ? '#f87171' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          {confirming ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function Ledger() {
  const { transactions, customers, deleteTransaction } = useAppContext();
  const [filter, setFilter] = useState('ALL');

  const customerMap = useMemo(() => {
    const m = {};
    customers.forEach(c => { m[c.id] = c.name; });
    return m;
  }, [customers]);

  const filtered = useMemo(() => {
    return transactions
      .filter(t => !t.deleted_at)
      .filter(t => filter === 'ALL' || t.category === filter)
      .sort((a, b) => {
        const da = a.date + (a.time || '');
        const db = b.date + (b.time || '');
        return db.localeCompare(da);
      });
  }, [transactions, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = [];
    const seen = {};
    filtered.forEach(tx => {
      if (!seen[tx.date]) {
        seen[tx.date] = true;
        groups.push({ date: tx.date, items: [] });
      }
      groups[groups.length - 1].items.push(tx);
    });
    return groups;
  }, [filtered]);

  return (
    <div style={{ padding: '1rem', paddingBottom: '90px', maxWidth: '480px', margin: '0 auto' }}
         className="animate-fade-in">

      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ledger</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          {filtered.length} transactions
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FILTERS.map(f => {
          const color = CAT_COLORS[f] || 'var(--text-secondary)';
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px',
                borderRadius: '20px',
                border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
                background: active ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: active ? color : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: active ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f === 'ALL' ? 'All' : `${CAT_EMOJIS[f]} ${f}`}
            </button>
          );
        })}
      </div>

      {grouped.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          No transactions found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {grouped.map(group => (
            <div key={group.date}>
              {/* Date header */}
              <div style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>{formatDisplayDate(group.date)}</span>
                <span style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              {/* Transactions for this date */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {group.items.map(tx => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    customerName={customerMap[tx.cid] || 'Unknown'}
                    onDelete={deleteTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
