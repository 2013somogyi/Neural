import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function CadAdmView({ onNavigate, showToast, tempEmpresa }) {
  const { registerCompany } = useAuth();
  const [loading, setLoading] = useState(false);
  const [adm, setAdm] = useState({
    nome: 'Carlos Eduardo',
    login: 'carlos.adm',
    cpf: '123.456.789-00',
    senha: '123456'
  });

  const handleChange = (field, value) => {
    setAdm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerCompany(tempEmpresa, adm);
      showToast('Empresa e ADM cadastrados com sucesso!');
      onNavigate('login');
    } catch (err) {
      showToast(err.message || 'Erro ao cadastrar empresa/ADM', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex-grow p-6 bg-slate-100 flex items-center justify-center min-h-screen">
      <div className="bg-dorfic-card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-dorfic-gradient rounded-xl flex items-center justify-center text-white text-xl font-black mx-auto mb-2">
            N
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Dados do ADM:</h2>
          <p className="text-xs text-slate-500">Cadastre o Administrador principal da Empresa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={adm.nome}
              onChange={e => handleChange('nome', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Login:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={adm.login}
              onChange={e => handleChange('login', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CPF:</label>
            <input
              type="text"
              className="input-dorfic w-full text-sm"
              required
              value={adm.cpf}
              onChange={e => handleChange('cpf', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Senha:</label>
            <input
              type="password"
              className="input-dorfic w-full text-sm"
              required
              value={adm.senha}
              onChange={e => handleChange('senha', e.target.value)}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => onNavigate('cad-empresa')}
              className="btn-dorfic-secondary w-1/3 py-2.5"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-dorfic w-2/3 py-2.5"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
