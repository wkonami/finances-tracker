import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      nav('/dashboard');
    } catch (err) {
      alert('Erro no login');
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div><input placeholder="Usuário" value={username} onChange={e => setUsername(e.target.value)} /></div>
        <div><input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}