import { getCatBalKey } from '../context/appState.js';
import { canManage } from './roleAccess.js';

export const subcategories = { RETAIL: ['CASH', 'METAL'], BULLION: ['CASH', 'GOLD', 'SILVER'], SILVER: ['CASH', 'SILVER'], CHIT: ['CASH'] };
export const editedType = (tx, sub) => sub === tx.sub_type ? tx.type : tx.category === 'RETAIL' || sub === 'CASH' ? 'CASH' : sub;

const fields = ['type', 'sub_type', 'chit_scheme', 'metal_type', 'jama', 'nave', 'direction', 'grams', 'bill_amount', 'bill_number', 'date', 'description'];
const snapshot = tx => Object.fromEntries(fields.map(key => [key, tx[key] ?? null]));
const round = (value, type) => Number(value.toFixed(type === 'CASH' ? 2 : 3));

// Preserve customer, category, posting order and opening balances in both affected accounts.
export function editTransaction({ transactions, deletedTransactions, customers, role, id, changes, expectedRevision }) {
    if (!canManage(role)) throw new Error('Only the owner can edit transactions.');
    const old = transactions.find(tx => tx.id === id);
    if (!old) throw new Error('This transaction is no longer available.');
    if ((old.editHistory?.length || 0) !== expectedRevision) throw new Error('This transaction changed. Close and reopen it before editing.');
    const customer = customers.find(c => c.id === old.cid);
    const key = getCatBalKey(old.category, old.type);
    if (!customer || !key) throw new Error('The customer or account could not be found.');
    const sub = changes.sub_type ?? old.sub_type;
    if (sub !== undefined && !subcategories[old.category]?.includes(sub)) throw new Error('Choose a valid subcategory.');
    const type = sub === undefined ? old.type : editedType(old, sub);
    const nextKey = getCatBalKey(old.category, type);
    const scheme = changes.chit_scheme ?? old.chit_scheme;
    if (old.category === 'CHIT' && changes.chit_scheme !== undefined && !scheme?.trim()) throw new Error('Choose a chit scheme.');
    const grams = Number(changes.grams ?? old.grams ?? 0);
    if (!Number.isFinite(grams) || grams < 0 || grams > 999999999999 || Math.abs(grams - round(grams, 'GOLD')) > 1e-7) throw new Error('Enter a valid weight with up to 3 decimal places.');
    const metal = changes.metal_type ?? (old.metal_type || 'GOLD');
    if (old.category === 'RETAIL' && sub === 'METAL' && !['GOLD', 'SILVER'].includes(metal)) throw new Error('Choose gold or silver.');
    const amount = Number(changes.amount);
    const precision = type === 'CASH' ? 2 : 3;
    if (!Number.isFinite(amount) || amount <= 0 || amount > 999999999999 || Math.abs(amount - round(amount, type)) > 1e-7) {
        throw new Error(`Enter an amount above zero with up to ${precision} decimal places.`);
    }
    if (!['IN', 'OUT'].includes(changes.direction)) throw new Error('Choose You Got (Jama) or You Gave (Nave).');
    const bill = changes.bill_number?.trim().toUpperCase() || null;
    if (bill && bill.length > 64) throw new Error('Bill number must be 64 characters or fewer.');
    if (bill && [...transactions, ...deletedTransactions].some(t => t.id !== id && t.bill_number?.toUpperCase() === bill)) {
        throw new Error('Bill number already exists. Use a different number or leave it blank.');
    }
    const date = changes.date;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Enter a valid date.');
    const reason = changes.reason?.trim();
    if (!reason) throw new Error('Please enter a reason for this correction.');
    const billAmount = Number(changes.bill_amount || 0);
    if (!Number.isFinite(billAmount) || billAmount < 0 || billAmount > 999999999999 || Math.abs(billAmount - round(billAmount, 'CASH')) > 1e-7) throw new Error('Enter a valid bill amount with up to 2 decimal places.');
    const updated = { ...old, jama: changes.direction === 'IN' ? amount : 0, nave: changes.direction === 'OUT' ? amount : 0,
        direction: changes.direction, type, sub_type: sub, chit_scheme: scheme,
        metal_type: old.category === 'RETAIL' && sub === 'METAL' ? metal : '',
        grams: type !== 'CASH' ? amount : sub === 'METAL' ? grams : 0,
        bill_number: bill, bill_amount: billAmount, date, description: changes.description?.trim() || '' };
    if (JSON.stringify(snapshot(old)) === JSON.stringify(snapshot(updated))) throw new Error('No changes to save.');
    updated.editHistory = [...(old.editHistory || []), { at: new Date().toISOString(), by: role, reason, before: snapshot(old), after: snapshot(updated) }];
    const totals = { CASH: 'cashBalance', GOLD: 'goldBalance', SILVER: 'silverBalance' };
    const nextCustomer = { ...customer };
    for (const [accountKey, accountType, delta] of [[key, old.type, -(old.jama - old.nave)], [nextKey, type, updated.jama - updated.nave]]) {
        nextCustomer[accountKey] = round(Number(nextCustomer[accountKey] || 0) + delta, accountType);
        nextCustomer[totals[accountType]] = round(Number(nextCustomer[totals[accountType]] || 0) + delta, accountType);
    }
    const nextCustomers = customers.map(c => c.id === old.cid ? nextCustomer : c);
    const nextTransactions = transactions.map(tx => tx.id === id ? updated : tx);
    const corrected = new Map();
    for (const accountType of new Set([old.type, type])) {
        const sameAccount = tx => tx.cid === old.cid && tx.category === old.category && tx.type === accountType;
        const accountKey = getCatBalKey(old.category, accountType);
        let running = round(Number(customer[accountKey] || 0) - transactions.filter(sameAccount).reduce((sum, tx) => sum + tx.jama - tx.nave, 0), accountType);
        nextTransactions.filter(sameAccount).sort((a, b) => a.createdAt - b.createdAt || String(a.id).localeCompare(String(b.id))).forEach(tx => {
            const before = running;
            running = round(running + tx.jama - tx.nave, accountType);
            corrected.set(tx.id, { ...tx, currentBalance: before, newBalance: running });
        });
    }
    return { customers: nextCustomers, transactions: transactions.map(tx => corrected.get(tx.id) || tx) };
}
