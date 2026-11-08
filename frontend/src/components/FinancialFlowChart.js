import React, { useEffect, useState } from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  FaChartLine
} from 'react-icons/fa';

import api from '../services/api';

import '../App.css';

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const formatCompactCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

function FinancialFlowChart() {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState([]);
  const [totals, setTotals] = useState({
    sales: 0,
    purchases: 0,
    balance: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadFinancialFlow() {
      try {
        setLoading(true);
        setError('');

        const response = await api.get(
          `/dashboard/financial-flow?months=${months}`
        );

        if (!active) return;

        setData(response.data.data || []);

        setTotals(
          response.data.totals || {
            sales: 0,
            purchases: 0,
            balance: 0
          }
        );
      } catch (error) {
        if (!active) return;

        console.error(
          'Erro ao carregar fluxo financeiro:',
          error
        );

        setError(
          'Não foi possível carregar o fluxo financeiro.'
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFinancialFlow();

    return () => {
      active = false;
    };
  }, [months]);

  return (
    <section className="dashboard-panel card">
      <div className="financial-flow-header">
        <div>
            <h3>Fluxo financeiro</h3>
        </div>

        <select
          className="financial-flow-filter"
          value={months}
          onChange={(event) => setMonths(Number(event.target.value))}
          aria-label="Período do fluxo financeiro"
        >
          <option value={6}>6 meses</option>
          <option value={12}>12 meses</option>
          <option value={24}>24 meses</option>
        </select>

        <FaChartLine />
      </div>

      <div className="financial-flow-totals">
        <div>
          <span>Entradas</span>
          <strong className="financial-flow-sales">
            {formatCurrency(totals.sales)}
          </strong>
        </div>

        <div>
          <span>Saídas</span>
          <strong className="financial-flow-purchases">
            {formatCurrency(totals.purchases)}
          </strong>
        </div>

        <div>
          <span>Saldo</span>
          <strong
            className={
              totals.balance >= 0
                ? 'financial-flow-positive'
                : 'financial-flow-negative'
            }
          >
            {formatCurrency(totals.balance)}
          </strong>
        </div>
      </div>

      <div className="financial-flow-chart">
        {loading ? (
          <div className="financial-flow-message">
            Carregando gráfico...
          </div>
        ) : error ? (
          <div className="financial-flow-message financial-flow-error">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 15,
                right: 10,
                left: 5,
                bottom: 5
              }}
              barGap={5}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                tickFormatter={formatCompactCurrency}
                width={55}
              />

              <Tooltip
                formatter={(value, name) => [
                  formatCurrency(value),
                  name
                ]}
                labelStyle={{
                  fontWeight: 600,
                  marginBottom: 5
                }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--border-color)'
                }}
              />

              <Bar
                dataKey="sales"
                name="Entradas"
                fill="#269B65"
                radius={[5, 5, 0, 0]}
                maxBarSize={35}
              />

              <Bar
                dataKey="purchases"
                name="Saídas"
                fill="#D97757"
                radius={[5, 5, 0, 0]}
                maxBarSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

export default FinancialFlowChart;