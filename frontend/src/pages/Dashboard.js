import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import '../App.css';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    api.get('/api/debts').then(res => {
      setSummary(res.data.summary);
      setDebts(res.data.debts);
    });
  }, []);

  return (
    <div className='container'>
      <h1 className='title' >Rastreador de Finanças</h1>
      {summary && (
        <div>
          <div>Total em aberto: {summary.totalOpen.toFixed(2)}</div>
          <div>Total recebido: {summary.totalPaid.toFixed(2)}</div>
          <div>Quantidade: {summary.count}</div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <Link to="/api/new">Nova</Link>
        <h2>Últimas</h2>
        <ul>
          {debts.map(d => (
            <li key={d.id}>
              <Link to={`/api/debt/${d.id}`}>{d.debtorName}</Link> — Aberto: {d.totalOpen.toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}