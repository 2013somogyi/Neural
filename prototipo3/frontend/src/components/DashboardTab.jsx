import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client';

export function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const res = await apiRequest('/dashboard');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <div className="p-6 text-sm text-slate-500">Carregando Dashboard...</div>;

  const faturamento = data ? `R$ ${(data.faturamentoTotal || 0).toFixed(2).replace('.', ',')}` : 'R$ 0,00';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard de Vendas</h1>
          <p className="text-xs text-slate-500">Última Atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-dorfic-secondary text-xs px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-print"></i> Imprimir
          </button>
          <button onClick={() => alert('Exportando relatório financeiro em PDF/Excel...')} className="btn-dorfic text-xs px-4 py-2 flex items-center gap-2">
            <i className="fa-solid fa-download"></i> Baixar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-dorfic-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Faturamento (Mês)</p>
              <h2 className="text-3xl font-extrabold text-orange-600 mt-2">{faturamento}</h2>
            </div>
            <div className="bg-emerald-100 text-emerald-700 p-3 rounded-xl">
              <i className="fa-solid fa-dollar-sign text-xl"></i>
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-bold mt-4">
            <i className="fa-solid fa-arrow-up"></i> +12.5% em relação ao mês anterior
          </p>
        </div>

        <div className="bg-dorfic-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Ordens de Serviço</p>
              <h2 className="text-3xl font-extrabold text-slate-800 mt-2">{data?.qtdOS || 0}</h2>
            </div>
            <div className="bg-orange-100 text-orange-700 p-3 rounded-xl">
              <i className="fa-solid fa-clipboard-list text-xl"></i>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-bold mt-4">0,0% em relação ao mês anterior</p>
        </div>

        <div className="bg-dorfic-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Garantias Ativas</p>
              <h2 className="text-3xl font-extrabold text-blue-600 mt-2">{data?.garantiasAtivas || 0}</h2>
            </div>
            <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
              <i className="fa-solid fa-shield-halved text-xl"></i>
            </div>
          </div>
          <p className="text-xs text-blue-600 font-bold mt-4">Dentro do prazo regulamentar</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 text-lg">Resumo de Vendas & Desempenho</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Filtro:</span>
            <select className="input-dorfic text-xs py-1">
              <option>Este Mês</option>
              <option>Mês Passado</option>
              <option>Ano Atual</option>
            </select>
            <button className="btn-dorfic-secondary text-xs px-3 py-1 flex items-center gap-1">
              <i className="fa-solid fa-share-nodes"></i> Compartilhar
            </button>
          </div>
        </div>
        <div className="h-48 bg-orange-50/50 rounded-xl flex items-center justify-center border border-dashed border-orange-200 text-slate-400">
          <p className="text-xs text-center">
            <i className="fa-solid fa-chart-area text-3xl text-orange-400 mb-2 block"></i> Gráfico Visual de Movimentações Financeiras e OS Fechadas
          </p>
        </div>
      </div>
    </div>
  );
}
