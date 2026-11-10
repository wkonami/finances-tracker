
import React, { useCallback, useEffect, useState } from 'react';
import {
  FaPlus,
  FaTruck,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaShoppingCart
} from 'react-icons/fa';

import api from '../services/api';
import '../App.css';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  document: '',
  notes: ''
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchSuppliers = useCallback(async () => {
    try {
      setError('');

      const response = await api.get('/suppliers');
      setSuppliers(response.data.suppliers || response.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível carregar os fornecedores.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openNewForm = () => {
    setEditingSupplier(null);
    setForm(initialForm);
    setError('');
    setShowForm(true);
  };

  const openEditForm = (supplier) => {
    setEditingSupplier(supplier);
    setForm({
      name: supplier.name || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      document: supplier.document || '',
      notes: supplier.notes || ''
    });
    setError('');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingSupplier(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Informe o nome do fornecedor.');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        document: form.document.trim(),
        notes: form.notes.trim()
      };

      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}`, payload);
      } else {
        await api.post('/suppliers', payload);
      }

      closeForm();
      await fetchSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível salvar o fornecedor.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (supplier) => {
    const purchaseCount = supplier._count?.purchases || 0;

    const message = purchaseCount > 0
      ? `O fornecedor "${supplier.name}" está vinculado a ${purchaseCount} compra(s). Ele será arquivado e continuará associado ao histórico. Deseja continuar?`
      : `Deseja arquivar o fornecedor "${supplier.name}"?`;

    if (!window.confirm(message)) return;

    try {
      setError('');

      await api.delete(`/suppliers/${supplier.id}`);
      await fetchSuppliers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Não foi possível arquivar o fornecedor.'
      );
    }
  };

  return (
    <div className="page-container page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fornecedores</h1>
          <p className="page-description">
            Cadastre e gerencie os fornecedores das suas compras.
          </p>
        </div>

        <button
          type="button"
          className="button button-primary"
          onClick={openNewForm}
        >
          <FaPlus />
          Novo fornecedor
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Fechar mensagem"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <section className="content-section">
        {loading ? (
          <div className="loading">
            Carregando fornecedores...
          </div>
        ) : suppliers.length === 0 ? (
          <div className="empty-state">
            <FaTruck />
            <h3>Nenhum fornecedor cadastrado</h3>
            <p>
              Cadastre seu primeiro fornecedor para vinculá-lo às compras.
            </p>

            <button
              type="button"
              className="button button-primary"
              onClick={openNewForm}
            >
              <FaPlus />
              Cadastrar fornecedor
            </button>
          </div>
        ) : (
          <div className="record-list">
            {suppliers.map((supplier) => (
              <article
                className="record-card card"
                key={supplier.id}
              >
                <div className="record-header">
                  <div className="record-title-group">
                    <div className="record-icon">
                      <FaTruck />
                    </div>

                    <div>
                      <h3 className="record-title">
                        {supplier.name}
                      </h3>

                      <span className="record-meta">
                        <FaShoppingCart />
                        {supplier._count?.purchases || 0} compra(s)
                      </span>
                    </div>
                  </div>

                  <div className="record-actions">
                    <button
                      type="button"
                      className="icon-button"
                      title="Editar fornecedor"
                      onClick={() => openEditForm(supplier)}
                    >
                      <FaEdit />
                    </button>

                    <button
                      type="button"
                      className="icon-button danger"
                      title="Arquivar fornecedor"
                      onClick={() => handleDelete(supplier)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="record-meta">
                  {supplier.phone && (
                    <span>
                      <FaPhone /> {supplier.phone}
                    </span>
                  )}

                  {supplier.email && (
                    <span>
                      <FaEnvelope /> {supplier.email}
                    </span>
                  )}

                  {supplier.document && (
                    <span>
                      <FaIdCard /> {supplier.document}
                    </span>
                  )}
                </div>

                {supplier.notes && (
                  <p className="record-notes">
                    {supplier.notes}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay">
          <form
            className="modal modal-wide"
            onSubmit={handleSave}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingSupplier
                    ? 'Editar fornecedor'
                    : 'Novo fornecedor'}
                </h2>
                <p>Informe os dados do fornecedor.</p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Fechar"
              >
                <FaTimes />
              </button>
            </div>

            <div className="field">
              <label htmlFor="supplier-name">Nome *</label>
              <input
                id="supplier-name"
                name="name"
                type="text"
                className="field"
                maxLength={150}
                value={form.name}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
                required
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="supplier-phone">Telefone</label>
                <input
                  id="supplier-phone"
                  name="phone"
                  type="text"
                  maxLength={30}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="field">
                <label htmlFor="supplier-email">E-mail</label>
                <input
                  id="supplier-email"
                  name="email"
                  type="email"
                  maxLength={150}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="fornecedor@email.com"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="supplier-document">
                CPF/CNPJ ou documento
              </label>
              <input
                id="supplier-document"
                name="document"
                type="text"
                maxLength={30}
                value={form.document}
                onChange={handleChange}
                placeholder="Documento do fornecedor"
              />
            </div>

            <div className="field">
              <label htmlFor="supplier-notes">Observações</label>
              <textarea
                id="supplier-notes"
                name="notes"
                rows={4}
                maxLength={500}
                value={form.notes}
                onChange={handleChange}
                placeholder="Informações adicionais"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={closeForm}
                disabled={saving}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="button button-primary"
                disabled={saving}
              >
                <FaSave />
                {saving ? 'Salvando...' : 'Salvar fornecedor'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
