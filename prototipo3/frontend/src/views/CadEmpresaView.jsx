import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function CadEmpresaView({ onNavigate, showToast, onSaveTempEmpresa }) {
  const { selectedPlan } = useAuth();
  const [empresa, setEmpresaState] = useState({
    nome_juridico: 'Neural Tech Soluções LTDA',
    cnpj: '12.345.678/0001-99',
    telefone: '(11) 98888-7777',
    email: 'contato@neuraltech.com.br',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: 'Sala 402',
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    cep: '01310-100',
    horario: '08:00 as 18:00',
    plano: selectedPlan
  });

  const handleChange = (field, value) => {
    setEmpresaState(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveTempEmpresa(empresa);
    onNavigate('cad-adm');
  };

  return (
    <section className="flex-grow p-6 bg-slate-100 flex items-center justify-center min-h-screen">
      <div className="bg-dorfic-card w-full max-w-2xl p-8">
        <div className="flex items-center justify-between border-b border-orange-100 pb-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Dados da empresa:</h2>
            <p className="text-xs text-slate-500">Cadastre a estrutura da tabela EMPRESA do Banco de Dados</p>
          </div>
          <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 font-bold rounded-full">Passo 1 de 2</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Jurídico:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={empresa.nome_juridico}
              onChange={e => handleChange('nome_juridico', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={empresa.cnpj}
              onChange={e => handleChange('cnpj', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefone:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={empresa.telefone}
              onChange={e => handleChange('telefone', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">E-mail:</label>
            <input
              type="email"
              className="input-dorfic w-full text-sm"
              required
              value={empresa.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.logradouro}
              onChange={e => handleChange('logradouro', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Número:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.numero}
              onChange={e => handleChange('numero', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Complemento:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.complemento}
              onChange={e => handleChange('complemento', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bairro:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.bairro}
              onChange={e => handleChange('bairro', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cidade:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.cidade}
              onChange={e => handleChange('cidade', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estado (UF) / CEP:</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="input-dorfic w-1/3 text-sm"
                value={empresa.uf}
                maxLength="2"
                onChange={e => handleChange('uf', e.target.value)}
              />
              <input
                type="text"
                className="input-dorfic w-2/3 text-sm"
                value={empresa.cep}
                onChange={e => handleChange('cep', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Logo da Empresa:</label>
            <button type="button" onClick={() => showToast('Logotipo pode ser alterado nas configurações.')} className="btn-dorfic-secondary w-full text-xs py-2 flex items-center justify-center gap-2">
              <i className="fa-solid fa-upload"></i> Selecionar Mídia
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Funcionamento:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              value={empresa.horario}
              onChange={e => handleChange('horario', e.target.value)}
            />
          </div>

          <div className="md:col-span-2 pt-4 flex justify-between">
            <button type="button" onClick={() => onNavigate('checkout')} className="btn-dorfic-secondary px-6 py-2.5">
              Voltar
            </button>
            <button type="submit" className="btn-dorfic px-8 py-2.5">
              Concluir & Próximo
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
