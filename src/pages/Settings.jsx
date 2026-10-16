import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '../components/ui/Primitives';
import { useAppContext } from '../context/appState';
import { useToast } from '../components/ui/toastContext';
import { isLocalMode } from '../lib/runtime';
import { Database, Trash2, ArrowLeft, Download } from 'lucide-react';
import * as XLSX from 'xlsx';


const Settings = () => {
    const { seedDummyData, authSession, customers, transactions } = useAppContext();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isOwner = authSession?.role === 'owner' || authSession?.role === 'super-admin';

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteInput, setDeleteInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const [isExporting, setIsExporting] = useState(false);

    const handleSeed = () => {
        const msg = seedDummyData();
        toast.success(msg);
    };

    const handleExportAll = async () => {
        setIsExporting(true);
        try {
            const wb = XLSX.utils.book_new();
            const fmt2 = (v) => parseFloat(v || 0).toFixed(2);
            const fmt3 = (v) => parseFloat(v || 0).toFixed(3);
            const dir  = (v) => parseFloat(v) >= 0 ? 'jama' : 'nave (balance)';

            // ── Sheet 1: Customer Balances ────────────────────────────────
            const custRows = customers.map(c => ({
                'Customer Name':    c.name,
                'Mobile':           c.mobile,
                'Primary Category': c.primary_category || '',
                'Due Date':         c.due_date || '',
                'Retail Cash (₹)':     fmt2(c.retailCash),
                'Retail Cash Dir':     dir(c.retailCash),
                'Retail Gold (g)':     fmt3(c.retailGold),
                'Retail Gold Dir':     dir(c.retailGold),
                'Bullion Cash (₹)':    fmt2(c.bullionCash),
                'Bullion Cash Dir':    dir(c.bullionCash),
                'Bullion Gold (g)':    fmt3(c.bullionGold),
                'Bullion Gold Dir':    dir(c.bullionGold),
                'Bullion Silver (g)':  fmt3(c.bullionSilver),
                'Bullion Silver Dir':  dir(c.bullionSilver),
                'Silver Cash (₹)':     fmt2(c.silverCash),
                'Silver Cash Dir':     dir(c.silverCash),
                'Silver (g)':          fmt3(c.silverSilver),
                'Silver Dir':          dir(c.silverSilver),
                'Chit Cash (₹)':       fmt2(c.chitCash),
                'Chit Cash Dir':       dir(c.chitCash),
            }));
            const ws1 = XLSX.utils.json_to_sheet(custRows.length ? custRows : [{ 'Info': 'No customers found' }]);
            ws1['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 18 }, { wch: 12 },
                            ...Array(16).fill({ wch: 16 })];
            XLSX.utils.book_append_sheet(wb, ws1, 'Customer Balances');

            // ── Sheet 2: All Transactions ─────────────────────────────────
            const custMap = Object.fromEntries(customers.map(c => [c.id, c.name]));
            const txRows = [...transactions]
                .sort((a, b) => {
                    if (b.date !== a.date) return b.date.localeCompare(a.date);
                    return (b.time || '').localeCompare(a.time || '');
                })
                .map(t => ({
                    'Bill Number': t.bill_number || '',
                    'Date':        t.date,
                    'Time':        t.time ? String(t.time).substring(0, 5) : '',
                    'Customer':    custMap[t.cid] || t.cid,
                    'Category':    t.category,
                    'Sub Type':    t.sub_type,
                    'Type':        t.type,
                    'Jama':        t.jama > 0 ? (t.type === 'CASH' ? fmt2(t.jama) : fmt3(t.jama)) : '',
                    'Nave':        t.nave > 0 ? (t.type === 'CASH' ? fmt2(t.nave) : fmt3(t.nave)) : '',
                    'Unit':        t.type === 'CASH' ? '₹' : 'g',
                    'Balance After': t.type === 'CASH' ? fmt2(t.newBalance) : fmt3(t.newBalance),
                    'Description': t.description || '',
                    'Added By':    t.added_by || '',
                    'Chit Scheme': t.chit_scheme || '',
                }));
            const ws2 = XLSX.utils.json_to_sheet(txRows.length ? txRows : [{ 'Info': 'No transactions found' }]);
            ws2['!cols'] = [{ wch: 12 }, { wch: 8 }, { wch: 22 }, { wch: 10 }, { wch: 10 },
                            { wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 6 }, { wch: 14 },
                            { wch: 24 }, { wch: 12 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'All Transactions');

            // ── Sheet 3: Summary ──────────────────────────────────────────
            const totals = transactions.reduce((acc, t) => {
                const key = `${t.category}_${t.sub_type}`;
                if (!acc[key]) acc[key] = { category: t.category, sub_type: t.sub_type, type: t.type, jama: 0, nave: 0 };
                acc[key].jama += t.jama || 0;
                acc[key].nave += t.nave || 0;
                return acc;
            }, {});
            const summaryRows = Object.values(totals).map(r => ({
                'Category':   r.category,
                'Sub Type':   r.sub_type,
                'Unit':       r.type === 'CASH' ? '₹' : 'g',
                'Total Jama': r.type === 'CASH' ? fmt2(r.jama) : fmt3(r.jama),
                'Total Nave': r.type === 'CASH' ? fmt2(r.nave) : fmt3(r.nave),
                'Net':        r.type === 'CASH' ? fmt2(r.jama - r.nave) : fmt3(r.jama - r.nave),
                'Net Direction': (r.jama - r.nave) >= 0 ? 'jama' : 'nave (balance)',
            }));
            const ws3 = XLSX.utils.json_to_sheet(summaryRows.length ? summaryRows : [{ 'Info': 'No data' }]);
            ws3['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
            XLSX.utils.book_append_sheet(wb, ws3, 'Summary');

            // ── Sheet 4: Overdue Customers ────────────────────────────────
            const today = new Date().toISOString().split('T')[0];
            const overdueRows = customers
                .filter(c => c.due_date && c.due_date < today)
                .map(c => {
                    const days = Math.floor((new Date(today) - new Date(c.due_date)) / 86400000);
                    return {
                        'Customer Name':   c.name,
                        'Mobile':          c.mobile,
                        'Due Date':        c.due_date,
                        'Days Overdue':    days,
                        'Bullion Cash (₹)':   fmt2(c.bullionCash),
                        'Bullion Cash Dir':   dir(c.bullionCash),
                        'Bullion Gold (g)':   fmt3(c.bullionGold),
                        'Bullion Silver (g)': fmt3(c.bullionSilver),
                        'Retail Cash (₹)':    fmt2(c.retailCash),
                        'Chit Cash (₹)':      fmt2(c.chitCash),
                    };
                });
            const ws4 = XLSX.utils.json_to_sheet(overdueRows.length ? overdueRows : [{ 'Info': 'No overdue customers' }]);
            ws4['!cols'] = [{ wch: 22 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, ...Array(6).fill({ wch: 16 })];
            XLSX.utils.book_append_sheet(wb, ws4, 'Overdue Customers');

            // ── Download ──────────────────────────────────────────────────
            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
            XLSX.writeFile(wb, `jjledger_demo_full_dump_${dateStr}.xlsx`);
            toast.success('Export complete — check your downloads.');
        } catch (err) {
            toast.error('Export failed: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleClearData = async () => {
        if (deleteInput !== 'DELETE') return;
        setIsDeleting(true);
        try {
            const keys = [
                'jjledger_demo_customers', 'jjledger_demo_transactions', 'jjledger_demo_deleted_transactions', 'jjledger_demo_auth', 'jjledger_demo_chit_schemes',
                'jjledger_demo_retail', 'jjledger_demo_bullion', 'jjledger_demo_silver', 'jjledger_demo_chit',
                'jjledger_demoLegacy_customers', 'jjledger_demoLegacy_transactions', 'jjledger_demoLegacy_retail',
                'jjledger_demoLegacy_bullion', 'jjledger_demoLegacy_silver', 'jjledger_demoLegacy_chit',
            ];
            keys.forEach(k => localStorage.removeItem(k));
            toast.success('All data deleted. Reloading…');
            setTimeout(() => window.location.reload(), 1200);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
            setDeleteInput('');
        }
    };

    const closeConfirm = () => { setShowDeleteConfirm(false); setDeleteInput(''); };

    return (
        <div className="module-container animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <Card className="glass-card" style={{ padding: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}>
                        <ArrowLeft size={20} />
                    </button>
                    Application Settings
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {isLocalMode && <div>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Database size={16} /> Demo Data
                        </h3>
                        <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            Populate the app with sample customers, trades, and bills to explore the ledger functions.
                            This will overwrite existing data.
                        </p>
                        <Button variant="primary" onClick={handleSeed}>
                            Load Dummy Data
                        </Button>
                    </div>}

                    {/* Export All Data */}
                    {isOwner && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Download size={16} /> Export All Data
                            </h3>
                            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Download a full Excel dump of all customers, transactions, balances, and overdue accounts.
                                Opens in Excel or Google Sheets — filter and analyse as needed.
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <Button variant="primary" onClick={handleExportAll} disabled={isExporting}>
                                    {isExporting ? 'Generating…' : '📥 Download Full Dump (.xlsx)'}
                                </Button>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    4 sheets: Customer Balances · All Transactions · Summary · Overdue
                                </span>
                            </div>
                        </div>
                    )}

                    {isOwner && isLocalMode && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem' }}>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Trash2 size={16} /> Danger Zone
                            </h3>
                            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                Permanently delete all customers and transactions from this browser only. This cannot be undone.
                            </p>
                            <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                                Clear All Data
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="popup-overlay animate-fade-in"
                    onClick={closeConfirm}
                    style={{ zIndex: 1100 }}
                >
                    <div
                        className="glass-panel slide-up"
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '380px', width: '90%', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
                            <h3 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Delete All Data?</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                This will permanently delete all customers and transactions from <strong>this browser only</strong>. <strong>This cannot be undone.</strong>
                            </p>
                        </div>

                        <div style={{ marginBottom: '1.25rem' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                Type <span style={{ fontFamily: 'monospace', background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>DELETE</span> to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteInput}
                                onChange={e => setDeleteInput(e.target.value)}
                                placeholder="Type DELETE here"
                                autoFocus
                                style={{
                                    width: '100%', padding: '0.6rem 0.75rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${deleteInput === 'DELETE' ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px', color: 'var(--text-primary)',
                                    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={handleClearData}
                                disabled={deleteInput !== 'DELETE' || isDeleting}
                                style={{
                                    flex: 1, padding: '0.65rem',
                                    background: deleteInput === 'DELETE' && !isDeleting ? '#ef4444' : 'rgba(239,68,68,0.2)',
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    borderRadius: '8px',
                                    color: deleteInput === 'DELETE' && !isDeleting ? '#fff' : 'rgba(239,68,68,0.5)',
                                    cursor: deleteInput === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
                                    fontSize: '0.875rem', fontWeight: 700
                                }}
                            >
                                {isDeleting ? 'Deleting…' : 'Confirm Delete'}
                            </button>
                            <button
                                onClick={closeConfirm}
                                style={{
                                    flex: 1, padding: '0.65rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem', fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
