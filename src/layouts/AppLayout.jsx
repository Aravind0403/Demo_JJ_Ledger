import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, Users, Plus, BookOpen, ListChecks, LogOut } from 'lucide-react';
import './AppLayout.css';

const NAV = [
  { path: '/dashboard',    icon: LayoutDashboard, label: 'Home'      },
  { path: '/customers',    icon: Users,            label: 'Customers' },
  { path: '/transactions', icon: Plus,             label: 'Add'       },
  { path: '/ledger',       icon: BookOpen,         label: 'Ledger'    },
  { path: '/due',          icon: ListChecks,       label: 'Dues'      },
];

export default function AppLayout() {
  const { logout, transactions, MAX_TX } = useAppContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const totalUsed = transactions.length;

  return (
    <div className="app-container">
      {/* Demo banner */}
      <div className="demo-banner">
        🎯 Demo Mode &nbsp;·&nbsp; <strong>{totalUsed}/{MAX_TX}</strong> transactions used &nbsp;·&nbsp; Refresh to reset
      </div>

      {/* Header */}
      <header className="app-header glass-panel">
        <div className="header-left">
          <span style={{ fontSize: '1.4rem' }}>💎</span>
          <h1 className="header-title">JJ Ledger Pro</h1>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(99,102,241,0.2)',
            color: '#a5b4fc',
            padding: '2px 7px',
            borderRadius: '10px',
            fontWeight: 600,
          }}>DEMO</span>
        </div>
        <button className="header-exit-btn" onClick={logout}>
          <LogOut size={14} /> Exit
        </button>
      </header>

      {/* Page content */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav glass-panel">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active =
            pathname === path ||
            (path !== '/dashboard' && pathname.startsWith(path));
          return (
            <button
              key={path}
              className={`nav-item ${active ? 'nav-active' : ''}`}
              onClick={() => navigate(path)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
