import React, { useEffect, useState } from 'react';

import {
  NavLink,
  Outlet,
  useNavigate
} from 'react-router-dom';

import {
  FaChartLine,
  FaShoppingBag,
  FaTruck,
  FaReceipt,
  FaFileAlt,
  FaUsers,
  FaBars,
  FaSignOutAlt,
  FaWallet,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

import ThemeToggle from '../components/ThemeToggle';

const navigationItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: <FaChartLine />,
    description: 'Acompanhe o desempenho financeiro do seu negócio.'
  },
  {
    label: 'Vendas',
    path: '/sales',
    icon: <FaShoppingBag />,
    description: 'Gerencie seus pedidos, vendas e recebimentos.'
  },
  {
    label: 'Compras',
    path: '/purchases',
    icon: <FaReceipt />,
    description: 'Controle suas compras e aquisições.'
  },
  {
    label: 'Fornecedores',
    path: '/suppliers',
    icon: <FaTruck />,
    description: 'Gerencie seus fornecedores.'
  },
  {
    label: 'Relatórios',
    path: '/reports',
    icon: <FaFileAlt />,
    description: 'Consulte relatórios e indicadores financeiros.'
  }
];

export default function MainLayout() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  useEffect(() => {
    localStorage.setItem(
      'sidebar-collapsed',
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('username');

    navigate('/');
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  function toggleSidebar() {
    setSidebarCollapsed((current) => !current);
  }

  return (
    <div
      className={`app-layout ${
        sidebarCollapsed ? 'sidebar-collapsed' : ''
      }`}
    >
      <aside
        className={`sidebar ${
          sidebarOpen ? 'sidebar-open' : ''
        }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <FaWallet />
          </div>

          <div className="sidebar-brand-text">
            <h2>Finances</h2>
            <span>Gestão financeira</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={toggleSidebar}
          title={
            sidebarCollapsed
              ? 'Expandir menu'
              : 'Recolher menu'
          }
          aria-label={
            sidebarCollapsed
              ? 'Expandir menu lateral'
              : 'Recolher menu lateral'
          }
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed
            ? <FaChevronRight />
            : <FaChevronLeft />
          }
        </button>

        <div className="sidebar-section-label">
          MENU PRINCIPAL
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {role === 'ADMIN' && (
          <div className="sidebar-admin">
            <div className="sidebar-section-label">
              ADMINISTRAÇÃO
            </div>

            <NavLink
              to="/users"
              title={sidebarCollapsed ? 'Usuários' : undefined}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">
                <FaUsers />
              </span>

              <span>Usuários</span>
            </NavLink>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div
              className="sidebar-avatar"
              title={username || 'Usuário'}
            >
              {username?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div className="sidebar-user-info">
              <strong>{username || 'Usuário'}</strong>
              <span>{role || 'USER'}</span>
            </div>
          </div>

          <div className="sidebar-actions">
            <div className="sidebar-theme-toggle">
              <ThemeToggle />
            </div>

            <button
              type="button"
              className="sidebar-action"
              onClick={logout}
              title="Sair"
              aria-label="Sair"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="dashboard-header-left">
            <button
              type="button"
              className="sidebar-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Abrir menu"
              aria-expanded={sidebarOpen}
            >
              <FaBars />
            </button>
          </div>

          <div className="dashboard-header-actions" />
        </header>

        <Outlet />
      </main>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-label="Fechar menu"
        />
      )}
    </div>
  );
}