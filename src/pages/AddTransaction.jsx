import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import './AddTransaction.css';

const CATEGORIES = ['RETAIL', 'SILVER', 'CHIT'];

const SUB_TYPES = {
  RETAIL: ['CASH', 'METAL'],
  SILVER: ['CASH', 'SILVER'],
  CHIT:   ['CASH'],
};

const today = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);

function ProgressBar({ used, max }) {
  const pct = Math.min((used / max) * 100, 100);
  const warn  = used >= 8;
  const danger = used >= max;
  const cls = danger ? 'danger' : warn ? 'warn' : 'ok';

  return (
    <div className="tx-progress-wrap">
      <div className="tx-progress-header">
        <span className="tx-progress-label">Demo transaction limit</span>
        <span className={`tx-progress-badge badge-${cls}`}>{used}/{max} used</span>
      </div>
      <div className="tx-progress-bar">
        <div
          className={`tx-progress-fill fill-${cls}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function AddTransaction() {
  const { customers, addTransaction, transactions, MAX_TX } = useAppContext();
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [category, setCategory] = useState('RETAIL');
  const [subType, setSubType] = useState('CASH');
  const [direction, setDirection] = useState('jama'); // 'jama' or 'nave'
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const dropdownRef = useRef(null);

  const totalUsed = transactions.length;
  const atLimit   = totalUsed >= MAX_TX;

  // When category changes reset subtype to first valid option
  useEffect(() => {
    setSubType(SUB_TYPES[category][0]);
  }, [category]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredCustomers = customerSearch
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.mobile && c.mobile.includes(customerSearch))
      )
    : customers;

  const selectCustomer = (c) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowDropdown(false);
  };

  const handleCustomerInput = (e) => {
    setCustomerSearch(e.target.value);
    setSelectedCustomer(null);
    setShowDropdown(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !amount || parseFloat(amount) <= 0) return;

    const amountVal = parseFloat(amount);
    const jama = direction === 'jama' ? amountVal : 0;
    const nave = direction === 'nave' ? -amountVal : 0;

    const result = addTransaction({
      cid: selectedCustomer.id,
      date,
      time: nowTime(),
      category,
      sub_type: subType,
      type: subType === 'CASH' ? 'CASH' : 'METAL',
      jama,
      nave,
      description: description.trim(),
    });

    if (result) setSubmitted(true);
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCategory('RETAIL');
    setSubType('CASH');
    setDirection('jama');
    setAmount('');
    setDate(today());
    setDescription('');
    setSubmitted(false);
  };

  const isGrams = subType === 'METAL' || subType === 'SILVER';
  const amountLabel = direction === 'jama'
    ? `Amount (${isGrams ? 'grams' : '₹'}) — Jama (Credit / received)`
    : `Amount (${isGrams ? 'grams' : '₹'}) — Nave (Debit / given)`;

  const canSubmit = !!selectedCustomer && !!amount && parseFloat(amount) > 0 && !atLimit;

  if (submitted) {
    return (
      <div className="add-tx-page animate-fade-in">
        <ProgressBar used={transactions.length} max={MAX_TX} />
        <div className="success-card">
          <div className="success-icon">✅</div>
          <div className="success-title">Transaction Saved!</div>
          <div className="success-sub">Entry recorded for {selectedCustomer?.name}</div>
          <div className="success-actions">
            <button className="btn-another" onClick={resetForm}>+ Add Another</button>
            <button className="btn-ledger" onClick={() => navigate('/ledger')}>View Ledger →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-tx-page animate-fade-in">
      <div className="tx-header">
        <h2 className="tx-title">Add Transaction</h2>
        <p className="tx-subtitle">Record a new ledger entry</p>
      </div>

      <ProgressBar used={totalUsed} max={MAX_TX} />

      {atLimit ? (
        <div className="limit-banner">
          <h3>🚫 Demo Limit Reached</h3>
          <p>You've used all {MAX_TX} transaction slots. Refresh the page to reset the demo.</p>
        </div>
      ) : (
        <form className="tx-form" onSubmit={handleSubmit}>
          {/* Customer */}
          <div className="field-group">
            <label className="field-label">Customer *</label>
            <div className="customer-select-wrap" ref={dropdownRef}>
              <input
                className="customer-select-input"
                type="text"
                value={customerSearch}
                onChange={handleCustomerInput}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search customer…"
                autoComplete="off"
              />
              {showDropdown && filteredCustomers.length > 0 && (
                <div className="customer-dropdown">
                  {filteredCustomers.map(c => (
                    <div
                      key={c.id}
                      className="customer-option"
                      onMouseDown={() => selectCustomer(c)}
                    >
                      <div>{c.name}</div>
                      {c.mobile && <div className="customer-option-mobile">{c.mobile}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="field-group">
            <label className="field-label">Category</label>
            <div className="btn-group">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`cat-btn ${category === cat ? `cat-btn-active-${cat.toLowerCase()}` : ''}`}
                  onClick={() => setCategory(cat)}
                >
                  {cat === 'RETAIL' ? '🏪' : cat === 'SILVER' ? '🥈' : '📋'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-type */}
          <div className="field-group">
            <label className="field-label">Type</label>
            <div className="btn-group">
              {SUB_TYPES[category].map(st => {
                const activeClass =
                  st === 'CASH' ? 'cat-btn-active-cash' :
                  st === 'METAL' ? 'cat-btn-active-metal' :
                  'cat-btn-active-silveramt';
                return (
                  <button
                    key={st}
                    type="button"
                    className={`cat-btn ${subType === st ? activeClass : ''}`}
                    onClick={() => setSubType(st)}
                  >
                    {st === 'CASH' ? '💵 Cash' : st === 'METAL' ? '🥇 Metal (g)' : '🥈 Silver (g)'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Jama / Nave direction */}
          <div className="field-group">
            <label className="field-label">Direction</label>
            <div className="jama-nave-toggle">
              <button
                type="button"
                className={`jama-btn ${direction === 'jama' ? 'jama-btn-active-jama' : ''}`}
                onClick={() => setDirection('jama')}
              >
                ✅ Jama + (Credit)
              </button>
              <button
                type="button"
                className={`jama-btn ${direction === 'nave' ? 'jama-btn-active-nave' : ''}`}
                onClick={() => setDirection('nave')}
              >
                ❌ Nave − (Debit)
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="field-group">
            <label className="field-label">{amountLabel}</label>
            <input
              className="amount-input"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder={isGrams ? 'e.g. 10.500' : 'e.g. 5000'}
              step={isGrams ? '0.001' : '1'}
              min="0"
            />
          </div>

          {/* Date */}
          <div className="field-group">
            <label className="field-label">Date</label>
            <input
              className="date-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="field-group">
            <label className="field-label">Description (optional)</label>
            <input
              className="desc-input"
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Advance payment, ring purchase…"
              maxLength={100}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={!canSubmit}>
            Save Transaction
          </button>
        </form>
      )}
    </div>
  );
}
