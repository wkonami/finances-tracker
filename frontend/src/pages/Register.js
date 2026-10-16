
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import '../App.css';

export default function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password || !confirmPassword) {
      alert('Preencha todos os campos.');
      return;
    }

    if (normalizedUsername.length < 3) {
      alert('O usuário deve ter pelo menos 3 caracteres.');
      return;
    }

    if (password.length < 8) {
      alert('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        username: normalizedUsername,
        password,
      });

      alert('Conta criada com sucesso! Faça login para continuar.');

      navigate('/', { replace: true });
    } catch (error) {
      console.error(error);

      const message =
        error.response?.data?.message ||
        'Não foi possível criar a conta. Tente novamente.';

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-container">
      <section className="login-box card">
        <h1 className="title">Criar conta</h1>

        <p className="empty-text">
          Cadastre-se para começar a usar o Finances.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            className="field"
            type="text"
            placeholder="Usuário"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            className="field"
            type="password"
            placeholder="Senha"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            className="field"
            type="password"
            placeholder="Confirmar senha"
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            className="button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <button
          className="button secondary"
          type="button"
          disabled={loading}
          onClick={() => navigate('/')}
        >
          Voltar para o login
        </button>
      </section>
    </main>
  );
}
