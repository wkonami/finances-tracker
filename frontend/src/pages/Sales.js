
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaMoneyBillWave,
  FaBoxOpen,
  FaCheck,
  FaClock,
  FaEye
} from 'react-icons/fa';

import api from '../services/api';
import PaymentModal from '../components/PaymentModal';

import '../App.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

function getRemainingAmount(debt) {
  if (debt.remainingAmount !== undefined) {
    return Number(debt.remainingAmount) || 0;
  }

  if (debt.totalOpen !== undefined) {
    return Number(debt.totalOpen) || 0;
  }

  const total = Number(debt.totalAmount) || 0;
  const paid = Number(debt.paidAmount) || 0;

  return Math.max(total - paid, 0);
}

export default function Sales() {
  const navigate = useNavigate();

  const [debts, setDebts] = useState([]);
  const [closedDebts, setClosedDebts] = useState([]);
  const [summary, setSummary] = useState({});
  const [activeTab, setActiveTab] = useState('open');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);
  const [updatingDelivery, setUpdatingDelivery] = useState(null);

  const loadDebts = useCallback(async () => {
    try {
      setError('');

      const response = await api.get('/debts');

      setDebts(response.data.debts || []);
      setClosedDebts(response.data.closedDebts || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      console.error('Erro ao carregar vendas:', err);
      setError(
        err.response?.data?.message ||
        'Não foi possível carregar as vendas.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  function openPaymentModal(debt) {
    setSelectedDebt(debt);
    setPaymentAmount(String(getRemainingAmount(debt)));
    setPaymentNote('');
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    if (savingPayment) return;

    setShowPaymentModal(false);
    setSelectedDebt(null);
    setPaymentAmount('');
    setPaymentNote('');
  }

  async function savePayment() {
    if (!selectedDebt) return;

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor de pagamento válido.');
      return;
    }

    if (amount > getRemainingAmount(selectedDebt)) {
      setError('O pagamento não pode ser maior que o valor restante.');
      return;
    }

    try {
      setSavingPayment(true);
      setError('');

      await api.post(`/debts/${selectedDebt.id}/payments`, {
        amount,
        note: paymentNote
      });

      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      setPaymentNote('');

      await loadDebts();
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      setError(
        err.response?.data?.message ||
        'Não foi possível registrar o pagamento.'
      );
    } finally {
      setSavingPayment(false);
    }
  }

  async function markAsDelivered(debt) {
    try {
      setUpdatingDelivery(debt.id);
      setError('');

      await api.patch(`/debts/${debt.id}/delivered`);

      await loadDebts();
    } catch (err) {
      console.error('Erro ao atualizar entrega:', err);
      setError(
        err.response?.data?.message ||
        'Não foi possível atualizar a entrega.'
      );
    } finally {
      setUpdatingDelivery(null);
    }
  }

  const visibleDebts = activeTab === 'open' ? debts : closedDebts;

  const totalOrders = debts.length + closedDebts.length;
  const totalOpen = summary.totalOpen ?? debts.reduce(
    (total, debt) => total + getRemainingAmount(debt),
    0
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Carregando vendas...</div>
      </div>
    );
  }

  return (
    <div className="page-container sales-page">
      <div className="sales-toolbar">
        <div>
          <h2 className="section-title">Gerenciamento de vendas</h2>
          <p className="sales-description">
            Acompanhe suas vendas, pagamentos e entregas.
          </p>
        </div>

        <button
          type="button"
          className="button"
          onClick={() => navigate('/new')}
        >
          <FaPlus />
          Nova venda
        </button>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="summary-box">
        <div className="summary-item card">
          <span className="summary-label">Total a receber</span>
          <strong className="summary-value">
            {formatCurrency(totalOpen)}
          </strong>
        </div>

        <div className="summary-item card">
          <span className="summary-label">Vendas em aberto</span>
          <strong className="summary-value">
            {debts.length}
          </strong>
        </div>

        <div className="summary-item card">
          <span className="summary-label">Vendas quitadas</span>
          <strong className="summary-value success">
            {closedDebts.length}
          </strong>
        </div>

        <div className="summary-item card">
          <span className="summary-label">Total de vendas</span>
          <strong className="summary-value">
            {totalOrders}
          </strong>
        </div>
      </section>

      <section className="sales-status-summary">
        <div className="sales-status-item">
          <span className="sales-status-icon pending">
            <FaBoxOpen />
          </span>

          <div>
            <span className="summary-label">Entregas pendentes</span>
            <strong className="summary-value">
              {summary.pendingDeliveries ?? 0}
            </strong>
          </div>
        </div>

        <div className="sales-status-item">
          <span className="sales-status-icon waiting">
            <FaClock />
          </span>

          <div>
            <span className="summary-label">Aguardando pagamento</span>
            <strong className="summary-value">
              {summary.awaitingPayment ?? 0}
            </strong>
          </div>
        </div>
      </section>

      <section className="debts-section">
        <div className="sales-tabs">
          <button
            type="button"
            className={`sales-tab ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Em aberto
            <span>{debts.length}</span>
          </button>

          <button
            type="button"
            className={`sales-tab ${activeTab === 'closed' ? 'active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            Quitadas
            <span>{closedDebts.length}</span>
          </button>
        </div>

        {visibleDebts.length === 0 ? (
          <p className="empty-text">
            {activeTab === 'open'
              ? 'Nenhuma venda em aberto.'
              : 'Nenhuma venda quitada.'}
          </p>
        ) : (
          <div className="debt-list">
            {visibleDebts.map((debt) => {
              const remainingAmount = getRemainingAmount(debt);
              const isClosed = activeTab === 'closed';

              return (
                <article
                  key={debt.id}
                  className={`debt-item card ${isClosed ? 'closed-debt-item' : ''}`}
                >
                  <div className="debt-info">
                    <div className="sales-card-heading">
                      <h3 className={isClosed ? 'closed-debt-name' : ''}>
                        {debt.debtorName}
                      </h3>

                      <span
                        className={`delivery-status ${
                          debt.delivered ? 'delivered' : 'pending'
                        }`}
                      >
                        {debt.delivered ? (
                          <>
                            <FaCheck /> Entregue
                          </>
                        ) : (
                          <>
                            <FaClock /> Pendente
                          </>
                        )}
                      </span>
                    </div>

                    {debt.notes && (
                      <p className={isClosed ? 'closed-debt-note' : 'debt-note'}>
                        {debt.notes}
                      </p>
                    )}

                    <div className="sales-card-footer">
                      <div className="debt-value">
                        <span className="summary-label">
                          {isClosed ? 'Situação' : 'Valor restante'}
                        </span>

                        <strong className={isClosed ? 'success' : ''}>
                          {isClosed
                            ? 'Quitada'
                            : formatCurrency(remainingAmount)}
                        </strong>
                      </div>

                      <div className="debt-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Ver detalhes"
                          aria-label={`Ver detalhes de ${debt.debtorName}`}
                          onClick={() => navigate(`/debt/${debt.id}`)}
                        >
                          <FaEye />
                        </button>

                        {!isClosed && !debt.delivered && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Marcar como entregue"
                            aria-label={`Marcar venda de ${debt.debtorName} como entregue`}
                            disabled={updatingDelivery === debt.id}
                            onClick={() => markAsDelivered(debt)}
                          >
                            <FaBoxOpen />
                          </button>
                        )}

                        {!isClosed && remainingAmount > 0 && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Registrar pagamento"
                            aria-label={`Registrar pagamento de ${debt.debtorName}`}
                            onClick={() => openPaymentModal(debt)}
                          >
                            <FaMoneyBillWave />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <PaymentModal
        visible={showPaymentModal}
        amount={paymentAmount}
        note={paymentNote}
        onAmountChange={setPaymentAmount}
        onNoteChange={setPaymentNote}
        onCancel={closePaymentModal}
        onSave={savePayment}
      />

      {savingPayment && (
        <div className="sales-saving-indicator">
          Salvando pagamento...
        </div>
      )}
    </div>
  );
}
