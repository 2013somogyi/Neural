import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function OSTab({ showToast }) {
  const [osList, setOsList] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOS, setSelectedOS] = useState(null);

  const [osForm, setOsForm] = useState({
    id_cliente: '',
    tipo_documento: 'OS',
    prioridade: 'Média',
    equipamento_tipo: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    relato_problema: '',
    id_tecnico_responsavel: '',
    prazo_garantia_dias: 90,
    status: 'Aberta',
    valor_total: 0,
    valor_desconto: 0
  });

  const loadAuxiliaryData = async () => {
    try {
      const [cliData, tecData] = await Promise.all([
        apiRequest('/clientes'),
        apiRequest('/tecnicos')
      ]);
      setClientes(cliData);
      setTecnicos(tecData);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOS = async (statusFilter = filtroStatus, searchFilter = busca) => {
    try {
      setLoading(true);
      let url = '/os?';
      if (statusFilter) url += `status=${encodeURIComponent(statusFilter)}&`;
      if (searchFilter) url += `busca=${encodeURIComponent(searchFilter)}`;
      const data = await apiRequest(url);
      setOsList(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuxiliaryData();
    loadOS();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadOS(filtroStatus, busca);
  };

  const resetNovoForm = () => {
    setOsForm({
      id_cliente: clientes.length > 0 ? clientes[0].id_cliente : '',
      tipo_documento: 'OS',
      prioridade: 'Média',
      equipamento_tipo: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      relato_problema: '',
      id_tecnico_responsavel: '',
      prazo_garantia_dias: 90,
      status: 'Aberta',
      valor_total: 0,
      valor_desconto: 0
    });
  };

  const handleSaveNova = async (e) => {
    e.preventDefault();
    try {
      const newOS = await apiRequest('/os', {
        method: 'POST',
        body: JSON.stringify(osForm)
      });
      showToast(`Ordem de Serviço criada com sucesso! (Nº 000${newOS.numero_os})`);
      setShowNovaModal(false);
      loadOS();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openEdicao = (osItem) => {
    setSelectedOS(osItem);
    setOsForm({
      id_cliente: osItem.id_cliente,
      tipo_documento: osItem.tipo_documento || 'OS',
      prioridade: osItem.prioridade || 'Média',
      equipamento_tipo: osItem.equipamento_tipo || '',
      marca: osItem.marca || '',
      modelo: osItem.modelo || '',
      numero_serie: osItem.numero_serie || '',
      relato_problema: osItem.relato_problema || '',
      id_tecnico_responsavel: osItem.id_tecnico_responsavel || '',
      prazo_garantia_dias: osItem.prazo_garantia_dias || 90,
      status: osItem.status || 'Aberta',
      valor_total: osItem.valor_total || 0,
      valor_desconto: osItem.valor_desconto || 0
    });
    setShowEditModal(true);
  };

  const handleSaveEdicao = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/os/${selectedOS.id_os}`, {
        method: 'PUT',
        body: JSON.stringify(osForm)
      });
      showToast('Ordem de Serviço atualizada com sucesso!');
      setShowEditModal(false);
      loadOS();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteOS = async () => {
    if (!window.confirm('Certeza que deseja remover esta Ordem de Serviço?')) return;
    try {
      await apiRequest(`/os/${selectedOS.id_os}`, { method: 'DELETE' });
      showToast('Ordem de Serviço removida.', 'error');
      setShowEditModal(false);
      loadOS();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const calcLiquido = () => {
    const total = parseFloat(osForm.valor_total) || 0;
    const desc = parseFloat(osForm.valor_desconto) || 0;
    return Math.max(0, total - desc).toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-orange-600 uppercase tracking-wide">Ordem de Serviço (O.S)</h2>
          <button
            onClick={() => { resetNovoForm(); setShowNovaModal(true); }}
            className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2"
          >
            <i className="fa-solid fa-file-circle-plus"></i> Nova O.S.
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filtroStatus}
            onChange={e => { setFiltroStatus(e.target.value); loadOS(e.target.value, busca); }}
            className="input-dorfic text-xs py-2"
          >
            <option value="">Todos os Status</option>
            <option value="Aberta">Aberta</option>
            <option value="Aguardando Peça">Aguardando Peça</option>
            <option value="Em Execução">Em Execução</option>
            <option value="Concluída">Concluída</option>
            <option value="Cancelada">Cancelada</option>
          </select>

          <input
            type="text"
            placeholder="Buscar por Cliente ou Equipamento..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-dorfic text-xs py-2 w-full md:w-48"
          />

          <button type="submit" className="btn-dorfic text-xs px-3 py-2">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-orange-50 text-orange-900 font-extrabold uppercase border-b border-orange-200">
              <tr>
                <th className="p-3">Nº OS</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Equipamento</th>
                <th className="p-3">Status</th>
                <th className="p-3">Valor Líquido</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">Carregando Ordens de Serviço...</td>
                </tr>
              ) : osList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">Nenhuma Ordem de Serviço encontrada.</td>
                </tr>
              ) : (
                osList.map(o => {
                  let statusBadge = 'bg-slate-100 text-slate-700';
                  if (o.status === 'Em Execução') statusBadge = 'bg-blue-100 text-blue-700 border border-blue-200';
                  if (o.status === 'Concluída') statusBadge = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                  if (o.status === 'Aguardando Peça') statusBadge = 'bg-orange-100 text-orange-700 border border-orange-200';
                  if (o.status === 'Cancelada') statusBadge = 'bg-red-100 text-red-700 border border-red-200';

                  return (
                    <tr key={o.id_os}>
                      <td className="p-3 font-mono font-bold text-slate-800">000{o.numero_os}</td>
                      <td className="p-3">{o.tipo_documento}</td>
                      <td className="p-3 font-bold">{o.cliente ? o.cliente.nome_completo : 'N/A'}</td>
                      <td className="p-3">{o.marca} {o.modelo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusBadge}`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold">R$ {(o.valor_liquido || 0).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => openEdicao(o)}
                          className="btn-dorfic text-[10px] px-3 py-1 uppercase tracking-wider"
                        >
                          Abrir / Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL NOVA OS */}
      {showNovaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">ABRIR NOVA ORDEM DE SERVIÇO</h3>
              <button onClick={() => setShowNovaModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSaveNova} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cliente:*</label>
                <select
                  className="input-dorfic w-full"
                  required
                  value={osForm.id_cliente}
                  onChange={e => setOsForm({ ...osForm, id_cliente: e.target.value })}
                >
                  <option value="">Selecione um cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.codigo} - {c.nome_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo Documento:*</label>
                <select
                  className="input-dorfic w-full"
                  required
                  value={osForm.tipo_documento}
                  onChange={e => setOsForm({ ...osForm, tipo_documento: e.target.value })}
                >
                  <option value="Orçamento">Orçamento</option>
                  <option value="OS">OS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Equipamento Tipo:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Ex: Notebook / Celular"
                  required
                  value={osForm.equipamento_tipo}
                  onChange={e => setOsForm({ ...osForm, equipamento_tipo: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Marca / Modelo:*</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input-dorfic w-1/2"
                    placeholder="Marca"
                    required
                    value={osForm.marca}
                    onChange={e => setOsForm({ ...osForm, marca: e.target.value })}
                  />
                  <input
                    type="text"
                    className="input-dorfic w-1/2"
                    placeholder="Modelo"
                    required
                    value={osForm.modelo}
                    onChange={e => setOsForm({ ...osForm, modelo: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Número de Série:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="SN123456"
                  value={osForm.numero_serie}
                  onChange={e => setOsForm({ ...osForm, numero_serie: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioridade:*</label>
                <select
                  className="input-dorfic w-full"
                  required
                  value={osForm.prioridade}
                  onChange={e => setOsForm({ ...osForm, prioridade: e.target.value })}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Técnico Responsável:</label>
                <select
                  className="input-dorfic w-full"
                  value={osForm.id_tecnico_responsavel}
                  onChange={e => setOsForm({ ...osForm, id_tecnico_responsavel: e.target.value })}
                >
                  <option value="">Sem técnico atribuído</option>
                  {tecnicos.map(t => (
                    <option key={t.id_tecnico} value={t.id_tecnico}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prazo Garantia (Dias):</label>
                <input
                  type="number"
                  className="input-dorfic w-full"
                  value={osForm.prazo_garantia_dias}
                  onChange={e => setOsForm({ ...osForm, prazo_garantia_dias: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Relato do Problema:*</label>
                <textarea
                  className="input-dorfic w-full h-16"
                  required
                  placeholder="Aparelho não liga após queda..."
                  value={osForm.relato_problema}
                  onChange={e => setOsForm({ ...osForm, relato_problema: e.target.value })}
                ></textarea>
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-orange-100">
                <button type="button" onClick={() => setShowNovaModal(false)} className="btn-dorfic-secondary px-6 py-2">
                  Cancelar
                </button>
                <button type="submit" className="btn-dorfic px-8 py-2">
                  Gerar OS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR OS */}
      {showEditModal && selectedOS && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900">EDITAR ORDEM DE SERVIÇO (Nº 000{selectedOS.numero_os})</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSaveEdicao} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status:</label>
                <select
                  className="input-dorfic w-full"
                  value={osForm.status}
                  onChange={e => setOsForm({ ...osForm, status: e.target.value })}
                >
                  <option value="Aberta">Aberta</option>
                  <option value="Aguardando Peça">Aguardando Peça</option>
                  <option value="Em Execução">Em Execução</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo Documento:</label>
                <select
                  className="input-dorfic w-full"
                  value={osForm.tipo_documento}
                  onChange={e => setOsForm({ ...osForm, tipo_documento: e.target.value })}
                >
                  <option value="Orçamento">Orçamento</option>
                  <option value="OS">OS</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Prioridade:</label>
                <select
                  className="input-dorfic w-full"
                  value={osForm.prioridade}
                  onChange={e => setOsForm({ ...osForm, prioridade: e.target.value })}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Técnico Responsável:</label>
                <select
                  className="input-dorfic w-full"
                  value={osForm.id_tecnico_responsavel}
                  onChange={e => setOsForm({ ...osForm, id_tecnico_responsavel: e.target.value })}
                >
                  <option value="">Sem técnico atribuído</option>
                  {tecnicos.map(t => (
                    <option key={t.id_tecnico} value={t.id_tecnico}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valor Total (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-dorfic w-full"
                  value={osForm.valor_total}
                  onChange={e => setOsForm({ ...osForm, valor_total: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Desconto (R$):</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-dorfic w-full"
                  value={osForm.valor_desconto}
                  onChange={e => setOsForm({ ...osForm, valor_desconto: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 bg-orange-50 p-3 rounded-xl font-bold text-orange-900 flex justify-between items-center">
                <span>Valor Líquido Final:</span>
                <span className="text-lg">R$ {calcLiquido()}</span>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Relato do Problema:*</label>
                <textarea
                  className="input-dorfic w-full h-16"
                  required
                  value={osForm.relato_problema}
                  onChange={e => setOsForm({ ...osForm, relato_problema: e.target.value })}
                ></textarea>
              </div>

              <div className="md:col-span-2 pt-4 flex justify-between gap-3 border-t border-orange-100">
                <button
                  type="button"
                  onClick={handleDeleteOS}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow"
                >
                  Excluir
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowEditModal(false)} className="btn-dorfic-secondary px-6 py-2">
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
