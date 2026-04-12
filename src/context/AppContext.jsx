import React, { createContext, useContext, useState, useCallback } from 'react';
import { getSeedData, MAX_TX } from '../data/seedData';
import { useToast } from '../components/ui/Toast';

const AppContext = createContext(null);
export const useAppContext = () => useContext(AppContext);

const LS_CUSTOMERS    = 'demo_customers';
const LS_TRANSACTIONS = 'demo_transactions';
const LS_AUTH         = 'demo_authed';

function loadOrSeed(key, seedFn) {
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  const seed = seedFn();
  localStorage.setItem(key, JSON.stringify(seed));
  return seed;
}

export function AppProvider({ children }) {
  const { toast } = useToast();
  const seed = getSeedData();

  const [customers, setCustomers] = useState(() =>
    loadOrSeed(LS_CUSTOMERS, () => seed.customers)
  );
  const [transactions, setTransactions] = useState(() =>
    loadOrSeed(LS_TRANSACTIONS, () => seed.transactions)
  );
  const [authed, setAuthed] = useState(() =>
    localStorage.getItem(LS_AUTH) === 'true'
  );

  const persist = (custs, txs) => {
    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(custs));
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(txs));
  };

  // ── Auth ────────────────────────────────────────────────────────────────
  const login = useCallback((password) => {
    if (password === 'demo123') {
      localStorage.setItem(LS_AUTH, 'true');
      setAuthed(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setAuthed(false);
  }, []);

  // ── Customers ───────────────────────────────────────────────────────────
  const addCustomer = useCallback((data) => {
    const c = {
      id: `c${Date.now()}`,
      retailCash: 0,
      retailGold: 0,
      silverCash: 0,
      silverSilver: 0,
      chitCash: 0,
      dueDate: null,
      ...data,
    };
    const next = [...customers, c];
    setCustomers(next);
    localStorage.setItem(LS_CUSTOMERS, JSON.stringify(next));
    toast.success('Customer added');
    return c;
  }, [customers, toast]);

  const getCustomer = useCallback((id) =>
    customers.find(c => c.id === id),
  [customers]);

  // ── Transactions ────────────────────────────────────────────────────────
  const addTransaction = useCallback((txData) => {
    if (transactions.length >= MAX_TX) {
      toast.error(`Demo limit reached (${MAX_TX}/${MAX_TX}). Refresh to reset.`);
      return false;
    }

    const tx = { id: `t${Date.now()}`, deleted_at: null, ...txData };

    const custs = customers.map(c => {
      if (c.id !== tx.cid) return c;
      const net = (parseFloat(tx.jama) || 0) + (parseFloat(tx.nave) || 0);
      const u = { ...c };
      if (tx.category === 'RETAIL' && tx.sub_type === 'CASH')   u.retailCash   = (parseFloat(c.retailCash)   || 0) + net;
      if (tx.category === 'RETAIL' && tx.sub_type === 'METAL')  u.retailGold   = (parseFloat(c.retailGold)   || 0) + net;
      if (tx.category === 'SILVER' && tx.sub_type === 'CASH')   u.silverCash   = (parseFloat(c.silverCash)   || 0) + net;
      if (tx.category === 'SILVER' && tx.sub_type === 'SILVER') u.silverSilver = (parseFloat(c.silverSilver) || 0) + net;
      if (tx.category === 'CHIT'   && tx.sub_type === 'CASH')   u.chitCash     = (parseFloat(c.chitCash)     || 0) + net;
      return u;
    });

    const txs = [...transactions, tx];
    setCustomers(custs);
    setTransactions(txs);
    persist(custs, txs);
    toast.success('Transaction saved');
    return tx;
  }, [customers, transactions, toast]);

  const deleteTransaction = useCallback((id) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const deletedAt = new Date().toISOString();

    const custs = customers.map(c => {
      if (c.id !== tx.cid) return c;
      const net = (parseFloat(tx.jama) || 0) + (parseFloat(tx.nave) || 0);
      const u = { ...c };
      if (tx.category === 'RETAIL' && tx.sub_type === 'CASH')   u.retailCash   = (parseFloat(c.retailCash)   || 0) - net;
      if (tx.category === 'RETAIL' && tx.sub_type === 'METAL')  u.retailGold   = (parseFloat(c.retailGold)   || 0) - net;
      if (tx.category === 'SILVER' && tx.sub_type === 'CASH')   u.silverCash   = (parseFloat(c.silverCash)   || 0) - net;
      if (tx.category === 'SILVER' && tx.sub_type === 'SILVER') u.silverSilver = (parseFloat(c.silverSilver) || 0) - net;
      if (tx.category === 'CHIT'   && tx.sub_type === 'CASH')   u.chitCash     = (parseFloat(c.chitCash)     || 0) - net;
      return u;
    });

    const txs = transactions.map(t =>
      t.id === id ? { ...t, deleted_at: deletedAt } : t
    );
    setCustomers(custs);
    setTransactions(txs);
    persist(custs, txs);
    toast.success('Transaction deleted');
  }, [customers, transactions, toast]);

  const value = {
    authed, login, logout,
    customers, transactions,
    addCustomer, getCustomer,
    addTransaction, deleteTransaction,
    MAX_TX,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
