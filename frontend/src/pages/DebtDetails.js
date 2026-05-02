import React, { useEffect, useState } from 'react';

import api from '../services/api';

import {
  useParams,
  useNavigate
} from 'react-router-dom';

export default function DebtDetails() {

  const { id } = useParams();

  const nav = useNavigate();

  const [debt, setDebt] = useState(null);

  const [amount, setAmount] = useState('');

  const [paymentDate, setPaymentDate] = useState('');

  const [note, setNote] = useState('');

  async function loadDebt() {

    try {

      const res = await api.get(`/api/debts/${id}`);

      setDebt(res.data);

    } catch (error) {

      console.error(error);

    }
  }

  useEffect(() => {

    loadDebt();

  }, [id]);

  async function addPayment() {

    try {

      await api.post(`/api/debts/${id}/payments`, {

        amount,

        paymentDate,

        note

      });

      setAmount('');

      setPaymentDate('');

      setNote('');

      loadDebt();

    } catch (error) {

      console.error(error);

      alert('Erro ao adicionar pagamento');
    }
  }

  if (!debt) {

    return <div>Carregando...</div>;
  }

  return (

    <div style={{ padding: 20 }}>

      <h2>{debt.debtorName}</h2>

      <div>
        <strong>Total:</strong>
        {' '}
        R$ {parseFloat(debt.totalAmount).toFixed(2)}
      </div>

      <div>
        <strong>Pago:</strong>
        {' '}
        R$ {debt.totalPaid.toFixed(2)}
      </div>

      <div>
        <strong>Em aberto:</strong>
        {' '}
        R$ {debt.totalOpen.toFixed(2)}
      </div>

      <hr />

      <h3>Adicionar pagamento</h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 300
      }}>

        <input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />

        <textarea
          placeholder="Observação"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <button onClick={addPayment}>
          Adicionar pagamento
        </button>

      </div>

      <hr />

      <h3>Histórico de pagamentos</h3>

      {

        debt.payments.length === 0 && (

          <p>Nenhum pagamento registrado.</p>

        )

      }

      <ul>

        {

          debt.payments.map(payment => (

            <li
              key={payment.id}
              style={{
                marginBottom: 10
              }}
            >

              <div>

                💰
                {' '}
                R$ {parseFloat(payment.amount).toFixed(2)}

              </div>

              <div>

                📅
                {' '}
                {

                  new Date(
                    payment.paymentDate
                  ).toLocaleDateString()

                }

              </div>

              {

                payment.note && (

                  <div>

                    📝
                    {' '}
                    {payment.note}

                  </div>

                )

              }

            </li>

          ))

        }

      </ul>

      <button onClick={() => nav('/dashboard')}>
        Voltar
      </button>

    </div>
  );
}