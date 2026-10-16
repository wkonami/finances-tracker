import React, {
  useEffect,
  useState,
  useCallback
} from 'react';

import api from '../services/api';

import { useNavigate } from 'react-router-dom';

import '../App.css';

export default function Users() {

  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');

  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);

    try {

      const { data } = await api.get('/users');

      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar usuários', error);

      alert(
        error.response?.data?.message ||
        'Erro ao carregar usuários.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function clearForm() {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('USER');
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername) {
      alert('Informe o nome do usuário.');
      return;
    }

    if (!editingUser && !password) {
      alert('Informe uma senha para o usuário');
      return;
    }

    const payload = {
      username: normalizedUsername,
      role,
    };

    //apenas envia a senha se uma nova for informada
    if (password) {
      payload.password = password;
    }

    setSaving(true);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);

        alert('Usuário atualizado com sucesso.');
      } else {
        await api.post('/users', payload);

        alert('Usuário cadastrado com sucesso.');
      }

      clearForm();
      await loadUsers();
    } catch (error) {
      console.error('Erro ao salvar o usuário', error);

      alert(
        error.response?.data?.message ||
        'Erro ao salvar usuário.'
      );
    } finally {
      setSaving(false);
    }
  }

  function editUser(user) {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
  }

  async function deleteUser(id) {
    const confirmed = window.confirm(
      'Deseja arquivar este usuário?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/users/${id}`);

      alert('Usuário arquivado com sucesso.');

      if (editingUser?.id === id) {
        clearForm();
      }

      await loadUsers();
    } catch (error) {
      console.error('Erro ao arquivar usuário', error);

      alert(
        error.response?.data?.message ||
        'Erro ao arquivar usuário.'
      );
    }
  }

  return (
    <main className="container users-page">
      <header className="users-header">
        <div>
          <h1 className="title">
            Manutenção de Usuários
          </h1>

          <p className="empty-text">
            Gerencie os acessos e os perfis dos usuários do sistema.
          </p>
        </div>

        <button
          className="button secondary"
          type="button"
          onClick={() => navigate('/dashboard')}
        >
          Voltar ao dashboard
        </button>
      </header>

      <section className="page-card users-form-card mb-3">
        <div className="users-section-header">
          <h2 className="section-title">
            {editingUser ? 'Editar usuário' : 'Novo usuário'}
          </h2>

          {editingUser && (
            <span className="users-edit-badge">
              Editando: {editingUser.username}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field-group">
              <label htmlFor="username">
                Nome de usuário
              </label>

              <input
                id="username"
                className="field"
                type="text"
                placeholder="Digite o nome de usuário"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">
                {editingUser ? 'Nova senha' : 'Senha'}
              </label>

              <input
                id="password"
                className="field"
                type="password"
                placeholder={
                  editingUser
                    ? 'Deixe em branco para manter a atual'
                    : 'Digite uma senha'
                }
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!editingUser}
              />
            </div>

            <div className="field-group">
              <label htmlFor="role">
                Perfil de acesso
              </label>

              <select
                id="role"
                className="field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div className="users-form-actions">
            <button
              className="button"
              type="submit"
              disabled={saving}
            >
              {saving
                ? 'Salvando...'
                : editingUser
                  ? 'Salvar alterações'
                  : 'Cadastrar usuário'}
            </button>

            {editingUser && (
              <button
                className="button secondary"
                type="button"
                onClick={clearForm}
                disabled={saving}
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="page-card users-list-card">
        <div className="users-section-header">
          <h2 className="section-title">
            Usuários cadastrados
          </h2>

          <span className="users-count">
            {users.length}{' '}
            {users.length === 1 ? 'usuário' : 'usuários'}
          </span>
        </div>

        {loading ? (
          <p className="empty-text">
            Carregando usuários...
          </p>
        ) : users.length === 0 ? (
          <p className="empty-text">
            Nenhum usuário encontrado.
          </p>
        ) : (
          <div className="table-wrapper">
            <table className="table users-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th className="users-actions-column">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <span className="users-username">
                        {user.username}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`users-role ${
                          user.role === 'ADMIN'
                            ? 'users-role-admin'
                            : 'users-role-user'
                        }`}
                      >
                        {user.role === 'ADMIN'
                          ? 'Administrador'
                          : 'Usuário'}
                      </span>
                    </td>

                    <td>
                      <div className="users-row-actions">
                        <button
                          className="button secondary"
                          type="button"
                          onClick={() => editUser(user)}
                        >
                          Editar
                        </button>

                        <button
                          className="button danger"
                          type="button"
                          onClick={() => deleteUser(user.id)}
                        >
                          Arquivar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );

}