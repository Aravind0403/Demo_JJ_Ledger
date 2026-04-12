import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import AddTransaction from './pages/AddTransaction';
import Ledger from './pages/Ledger';
import DuePage from './pages/DuePage';

const ProtectedLayout = () => {
  const { authed } = useAppContext();
  if (!authed) return <Navigate to="/login" replace />;
  return <AppLayout />;
};

function LoginGuard() {
  const { authed } = useAppContext();
  if (authed) return <Navigate to="/dashboard" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginGuard />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/customers"    element={<Customers />} />
            <Route path="/transactions" element={<AddTransaction />} />
            <Route path="/ledger"       element={<Ledger />} />
            <Route path="/due"          element={<DuePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
