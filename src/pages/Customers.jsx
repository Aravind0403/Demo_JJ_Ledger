import React, { useState, useMemo } from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Customers.css';

const n   = (v) => parseFloat(v || 0);
const fmt = (v) => Math.abs(n(v)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtG = (v) => Math.abs(n(v)).toFixed(3);

function CustomerRow({ customer }) {
  const [open, setOpen] = useState(false);

  const chips = [];
  if (Math.abs(n(customer.retailCash)) > 0.001 || Math.abs(n(customer.retailGold)) > 0.0001) chips.push('RETAIL');
  if (Math.abs(n(customer.silverCash)) > 0.001 || Math.abs(n(customer.silverSilver)) > 0.0001) chips.push('SILVER');
  if (Math.abs(n(customer.chitCash)) > 0.001) chips.push('CHIT');

  const balances = [
    { label: 'Retail Cash',   value: customer.retailCash,   isGrams: false, show: Math.abs(n(customer.retailCash))   > 0.001  },
    { label: 'Retail Gold',   value: customer.retailGold,   isGrams: true,  show: Math.abs(n(customer.retailGold))   > 0.0001 },
    { label: 'Silver Cash',   value: customer.silverCash,   isGrams: false, show: Math.abs(n(customer.silverCash))   > 0.001  },
    { label: 'Silver (grams)',value: customer.silverSilver, isGrams: true,  show: Math.abs(n(customer.silverSilver)) > 0.0001 },
    { label: 'Chit Cash',     value: customer.chitCash,     isGrams: false, show: Math.abs(n(customer.chitCash))     > 0.001  },
  ].filter(b => b.show);

  return (
    <div className="customer-row glass-panel" onClick={() => setOpen(o => !o)}>
      <div className="customer-row-header">
        <div className="customer-info">
          <span className="customer-name">{customer.name}</span>
          {customer.mobile && <span className="customer-mobile">📞 {customer.mobile}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="customer-chips">
            {chips.map(c => (
              <span key={c} className={`cat-chip chip-${c.toLowerCase()}`}>{c}</span>
            ))}
            {chips.length === 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>No balance</span>
            )}
          </div>
          <ChevronDown size={16} className={`chevron-icon ${open ? 'chevron-open' : ''}`} />
        </div>
      </div>

      {open && (
        <div className="customer-expand">
          {balances.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '4px 0' }}>
              All balances are zero
            </div>
          ) : (
            balances.map(b => (
              <div key={b.label} className="balance-row">
                <span className="balance-label">{b.label}</span>
                <span className={n(b.value) >= 0 ? 'balance-positive' : 'balance-negative'}>
                  {n(b.value) >= 0 ? '+' : '-'}
                  {b.isGrams ? `${fmtG(b.value)}g` : `₹${fmt(b.value)}`}
                  {!b.isGrams && ' ' + (n(b.value) >= 0 ? 'CR' : 'DR')}
                </span>
              </div>
            ))
          )}
          {customer.dueDate && (
            <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#fbbf24' }}>
              📅 Due date: {customer.dueDate}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddCustomerModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), mobile: mobile.trim() });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet slide-up">
        <div className="modal-handle" />
        <h2 className="modal-title">Add Customer</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Customer or business name"
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Mobile (optional)</label>
            <input
              type="tel"
              value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              maxLength={10}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Add Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const { customers, addCustomer } = useAppContext();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.toLowerCase();
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.mobile && c.mobile.includes(q))
    );
  }, [customers, query]);

  return (
    <div className="customers-page animate-fade-in">
      <div className="customers-header">
        <h2 className="customers-title">Customers</h2>
        <button className="add-customer-btn" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="search-bar">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or mobile…"
        />
      </div>

      <div className="customer-list">
        {filtered.length === 0 ? (
          <div className="no-results">
            {query ? 'No customers match your search.' : 'No customers yet.'}
          </div>
        ) : (
          filtered.map(c => <CustomerRow key={c.id} customer={c} />)
        )}
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onAdd={addCustomer}
        />
      )}
    </div>
  );
}
