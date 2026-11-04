import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DashboardTab } from '../components/DashboardTab';
import { ClientesTab } from '../components/ClientesTab';
import { OSTab } from '../components/OSTab';
import { EstoqueTab } from '../components/EstoqueTab';
import { FornecedoresTab } from '../components/FornecedoresTab';
import { RelatoriosTab } from '../components/RelatoriosTab';
import { TecnicosTab } from '../components/TecnicosTab';
import { ConfigTab, SuporteTab } from '../components/ConfigAndSuporteTabs';

const modules = [
  { id: 'tab-inicio', label: 'Visão geral', icon: 'fa-chart-pie', roles: ['Admin'] },
  { id: 'tab-clientes', label: 'Clientes', icon: 'fa-users', roles: ['Admin', 'Tecnico', 'Financeiro'] },
  { id: 'tab-os', label: 'Ordens de serviço', icon: 'fa-screwdriver-wrench', roles: ['Admin', 'Tecnico', 'Financeiro'] },
  { id: 'tab-estoque', label: 'Peças e estoque', icon: 'fa-boxes-stacked', roles: ['Admin', 'Tecnico'], stock: true },
  { id: 'tab-fornecedor', label: 'Fornecedores', icon: 'fa-truck-field', roles: ['Admin'] },
  { id: 'tab-relatorio', label: 'Relatórios', icon: 'fa-chart-line', roles: ['Admin'] },
  { id: 'tab-tecnicos', label: 'Equipe', icon: 'fa-user-gear', roles: ['Admin'] }
];

const secondaryModules = [
  { id: 'tab-profile', label: 'Meu perfil', icon: 'fa-user', roles: ['Admin', 'Tecnico', 'Financeiro'] },
  { id: 'tab-config', label: 'Configurações', icon: 'fa-gear', roles: ['Admin'] },
  { id: 'tab-suporte', label: 'Suporte', icon: 'fa-circle-question', roles: ['Admin'] }
];

export function MainLayout({ onNavigate, showToast }) {
  const {
    user,
    empresa,
    isDarkMode,
    toggleTheme,
    logout
  } = useAuth();
  const drawerKey = `nneural_drawer_${user?.id_usuario || user?.id_tecnico || 'anonymous'}`;
  const [activeTab, setActiveTab] = useState('tab-clientes');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('nneural_drawer_anonymous') === 'collapsed');
  const [mobileOpen, setMobileOpen] = useState(false);

  const availableModules = useMemo(() => modules.filter(item => {
    if (!item.roles.includes(user?.perfil)) return false;
    return !item.stock || empresa?.modelo_estoque !== 'Sem Estoque';
  }), [empresa?.modelo_estoque, user?.perfil]);
  const availableSecondary = secondaryModules.filter(item => item.roles.includes(user?.perfil));
  const activeLabel = [...availableModules, ...availableSecondary].find(item => item.id === activeTab)?.label || 'Início';

  useEffect(() => {
    setCollapsed(localStorage.getItem(drawerKey) === 'collapsed');
  }, [drawerKey]);

  const handleLogout = () => {
    logout();
    showToast('Sessão encerrada.');
    onNavigate('landing');
  };

  const selectTab = id => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'tab-inicio': return <DashboardTab />;
      case 'tab-clientes': return <ClientesTab showToast={showToast} />;
      case 'tab-os': return <OSTab showToast={showToast} />;
      case 'tab-estoque': return <EstoqueTab showToast={showToast} />;
      case 'tab-fornecedor': return <FornecedoresTab showToast={showToast} />;
      case 'tab-relatorio': return <RelatoriosTab showToast={showToast} />;
      case 'tab-tecnicos': return <TecnicosTab showToast={showToast} />;
      case 'tab-config': return <ConfigTab showToast={showToast} />;
      case 'tab-suporte': return <SuporteTab />;
      case 'tab-profile':
        return (
          <section className="bg-white rounded-2xl border border-orange-100 p-6 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">Meu perfil</h1>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-500">Nome</dt><dd className="font-semibold">{user?.nome || '—'}</dd></div>
              <div><dt className="text-slate-500">Login</dt><dd className="font-semibold">{user?.login || '—'}</dd></div>
              <div><dt className="text-slate-500">Perfil</dt><dd className="font-semibold">{user?.perfil || '—'}</dd></div>
              <div><dt className="text-slate-500">Empresa</dt><dd className="font-semibold">{empresa?.nome_juridico || '—'}</dd></div>
            </dl>
            <p className="mt-5 text-sm text-slate-600">Os dados são exibidos conforme as permissões do seu perfil.</p>
          </section>
        );
      default: return null;
    }
  };

  const renderNavItem = item => (
    <button
      key={item.id}
      type="button"
      title={collapsed ? item.label : undefined}
      aria-label={item.label}
      aria-current={activeTab === item.id ? 'page' : undefined}
      onClick={() => selectTab(item.id)}
      className={`sidebar-btn w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition flex items-center gap-3 ${
        activeTab === item.id
          ? 'bg-orange-500 text-white shadow-sm'
          : 'text-slate-700 hover:bg-orange-50 hover:text-orange-700'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <i className={`fa-solid ${item.icon} w-5 shrink-0 text-center`} />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-orange-100 bg-white transition-all duration-200 md:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className={`flex h-16 items-center border-b border-orange-100 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="bg-dorfic-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white">N</div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-extrabold text-slate-900">N Neural</div>
              <div className="truncate text-xs text-slate-500">{empresa?.nome_juridico || 'Sua empresa'}</div>
            </div>
          )}
          <button
            type="button"
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem(drawerKey, next ? 'collapsed' : 'expanded');
            }}
            className={`hidden rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-orange-700 md:block ${collapsed ? 'absolute -right-3 top-5 bg-white shadow' : 'ml-auto'}`}
          >
            <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
          </button>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-orange-50 md:hidden"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 space-y-1 overflow-y-auto p-3">
          {availableModules.map(renderNavItem)}
          <div className="my-3 border-t border-orange-100" />
          {availableSecondary.map(renderNavItem)}
        </nav>

        <div className={`border-t border-orange-100 p-3 ${collapsed ? 'text-center' : ''}`}>
          <div className={`mb-2 flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-800">
              {(user?.nome || 'U').slice(0, 1).toUpperCase()}
            </span>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">{user?.nome}</div>
                <div className="text-xs text-slate-500">{user?.perfil}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            title={collapsed ? 'Sair' : undefined}
            onClick={handleLogout}
            className={`w-full rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
          >
            <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? 'md:pl-20' : 'md:pl-72'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-orange-100 bg-white px-4 shadow-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-orange-50 md:hidden"
            >
              <i className="fa-solid fa-bars" />
            </button>
            <h1 className="truncate text-sm font-bold text-slate-800 sm:text-base">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Tema ${isDarkMode ? 'escuro' : 'claro'} ativo. Alternar para tema ${isDarkMode ? 'claro' : 'escuro'}`}
              title={`Alternar para tema ${isDarkMode ? 'claro' : 'escuro'}`}
              className="theme-toggle-button"
            >
              <i
                className={isDarkMode
                  ? 'fa-solid fa-sun theme-icon text-orange-400'
                  : 'fa-solid fa-moon theme-icon text-slate-600'}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              onClick={() => selectTab('tab-profile')}
              aria-label="Abrir meu perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-800"
            >
              {(user?.nome || 'U').slice(0, 1).toUpperCase()}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sair do sistema"
              title="Sair do sistema"
              className="main-header-logout"
            >
              <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </header>
        <main className="min-w-0 p-4 sm:p-6">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
