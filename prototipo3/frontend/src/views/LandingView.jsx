import React from 'react';
import { useAuth } from '../context/AuthContext';

export function LandingView({ onNavigate }) {
  const { setSelectedPlan, isDarkMode, toggleTheme } = useAuth();

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    onNavigate('checkout');
  };

  return (
    <section className="screen flex-grow flex flex-col bg-slate-50 min-h-screen">
      <header className="bg-white border-b border-orange-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-dorfic-gradient rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-md">
            N
          </div>
          <span className="text-2xl font-black text-orange-600 tracking-tight">Neural</span>
        </div>
        <div className="flex gap-3 items-center">
          <button onClick={toggleTheme} className="hover:text-orange-600 transition p-2 mr-2" title="Alternar Tema">
            <i className={`fa-solid ${isDarkMode ? 'fa-sun text-orange-400' : 'fa-moon text-slate-600'} text-xl`}></i>
          </button>
          <button onClick={() => onNavigate('login')} className="btn-dorfic-secondary px-5 py-2.5">Log in</button>
          <button onClick={() => onNavigate('signup')} className="btn-dorfic px-5 py-2.5">Sign Up</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow w-full flex flex-col justify-center">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4">Escolha o plano ideal para a sua empresa</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">Gerencie Ordens de Serviço, Estoque, Clientes e Finanças em um só lugar com tecnologia Neural.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          {/* Plano Básico */}
          <div className="bg-dorfic-card p-8 flex flex-col justify-between border-2 border-orange-200">
            <div>
              <div className="inline-block bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-sm mb-4">Plano Básico</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">R$ 89<span className="text-sm font-normal text-slate-500">/mês</span></h2>
              <p className="text-slate-600 mb-6">Ideal para pequenos técnicos e assistências em crescimento.</p>

              <div className="space-y-3 mb-8 text-sm">
                <div className="font-bold text-slate-700 border-b pb-2">Detalhamento:</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Cadastro de Clientes ilimitado</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Até 100 Ordens de Serviço / mês</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Controle Básico de Estoque</div>
                <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-xmark"></i> Módulo do Técnico dedicado</div>
                <div className="flex items-center gap-2 text-slate-400"><i className="fa-solid fa-xmark"></i> Suporte Prioritário 24/7</div>
              </div>
            </div>
            <button onClick={() => handleSelectPlan('Básico')} className="btn-dorfic-secondary w-full py-3">Contratar Básico</button>
          </div>

          {/* Plano Prime */}
          <div className="bg-dorfic-card p-8 flex flex-col justify-between border-2 border-orange-500 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-orange-500 text-white font-bold text-xs px-4 py-1 rounded-bl-xl uppercase tracking-wider">Mais Popular</div>
            <div>
              <div className="inline-block bg-orange-500 text-white font-bold px-3 py-1 rounded-full text-sm mb-4">Plano Prime</div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">R$ 179<span className="text-sm font-normal text-slate-500">/mês</span></h2>
              <p className="text-slate-600 mb-6">Para empresas completas com equipes e grande fluxo de OS.</p>

              <div className="space-y-3 mb-8 text-sm">
                <div className="font-bold text-slate-700 border-b pb-2">Detalhamento:</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Ordens de Serviço Ilimitadas</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Controle Avançado de Estoque & Peças</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Gestão de Fornecedores & Requisições</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Perfis de Usuários e Técnicos</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Relatórios de Faturamento & Exportação</div>
                <div className="flex items-center gap-2"><i className="fa-solid fa-check text-orange-500"></i> Suporte Completo via Neural Bot</div>
              </div>
            </div>
            <button onClick={() => handleSelectPlan('Prime')} className="btn-dorfic w-full py-3">Assinar Plano Prime</button>
          </div>
        </div>
      </main>
    </section>
  );
}
