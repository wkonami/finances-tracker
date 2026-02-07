import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function NewDebt() {
  const [debtorName, setDebtorName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await api.post('/debts', { debtorName, totalAmount, notes });
      nav('/dashboard');
    } catch (err) {
      alert('Erro');
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h2>Nova Dívida</h2>
      <form onSubmit={handleSubmit}>
        <div><input value={debtorName} onChange={e => setDebtorName(e.target.value)} placeholder="Nome do devedor" /></div>
        <div><input value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Valor total (ex: 120.50)" /></div>
        <div><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observações" /></div>
        <button type="submit">Salvar</button>
      </form>
    </div>
  );
}