
import React, {
  useEffect,
  useState
} from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';

import api from './services/api';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewDebt from './pages/NewDebt';
import DebtDetails from './pages/DebtDetails';
import Users from './pages/Users';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';

import MainLayout from './layouts/MainLayout';

import './App.css';

function PrivateRoute() {

  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;

}

function AdminRoute() {

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;

}

export default function App() {

  const [loadingServer, setLoadingServer] = useState(true);

  useEffect(() => {

    async function wakeServer() {

      try {

        await api.get('/health');

      } catch (error) {

        console.error(error);

      } finally {

        setLoadingServer(false);

      }

    }

    wakeServer();

  }, []);

  if (loadingServer) {

    return (
      <div className="loading-screen">

        <div className="loading-box card">

          <h2>
            Conectando ao servidor...
          </h2>

          <p>
            O servidor pode estar iniciando.
          </p>

        </div>

      </div>
    );

  }

  return (

    <BrowserRouter>

      <Routes>

        {/* Rotas públicas */}
        <Route
          path="/"
          element={<Login />}
        />

        {/* Rotas privadas */}
        <Route element={<PrivateRoute />}>

          <Route element={<MainLayout />}>

            <Route 
              path="/sales" 
              element={<Sales />} 
            />

            <Route 
              path="/purchases" 
              element={<Purchases />} 
            />

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/new"
              element={<NewDebt />}
            />

            <Route
              path="/debt/:id"
              element={<DebtDetails />}
            />

            <Route
              path="/suppliers"
              element={<Suppliers />}
            />

            {/* Área administrativa */}
            <Route element={<AdminRoute />}>

              <Route
                path="/users"
                element={<Users />}
              />

            </Route>

          </Route>

        </Route>

        {/* Rota inexistente */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>

  );

}
