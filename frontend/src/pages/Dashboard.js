
import React, {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  NavLink
} from 'react-router-dom';

import {
  FaShoppingBag,
  FaReceipt,
  FaMoneyBillWave,
  FaBoxOpen,
  FaClock,
  FaChartPie,
  FaTruck,
  FaWallet,
  FaRedo
} from 'react-icons/fa';

import api from '../services/api';

import '../App.css';

import FinancialFlowChart from '../components/FinancialFlowChart';

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export default function Dashboard() {

  const [summary, setSummary] = useState(null);
  const [debts, setDebts] = useState([]);
  const [closedDebts, setClosedDebts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState('');

  const [lastUpdated, setLastUpdated] = useState(null);

  // Carrega os dados da Dashboard
  const loadDashboard = useCallback(async (isRefresh = false) => {

    try {

      if (isRefresh) {
        setRefreshing(true);
        setRefreshError('');
      } else {
        setLoading(true);
        setError('');
      }

      const response = await api.get('/debts');

      setSummary(response.data.summary || null);
      setDebts(response.data.debts || []);
      setClosedDebts(response.data.closedDebts || []);

      setLastUpdated(new Date());

    } catch (err) {

      console.error('Erro ao carregar Dashboard:', err);

      if (isRefresh) {
        setRefreshError('Não foi possível atualizar os dados. Tente novamente.');
      } else {
        setError('Não foi possível carregar os dados financeiros.');
      }

    } finally {

      setLoading(false);
      setRefreshing(false);

    }

  }, []);

  // Carregamento inicial
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalOrders = debts.length + closedDebts.length;

  // Indicadores financeiros
  const indicators = [
    {
      title: 'Total a receber',
      value: formatCurrency(summary?.totalOpen),
      description: 'Valores pendentes de recebimento',
      icon: <FaMoneyBillWave />,
      color: 'primary'
    },
    {
      title: 'Pedidos em aberto',
      value: debts.length,
      description: 'Pedidos ainda não finalizados',
      icon: <FaShoppingBag />,
      color: 'blue'
    },
    {
      title: 'Entregas pendentes',
      value: summary?.pendingDeliveries ?? 0,
      description: 'Pedidos aguardando entrega',
      icon: <FaBoxOpen />,
      color: 'orange'
    },
    {
      title: 'Aguardando pagamento',
      value: summary?.awaitingPayment ?? 0,
      description: 'Pedidos com saldo pendente',
      icon: <FaClock />,
      color: 'purple'
    }
  ];

  // Carregamento inicial
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />

        <span>Carregando informações...</span>
      </div>
    );
  }

  // Erro no carregamento inicial
  if (error) {
    return (
      <div className="dashboard-error">

        <p>{error}</p>

        <button
          type="button"
          className="button"
          onClick={() => loadDashboard()}
        >
          Tentar novamente
        </button>

      </div>
    );
  }

  return (
    <div className="page-container page-content">

      {/* Indicadores financeiros */}
      <section className="dashboard-section">

        <div className="page-header">

          <div>
            <h1 className="page-title">
              Resumo financeiro
            </h1>

            <p className="page-description">
              Indicadores dos seus pedidos atuais.
            </p>
          </div>

          {/* Ações do cabeçalho */}
          <div className="dashboard-header-actions">

            {lastUpdated && (
              <span className="dashboard-last-updated">
                Atualizado às{' '}
                {lastUpdated.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}

            <button
              type="button"
              className={`dashboard-refresh ${refreshing ? 'refreshing' : ''}`}
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              title="Atualizar informações"
              aria-label="Atualizar informações da Dashboard"
              aria-busy={refreshing}
            >
              <FaRedo />
            </button>

          </div>

        </div>

        {/* Erro durante atualização */}
        {refreshError && (
          <div
            className="dashboard-refresh-error"
            role="alert"
          >
            {refreshError}
          </div>
        )}

        {/* Cards de indicadores */}
        <div className="dashboard-indicators">

          {indicators.map((indicator) => (

            <article
              key={indicator.title}
              className="dashboard-indicator card"
            >

              <div className="indicator-top">

                <span className="indicator-title">
                  {indicator.title}
                </span>

                <div className={`indicator-icon ${indicator.color}`}>
                  {indicator.icon}
                </div>

              </div>

              <strong className="indicator-value">
                {indicator.value}
              </strong>

              <span className="indicator-description">
                {indicator.description}
              </span>

            </article>

          ))}

        </div>

      </section>

      {/* Gráficos financeiros */}
      <section className="dashboard-charts">

        {/* Fluxo financeiro */}
          <FinancialFlowChart />

        {/* Distribuição financeira */}
        <article className="dashboard-panel card">

          <div className="dashboard-panel-header">

            <div>
              <h3>Distribuição financeira</h3>

              <p>Composição das movimentações</p>
            </div>

            <FaChartPie />

          </div>

          <div className="chart-empty-state">

            <div className="chart-empty-icon">
              <FaChartPie />
            </div>

            <strong>
              Aguardando dados
            </strong>

            <p>
              A distribuição será calculada a partir das
              vendas, compras e despesas cadastradas.
            </p>

          </div>

        </article>

      </section>

      {/* Resumo operacional */}
      <section className="dashboard-bottom-grid">

        {/* Resumo de vendas */}
        <article className="dashboard-panel card">

          <div className="dashboard-panel-header">

            <div>
              <h3>Resumo de vendas</h3>

              <p>Situação dos pedidos cadastrados</p>
            </div>

            <FaShoppingBag />

          </div>

          <div className="sales-summary-list">

            <div className="sales-summary-item">
              <span>Pedidos em aberto</span>

              <strong>{debts.length}</strong>
            </div>

            <div className="sales-summary-item">
              <span>Pedidos fechados</span>

              <strong>{closedDebts.length}</strong>
            </div>

            <div className="sales-summary-item">
              <span>Total de pedidos</span>

              <strong>{totalOrders}</strong>
            </div>

          </div>

          <NavLink
            to="/sales"
            className="dashboard-panel-link"
          >
            Acessar vendas

            <span>→</span>
          </NavLink>

        </article>

        {/* Gestão do negócio */}
        <article className="dashboard-panel card">

          <div className="dashboard-panel-header">

            <div>
              <h3>Gestão do negócio</h3>

              <p>Acesse os outros módulos</p>
            </div>

            <FaWallet />

          </div>

          <div className="management-links">

            <NavLink to="/purchases">
              <FaReceipt />

              <span>Registrar compras</span>

              <span className="management-arrow">→</span>
            </NavLink>

            <NavLink to="/suppliers">
              <FaTruck />

              <span>Gerenciar fornecedores</span>

              <span className="management-arrow">→</span>
            </NavLink>

          </div>

        </article>

      </section>

    </div>
  );
}
