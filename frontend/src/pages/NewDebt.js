import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import '../App.css';

export default function NewDebt() {
  const [debtorName, setDebtorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');

  const navigate = useNavigate();

  // Itens que aparecerão como botões
  const quickItems = [
    'Colar',
    'Pulseira',
    'Brinco',
    'Enfeite de Cabelo'
  ];

  // Adiciona o texto ao campo Observações
  function addNote(item) {
    setNotes((prev) =>
      prev.trim() === '' ? item : `${prev}\n${item}`
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
      <button
        className="button"
        onClick={() => navigate('/dashboard')}
      >
        Home
      </button>

      <h2>Nova Dívida</h2>

      <form
        className="new-debt-form"
        onSubmit={handleSubmit}
      >
        <input
          value={debtorName}
          onChange={(e) => setDebtorName(e.target.value)}
          placeholder="Nome do devedor"
        />

        <input
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="Valor total (ex: 120.50)"
        />

        {/* Botões rápidos */}
        <div className="quick-items">
          {quickItems.map((item) => (
            <button
              key={item}
              type="button"
              className="quick-item-button"
              onClick={() => addNote(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observações"
          rows={6}
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