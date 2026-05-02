import React, { useState } from 'react';

import api from '../services/api';

import { useNavigate } from 'react-router-dom';

import '../App.css';

export default function NewDebt() {

  const [debtorName, setDebtorName] = useState('');

  const [totalAmount, setTotalAmount] = useState('');

  const [notes, setNotes] = useState('');

  const navigate = useNavigate();

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

      <h2>
        Nova Dívida
      </h2>

      <form
        className="new-debt-form"
        onSubmit={handleSubmit}
      >

        <input
          value={debtorName}
          onChange={(e) =>

            setDebtorName(e.target.value)

          }
          placeholder="Nome do devedor"
        />

        <input
          value={totalAmount}
          onChange={(e) =>

            setTotalAmount(e.target.value)

          }
          placeholder="Valor total (ex: 120.50)"
        />

        <textarea
          value={notes}
          onChange={(e) =>

            setNotes(e.target.value)

          }
          placeholder="Observações"
        />

        <button
          className="button"
          type="submit"
        >

          Salvar

        </button>

      </form>

    </div>

  );

}