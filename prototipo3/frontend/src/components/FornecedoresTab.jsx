import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function FornecedoresTab({ showToast }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedForn, setSelectedForn] = useState(null);

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
      const data = await apiRequest('/fornecedores');
      setFornecedores(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFornecedores();
  }, []);

  const openNovo = () => {
    setSelectedForn(null);
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
    setForm({ ...f });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedForn) {
        await apiRequest(`/fornecedores/${selectedForn.id_fornecedor}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Fornecedor atualizado com sucesso!');
      } else {
        await apiRequest('/fornecedores', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Fornecedor cadastrado com sucesso!');
      }
      setShowModal(false);
      loadFornecedores();
    } catch (err) {
      showToast(err.message, 'error');
    }
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
                  value={form.nome_juridico}
                  onChange={e => setForm({ ...form, nome_juridico: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">CNPJ:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  value={form.cnpj}
                  onChange={e => setForm({ ...form, cnpj: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Produtos Fornecidos:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  value={form.produtos}
                  onChange={e => setForm({ ...form, produtos: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Telefone:</label>
                  <input
                    type="text"
                    className="input-dorfic w-full"
                    value={form.telefone}
                    onChange={e => setForm({ ...form, telefone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">E-mail:</label>
                  <input
                    type="email"
                    className="input-dorfic w-full"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
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
