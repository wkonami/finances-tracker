import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewDebt from './pages/NewDebt';
import DebtDetails from './pages/DebtDetails';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/new" element={<PrivateRoute><NewDebt /></PrivateRoute>} />
        <Route path="/debt/:id" element={<PrivateRoute><DebtDetails /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}