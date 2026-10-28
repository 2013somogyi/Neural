import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function TecnicosTab({ showToast }) {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTec, setSelectedTec] = useState(null);

  const [form, setForm] = useState({
    nome: '',
    login: '',
    cpf: '',
    cargo: 'Técnico Hardware',
    salario_fixo: 0,
    senha: ''
  });

  const loadTecnicos = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/tecnicos');
      setTecnicos(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTecnicos();
  }, []);

  const openNovo = () => {
    setSelectedTec(null);
    setForm({
      nome: '',
      login: '',
      cpf: '',
      cargo: 'Técnico Hardware',
      salario_fixo: 0,
      senha: ''
    });
    setShowModal(true);
  };

  const openEdicao = (t) => {
    setSelectedTec(t);
    setForm({
      nome: t.nome,
      login: t.login,
      cpf: t.cpf || '',
      cargo: t.cargo || '',
      salario_fixo: t.salario_fixo || 0,
      senha: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedTec) {
        await apiRequest(`/tecnicos/${selectedTec.id_tecnico}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Técnico atualizado com sucesso!');
      } else {
        await apiRequest('/tecnicos', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Técnico cadastrado com sucesso!');
      }
      setShowModal(false);
      loadTecnicos();
    } catch (err) {
      showToast(err.message, 'error');
    }
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
                  <td className="p-3">R$ {(t.salario_fixo || 0).toFixed(2)}</td>
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
                  value={form.login}
                  onChange={e => setForm({ ...form, login: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  value={form.cpf}
                  onChange={e => setForm({ ...form, cpf: e.target.value })}
                />
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
                  <label className="block font-bold text-slate-700 mb-1">Salário Fixo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-dorfic w-full"
                    value={form.salario_fixo}
                    onChange={e => setForm({ ...form, salario_fixo: e.target.value })}
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
