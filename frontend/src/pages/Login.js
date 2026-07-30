import React, { useState } from 'react';

import api from '../services/api';

import { useNavigate } from 'react-router-dom';

import '../App.css';

export default function Login() {

  const [username, setUsername] = useState('');

  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      const { data } = await api.post(
        '/auth/login',
        {
          username,
          password
        }
      );

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('username', data.user.username);

      navigate('/dashboard');

    } catch (err) {

      console.error(err);

      alert('Erro no login');

    }

  }

  return (

    <div className="login-container">

      <div className="login-box">

        <h2>
          Login
        </h2>

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >

          <input
            placeholder="Usuário"
            value={username}
            onChange={(e) =>

              setUsername(e.target.value)

            }
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) =>

              setPassword(e.target.value)

            }
          />

          <button
            className="button"
            type="submit"
          >

            Entrar

          </button>

        </form>

      </div>

    </div>

  );

}