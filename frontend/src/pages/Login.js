import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../services/api';

import '../App.css';

export default function Login() {

  const navigate = useNavigate();

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {

    e.preventDefault();

    if (!username.trim() || !password.trim()) {

      alert('Informe usuário e senha.');

      return;

    }

    setLoading(true);

    try {

      const response = await api.post(
        '/auth/login',
        {
          username,
          password
        }
      );

      const { token, user } = response.data;

      if (!token) {

        throw new Error('Token não recebido.');

      }

      localStorage.setItem('token', token);

      if (user) {

        localStorage.setItem(
          'userId',
          String(user.id)
        );

        localStorage.setItem(
          'username',
          user.username
        );

        localStorage.setItem(
          'role',
          user.role
        );

      } else {

        localStorage.removeItem('userId');

        localStorage.removeItem('username');

        localStorage.setItem(
          'role',
          'USER'
        );

      }

      navigate(
        '/dashboard',
        {
          replace: true
        }
      );

    } catch (error) {

      console.error(error);

      const message =
        error.response?.data?.message ||
        'Usuário ou senha inválidos.';

      alert(message);

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="login-container">

      <section className="login-box card">

        <h1 className="title">
          Finances
        </h1>

        <p className="empty-text">
          Entre com seu usuário e senha.
        </p>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <input
            className="field"
            type="text"
            placeholder="Usuário"
            autoComplete="username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
          />

          <input
            className="field"
            type="password"
            placeholder="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          <button
            className="button"
            type="submit"
            disabled={loading}
          >

            {
              loading
                ? 'Entrando...'
                : 'Entrar'
            }

          </button>

        </form>

      </section>

    </main>

  );

}