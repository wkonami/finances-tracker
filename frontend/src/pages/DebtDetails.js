import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';

export default function DebtDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const [debt, setDebt] = useState(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    api.get(`/api/debts/${id}`).then(res => setDebt(res.data));
  }, [id]);

  async function addPayment() {
    if (!amount) return;
    await api.post(`/api/debts/${id}/payments`, { amount });
    const res = await api.get(`/api/debts/${id}`);
    setDebt(res.data);
    setAmount('');
  }

  if (!debt) return <div>Carregando...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{debt.debtorName}</h2>
      <div>Total: {parseFloat(debt.totalAmount).toFixed(2)}</div>
      <div>Pago: {debt.totalPaid.toFixed(2)}</div>
      <div>Em aberto: {debt.totalOpen.toFixed(2)}</div>

      <div style={{ marginTop: 20 }}>
        <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Valor pago agora" />
        <button onClick={addPayment}>Adicionar pagamento</button>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => nav('/dashboard')}>Voltar</button>
      </div>
    </div>
  );
}