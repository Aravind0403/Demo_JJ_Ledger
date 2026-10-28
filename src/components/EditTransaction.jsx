import { useEffect, useRef, useState } from 'react';
import { X, Pencil } from 'lucide-react';
import { useAppContext, getCatBalKey } from '../context/appState';
import './EditTransaction.css';
import { subcategories, editedType } from '../lib/editTransaction';

export default function EditTransaction({ transaction: tx, onClose, onSaved }) {
    const { updateTransaction, customers, chitSchemes } = useAppContext();
    const dialog = useRef(null);
    const [form, setForm] = useState({ sub_type: tx.sub_type || (tx.type === 'GOLD' && tx.category === 'RETAIL' ? 'METAL' : tx.type), chit_scheme: tx.chit_scheme || '', grams: String(tx.grams || 0), metal_type: tx.metal_type || 'GOLD', amount: String(tx.jama || tx.nave), direction: tx.jama > 0 ? 'IN' : 'OUT',
        bill_number: tx.bill_number || '', date: tx.date, description: tx.description || '', bill_amount: String(tx.bill_amount || 0), reason: '' });
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const customer = customers.find(c => c.id === tx.cid);
    const type = editedType(tx, form.sub_type);
    const cash = type === 'CASH';
    const fmt = (value, unit = type) => { const cash = unit === 'CASH'; return `${cash ? '₹' : ''}${Number(value).toLocaleString('en-IN', { minimumFractionDigits: cash ? 2 : 3, maximumFractionDigits: cash ? 2 : 3 })}${cash ? '' : ' g'}`; };
    const current = Number(customer?.[getCatBalKey(tx.category, tx.type)] || 0);
    const moved = type !== tx.type;
    const destination = Number(customer?.[getCatBalKey(tx.category, type)] || 0);
    const delta = (form.direction === 'IN' ? 1 : -1) * Number(form.amount) - (tx.jama - tx.nave);
    const change = event => { const { name, value } = event.target; setForm(prev => ({ ...prev, [name]: value,
        ...(name === 'sub_type' && editedType(tx, value) !== editedType(tx, prev.sub_type) ? { amount: '' } : {}) })); };
    useEffect(() => { dialog.current.showModal(); }, []);
    const save = async event => {
        event.preventDefault();
        if (saving) return;
        setSaving(true); setError('');
        try {
            await updateTransaction(tx.id, form, tx.editHistory?.length || 0);
            onSaved();
        } catch (err) { setError(err.message); setSaving(false); }
    };
    return <dialog ref={dialog} className="tx-edit-dialog" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }} aria-labelledby="tx-edit-title">
        <form onSubmit={save}>
            <header className="tx-edit-header">
                <div><span className="tx-edit-eyebrow">OWNER CORRECTION · LOCAL DEMO</span><h2 id="tx-edit-title"><Pencil size={20} /> Edit transaction</h2></div>
                <button type="button" className="icon-btn" aria-label="Close edit" onClick={onClose} disabled={saving}><X /></button>
            </header>
            <div className="tx-edit-body">
                <div className="tx-edit-account"><strong>{customer?.name}</strong><span>{tx.category} · {tx.sub_type} {tx.chit_scheme && `· ${tx.chit_scheme}`}</span></div>
                <p className="tx-edit-help">Correct this entry below. Customer, main category and attached photos stay the same. You can correct the subcategory or chit scheme. Balances follow the original entry order.</p>
                <div className="tx-edit-grid">
                    {tx.category === 'CHIT' ? <label>Chit scheme<select name="chit_scheme" value={form.chit_scheme} onChange={change} required><option value="">Select scheme</option>{[...new Set([...(chitSchemes || []), tx.chit_scheme].filter(Boolean))].map(s => <option key={s} value={s}>{s}</option>)}</select></label> : <label>Subcategory<select name="sub_type" value={form.sub_type} onChange={change}>{subcategories[tx.category].map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</select></label>}
                    {tx.category === 'RETAIL' && form.sub_type === 'METAL' && cash && <><label>Metal<select name="metal_type" value={form.metal_type} onChange={change}><option value="GOLD">Gold</option><option value="SILVER">Silver</option></select></label><label>Property weight (g)<input name="grams" type="number" min="0" step="0.001" value={form.grams} onChange={change} /></label></>}
                    <label>Transaction direction<select name="direction" value={form.direction} onChange={change}><option value="IN">You Got (Jama)</option><option value="OUT">You Gave (Nave)</option></select></label>
                    <label>{cash ? 'Amount (₹)' : 'Weight (g)'}<input autoFocus name="amount" type="number" min={cash ? '0.01' : '0.001'} step={cash ? '0.01' : '0.001'} max="999999999999" value={form.amount} onChange={change} required /></label>
                    <label>Bill number (optional)<input name="bill_number" maxLength={64} value={form.bill_number} onChange={change} placeholder="e.g. BILL-101" /></label>
                    <label>Transaction date<input name="date" type="date" value={form.date} onChange={change} required /></label>
                    <label>Bill amount (₹, optional)<input name="bill_amount" type="number" min="0" step="0.01" max="999999999999" value={form.bill_amount} onChange={change} /></label>
                </div>
                <label>Notes<textarea name="description" rows={2} maxLength={2000} value={form.description} onChange={change} /></label>
                <div className="tx-edit-preview">{moved ? <><span>Remove from {tx.type.toLowerCase()} balance</span><div><strong>{fmt(current, tx.type)}</strong><span>→</span><strong>{fmt(current - (tx.jama - tx.nave), tx.type)}</strong></div><span>Add to {type.toLowerCase()} balance</span><div><strong>{fmt(destination)}</strong><span>→</span><strong>{Number(form.amount) > 0 ? fmt(destination + (form.direction === 'IN' ? 1 : -1) * Number(form.amount)) : '—'}</strong></div></> : <><span>Customer’s {tx.category.toLowerCase()} {type.toLowerCase()} balance</span><div><strong>{fmt(current)}</strong><span>→</span><strong>{Number.isFinite(delta) && Number(form.amount) > 0 ? fmt(current + delta) : '—'}</strong></div></>}<small>Running balances in affected accounts will be corrected. Cash and grams are never automatically converted.</small></div>
                <label>Reason for correction<textarea name="reason" rows={2} maxLength={500} value={form.reason} onChange={change} placeholder="e.g. Amount entered incorrectly" required /></label>
                {!!tx.editHistory?.length && <details className="tx-edit-history"><summary>Correction history ({tx.editHistory.length})</summary>{[...tx.editHistory].reverse().map((entry, i) => <article key={i}><strong>{new Date(entry.at).toLocaleString()} · {entry.by}</strong><p>{entry.reason}</p><p>{entry.before.direction === 'IN' ? 'You Got (Jama)' : 'You Gave (Nave)'} {fmt(entry.before.jama || entry.before.nave, entry.before.type || tx.type)} → {entry.after.direction === 'IN' ? 'You Got (Jama)' : 'You Gave (Nave)'} {fmt(entry.after.jama || entry.after.nave, entry.after.type || tx.type)}</p>{[['sub_type', 'Subcategory'], ['chit_scheme', 'Chit scheme'], ['metal_type', 'Metal'], ['grams', 'Weight (g)'], ['bill_number', 'Bill number'], ['date', 'Date'], ['description', 'Notes'], ['bill_amount', 'Bill amount (₹)']].filter(([key]) => entry.before[key] !== entry.after[key]).map(([key, label]) => <p key={key}>{label}: {String(entry.before[key] ?? '—')} → {String(entry.after[key] ?? '—')}</p>)}</article>)}</details>}
                {error && <p className="tx-edit-error" role="alert">{error}</p>}
            </div>
            <footer className="tx-edit-footer"><button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="tx-edit-save" disabled={saving}>{saving ? 'Saving…' : 'Save correction'}</button></footer>
        </form>
    </dialog>;
}
