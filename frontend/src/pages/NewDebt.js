import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

import '../App.css';

export default function NewDebt() {

  const navigate = useNavigate();

  const [debtorName, setDebtorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const quickItems = [
    'Colar',
    'Pulseira',
    'Brinco',
    'Enfeite de Cabelo'
  ];

  function addNote(item) {

    setNotes((prev) =>
      prev.trim() === ''
        ? item
        : `${prev}\n${item}`
    );

  }

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      await api.post('/debts', {
        debtorName,
        totalAmount,
        notes
      });

      navigate('/dashboard');

    } catch (err) {

      console.error(err);

      alert('Erro ao criar dívida');

    }

  }

  return (

    <div className="new-debt-container">

      <div className="new-debt-form card">

        <button
          className="button secondary"
          onClick={() => navigate('/dashboard')}
        >
          Voltar
        </button>

        <h1 className="title">
          Novo pedido
        </h1>

        <form
          onSubmit={handleSubmit}
        >

          <input
            className="field"
            type="text"
            placeholder="Nome do devedor"
            value={debtorName}
            onChange={(e) =>
              setDebtorName(e.target.value)
            }
          />

          <input
            className="field"
            type="number"
            step="0.01"
            placeholder="Valor total"
            value={totalAmount}
            onChange={(e) =>
              setTotalAmount(e.target.value)
            }
          />

          <div className="quick-items">

            {

              quickItems.map((item) => (

                <button
                  key={item}
                  type="button"
                  className="quick-item-button"
                  onClick={() => addNote(item)}
                >

                  {item}

                </button>

              ))

            }

          </div>

          <textarea
            className="field"
            rows={6}
            placeholder="Observações"
            value={notes}
            onChange={(e) =>
              setNotes(e.target.value)
            }
          />

          <button
            className="button"
            type="submit"
          >

            Salvar Dívida

          </button>

        </form>

      </div>

    </div>

  );

}