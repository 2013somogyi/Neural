import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client';
import { formatMoney } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { isValidBrazilianDocument, isValidBrazilianPhone, isValidEmail, maskBrazilianDocument, maskBrazilianPhone } from '../utils/validation';

const clientFields = [
  'nome_completo', 'cpf_cnpj', 'rg', 'telefone', 'email', 'logradouro',
  'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'ponto_referencia'
];

export function ClientesTab({ showToast }) {
  const { user } = useAuth();
  const canEdit = ['Admin', 'Tecnico'].includes(user?.perfil);
  const canDelete = user?.perfil === 'Admin';
  const [clientes, setClientes] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('nome');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Modal states
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistModal, setShowHistModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedCliente, setSelectedCliente] = useState(null);
  const [clienteHistData, setClienteHistData] = useState(null);
  const [formErrors, setFormErrors] = useState({});

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
    ponto_referencia: ''
  });

  const loadClientes = async (term = '') => {
    try {
      setLoading(true);
      setLoadError('');
      let url = '/clientes';
      if (term) {
        url += `?tipo=${filtroTipo}&busca=${encodeURIComponent(term)}`;
      }
      const data = await apiRequest(url);
      setClientes(data);
    } catch (err) {
      setLoadError(err.message || 'Não foi possível carregar os clientes.');
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
    if (!validateCliente()) return;
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
    setFormErrors({});
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
      ponto_referencia: ''
    });
  };

  const openEdicao = (c) => {
    setSelectedCliente(c);
    setFormErrors({});
    setClienteForm({
      ...c,
      cpf_cnpj: maskBrazilianDocument(c.cpf_cnpj || ''),
      telefone: maskBrazilianPhone(c.telefone || '')
    });
    setShowEditModal(true);
  };

  const handleSaveEdicao = async (e) => {
    e.preventDefault();
    if (!validateCliente()) return;
    try {
      await apiRequest(`/clientes/${selectedCliente.id_cliente}`, {
        method: 'PUT',
        body: JSON.stringify(Object.fromEntries(
          clientFields.map(field => [field, clienteForm[field] || ''])
        ))
      });
      showToast('Cliente atualizado com sucesso!');
      setShowEditModal(false);
      loadClientes();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const validateCliente = () => {
    const errors = {};
    if (!isValidBrazilianDocument(clienteForm.cpf_cnpj)) errors.cpf_cnpj = 'Informe um CPF ou CNPJ válido.';
    if (!isValidBrazilianPhone(clienteForm.telefone)) errors.telefone = 'Informe um telefone com DDD válido.';
    if (clienteForm.email && !isValidEmail(clienteForm.email)) errors.email = 'Informe um e-mail válido.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateClientField = (field, value) => {
    const maskedValue = field === 'cpf_cnpj'
      ? maskBrazilianDocument(value)
      : field === 'telefone'
        ? maskBrazilianPhone(value)
        : value;
    setClienteForm(prev => ({ ...prev, [field]: maskedValue }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: '' }));
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
          {canEdit && <button onClick={() => { resetNovoForm(); setShowNovoModal(true); }} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-plus"></i> Novo Cliente
          </button>}
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
              ) : loadError ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-red-700">
                    <span>{loadError}</span>
                    <button type="button" onClick={() => loadClientes(busca)} className="ml-3 font-bold underline">
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">
                    {busca ? 'Nenhum cliente encontrado para esta busca.' : 'Nenhum cliente cadastrado.'}
                    {canEdit && !busca && (
                      <button type="button" onClick={() => setShowNovoModal(true)} className="ml-2 font-bold text-orange-700 underline">
                        Cadastrar primeiro cliente
                      </button>
                    )}
                  </td>
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
                      {canEdit && <button
                          onClick={() => openEdicao(c)}
                          className="text-orange-500 hover:text-orange-700 bg-orange-50 p-2 rounded-lg transition"
                          title="Editar"
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>}
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
        <span>REGISTROS ATIVOS: {clientes.length}</span>
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
                  placeholder="Digite o nome completo"
                  autoComplete="name"
                  value={clienteForm.nome_completo}
                  onChange={e => setClienteForm({ ...clienteForm, nome_completo: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="cliente-cpf-cnpj" className="block font-bold text-slate-700 mb-1">CPF/CNPJ:*</label>
                <input
                  id="cliente-cpf-cnpj"
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="Digite CPF ou CNPJ"
                  autoComplete="off"
                  value={clienteForm.cpf_cnpj}
                  aria-invalid={Boolean(formErrors.cpf_cnpj)}
                  aria-describedby={formErrors.cpf_cnpj ? 'cliente-cpf-cnpj-error' : undefined}
                  onInput={e => updateClientField('cpf_cnpj', e.currentTarget.value)}
                />
                {formErrors.cpf_cnpj && <p className="field-error" id="cliente-cpf-cnpj-error">{formErrors.cpf_cnpj}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">RG:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Digite o RG (opcional)"
                  value={clienteForm.rg}
                  onChange={e => setClienteForm({ ...clienteForm, rg: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="cliente-telefone" className="block font-bold text-slate-700 mb-1">Telefone:*</label>
                <input
                  id="cliente-telefone"
                  type="text"
                  className="input-dorfic w-full"
                  required
                  placeholder="(00) 00000-0000"
                  autoComplete="tel"
                  value={clienteForm.telefone}
                  aria-invalid={Boolean(formErrors.telefone)}
                  aria-describedby={formErrors.telefone ? 'cliente-telefone-error' : undefined}
                  onInput={e => updateClientField('telefone', e.currentTarget.value)}
                />
                {formErrors.telefone && <p className="field-error" id="cliente-telefone-error">{formErrors.telefone}</p>}
              </div>
              <div>
                <label htmlFor="cliente-email" className="block font-bold text-slate-700 mb-1">E-mail:*</label>
                <input
                  id="cliente-email"
                  type="text"
                  inputMode="email"
                  className="input-dorfic w-full"
                  placeholder="Digite o e-mail (opcional)"
                  autoComplete="email"
                  value={clienteForm.email}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? 'cliente-email-error' : undefined}
                  onInput={e => updateClientField('email', e.currentTarget.value)}
                />
                {formErrors.email && <p className="field-error" id="cliente-email-error">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Logradouro:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Digite o logradouro"
                  autoComplete="address-line1"
                  value={clienteForm.logradouro}
                  onChange={e => setClienteForm({ ...clienteForm, logradouro: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Número:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Número"
                  value={clienteForm.numero}
                  onChange={e => setClienteForm({ ...clienteForm, numero: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Complemento:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Complemento (opcional)"
                  value={clienteForm.complemento}
                  onChange={e => setClienteForm({ ...clienteForm, complemento: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bairro:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Digite o bairro"
                  value={clienteForm.bairro}
                  onChange={e => setClienteForm({ ...clienteForm, bairro: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cidade:</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="Digite a cidade"
                  value={clienteForm.cidade}
                  onChange={e => setClienteForm({ ...clienteForm, cidade: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado (UF):</label>
                <input
                  type="text"
                  className="input-dorfic w-full"
                  placeholder="UF"
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
                  placeholder="Ponto de referência (opcional)"
                  value={clienteForm.ponto_referencia}
                  onChange={e => setClienteForm({ ...clienteForm, ponto_referencia: e.target.value })}
                />
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
                <label htmlFor="cliente-edit-cpf-cnpj" className="block font-bold text-slate-700 mb-1">CPF/CNPJ:*</label>
                <input
                  id="cliente-edit-cpf-cnpj"
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.cpf_cnpj}
                  aria-invalid={Boolean(formErrors.cpf_cnpj)}
                  aria-describedby={formErrors.cpf_cnpj ? 'cliente-edit-cpf-cnpj-error' : undefined}
                  onInput={e => updateClientField('cpf_cnpj', e.currentTarget.value)}
                />
                {formErrors.cpf_cnpj && <p className="field-error" id="cliente-edit-cpf-cnpj-error">{formErrors.cpf_cnpj}</p>}
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
                <label htmlFor="cliente-edit-telefone" className="block font-bold text-slate-700 mb-1">Telefone:*</label>
                <input
                  id="cliente-edit-telefone"
                  type="text"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.telefone}
                  aria-invalid={Boolean(formErrors.telefone)}
                  aria-describedby={formErrors.telefone ? 'cliente-edit-telefone-error' : undefined}
                  onInput={e => updateClientField('telefone', e.currentTarget.value)}
                />
                {formErrors.telefone && <p className="field-error" id="cliente-edit-telefone-error">{formErrors.telefone}</p>}
              </div>
              <div>
                <label htmlFor="cliente-edit-email" className="block font-bold text-slate-700 mb-1">E-mail:*</label>
                <input
                  id="cliente-edit-email"
                  type="text"
                  inputMode="email"
                  className="input-dorfic w-full"
                  required
                  value={clienteForm.email}
                  aria-invalid={Boolean(formErrors.email)}
                  aria-describedby={formErrors.email ? 'cliente-edit-email-error' : undefined}
                  onInput={e => updateClientField('email', e.currentTarget.value)}
                />
                {formErrors.email && <p className="field-error" id="cliente-edit-email-error">{formErrors.email}</p>}
              </div>

              <div className="md:col-span-2 pt-4 flex justify-between gap-3 border-t border-orange-100">
                {canDelete && <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow"
                >
                  Deletar
                </button>}
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
                      <p className="mt-1 font-bold">Valor: R$ {formatMoney(os.valor_liquido)}</p>
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
