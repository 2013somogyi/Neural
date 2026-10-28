import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';

export function ClientesTab({ showToast }) {
  const [clientes, setClientes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('nome');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistModal, setShowHistModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteHistData, setClienteHistData] = useState(null);

  const [clienteForm, setClienteForm] = useState({
    nome_completo: '',
    cpf_cnpj: '',
    rg: '',
    telefone: '',
    email: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    ponto_referencia: '',
    detalhes_geral: ''
  });

  const loadClientes = async (term = '') => {
    try {
      setLoading(true);
      let url = '/clientes';
      if (term) {
        url += `?tipo=${filtroTipo}&busca=${encodeURIComponent(term)}`;
      }
      const data = await apiRequest(url);
      setClientes(data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadClientes(busca);
  };

  const resetSearch = () => {
    setBusca('');
    loadClientes('');
  };

  const handleSaveNovo = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/clientes', {
        method: 'POST',
        body: JSON.stringify(clienteForm)
      });
      showToast('Cliente cadastrado com sucesso!');
      setShowNovoModal(false);
      resetNovoForm();
      loadClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const resetNovoForm = () => {
    setClienteForm({
      nome_completo: '',
      cpf_cnpj: '',
      rg: '',
      telefone: '',
      email: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      ponto_referencia: '',
      detalhes_geral: ''
    });
  };

  const openEdicao = (c) => {
    setSelectedCliente(c);
    setClienteForm({ ...c });
    setShowEditModal(true);
  };

  const handleSaveEdicao = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/clientes/${selectedCliente.id_cliente}`, {
        method: 'PUT',
        body: JSON.stringify(clienteForm)
      });
      showToast('Cliente atualizado com sucesso!');
      setShowEditModal(false);
      loadClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const openHistorico = async (c) => {
    try {
      const data = await apiRequest(`/clientes/${c.id_cliente}`);
      setClienteHistData(data);
      setShowHistModal(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = () => {
    setShowEditModal(false);
    setShowDeleteModal(true);
  };

  const handleExecuteDelete = async () => {
    try {
      await apiRequest(`/clientes/${selectedCliente.id_cliente}`, {
        method: 'DELETE'
      });
      showToast('Cliente inativado com sucesso!', 'error');
      setShowDeleteModal(false);
      loadClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-orange-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-orange-600 uppercase tracking-wide">CLIENTE</h2>
          <button onClick={() => { resetNovoForm(); setShowNovoModal(true); }} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Novo Cliente
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filtroTipo}
            onChange={e => setFiltroTipo(e.target.value)}
            className="input-dorfic text-xs py-2"
          >
            <option value="nome">Nome</option>
            <option value="codigo">Código</option>
            <option value="telefone">Telefone</option>
          </select>
          <input
            type="text"
            placeholder="Pesquisar..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="input-dorfic text-xs py-2 w-full md:w-48"
          />
          <button type="submit" className="btn-dorfic text-xs px-3 py-2">
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
          <button type="button" onClick={resetSearch} className="btn-dorfic-secondary text-xs px-3 py-2">
            Resetar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-orange-50 text-orange-900 font-extrabold uppercase border-b border-orange-200">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nome / Nome Completo</th>
                <th className="p-3">CPF/CNPJ</th>
                <th className="p-3">Telefone</th>
                <th className="p-3">E-mail</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">Carregando clientes...</td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">Nenhum cliente encontrado.</td>
                </tr>
              ) : (
                clientes.map(c => (
                  <tr key={c.id_cliente}>
                    <td className="p-3 font-mono font-bold text-orange-600">{c.codigo}</td>
                    <td className="p-3 font-bold text-slate-800">{c.nome_completo}</td>
                    <td className="p-3">{c.cpf_cnpj}</td>
                    <td className="p-3">{c.telefone}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3 text-center space-x-2">
                      <button
                        onClick={() => openHistorico(c)}
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition"
                        title="Histórico"
                      >
                        <i className="fa-solid fa-clock-rotate-left"></i>
                      </button>
                      <button
                        onClick={() => openEdicao(c)}
                        className="text-orange-500 hover:text-orange-700 bg-orange-50 p-2 rounded-lg transition"
                        title="Editar"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="bg-orange-100 border border-orange-200 rounded-xl p-3 flex justify-between items-center text-xs font-black text-orange-900">
        <span>CLIENTES: {String(clientes.length).padStart(3, '0')}</span>
        <span>GARANTIAS VÁLIDAS: 014</span>
      </div>

      {/* MODAL NOVO CLIENTE */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-user-plus text-orange-500"></i> ADICIONAR NOVO CLIENTE
              </h3>
              <button onClick={() => setShowNovoModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSaveNovo} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código:</label>
                <input type="text" className="input-dorfic w-full bg-slate-100" readOnly value="Auto" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="Ex: Carl Johnson"
                  value={clienteForm.nome_completo}
                  onChange={e => setClienteForm({ ...clienteForm, nome_completo: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF/CNPJ:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="678.326.510-58"
                  value={clienteForm.cpf_cnpj}
                  onChange={e => setClienteForm({ ...clienteForm, cpf_cnpj: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">RG:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="767426594"
                  value={clienteForm.rg}
                  onChange={e => setClienteForm({ ...clienteForm, rg: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="40028922"
                  value={clienteForm.telefone}
                  onChange={e => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail:*</label>
                <input
                  type="email"
                  className="input-dorfic w-full"
                  required
                  placeholder="carljohnson@gmail.com"
                  value={clienteForm.email}
                  onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Logradouro:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Rua sem saída"
                  value={clienteForm.logradouro}
                  onChange={e => setClienteForm({ ...clienteForm, logradouro: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Número:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="476"
                  value={clienteForm.numero}
                  onChange={e => setClienteForm({ ...clienteForm, numero: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Complemento:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Casa"
                  value={clienteForm.complemento}
                  onChange={e => setClienteForm({ ...clienteForm, complemento: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Ganton"
                  value={clienteForm.bairro}
                  onChange={e => setClienteForm({ ...clienteForm, bairro: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Los Santos"
                  value={clienteForm.cidade}
                  onChange={e => setClienteForm({ ...clienteForm, cidade: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado (UF):</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="San Andreas"
                  value={clienteForm.uf}
                  onChange={e => setClienteForm({ ...clienteForm, uf: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CEP:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="00000-000"
                  value={clienteForm.cep}
                  onChange={e => setClienteForm({ ...clienteForm, cep: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ponto de Referência:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Após a ponte"
                  value={clienteForm.ponto_referencia}
                  onChange={e => setClienteForm({ ...clienteForm, ponto_referencia: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Detalhes Geral:</label>
                <textarea
                  className="input-dorfic w-full h-16"
                  placeholder="Mora no meio do gueto"
                  value={clienteForm.detalhes_geral}
                  onChange={e => setClienteForm({ ...clienteForm, detalhes_geral: e.target.value })}
                ></textarea>
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-orange-100">
                <button type="button" onClick={() => setShowNovoModal(false)} className="btn-dorfic-secondary px-6 py-2">
                  Cancelar
                </button>
                <button type="submit" className="btn-dorfic px-8 py-2">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <i className="fa-solid fa-user-pen text-orange-500"></i> EDIÇÃO DE CLIENTE
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <form onSubmit={handleSaveEdicao} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código:</label>
                <input type="text" className="input-dorfic w-full bg-slate-100" readOnly value={clienteForm.codigo || ''} />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome Completo:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.nome_completo}
                  onChange={e => setClienteForm({ ...clienteForm, nome_completo: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">CPF/CNPJ:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.cpf_cnpj}
                  onChange={e => setClienteForm({ ...clienteForm, cpf_cnpj: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">RG:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  value={clienteForm.rg || ''}
                  onChange={e => setClienteForm({ ...clienteForm, rg: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Telefone:*</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.telefone}
                  onChange={e => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">E-mail:*</label>
                <input
                  type="email"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.email}
                  onChange={e => setClienteForm({ ...clienteForm, email: e.target.value })}
                />
              </div>

              <div className="md:col-span-2 pt-4 flex justify-between gap-3 border-t border-orange-100">
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow"
                >
                  Deletar
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

      {/* MODAL DELETAR CLIENTE */}
      {showDeleteModal && selectedCliente && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-md p-6 text-center relative border-2 border-red-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-black">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">DELETAR CLIENTE</h3>
            <p className="text-xs text-slate-600 mb-4">Certeza que deseja deletar o cliente:</p>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-800 mb-6">
              {selectedCliente.codigo} | {selectedCliente.nome_completo} | {selectedCliente.telefone}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowDeleteModal(false)} className="btn-dorfic-secondary px-6 py-2 text-xs">
                Voltar
              </button>
              <button onClick={handleExecuteDelete} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow">
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO CLIENTE */}
      {showHistModal && clienteHistData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dorfic-card w-full max-w-2xl p-6 relative">
            <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
              <h3 className="text-lg font-black text-slate-900 uppercase">HISTÓRICO DO CLIENTE</h3>
              <button onClick={() => setShowHistModal(false)} className="text-slate-400 hover:text-red-500 font-bold text-xl">X</button>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-xs space-y-1 mb-4">
              <div><strong>Nome:</strong> {clienteHistData.nome_completo}</div>
              <div><strong>Código:</strong> {clienteHistData.codigo}</div>
              <div><strong>Telefone:</strong> {clienteHistData.telefone}</div>
              <div><strong>E-mail:</strong> {clienteHistData.email}</div>
            </div>

            <h4 className="font-bold text-slate-800 text-sm mb-2">Ordens de Serviço Relacionadas:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(!clienteHistData.os || clienteHistData.os.length === 0) ? (
                <p className="text-xs text-slate-500 italic">Nenhuma OS encontrada para este cliente.</p>
              ) : (
                clienteHistData.os.map(os => (
                  <div key={os.id_os} className="border border-orange-200 rounded-lg overflow-hidden text-xs">
                    <div className="bg-orange-50 p-2 border-b border-orange-200 flex justify-between font-bold">
                      <span>OS: 000{os.numero_os} | {os.data_abertura}</span>
                      <span className="text-orange-600">{os.status}</span>
                    </div>
                    <div className="p-2 bg-white">
                      <p><strong>Equip:</strong> {os.marca} {os.modelo}</p>
                      <p><strong>Problema:</strong> {os.relato_problema}</p>
                      <p className="mt-1 font-bold">Valor: R$ {(os.valor_liquido || 0).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 text-right">
              <button onClick={() => setShowHistModal(false)} className="btn-dorfic-secondary px-6 py-2 text-xs">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
