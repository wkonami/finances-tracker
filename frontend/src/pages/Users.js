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

  const loadUsers = useCallback(async () => {

    try {

      const { data } = await api.get('/users');

      setUsers(data);

    } catch (error) {

      console.error(error);

      alert('Erro ao carregar usuários.');

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

    try {

      if (editingUser) {

        await api.put(

          `/users/${editingUser.id}`,

          {
            username,
            password,
            role
          }

        );

      } else {

        await api.post(

          '/users',

          {
            username,
            password,
            role
          }

        );

      }

      clearForm();

      loadUsers();

    } catch (error) {

      console.error(error);

      alert(

        error.response?.data?.message ||

        'Erro ao salvar usuário.'

      );

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

      loadUsers();

    } catch (error) {

      console.error(error);

      alert('Erro ao excluir usuário.');

    }

  }

  return (

    <div className="container">
      <button
        className="button"
        onClick={() => navigate('/dashboard')}
      >
        Home
      </button>
      <h1 className="title">

        Manutenção de Usuários

      </h1>

      <div className="page-card">

        <h2 className="section-title">

          {

            editingUser

              ? 'Editar usuário'

              : 'Novo usuário'

          }

        </h2>

        <form
          onSubmit={handleSubmit}
        >

          <input
            placeholder="Usuário"
            value={username}
            onChange={(e) =>

              setUsername(
                e.target.value
              )

            }
            required
          />

          <input
            type="password"
            placeholder={

              editingUser

                ? 'Nova senha (opcional)'

                : 'Senha'

            }
            value={password}
            onChange={(e) =>

              setPassword(
                e.target.value
              )

            }
            required={!editingUser}
          />

          <select

            value={role}

            onChange={(e) =>

              setRole(
                e.target.value
              )

            }

          >

            <option value="USER">

              USER

            </option>

            <option value="ADMIN">

              ADMIN

            </option>

          </select>

          <div className="details-actions">

            <button
              className="button"
              type="submit"
            >

              {

                editingUser

                  ? 'Salvar alterações'

                  : 'Cadastrar'

              }

            </button>

            {

              editingUser && (

                <button

                  type="button"

                  className="button button-secondary"

                  onClick={clearForm}

                >

                  Cancelar

                </button>

              )

            }

          </div>

        </form>

      </div>

      <div
        className="page-card"
        style={{ marginTop: 25 }}
      >

        <h2 className="section-title">

          Usuários cadastrados

        </h2>

        {

          users.length === 0

            ? (

              <p>

                Nenhum usuário encontrado.

              </p>

            )

            : (

              <table className="users-table">

                <thead>

                  <tr>

                    <th>

                      Usuário

                    </th>

                    <th>

                      Perfil

                    </th>

                    <th>

                      Ações

                    </th>

                  </tr>

                </thead>

                <tbody>

                  {

                    users.map((user) => (

                      <tr
                        key={user.id}
                      >

                        <td>

                          {user.username}

                        </td>

                        <td>

                          {user.role}

                        </td>

                        <td>

                          <button
                            className="button"
                            onClick={() =>

                              editUser(user)

                            }
                          >

                            Editar

                          </button>

                          {' '}

                          <button
                            className="button danger"
                            onClick={() =>

                              deleteUser(user.id)

                            }
                          >

                            Excluir

                          </button>

                        </td>

                      </tr>

                    ))

                  }

                </tbody>

              </table>

            )

        }

      </div>

    </div>

  );

}