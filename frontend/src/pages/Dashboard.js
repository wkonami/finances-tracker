
import React, {
  useCallback,
  useEffect,
  useState
} from 'react';

import {
  NavLink
} from 'react-router-dom';

import {
  FaChartLine,
  FaShoppingBag,
  FaReceipt,
  FaMoneyBillWave,
  FaBoxOpen,
  FaClock,
  FaChartPie,
  FaTruck,
  FaWallet
} from 'react-icons/fa';

import api from '../services/api';

import '../App.css';

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
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {

    try {

      setLoading(true);
      setError('');

      const response = await api.get('/debts');

      setSummary(response.data.summary);
      setDebts(response.data.debts || []);
      setClosedDebts(response.data.closedDebts || []);

    } catch (err) {

      console.error(err);

      setError('Não foi possível carregar os dados financeiros.');

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalOrders = debts.length + closedDebts.length;

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

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
        <span>Carregando informações...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>

        <button
          type="button"
          className="button"
          onClick={loadDashboard}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-content">

      {/* Indicadores */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <h2>Resumo financeiro</h2>
            <p>Indicadores dos seus pedidos atuais.</p>
          </div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={loadDashboard}
            title="Atualizar informações"
          >
            Atualizar
          </button>

        </div>

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

      {/* Gráficos */}
      <section className="dashboard-charts">

        <article className="dashboard-panel card">

          <div className="dashboard-panel-header">

            <div>
              <h3>Fluxo financeiro</h3>
              <p>Entradas e saídas do negócio</p>
            </div>

            <FaChartLine />

          </div>

          <div className="chart-empty-state">

            <div className="chart-empty-icon">
              <FaChartLine />
            </div>

            <strong>Dados financeiros em preparação</strong>

            <p>
              Este gráfico será preenchido quando o sistema
              possuir os registros de recebimentos, compras
              e despesas.
            </p>

          </div>

        </article>

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

            <strong>Aguardando dados</strong>

            <p>
              A distribuição será calculada a partir das
              vendas, compras e despesas cadastradas.
            </p>

          </div>

        </article>

      </section>

      {/* Resumo operacional */}
      <section className="dashboard-bottom-grid">

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

            <NavLink to="/expenses">
              <FaMoneyBillWave />
              <span>Registrar despesas</span>
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
