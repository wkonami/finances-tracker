import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../services/api';

import '../App.css';

export default function Dashboard() {

  const [summary, setSummary] = useState(null);

  const [debts, setDebts] = useState([]);

  const [closedDebts, setClosedDebts] = useState([]);

  const [activeTab, setActiveTab] = useState('open');

  useEffect(() => {

    async function loadDebts() {

      try {

        const response = await api.get('/api/debts');

        setSummary(response.data.summary);

        setDebts(response.data.debts);

        setClosedDebts(
          response.data.closedDebts || []
        );

      } catch (error) {

        console.error(error);

        alert('Erro ao carregar dívidas');

      }

    }

    loadDebts();

  }, []);

  return (

    <div className="container">

      <h1 className="title">
        Rastreador de Finanças
      </h1>

      {

        summary && (

          <div className="summary-box">

            <div>
              <strong>Total em aberto:</strong>
              {' '}
              R$ {summary.totalOpen.toFixed(2)}
            </div>

            <div>
              <strong>Dívidas abertas:</strong>
              {' '}
              {summary.openCount}
            </div>

            <div>
              <strong>Dívidas quitadas:</strong>
              {' '}
              {summary.closedCount}
            </div>

          </div>

        )

      }

      <div className="tabs">

        <button
          className="button"
          onClick={() => setActiveTab('open')}
        >
          Em aberto
        </button>

        <button
          className="button"
          onClick={() => setActiveTab('closed')}
        >
          Quitadas
        </button>

        <Link to="/new">

          <button className="button">
            Nova dívida
          </button>

        </Link>

      </div>

      {

        activeTab === 'open' && (

          <div className="debts-section">

            <h2>
              Em aberto
            </h2>

            {

              debts.length === 0 ? (

                <p>
                  Nenhuma dívida em aberto.
                </p>

              ) : (

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

                        <span className="debt-value">

                          R$ {debt.totalOpen.toFixed(2)}

                        </span>

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

              closedDebts.length === 0 ? (

                <p>
                  Nenhuma dívida quitada.
                </p>

              ) : (

                <ul className="debt-list">

                  {

                    closedDebts.map((debt) => (

                      <li
                        key={debt.id}
                        className="closed-debt-item"
                      >

                        <div className="closed-debt-name">

                          {debt.debtorName}

                        </div>

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