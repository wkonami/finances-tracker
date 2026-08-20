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
    'Brinco',
    'Kanzashi'
  ];

  const [showEditDebtModal, setShowEditDebtModal] = useState(false);

  const [editDebtorName, setEditDebtorName] = useState('');

  const [editTotalAmount, setEditTotalAmount] = useState('');

  const [editDebtNotes, setEditDebtNotes] = useState('');

  function addPaymentNote(item) {
    setNote((prev) => {
      const lines = prev
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      const index = lines.findIndex(line =>
        line.toLowerCase().includes(item.toLowerCase())
      );

      if (index === -1) {
        return prev.trim()
          ? `${prev}\n${item}`
          : item;
      }

      const currentLine = lines[index];

      const match = currentLine.match(/^(\d+)\s+(.+)$/);

      if (match) {
        const quantity = Number(match[1]) + 1;
        lines[index] = `${quantity} ${match[2]}`;
      } else {
        lines[index] = `2 ${currentLine}`;
      }

      return lines.join('\n');
    });
  }

  function addEditNote(item) {
    setEditNote((prev) => {
      const lines = prev
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);

      const index = lines.findIndex(line =>
        line.toLowerCase().includes(item.toLowerCase())
      );

      if (index === -1) {
        return prev.trim()
          ? `${prev}\n${item}`
          : item;
      }

      const currentLine = lines[index];

      const match = currentLine.match(/^(\d+)\s+(.+)$/);

      if (match) {
        const quantity = Number(match[1]) + 1;
        lines[index] = `${quantity} ${match[2]}`;
      } else {
        lines[index] = `2 ${currentLine}`;
      }

      return lines.join('\n');
    });
  } 

  function openEditDebtModal() {
    setEditDebtorName(debt.debtorName || '');
    setEditTotalAmount(
      Number(debt.totalAmount).toFixed(2)
    );
    setEditDebtNotes(debt.notes || '');

    setShowEditDebtModal(true);
  }

  function closeEditDebtModal() {
    setShowEditDebtModal(false);
  }

  async function saveDebtEdit() {

    if (!editDebtorName.trim()) {
      alert('Informe o nome do devedor.');
      return;
    }

    const total = Number(editTotalAmount);

    if (isNaN(total) || total <= 0) {
      alert('Informe um valor total válido.');
      return;
    }

    if (total < Number(debt.totalPaid)) {
      alert(
        'O valor total não pode ser menor que o valor já pago.'
      );
      return;
    }

    try {

      await api.put(`/debts/${id}`, {
        debtorName: editDebtorName.trim(),
        totalAmount: total,
        notes: editDebtNotes
      });

      closeEditDebtModal();

      await fetchDebt();

    } catch (error) {

      console.error(error);

      alert(
        error.response?.data?.message ||
        'Erro ao editar pedido.'
      );

    }
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

  useEffect(() => {
    if (debt && Number(debt.totalOpen) > 0) {
      setAmount(Number(debt.totalOpen).toFixed(2));
    }
  }, [debt]);

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
        <div className="card loading-box">
            Carregando...
        </div>
      </div>
    );

  }

  const isClosed =
    debt.delivered &&
    Number(debt.totalOpen) <= 0;

  return (
    
    <div className="details-container">

      <div className="details-card card">

        <button
          className="button secondary"
          onClick={() =>
            navigate('/dashboard')
          }
        >
          Voltar
        </button>

        <header className="details-header">

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

          <div className="details-header-actions">

            <button
              className="button secondary small"
              onClick={openEditDebtModal}
            >
              Editar pedido
            </button>

            <div
              className={
                isClosed
                  ? 'badge success'
                  : 'badge danger'
              }
            >
              {isClosed ? 'Quitada' : 'Em aberto'}
            </div>

          </div>


        </header>

        <section className="details-summary-grid">

          <div className="summary-card card">

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

          <div className="summary-card card">

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

          <div className="summary-card card">

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

        </section>

        {

          !isClosed && (

            <>

              <hr className="divider" />

              <h3 className="section-title">
                Adicionar pagamento
              </h3>

              <form
                  className="payment-form"
                  onSubmit={(e)=>{
                      e.preventDefault();
                      addPayment();
                  }}
              >

                <input
                  className="field"
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
                  className="field"
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
                  className="field"
                  placeholder="Observação do pagamento"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                <button
                  type="submit"
                  className="button"
                >
                  Adicionar pagamento
                </button>

              </form>

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

              <ul className="list payment-list">

                {

                  debt.payments.map((payment) => {

                    const isEditing =
                      editingPaymentId === payment.id;

                    return (

                      <li
                        key={payment.id}
                        className="payment-item card"
                      >

                        {

                          isEditing ? (

                            <form
                                className="payment-edit-form"
                                onSubmit={(e)=>{
                                    e.preventDefault();
                                    saveEdit(payment.id);
                                }}
                            >

                              <input
                                className="field"
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
                                className="field"
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
                                className="field"
                                value={editNote}
                                onChange={(e) =>
                                  setEditNote(e.target.value)
                                }
                              />

                              <div className="payment-actions">

                                <button
                                  type="submit"
                                  className="button"
                                >
                                  Salvar
                                </button>

                                <button
                                  type="button"
                                  className="button secondary"
                                  onClick={cancelEdit}
                                >

                                  Cancelar

                                </button>

                              </div>

                            </form>

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
                                  className="button small"
                                  onClick={() =>

                                    startEdit(
                                      payment
                                    )

                                  }
                                >

                                  Editar

                                </button>

                                <button
                                  className="button danger small"
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

        <footer className="details-footer">

          <button
            className="button danger"
            onClick={deleteCurrentDebt}
          >

            Arquivar dívida

          </button>



        </footer>

      </div>

      {showEditDebtModal && (

        <div
          className="modal-overlay"
          onClick={closeEditDebtModal}
        >

          <div
            className="edit-debt-modal card"
            onClick={(e) => e.stopPropagation()}
          >

            <h3>
              Editar pedido
            </h3>

            <div className="form-group">

              <label>
                Devedor
              </label>

              <input
                className="field"
                type="text"
                value={editDebtorName}
                onChange={(e) =>
                  setEditDebtorName(e.target.value)
                }
                maxLength={100}
              />

            </div>

            <div className="form-group">

              <label>
                Valor total
              </label>

              <input
                className="field"
                type="number"
                step="0.01"
                min="0.01"
                value={editTotalAmount}
                onChange={(e) =>
                  setEditTotalAmount(e.target.value)
                }
              />

            </div>

            <div className="form-group">

              <label>
                Observações
              </label>

              <textarea
                className="field"
                value={editDebtNotes}
                onChange={(e) =>
                  setEditDebtNotes(e.target.value)
                }
                maxLength={1000}
                rows={6}
              />

            </div>

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

            <div className="modal-buttons">

              <button
                type="button"
                className="button secondary"
                onClick={closeEditDebtModal}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="button"
                onClick={saveDebtEdit}
              >
                Salvar alterações
              </button>

            </div>

          </div>

        </div>

      )}
    </div>

  );

}