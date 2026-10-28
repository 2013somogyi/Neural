import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function EstoqueTab({ showToast }) {
  const [pecas, setPecas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeca, setSelectedPeca] = useState(null);

  const [form, setForm] = useState({
    nome_peca: '',
    categoria: '',
    preco_custo_atual: 0,
    preco_venda: 0,
    quantidade_estoque: 0
  });

  const loadPecas = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/pecas');
      setPecas(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPecas();
  }, []);

  const openNovo = () => {
    setSelectedPeca(null);
    setForm({
      nome_peca: '',
      categoria: '',
      preco_custo_atual: 0,
      preco_venda: 0,
      quantidade_estoque: 0
    });
    setShowModal(true);
  };

  const openEdicao = (p) => {
    setSelectedPeca(p);
    setForm({ ...p });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selectedPeca) {
        await apiRequest(`/pecas/${selectedPeca.id_peca}`, {
          method: 'PUT',
          body: JSON.stringify(form)
        });
        showToast('Peça atualizada com sucesso!');
      } else {
        await apiRequest('/pecas', {
          method: 'POST',
          body: JSON.stringify(form)
        });
        showToast('Peça cadastrada com sucesso!');
      }
      setShowModal(false);
      loadPecas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Certeza que deseja remover esta peça?')) return;
    try {
      await apiRequest(`/pecas/${selectedPeca.id_peca}`, { method: 'DELETE' });
      showToast('Peça removida.', 'error');
      setShowModal(false);
      loadPecas();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-black text-orange-600 uppercase">Estoque & Peças (PECA)</h2>
        <button onClick={openNovo} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
          <i className="fa-solid fa-box-archive"></i> Cadastrar Nova Peça
        </button>
      </div>

      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-orange-50 text-orange-900 font-extrabold uppercase border-b border-orange-200">
            <tr>
              <th className="p-3">ID Peça</th>
              <th className="p-3">Nome da Peça</th>
              <th className="p-3">Categoria</th>
              <th className="p-3">Custo Atual</th>
              <th className="p-3">Preço Venda</th>
              <th className="p-3">Estoque</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-slate-500">Carregando peças...</td>
              </tr>
            ) : pecas.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center text-slate-500">Nenhuma peça cadastrada.</td>
              </tr>
            ) : (
              pecas.map(p => (
                <tr key={p.id_peca}>
                  <td className="p-3 font-mono text-slate-500">{p.id_peca}</td>
                  <td className="p-3 font-bold text-slate-800">{p.nome_peca}</td>
                  <td className="p-3">{p.categoria}</td>
                  <td className="p-3 text-red-500">R$ {(p.preco_custo_atual || 0).toFixed(2)}</td>
                  <td className="p-3 text-emerald-600 font-bold">R$ {(p.preco_venda || 0).toFixed(2)}</td>
                  <td className="p-3 font-black text-lg">{p.quantidade_estoque}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => openEdicao(p)} className="text-slate-400 hover:text-orange-600">
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
                {selectedPeca ? 'EDITAR PEÇA' : 'CADASTRAR PEÇA'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome da Peça:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={form.nome_peca}
                  onChange={e => setForm({ ...form, nome_peca: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Categoria:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Custo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-dorfic w-full"
                    value={form.preco_custo_atual}
                    onChange={e => setForm({ ...form, preco_custo_atual: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-dorfic w-full"
                    value={form.preco_venda}
                    onChange={e => setForm({ ...form, preco_venda: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantidade em Estoque:</label>
                <input
                  type="number"
                  className="input-dorfic w-full"
                  value={form.quantidade_estoque}
                  onChange={e => setForm({ ...form, quantidade_estoque: e.target.value })}
                />
              </div>

              <div className="pt-4 flex justify-between gap-3 border-t border-orange-100">
                {selectedPeca ? (
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
