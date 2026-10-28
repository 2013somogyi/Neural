import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardTab } from '../components/DashboardTab';
import { ClientesTab } from '../components/ClientesTab';
import { OSTab } from '../components/OSTab';
import { EstoqueTab } from '../components/EstoqueTab';
import { FornecedoresTab } from '../components/FornecedoresTab';
import { RelatoriosTab } from '../components/RelatoriosTab';
import { TecnicosTab } from '../components/TecnicosTab';
import { ConfigTab, SuporteTab } from '../components/ConfigAndSuporteTabs';

export function MainLayout({ onNavigate, showToast }) {
  const { user, empresa, isDarkMode, toggleTheme, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('tab-clientes');

  const navItems = [
    { id: 'tab-clientes', label: 'Cliente', icon: 'fa-users' },
    { id: 'tab-os', label: 'Ordem de Serviço', icon: 'fa-screwdriver-wrench' },
    { id: 'tab-estoque', label: 'Estoque & Peças', icon: 'fa-boxes-stacked' },
    { id: 'tab-fornecedor', label: 'Fornecedor', icon: 'fa-truck-field' },
    { id: 'tab-relatorio', label: 'Relatório', icon: 'fa-chart-line' },
    { id: 'tab-tecnicos', label: 'Técnicos / Equipe', icon: 'fa-user-gear' }
  ];

  const handleLogout = () => {
    logout();
    showToast('Sessão encerrada.');
    onNavigate('landing');
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* HEADER DO SISTEMA */}
      <header className="bg-white border-b-2 border-orange-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dorfic-gradient rounded-xl flex items-center justify-center text-white text-xl font-extrabold shadow">
              N
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-sm">
                Empresa: {empresa?.nome_juridico || 'Neural Tech'}
              </div>
              <div className="text-xs text-orange-600 font-bold">
                Nome: {user?.nome || 'Carlos'} ({user?.cargo || 'ADM'})
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('tab-inicio')}
            className="px-4 py-2 bg-orange-100 hover:bg-orange-200 text-orange-800 font-bold text-xs rounded-xl transition flex items-center gap-2"
          >
            <i className="fa-solid fa-house"></i> INÍCIO
          </button>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl">
            <button onClick={toggleTheme} className="hover:text-orange-600 transition px-2" title="Alternar Tema">
              <i className={`fa-solid ${isDarkMode ? 'fa-sun text-orange-400' : 'fa-moon text-slate-600'} text-sm`}></i>
            </button>
            <span>|</span>
            <button onClick={() => setActiveTab('tab-config')} className="hover:text-orange-600 transition">
              <i className="fa-solid fa-gear"></i> Configuração
            </button>
            <span>|</span>
            <button onClick={() => setActiveTab('tab-suporte')} className="hover:text-orange-600 transition">
              <i className="fa-solid fa-circle-question"></i> Suporte
            </button>
          </div>

          <span className="font-black text-orange-600 text-base tracking-tight hidden sm:inline">N Neural</span>

          <button onClick={handleLogout} className="text-xs text-red-500 font-bold hover:underline ml-2">
            Sair
          </button>
        </div>
      </header>

      {/* CORPO COM SIDEBAR + ÁREA DE CONTEÚDO */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* SIDEBAR LATERAL */}
        <aside className="w-full md:w-64 bg-white border-r-2 border-orange-100 p-4 space-y-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-btn w-full text-left p-3 rounded-xl font-bold text-sm flex items-center gap-3 transition ${
                activeTab === item.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-700 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <i className={`fa-solid ${item.icon} w-5 text-center`}></i> {item.label}
            </button>
          ))}
        </aside>

        {/* ÁREA CENTRAL DE CONTEÚDO DA APLICAÇÃO */}
        <main className="flex-grow p-6 bg-slate-50 overflow-y-auto">
          {activeTab === 'tab-inicio' && <DashboardTab />}
          {activeTab === 'tab-clientes' && <ClientesTab showToast={showToast} />}
          {activeTab === 'tab-os' && <OSTab showToast={showToast} />}
          {activeTab === 'tab-estoque' && <EstoqueTab showToast={showToast} />}
          {activeTab === 'tab-fornecedor' && <FornecedoresTab showToast={showToast} />}
          {activeTab === 'tab-relatorio' && <RelatoriosTab showToast={showToast} />}
          {activeTab === 'tab-tecnicos' && <TecnicosTab showToast={showToast} />}
          {activeTab === 'tab-config' && <ConfigTab showToast={showToast} />}
          {activeTab === 'tab-suporte' && <SuporteTab />}
        </main>
      </div>
    </div>
  );
}
