import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function ConfigTab({ showToast }) {
  const { empresa, setEmpresa } = useAuth();
  const [proxOS, setProxOS] = useState(empresa ? empresa.proximo_numero_os : 68);

  const handleSalvar = (e) => {
    e.preventDefault();
    if (empresa) {
      setEmpresa(prev => ({ ...prev, proximo_numero_os: parseInt(proxOS) }));
    }
    showToast('Configurações salvas!');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
        <h2 className="text-xl font-black text-orange-600 mb-4">Configurações Globais do Sistema</h2>
        <p className="text-xs text-slate-600 mb-4">Parâmetros da Empresa e Regras do Módulo Operacional.</p>

        <form onSubmit={handleSalvar} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Próximo Número de OS (proximo_numero_os):
            </label>
            <input
              type="number"
              className="input-dorfic w-full text-sm"
              value={proxOS}
              onChange={e => setProxOS(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-dorfic text-xs px-6 py-2.5">
            Salvar Configurações
          </button>
        </form>
      </div>
    </div>
  );
}

export function SuporteTab() {
  const abrirWhatsAppSuporte = () => {
    const numero = "5511999999999";
    const mensagem = encodeURIComponent("Olá, estou utilizando o sistema N Neural e preciso de suporte para a minha assistência técnica.");
    window.open(`https://wa.me/${numero}?text=${mensagem}`, '_blank');
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm text-center">
      <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3">
        <i className="fa-solid fa-headset"></i>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Suporte N Neural</h2>
      <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
        Precisa de ajuda com o sistema ou banco de dados? Fale diretamente com nossa equipe de suporte 24 horas.
      </p>
      <button onClick={abrirWhatsAppSuporte} className="btn-dorfic px-8 py-3 text-sm">
        Abrir Chamado via WhatsApp
      </button>
    </div>
  );
}
