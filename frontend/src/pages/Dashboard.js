import React, {
  useEffect,
  useState,
  useCallback
} from 'react';

import {
  Link,
  useNavigate
} from 'react-router-dom';

import api from '../services/api';

import '../App.css';

export default function Dashboard() {

  const navigate = useNavigate();

  const [summary, setSummary] =
    useState(null);

  const [debts, setDebts] =
    useState([]);

  const [closedDebts, setClosedDebts] =
    useState([]);

  const [activeTab, setActiveTab] =
    useState('open');

  const role =
    localStorage.getItem('role');

  const username =
    localStorage.getItem('username');

  function logout() {

    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');

    navigate('/');

  }

  const loadDebts =
    useCallback(async () => {

      try {

        const response =
          await api.get('/debts');

        setSummary(
          response.data.summary
        );

        setDebts(
          response.data.debts
        );

        setClosedDebts(
          response.data.closedDebts || []
        );

      } catch (error) {

        console.error(error);

        alert(
          'Erro ao carregar dívidas'
        );

      }

    }, []);

  useEffect(() => {

    loadDebts();

  }, [loadDebts]);

  return (

    <div className="container">

      <div className="top-bar">

        <div>

          <h1 className="title">
            Rastreador de Finanças
          </h1>

          <div className="logged-user">

            Usuário:
            {' '}
            <strong>
              {username}
            </strong>

            {' • '}

            Perfil:
            {' '}

            <strong>
              {role}
            </strong>

          </div>

        </div>

        <button
          className="button button-secondary"
          onClick={logout}
        >

          Sair

        </button>

      </div>

      {

        summary && (

          <div className="summary-box">

            <div className="summary-item">

              <div className="summary-label">
                Total em aberto
              </div>

              <div className="summary-value">

                R$

                {' '}

                {

                  Number(
                    summary.totalOpen
                  ).toFixed(2)

                }

              </div>

            </div>

            <div className="summary-item">

              <div className="summary-label">
                Dívidas abertas
              </div>

              <div className="summary-value">

                {summary.openCount}

              </div>

            </div>

            <div className="summary-item">

              <div className="summary-label">
                Dívidas quitadas
              </div>

              <div className="summary-value">

                {summary.closedCount}

              </div>

            </div>

          </div>

        )

      }

      <div className="tabs">

        <button
          className="button"
          onClick={() =>

            setActiveTab('open')

          }
        >

          Em aberto

        </button>

        <button
          className="button"
          onClick={() =>

            setActiveTab('closed')

          }
        >

          Quitadas

        </button>

        <Link to="/new">

          <button className="button">

            Nova dívida

          </button>

        </Link>

        {

          role === 'ADMIN' && (

            <Link to="/users">

              <button className="button">

                Usuários

              </button>

            </Link>

          )

        }

      </div>

      {

        activeTab === 'open' && (

          <div className="debts-section">

            <h2>

              Em aberto

            </h2>

            {

              debts.length === 0

                ? (

                  <p>

                    Nenhuma dívida em aberto.

                  </p>

                )

                : (

                  <ul className="debt-list">

                    {

                      debts.map((debt) => (

                        <li
                          key={debt.id}
                          className="debt-item"
                        >

                          <div className="debt-info">

                            <Link
                              className="debt-link"
                              to={`/debt/${debt.id}`}
                            >

                              {debt.debtorName}

                            </Link>

                            {

                              debt.notes && (

                                <div className="debt-note">

                                  {debt.notes}

                                </div>

                              )

                            }

                          </div>

                          <div className="debt-actions">

                            <span className="debt-value">

                              R$

                              {' '}

                              {

                                Number(
                                  debt.totalOpen
                                ).toFixed(2)

                              }

                            </span>

                          </div>

                        </li>

                      ))

                    }

                  </ul>

                )

            }

          </div>

        )

      }

      {

        activeTab === 'closed' && (

          <div className="debts-section">

            <h2>

              Quitadas

            </h2>

            {

              closedDebts.length === 0

                ? (

                  <p>

                    Nenhuma dívida quitada.

                  </p>

                )

                : (

                  <ul className="debt-list">

                    {

                      closedDebts.map((debt) => (

                        <li
                          key={debt.id}
                          className="closed-debt-item"
                        >

                          <Link
                            className="debt-link"
                            to={`/debt/${debt.id}`}
                          >

                            <div className="closed-debt-name">

                              {debt.debtorName}

                            </div>

                          </Link>

                          {

                            debt.notes && (

                              <div className="closed-debt-note">

                                {debt.notes}

                              </div>

                            )

                          }

                        </li>

                      ))

                    }

                  </ul>

                )

            }

          </div>

        )

      }

    </div>

  );

}