import React, {
  useEffect,
  useState,
  useCallback
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import {
    FaBoxOpen,
    FaMoneyBillWave
} from "react-icons/fa";

import PaymentModal from '../components/PaymentModal';

import api from '../services/api';

import '../App.css';

export default function Dashboard() {

  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [debts, setDebts] = useState([]);
  const [closedDebts, setClosedDebts] = useState([]);
  const [activeTab, setActiveTab] = useState('open');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username');

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');

    navigate('/');
  }

  async function markAsDelivered(id) {

    try {

      await api.patch(`/debts/${id}/delivered`);

      loadDebts();

    } catch (error) {

      console.error(error);

      alert("Erro ao marcar como entregue.");

    }

  }

  function openPaymentModal(debt) {
    setSelectedDebt(debt);
    setPaymentAmount(Number(debt.totalOpen).toFixed(2));
    setPaymentNote('');
    setShowPaymentModal(true);
  }

  function closePaymentModal() {
    setShowPaymentModal(false);
    setSelectedDebt(null);
  }

  async function savePayment() {
    if (!selectedDebt) return;
    try {
        await api.post(
          `/debts/${selectedDebt.id}/payments`,
          {
            amount: Number(paymentAmount),
            note: paymentNote
          });
        closePaymentModal();
        loadDebts();
    } catch (error) {
        console.error(error);
        alert(error.response?.data?.message ||
            'Erro ao registrar pagamento.'
        );
    }

  }

  const loadDebts = useCallback(async () => {
    try {
      const response = await api.get('/debts');

      setSummary(response.data.summary);
      setDebts(response.data.debts);
      setClosedDebts(response.data.closedDebts || []);

    } catch (error) {
      console.error(error);
      alert('Erro ao carregar dívidas');
    }
  }, []);

  useEffect(() => {
    loadDebts();
  }, [loadDebts]);

  return (
    <div className="container">

      <header className="top-bar">

        <div>

          <h1 className="title">
            Rastreador de Finanças
          </h1>

          <div className="logged-user">
            <strong>{username}</strong>
            <br />
            {role}
          </div>

        </div>

        <button
          className="button"
          onClick={logout}
        >
          Sair
        </button>

      </header>

      {summary && (

        <section className="summary-box">

          <article className="summary-item card">

            <span className="summary-label">
              Total em aberto
            </span>

            <div className="summary-value danger">
              R$ {Number(summary.totalOpen).toFixed(2)}
            </div>

          </article>

          <article className="summary-item card"
            onClick={() => setActiveTab('open')}
          >
            <span className="summary-label">
              Pedidos abertos
            </span>
            <div className="summary-value">
              {summary.openCount}
            </div>
          </article>

          <article className="summary-item card"
            onClick={() => setActiveTab('closed')}>

            <span className="summary-label">
              Pedidos finalizados
            </span>

            <div className="summary-value success">
              {summary.closedCount}
            </div>

          </article>

        </section>

      )}

      <nav className="tabs">

        <button
          className="button"
          onClick={() => setActiveTab('open')}
        >
          Em aberto
        </button>

        <button
          className="button"
          onClick={() => setActiveTab('closed')}
        >
          Quitadas
        </button>

        <Link to="/new">

          <button className="button">
            Nova dívida
          </button>

        </Link>

        {role === 'ADMIN' && (

          <Link to="/users">

            <button className="button">
              Usuários
            </button>

          </Link>

        )}

      </nav>

      {activeTab === 'open' && (

        <section className="debts-section">

          <h2 className="section-title">
            Em aberto
          </h2>

          {debts.length === 0 ? (

            <p className="empty-text">
              Nenhuma dívida em aberto.
            </p>

          ) : (

            <ul className="list debt-list">

              {debts.map((debt) => (
                  <li key={debt.id} className="debt-item card" onClick={() => navigate(`/debt/${debt.id}`)}>
                    <div className="debt-info">
                      {debt.debtorName}
                      <div
                          className={`delivery-status ${
                              debt.delivered ? 'delivered' : 'pending'
                          }`}
                      >
                          {debt.delivered
                              ? 'Entregue'
                              : 'Aguardando entrega'}
                      </div>
                      {debt.notes && (
                        <div className="debt-note">
                          {debt.notes}
                        </div>
                      )}
                    </div>
                    <span className="debt-value">
                      R$ {Number(debt.totalOpen).toFixed(2)}
                    </span>
                    <div className="debt-actions">
                      {!debt.delivered && (
                        <button
                            className="icon-button"
                            onClick={(e) => {

                                e.stopPropagation();

                                markAsDelivered(debt.id);

                            }}
                            title="Marcar como entregue"
                        >

                            <FaBoxOpen />

                        </button>
                      )}

                      {!debt.isPaid && (
                        <button
                            className="icon-button"
                            onClick={(e) => {

                                e.stopPropagation();

                                openPaymentModal(debt);

                            }}
                            title="Registrar pagamento"
                        >

                            <FaMoneyBillWave />

                        </button>
                      )}

                    </div>
                  </li>

              ))}

            </ul>

          )}

        </section>

      )}

      {activeTab === 'closed' && (

        <section className="debts-section">

          <h2 className="section-title">
            Quitadas
          </h2>

          {closedDebts.length === 0 ? (

            <p className="empty-text">
              Nenhuma dívida quitada.
            </p>

          ) : (

            <ul className="list debt-list">

              {closedDebts.map((debt) => (

                <li
                  key={debt.id}
                  className="closed-debt-item card"
                >

                  <div className="debt-info">

                    <Link
                      to={`/debt/${debt.id}`}
                      className="debt-link"
                    >

                      <div className="closed-debt-name">
                        {debt.debtorName}
                      </div>

                    </Link>

                    {debt.notes && (

                      <div className="closed-debt-note">
                        {debt.notes}
                      </div>

                    )}

                  </div>

                </li>

              ))}

            </ul>

          )}

        </section>

      )}
      <PaymentModal
        visible={showPaymentModal}
        amount={paymentAmount}
        note={paymentNote}
        onAmountChange={setPaymentAmount}
        onNoteChange={setPaymentNote}
        onCancel={closePaymentModal}
        onSave={savePayment}
      />
    </div>
  );
}