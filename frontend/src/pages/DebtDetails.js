import React, {
  useEffect,
  useState,
  useCallback
} from 'react';

import api from '../services/api';

import {
  useParams,
  useNavigate
} from 'react-router-dom';

import '../App.css';

function getTodayLocal() {
  const today = new Date();

  const offset = today.getTimezoneOffset();

  const localDate = new Date(
    today.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().split('T')[0];
}

export default function DebtDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [debt, setDebt] = useState(null);

  const [amount, setAmount] = useState('');

  const [paymentDate, setPaymentDate] = useState(
    getTodayLocal()
  );

  const [note, setNote] = useState('');

  const [editingPaymentId, setEditingPaymentId] = useState(null);

  const [editAmount, setEditAmount] = useState('');

  const [editPaymentDate, setEditPaymentDate] = useState('');

  const [editNote, setEditNote] = useState('');

    const quickItems = [
    'Colar',
    'Pulseira',
    'Brinco',
    'Enfeite de Cabelo'
  ];

  function addPaymentNote(item) {
    setNote((prev) =>
      prev.trim() === '' ? item : `${prev}\n${item}`
    );
  }

  function addEditNote(item) {
    setEditNote((prev) =>
      prev.trim() === '' ? item : `${prev}\n${item}`
    );
  }  

  const fetchDebt = useCallback(async () => {

    try {

      const response = await api.get(`/debts/${id}`);

      setDebt(response.data);

    } catch (error) {

      console.error(error);

      alert('Erro ao carregar dívida');

    }

  }, [id]);

  useEffect(() => {

    fetchDebt();

  }, [fetchDebt]);

  async function deleteCurrentDebt() {

    const confirmed = window.confirm(
      'Deseja arquivar esta dívida?'
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(`/debts/${id}`);

      navigate('/dashboard');

    } catch (error) {

      console.error(error);

      alert('Erro ao arquivar');

    }

  }

  async function addPayment() {

    if (!amount || !paymentDate) {

      alert('Informe valor e data');

      return;

    }

    try {

      await api.post(`/debts/${id}/payments`, {

        amount,

        paymentDate,

        note

      });

      setAmount('');

      setPaymentDate(getTodayLocal());

      setNote('');

      await fetchDebt();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        'Erro ao adicionar pagamento'
      );

    }

  }

  function startEdit(payment) {

    setEditingPaymentId(payment.id);

    setEditAmount(payment.amount);

    setEditPaymentDate(
      payment.paymentDate.split('T')[0]
    );

    setEditNote(payment.note || '');

  }

  function cancelEdit() {

    setEditingPaymentId(null);

    setEditAmount('');

    setEditPaymentDate('');

    setEditNote('');

  }

  async function saveEdit(paymentId) {

    try {

      await api.put(
        `/debts/payments/${paymentId}`,
        {
          amount: editAmount,
          paymentDate: editPaymentDate,
          note: editNote
        }
      );

      cancelEdit();

      await fetchDebt();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        'Erro ao editar pagamento'
      );

    }

  }

  async function deletePayment(paymentId) {

    const confirmed = window.confirm(
      'Deseja excluir este pagamento?'
    );

    if (!confirmed) {
      return;
    }

    try {

      await api.delete(
        `/debts/payments/${paymentId}`
      );

      await fetchDebt();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        'Erro ao excluir pagamento'
      );

    }

  }

  if (!debt) {

    return (
      <div className="loading-container">
        Carregando...
      </div>
    );

  }

  const isClosed =
    Number(debt.totalOpen) <= 0;

  return (
    
    <div className="details-container">

      <div className="details-card">

        <button
          className="button"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Voltar
        </button>

        <div className="details-header">

          <div>

            <h2 className="details-title">
              {debt.debtorName}
            </h2>

            {

              debt.notes && (

                <div className="details-notes">

                  {debt.notes}

                </div>

              )

            }

          </div>

          <div
            className={
              isClosed
                ? 'status-badge closed'
                : 'status-badge open'
            }
          >

            {

              isClosed
                ? 'Quitada'
                : 'Em aberto'

            }

          </div>

        </div>

        <div className="details-summary-grid">

          <div className="summary-card">

            <span className="summary-label">
              Valor total
            </span>

            <span className="summary-value">

              R$
              {' '}

              {

                parseFloat(
                  debt.totalAmount
                ).toFixed(2)

              }

            </span>

          </div>

          <div className="summary-card">

            <span className="summary-label">
              Valor pago
            </span>

            <span className="summary-value success">

              R$
              {' '}

              {

                Number(
                  debt.totalPaid
                ).toFixed(2)

              }

            </span>

          </div>

          <div className="summary-card">

            <span className="summary-label">
              Em aberto
            </span>

            <span className="summary-value danger">

              R$
              {' '}

              {

                Number(
                  debt.totalOpen
                ).toFixed(2)

              }

            </span>

          </div>

        </div>

        {

          !isClosed && (

            <>

              <hr className="divider" />

              <h3 className="section-title">
                Adicionar pagamento
              </h3>

              <div className="payment-form">

                <input
                  className="input"
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={amount}
                  onChange={(e) =>
                    setAmount(
                      e.target.value
                    )
                  }
                />

                <input
                  className="input"
                  type="date"
                  value={paymentDate}
                  onChange={(e) =>
                    setPaymentDate(
                      e.target.value
                    )
                  }
                />

                <div className="quick-items">
                  {quickItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="quick-item-button"
                      onClick={() => addPaymentNote(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <textarea
                  className="textarea"
                  placeholder="Observação do pagamento"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <button
                  className="button"
                  onClick={addPayment}
                >

                  Adicionar pagamento

                </button>

              </div>

            </>

          )

        }

        <hr className="divider" />

        <h3 className="section-title">
          Histórico de pagamentos
        </h3>

        {

          !debt.payments ||

          debt.payments.length === 0

            ? (

              <p className="empty-text">
                Nenhum pagamento registrado.
              </p>

            )

            : (

              <ul className="payment-list">

                {

                  debt.payments.map((payment) => {

                    const isEditing =
                      editingPaymentId === payment.id;

                    return (

                      <li
                        key={payment.id}
                        className="payment-item"
                      >

                        {

                          isEditing ? (

                            <div className="payment-edit-form">

                              <input
                                className="input"
                                type="number"
                                step="0.01"
                                value={editAmount}
                                onChange={(e) =>

                                  setEditAmount(
                                    e.target.value
                                  )

                                }
                              />

                              <input
                                className="input"
                                type="date"
                                value={editPaymentDate}
                                onChange={(e) =>

                                  setEditPaymentDate(
                                    e.target.value
                                  )

                                }
                              />

                              <div className="quick-items">
                                {quickItems.map((item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    className="quick-item-button"
                                    onClick={() => addEditNote(item)}
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>

                              <textarea
                                className="textarea"
                                value={editNote}
                                onChange={(e) =>
                                  setEditNote(e.target.value)
                                }
                              />

                              <div className="payment-actions">

                                <button
                                  className="button"
                                  onClick={() =>

                                    saveEdit(
                                      payment.id
                                    )

                                  }
                                >

                                  Salvar

                                </button>

                                <button
                                  className="button secondary-button"
                                  onClick={cancelEdit}
                                >

                                  Cancelar

                                </button>

                              </div>

                            </div>

                          ) : (

                            <>

                              <div className="payment-info">

                                <div>

                                  <strong>
                                    Valor:
                                  </strong>

                                  {' '}

                                  R$

                                  {' '}

                                  {

                                    parseFloat(
                                      payment.amount
                                    ).toFixed(2)

                                  }

                                </div>

                                <div>

                                  <strong>
                                    Data:
                                  </strong>

                                  {' '}

                                  {

                                    payment.paymentDate
                                      .split('T')[0]
                                      .split('-')
                                      .reverse()
                                      .join('/')

                                  }

                                </div>

                                {

                                  payment.note && (

                                    <div>

                                      <strong>
                                        Observação:
                                      </strong>

                                      {' '}

                                      {payment.note}

                                    </div>

                                  )

                                }

                              </div>

                              <div className="payment-actions">

                                <button
                                  className="button small-button"
                                  onClick={() =>

                                    startEdit(
                                      payment
                                    )

                                  }
                                >

                                  Editar

                                </button>

                                <button
                                  className="button danger-button small-button"
                                  onClick={() =>

                                    deletePayment(
                                      payment.id
                                    )

                                  }
                                >

                                  Excluir

                                </button>

                              </div>

                            </>

                          )

                        }

                      </li>

                    );

                  })

                }

              </ul>

            )

        }

        <div className="details-footer">

          <button
            className="button danger-button"
            onClick={deleteCurrentDebt}
          >

            Arquivar dívida

          </button>



        </div>

      </div>

    </div>

  );

}