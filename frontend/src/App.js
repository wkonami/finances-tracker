import React, {
  useEffect,
  useState
} from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import api from './services/api';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewDebt from './pages/NewDebt';
import DebtDetails from './pages/DebtDetails';
import Users from './pages/Users';

import './App.css';

function PrivateRoute({ children }) {

  const token = localStorage.getItem('token');

  if (!token) {

    return <Navigate to="/" replace />;

  }

  return children;

}

function AdminRoute({ children }) {

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {

    return <Navigate to="/" replace />;

  }

  if (role !== 'ADMIN') {

    return <Navigate to="/dashboard" replace />;

  }

  return children;

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

        <div className="loading-box">

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

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/new"
          element={
            <PrivateRoute>
              <NewDebt />
            </PrivateRoute>
          }
        />

        <Route
          path="/debt/:id"
          element={
            <PrivateRoute>
              <DebtDetails />
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <AdminRoute>
              <Users />
            </AdminRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </BrowserRouter>

  );

}