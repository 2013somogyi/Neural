import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { formatMoney } from '../utils/format';
import { formatCurrencyBRL, isValidBrazilianPhone, isValidEmail, maskBrazilianPhone, maskCurrencyBRL, parseCurrencyBRL } from '../utils/validation';

export function TecnicosTab({ showToast }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTec, setSelectedTec] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const [form, setForm] = useState({
    nome: '',
    login: '',
    email: '',
    telefone: '',
    cargo: '',
    salario_fixo: '',
    senha: ''
  });

  const loadTecnicos = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await apiRequest('/tecnicos');
      setTecnicos(data);
    } catch (err) {
      setLoadError(err.message || 'Não foi possível carregar a equipe.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTecnicos();
  }, []);

  const openNovo = () => {
    setSelectedTec(null);
    setFormErrors({});
    setForm({
      nome: '',
      login: '',
      email: '',
      telefone: '',
      cargo: '',
      salario_fixo: '',
      senha: ''
    });
    setShowModal(true);
  };

  const openEdicao = (t) => {
    setSelectedTec(t);
    setFormErrors({});
    setForm({
      nome: t.nome,
      login: t.login,
      email: t.email || '',
      telefone: t.telefone || '',
      cargo: t.cargo || '',
      salario_fixo: t.salario_fixo === null || t.salario_fixo === undefined ? '' : formatCurrencyBRL(t.salario_fixo),
      senha: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!isValidEmail(form.email)) errors.email = 'Informe um e-mail válido.';
    if (form.telefone && !isValidBrazilianPhone(form.telefone)) errors.telefone = 'Informe um telefone com DDD válido.';
    setFormErrors(errors);
    if (Object.keys(errors).length) return;
    try {
      const payload = {
        ...form,
        salario_fixo: form.salario_fixo ? parseCurrencyBRL(form.salario_fixo) : null
      };
      if (selectedTec && !payload.senha) delete payload.senha;
      if (selectedTec) {
        await apiRequest(`/tecnicos/${selectedTec.id_tecnico}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Técnico atualizado com sucesso!');
      } else {
        await apiRequest('/tecnicos', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Técnico cadastrado com sucesso!');
      }
      setShowModal(false);
      loadTecnicos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const updateFormField = (field, value) => {
    const maskedValue = field === 'telefone'
      ? maskBrazilianPhone(value)
      : field === 'salario_fixo'
        ? maskCurrencyBRL(value)
        : value;
    setForm(prev => ({ ...prev, [field]: maskedValue }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDelete = async () => {
    if (!window.confirm('Certeza que deseja inativar este técnico?')) return;
    try {
      await apiRequest(`/tecnicos/${selectedTec.id_tecnico}`, { method: 'DELETE' });
      showToast('Técnico inativado com sucesso.', 'error');
      setShowModal(false);
      loadTecnicos();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-black text-orange-600 uppercase">Técnicos / Usuários (TECNICO)</h2>
        <button onClick={openNovo} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
          <i className="fa-solid fa-user-plus"></i> Novo Técnico
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
        {loadError && (
          <div role="alert" className="flex items-center justify-between gap-4 bg-red-50 px-4 py-3 text-sm text-red-800">
            <span>{loadError}</span>
            <button type="button" onClick={loadTecnicos} className="btn-dorfic-secondary shrink-0 px-3 py-2">
              Tentar novamente
            </button>
          </div>
        )}
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-orange-50 text-orange-900 font-extrabold uppercase border-b border-orange-200">
            <tr>
              <th className="p-3">ID Técnico</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Login</th>
              <th className="p-3">Cargo</th>
              <th className="p-3">Salário Fixo</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">Carregando técnicos...</td>
              </tr>
            ) : loadError ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-red-700">Não foi possível carregar os técnicos.</td>
              </tr>
            ) : tecnicos.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-4 text-center text-slate-500">Nenhum técnico cadastrado.</td>
              </tr>
            ) : (
              tecnicos.map(t => (
                <tr key={t.id_tecnico}>
                  <td className="p-3 font-mono text-slate-500">{t.id_tecnico}</td>
                  <td className="p-3 font-bold text-slate-800">{t.nome}</td>
                  <td className="p-3 text-orange-600 font-mono text-xs">{t.login}</td>
                  <td className="p-3">{t.cargo}</td>
                  <td className="sensitive-value p-3">R$ {formatMoney(t.salario_fixo)}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdicao(t)} className="text-slate-400 hover:text-orange-600">
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
                {selectedTec ? 'EDITAR TÉCNICO' : 'CADASTRAR TÉCNICO'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  autoComplete="name"
                  placeholder="Digite o nome completo"
                  value={form.nome}
                  onChange={e => setForm({ ...form, nome: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Login:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  autoComplete="username"
                  placeholder="Digite o login"
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="tecnico-email" className="block font-bold text-slate-700 mb-1">E-mail:*</label>
                <input
                  id="tecnico-email"
                  type="text"
                  inputMode="email"
                  className="input-dorfic w-full"
                  required
                  autoComplete="email"
                  value={form.email}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? 'tecnico-email-error' : undefined}
                  onInput={e => updateFormField('email', e.currentTarget.value)}
                />
                {formErrors.email && <p className="field-error" id="tecnico-email-error">{formErrors.email}</p>}
              </div>

              <div>
                <label htmlFor="tecnico-telefone" className="block font-bold text-slate-700 mb-1">Telefone:</label>
                <input
                  id="tecnico-telefone"
                  type="text"
                  className="input-dorfic w-full"
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  aria-invalid={Boolean(formErrors.telefone)}
                  aria-describedby={formErrors.telefone ? 'tecnico-telefone-error' : undefined}
                  onInput={e => updateFormField('telefone', e.currentTarget.value)}
                />
                {formErrors.telefone && <p className="field-error" id="tecnico-telefone-error">{formErrors.telefone}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo:</label>
                  <input
                    type="text"
                    className="input-dorfic w-full"
                    value={form.cargo}
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tecnico-salario" className="block font-bold text-slate-700 mb-1">Salário Fixo (R$):</label>
                  <input
                    id="tecnico-salario"
                    type="text"
                    inputMode="decimal"
                    className="input-dorfic w-full"
                    value={form.salario_fixo}
                    aria-label="Salário fixo em reais"
                    onInput={e => updateFormField('salario_fixo', e.currentTarget.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Senha: {selectedTec ? '(deixe em branco para manter)' : '*'}
                </label>
                <input
                  type="password"
                  className="input-dorfic w-full"
                  required={!selectedTec}
                  autoComplete={selectedTec ? 'new-password' : 'new-password'}
                  minLength={8}
                  placeholder={selectedTec ? 'Deixe em branco para manter' : 'Mínimo de 8 caracteres'}
                  value={form.senha}
                  onChange={e => setForm({ ...form, senha: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-orange-100">
                {selectedTec ? (
                  <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl">
                    Inativar
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
