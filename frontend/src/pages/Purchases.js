
import React, { useCallback, useEffect, useState } from 'react';

import {
  FaPlus,
  FaShoppingCart,
  FaMoneyBillWave,
  FaWallet,
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCalendarAlt,
  FaHistory,
  FaSave,
  FaCreditCard
} from 'react-icons/fa';

import api from '../services/api';

import '../App.css';

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

const formatDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('pt-BR');
};

const initialForm = {
  description: '',
  totalAmount: '',
  notes: ''
};

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [paidPurchases, setPaidPurchases] = useState([]);
  const [summary, setSummary] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalOpen: 0,
    openCount: 0,
    paidCount: 0,
    totalCount: 0
  });

  const [activeTab, setActiveTab] = useState('open');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [paymentPurchase, setPaymentPurchase] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [historyPurchase, setHistoryPurchase] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentEditForm, setPaymentEditForm] = useState({
    amount: '',
    note: '',
    paymentDate: ''
  });

  const [savingPayment, setSavingPayment] = useState(false);

  const fetchPurchases = useCallback(async () => {
    try {
      setError('');

      const response = await api.get('/purchases');

      setPurchases(response.data.purchases || []);
      setPaidPurchases(response.data.paidPurchases || []);

      setSummary(response.data.summary || {
        totalAmount: 0,
        totalPaid: 0,
        totalOpen: 0,
        openCount: 0,
        paidCount: 0,
        totalCount: 0
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível carregar as compras.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  const visiblePurchases =
    activeTab === 'open' ? purchases : paidPurchases;

  const openNewForm = () => {
    setEditingPurchase(null);
    setForm(initialForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (purchase) => {
    setEditingPurchase(purchase);

    setForm({
      description: purchase.description,
      totalAmount: Number(purchase.totalAmount).toFixed(2),
      notes: purchase.notes || ''
    });

    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingPurchase(null);
    setForm(initialForm);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSavePurchase = async (event) => {
    event.preventDefault();

    const amount = Number(form.totalAmount);

    if (!form.description.trim()) {
      setError('Informe a descrição da compra.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        description: form.description.trim(),
        totalAmount: amount,
        notes: form.notes.trim()
      };

      if (editingPurchase) {
        await api.put(
          `/purchases/${editingPurchase.id}`,
          payload
        );
      } else {
        await api.post('/purchases', payload);
      }

      setShowForm(false);
      setEditingPurchase(null);
      setForm(initialForm);

      await fetchPurchases();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível salvar a compra.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePurchase = async (purchase) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a compra "${purchase.description}"?`
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.delete(`/purchases/${purchase.id}`);

      if (historyPurchase?.id === purchase.id) {
        setHistoryPurchase(null);
      }

      await fetchPurchases();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível excluir a compra.'
      );
    }
  };

  const openPaymentModal = (purchase) => {
    setPaymentPurchase(purchase);

    setPaymentAmount(
      Number(purchase.totalOpen).toFixed(2)
    );

    setPaymentNote('');

    setPaymentDate(
      new Date().toISOString().slice(0, 10)
    );
  };

  const closePaymentModal = () => {
    if (savingPayment) return;

    setPaymentPurchase(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleSavePayment = async (event) => {
    event.preventDefault();

    if (!paymentPurchase) return;

    const amount = Number(paymentAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor de pagamento válido.');
      return;
    }

    if (amount > Number(paymentPurchase.totalOpen)) {
      setError('O pagamento ultrapassa o valor restante.');
      return;
    }

    try {
      setSavingPayment(true);
      setError('');

      await api.post(
        `/purchases/${paymentPurchase.id}/payments`,
        {
          amount,
          note: paymentNote,
          paymentDate: paymentDate
            ? `${paymentDate}T12:00:00`
            : undefined
        }
      );

      setPaymentPurchase(null);
      setPaymentAmount('');
      setPaymentNote('');

      await fetchPurchases();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível registrar o pagamento.'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const openPaymentHistory = async (purchase) => {
    setHistoryPurchase(purchase);
    setHistoryPayments([]);
    setEditingPayment(null);
    setLoadingHistory(true);

    try {
      const response = await api.get(
        `/purchases/${purchase.id}/payments`
      );

      setHistoryPayments(response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível carregar o histórico.'
      );

      setHistoryPurchase(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const closePaymentHistory = () => {
    setHistoryPurchase(null);
    setHistoryPayments([]);
    setEditingPayment(null);
  };

  const openEditPayment = (payment) => {
    setEditingPayment(payment);

    setPaymentEditForm({
      amount: Number(payment.amount).toFixed(2),
      note: payment.note || '',
      paymentDate: new Date(payment.paymentDate)
        .toISOString()
        .slice(0, 10)
    });
  };

  const handleUpdatePayment = async (event) => {
    event.preventDefault();

    if (!editingPayment) return;

    const amount = Number(paymentEditForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    try {
      setSavingPayment(true);
      setError('');

      await api.put(
        `/purchases/payments/${editingPayment.id}`,
        {
          amount,
          note: paymentEditForm.note,
          paymentDate: paymentEditForm.paymentDate
            ? `${paymentEditForm.paymentDate}T12:00:00`
            : undefined
        }
      );

      const response = await api.get(
        `/purchases/${historyPurchase.id}/payments`
      );

      setHistoryPayments(response.data || []);
      setEditingPayment(null);

      await fetchPurchases();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível atualizar o pagamento.'
      );
    } finally {
      setSavingPayment(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    const confirmed = window.confirm(
      'Deseja realmente excluir este pagamento?'
    );

    if (!confirmed) return;

    try {
      setError('');

      await api.delete(
        `/purchases/payments/${payment.id}`
      );

      const response = await api.get(
        `/purchases/${historyPurchase.id}/payments`
      );

      setHistoryPayments(response.data || []);

      await fetchPurchases();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível excluir o pagamento.'
      );
    }
  };

  return (
    <div className="page-container page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Compras</h1>
          <p className="page-description">
            Gerencie suas compras e pagamentos.
          </p>
        </div>

        <button
          className="button button-primary"
          onClick={openNewForm}
        >
          <FaPlus />
          Nova compra
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Fechar mensagem"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="summary-grid">
        <div className="summary-card card">
          <div className="summary-card-icon">
            <FaShoppingCart />
          </div>

          <span className="summary-label">Total em compras</span>
          <strong className="summary-value">{formatCurrency(summary.totalAmount)}</strong>
          <small className="summary-meta">{summary.totalCount} compras cadastradas</small>
        </div>

        <div className="summary-card card">
          <div className="summary-card-icon">
            <FaWallet />
          </div>

          <span className="summary-label">Em aberto</span>
          <strong className="summary-value">{formatCurrency(summary.totalOpen)}</strong>
          <small className="summary-meta">{summary.openCount} compras pendentes</small>
        </div>

        <div className="summary-card card">
          <div className="summary-card-icon">
            <FaMoneyBillWave />
          </div>

          <span className="summary-label">Total pago</span>
          <strong className="summary-value success">{formatCurrency(summary.totalPaid)}</strong>
          <small className="summary-meta">Pagamentos registrados</small>
        </div>

        <div className="summary-card card">
          <div className="summary-card-icon">
            <FaCheckCircle />
          </div>

          <span className="summary-label">Quitadas</span>
          <strong className="summary-value success">{summary.paidCount}</strong>
          <small className="summary-meta">Compras totalmente pagas</small>
        </div>
      </section>

      <section className="content-section">
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'open' ? 'active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Em aberto ({purchases.length})
          </button>

          <button
            className={`tab ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            Quitadas ({paidPurchases.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">
            Carregando compras...
          </div>
        ) : visiblePurchases.length === 0 ? (
          <div className="empty-state">
            <FaShoppingCart />

            <h3>
              {activeTab === 'open'
                ? 'Nenhuma compra em aberto'
                : 'Nenhuma compra quitada'}
            </h3>

            <p>
              {activeTab === 'open'
                ? 'Cadastre sua primeira compra para começar.'
                : 'As compras quitadas aparecerão aqui.'}
            </p>

            {activeTab === 'open' && (
              <button
                className="button button-primary"
                onClick={openNewForm}
              >
                <FaPlus />
                Cadastrar compra
              </button>
            )}
          </div>
        ) : (
          <div className="record-list">
            {visiblePurchases.map((purchase) => (
              <article
                className="record-card card"
                key={purchase.id}
              >
                <div className="record-header">
                  <div className="record-title-group">
                    <div className="record-icon">
                      <FaShoppingCart />
                    </div>

                    <div>
                      <h3 className="record-title">{purchase.description}</h3>

                      <span className="record-meta">
                        <FaCalendarAlt />
                        {formatDate(purchase.createdAt)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`status-badge ${
                      purchase.isPaid ? 'paid' : 'pending'
                    }`}
                  >
                    {purchase.isPaid ? 'Quitada' : 'Em aberto'}
                  </span>
                </div>

                <div className="record-values">
                  <div className="value-item">
                    <span>Valor total</span>
                    <strong>
                      {formatCurrency(purchase.totalAmount)}
                    </strong>
                  </div>

                  <div className="value-item">
                    <span>Valor pago</span>
                    <strong>
                      {formatCurrency(purchase.totalPaid)}
                    </strong>
                  </div>

                  <div className="value-item">
                    <span>Restante</span>
                    <strong>
                      {formatCurrency(purchase.totalOpen)}
                    </strong>
                  </div>
                </div>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        Math.min(
                          (purchase.totalPaid /
                            Number(purchase.totalAmount)) * 100,
                          100
                        )
                      }%`
                    }}
                  />
                </div>

                <div className="progress-label">
                  <span>Progresso do pagamento</span>

                  <strong>
                    {Math.min(
                      (purchase.totalPaid /
                        Number(purchase.totalAmount)) * 100,
                      100
                    ).toFixed(0)}%
                  </strong>
                </div>

                <div className="record-actions">
                  {!purchase.isPaid && (
                    <button
                      className="button button-primary"
                      onClick={() => openPaymentModal(purchase)}
                    >
                      <FaCreditCard />
                      Pagar
                    </button>
                  )}

                  <button
                    className="button button-secondary"
                    onClick={() => openPaymentHistory(purchase)}
                  >
                    <FaHistory />
                    Histórico
                  </button>

                  <button
                    className="icon-button"
                    onClick={() => openEditForm(purchase)}
                    title="Editar compra"
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="icon-button danger"
                    onClick={() => handleDeletePurchase(purchase)}
                    title="Excluir compra"
                  >
                    <FaTrash />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      
        {showForm && (
            <div className="modal-overlay">
                <form
                className="modal modal-wide"
                onSubmit={handleSavePurchase}
                >
                <div className="modal-header">
                    <div>
                    <h2>
                        {editingPurchase ? 'Editar compra' : 'Nova compra'}
                    </h2>
                    <p>Informe os dados da compra.</p>
                    </div>

                    <button
                    type="button"
                    className="icon-button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Fechar"
                    >
                    <FaTimes />
                    </button>
                </div>

                <input
                    type="text"
                    name="description"
                    className="field"
                    placeholder="Descrição da compra"
                    value={form.description}
                    onChange={handleFormChange}
                    maxLength={200}
                    required
                />

                <input
                    type="number"
                    name="totalAmount"
                    className="field"
                    placeholder="Valor total"
                    value={form.totalAmount}
                    onChange={handleFormChange}
                    min="0.01"
                    step="0.01"
                    required
                />

                <div className="quick-actions">
                    {['Shopee', 'Aliexpress', 'Embalagens'].map((item) => (
                    <button
                        key={item}
                        type="button"
                        className="quick-action"
                        onClick={() =>
                        setForm((previous) => ({
                            ...previous,
                            notes: previous.notes
                            ? `${previous.notes}\n${item}`
                            : item,
                        }))
                        }
                    >
                        {item}
                    </button>
                    ))}
                </div>

                <textarea
                    name="notes"
                    className="field"
                    placeholder="Observações"
                    rows={6}
                    maxLength={500}
                    value={form.notes}
                    onChange={handleFormChange}
                />

                <div className="modal-actions">
                    <button
                    type="button"
                    className="button button-secondary"
                    onClick={closeForm}
                    disabled={saving}
                    >
                    Cancelar
                    </button>

                    <button
                    type="submit"
                    className="button button-primary"
                    disabled={saving}
                    >
                    <FaSave />
                    {saving ? 'Salvando...' : 'Salvar compra'}
                    </button>
                </div>
                </form>
            </div>
        )}


      {paymentPurchase && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>Registrar pagamento</h2>
                <p>{paymentPurchase.description}</p>
              </div>

              <button
                className="icon-button"
                onClick={closePaymentModal}
                disabled={savingPayment}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-info">
              <span>Valor restante</span>
              <strong>
                {formatCurrency(paymentPurchase.totalOpen)}
              </strong>
            </div>

            <form onSubmit={handleSavePayment}>
              <div className="field">
                <label htmlFor="purchase-payment-amount">
                  Valor do pagamento (R$)
                </label>

                <input
                  id="purchase-payment-amount"
                  type="number"
                  min="0.01"
                  max={paymentPurchase.totalOpen}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="purchase-payment-date">
                  Data do pagamento
                </label>

                <input
                  id="purchase-payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(event.target.value)
                  }
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="purchase-payment-note">
                  Observação (opcional)
                </label>

                <textarea
                  id="purchase-payment-note"
                  maxLength={500}
                  rows={3}
                  value={paymentNote}
                  onChange={(event) =>
                    setPaymentNote(event.target.value)
                  }
                  placeholder="Observações sobre o pagamento"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={closePaymentModal}
                  disabled={savingPayment}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="button button-primary"
                  disabled={savingPayment}
                >
                  <FaSave />
                  {savingPayment ? 'Salvando...' : 'Registrar pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyPurchase && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePaymentHistory();
            }
          }}
        >
          <div className="modal modal-history">
            <div className="modal-header">
              <div>
                <h2>Histórico de pagamentos</h2>
                <p>{historyPurchase.description}</p>
              </div>

              <button
                className="icon-button"
                onClick={closePaymentHistory}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>

            {loadingHistory ? (
              <div className="loading">
                Carregando histórico...
              </div>
            ) : historyPayments.length === 0 ? (
              <div className="empty-state">
                <FaHistory />
                <p>Nenhum pagamento registrado.</p>
              </div>
            ) : editingPayment ? (
              <form onSubmit={handleUpdatePayment}>
                <div className="field">
                  <label>Valor (R$)</label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentEditForm.amount}
                    onChange={(event) =>
                      setPaymentEditForm({
                        ...paymentEditForm,
                        amount: event.target.value
                      })
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>Data do pagamento</label>

                  <input
                    type="date"
                    value={paymentEditForm.paymentDate}
                    onChange={(event) =>
                      setPaymentEditForm({
                        ...paymentEditForm,
                        paymentDate: event.target.value
                      })
                    }
                    required
                  />
                </div>

                <div className="field">
                  <label>Observação</label>

                  <textarea
                    rows={3}
                    maxLength={500}
                    value={paymentEditForm.note}
                    onChange={(event) =>
                      setPaymentEditForm({
                        ...paymentEditForm,
                        note: event.target.value
                      })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="button button-secondary"
                    onClick={() => setEditingPayment(null)}
                    disabled={savingPayment}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={savingPayment}
                  >
                    <FaSave />
                    Salvar alterações
                  </button>
                </div>
              </form>
            ) : (
              <div className="history-list">
                {historyPayments.map((payment) => (
                  <div
                    className="history-item"
                    key={payment.id}
                  >
                    <div>
                      <strong>
                        {formatCurrency(payment.amount)}
                      </strong>

                      <span>
                        {formatDate(payment.paymentDate)}
                      </span>

                      {payment.note && (
                        <p>{payment.note}</p>
                      )}
                    </div>

                    <div className="history-actions">
                      <button
                        className="icon-button"
                        title="Editar pagamento"
                        onClick={() => openEditPayment(payment)}
                      >
                        <FaEdit />
                      </button>

                      <button
                        className="icon-button danger"
                        title="Excluir pagamento"
                        onClick={() => handleDeletePayment(payment)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
