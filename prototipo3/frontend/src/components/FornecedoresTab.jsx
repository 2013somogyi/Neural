import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { isValidCNPJ, isValidBrazilianPhone, isValidEmail, maskBrazilianDocument, maskBrazilianPhone } from '../utils/validation';

export function FornecedoresTab({ showToast }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedForn, setSelectedForn] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    nome_juridico: '',
    cnpj: '',
    produtos: '',
    telefone: '',
    email: ''
  });

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await apiRequest('/fornecedores');
      setFornecedores(data);
    } catch (err) {
      setLoadError(err.message || 'Não foi possível carregar os fornecedores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  const openNovo = () => {
    setSelectedForn(null);
    setFormErrors({});
    setForm({
      nome_juridico: '',
      cnpj: '',
      produtos: '',
      telefone: '',
      email: ''
    });
    setShowModal(true);
  };

  const openEdicao = (f) => {
    setSelectedForn(f);
    setFormErrors({});
    setForm({ ...f, cnpj: maskBrazilianDocument(f.cnpj || ''), telefone: maskBrazilianPhone(f.telefone || '') });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!isValidCNPJ(form.cnpj)) errors.cnpj = 'Informe um CNPJ válido.';
    if (form.telefone && !isValidBrazilianPhone(form.telefone)) errors.telefone = 'Informe um telefone com DDD válido.';
    if (form.email && !isValidEmail(form.email)) errors.email = 'Informe um e-mail válido.';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const payload = {
        nome_juridico: form.nome_juridico,
        cnpj: form.cnpj,
        produtos: form.produtos,
        telefone: form.telefone,
        email: form.email
      };

      if (selectedForn) {
        await apiRequest(`/fornecedores/${selectedForn.id_fornecedor}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Fornecedor atualizado com sucesso!');
      } else {
        await apiRequest('/fornecedores', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Fornecedor cadastrado com sucesso!');
      }
      setShowModal(false);
      loadFornecedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateFormField = (field, value) => {
    const maskedValue = field === 'cnpj'
      ? maskBrazilianDocument(value)
      : field === 'telefone'
        ? maskBrazilianPhone(value)
        : value;
    setForm(prev => ({ ...prev, [field]: maskedValue }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Certeza que deseja remover este fornecedor?')) return;
    try {
      await apiRequest(`/fornecedores/${selectedForn.id_fornecedor}`, { method: 'DELETE' });
      showToast('Fornecedor removido.', 'error');
      setShowModal(false);
      loadFornecedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-black text-orange-600 uppercase">Fornecedores</h2>
        <button onClick={openNovo} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
          <i className="fa-solid fa-truck-ramp-box"></i> Novo Fornecedor
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-orange-50 text-orange-900 font-extrabold uppercase border-b border-orange-200">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Nome Jurídico</th>
              <th className="p-3">CNPJ</th>
              <th className="p-3">Produtos Fornecidos</th>
              <th className="p-3">Contato</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">Carregando fornecedores...</td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-red-700">
                  <span>{loadError}</span>
                  <button type="button" onClick={loadFornecedores} className="ml-3 font-bold underline">Tentar novamente</button>
                </td>
              </tr>
            ) : fornecedores.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">Nenhum fornecedor cadastrado.</td>
              </tr>
            ) : (
              fornecedores.map(f => (
                <tr key={f.id_fornecedor}>
                  <td className="p-3 font-mono text-slate-500">{f.id_fornecedor}</td>
                  <td className="p-3 font-bold text-slate-800">{f.nome_juridico}</td>
                  <td className="p-3">{f.cnpj}</td>
                  <td className="p-3 text-xs truncate max-w-[150px]">{f.produtos}</td>
                  <td className="p-3">{f.telefone}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdicao(f)} className="text-slate-400 hover:text-orange-600">
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-lg p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">
                {selectedForn ? 'EDITAR FORNECEDOR' : 'CADASTRAR FORNECEDOR'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Jurídico:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  autoComplete="organization"
                  placeholder="Digite o nome jurídico"
                  value={form.nome_juridico}
                  onChange={e => setForm({ ...form, nome_juridico: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="fornecedor-cnpj" className="block font-bold text-slate-700 mb-1">CNPJ:*</label>
                <input
                  id="fornecedor-cnpj"
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="Digite o CNPJ"
                  value={form.cnpj}
                  aria-invalid={Boolean(formErrors.cnpj)}
                  aria-describedby={formErrors.cnpj ? 'fornecedor-cnpj-error' : undefined}
                  onInput={e => updateFormField('cnpj', e.currentTarget.value)}
                />
                {formErrors.cnpj && <p className="field-error" id="fornecedor-cnpj-error">{formErrors.cnpj}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Produtos Fornecidos:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  autoComplete="tel"
                  placeholder="Telefone (opcional)"
                  value={form.produtos}
                  onChange={e => setForm({ ...form, produtos: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fornecedor-telefone" className="block font-bold text-slate-700 mb-1">Telefone:</label>
                  <input
                    id="fornecedor-telefone"
                    type="text"
                    className="input-dorfic w-full"
                    value={form.telefone}
                    placeholder="(00) 00000-0000"
                    aria-invalid={Boolean(formErrors.telefone)}
                    aria-describedby={formErrors.telefone ? 'fornecedor-telefone-error' : undefined}
                    onInput={e => updateFormField('telefone', e.currentTarget.value)}
                  />
                  {formErrors.telefone && <p className="field-error" id="fornecedor-telefone-error">{formErrors.telefone}</p>}
                </div>
                <div>
                  <label htmlFor="fornecedor-email" className="block font-bold text-slate-700 mb-1">E-mail:</label>
                  <input
                    id="fornecedor-email"
                    type="text"
                    inputMode="email"
                    className="input-dorfic w-full"
                    autoComplete="email"
                    placeholder="E-mail (opcional)"
                    value={form.email}
                    aria-invalid={Boolean(formErrors.email)}
                    aria-describedby={formErrors.email ? 'fornecedor-email-error' : undefined}
                    onInput={e => updateFormField('email', e.currentTarget.value)}
                  />
                  {formErrors.email && <p className="field-error" id="fornecedor-email-error">{formErrors.email}</p>}
                </div>
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-orange-100">
                {selectedForn ? (
                  <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl">
                    Excluir
                  </button>
                ) : <div></div>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-dorfic-secondary px-6 py-2">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-dorfic px-8 py-2">
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
