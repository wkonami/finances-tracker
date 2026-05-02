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

export default function DebtDetails() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [debt, setDebt] = useState(null);

  const [amount, setAmount] = useState('');

  const [paymentDate, setPaymentDate] = useState('');

  const [note, setNote] = useState('');

  const fetchDebt = useCallback(async () => {

    try {

      const response = await api.get(`/api/debts/${id}`);

      setDebt(response.data);

    } catch (error) {

      console.error(error);

      alert('Erro ao carregar dívida');

    }

  }, [id]);

  useEffect(() => {

    fetchDebt();

  }, [fetchDebt]);

  async function addPayment() {

    if (!amount || !paymentDate) {

      alert('Informe valor e data');

      return;

    }

    try {

      await api.post(`/api/debts/${id}/payments`, {

        amount,

        paymentDate,

        note

      });

      setAmount('');

      setPaymentDate('');

      setNote('');

      await fetchDebt();

    } catch (error) {

      console.error(error);

      alert('Erro ao adicionar pagamento');

    }

  }

  if (!debt) {

    return <div>Carregando...</div>;

  }

  return (

    <div className="details-container">

      <h2>
        {debt.debtorName}
      </h2>

      <div className="details-summary">

        <div>

          <strong>Total:</strong>
          {' '}
          R$ {parseFloat(debt.totalAmount).toFixed(2)}

        </div>

        <div>

          <strong>Pago:</strong>
          {' '}
          R$ {Number(debt.totalPaid).toFixed(2)}

        </div>

        <div>

          <strong>Em aberto:</strong>
          {' '}
          R$ {Number(debt.totalOpen).toFixed(2)}

        </div>

      </div>

      {

        debt.notes && (

          <div className="details-notes">

            <strong>
              Observações:
            </strong>

            <div>
              {debt.notes}
            </div>

          </div>

        )

      }

      <hr />

      <h3>
        Adicionar pagamento
      </h3>

      <div className="payment-form">

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

      <hr />

      <h3>
        Histórico de pagamentos
      </h3>

      {

        !debt.payments ||

        debt.payments.length === 0

          ? (

            <p>
              Nenhum pagamento registrado.
            </p>

          )

          : (

            <ul className="payment-list">

              {

                debt.payments.map((payment) => (

                  <li
                    key={payment.id}
                    className="payment-item"
                  >

                    <div>

                      <strong>
                        Valor:
                      </strong>

                      {' '}

                      R$

                      {' '}

                      {parseFloat(payment.amount).toFixed(2)}

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

                  </li>

                ))

              }

            </ul>

          )

      }

      <button
        className="button"
        onClick={() => navigate('/dashboard')}
      >

        Voltar

      </button>

    </div>

  );

}