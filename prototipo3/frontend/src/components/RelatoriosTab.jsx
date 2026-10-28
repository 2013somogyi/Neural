import React from 'react';
import { apiRequest } from '../api/client';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function RelatoriosTab({ showToast }) {
  const gerarRelatorioPDF = async (tipo) => {
    try {
      const doc = new jsPDF();
      const dataAtual = new Date().toLocaleDateString('pt-BR');

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 107, 0); // Laranja N Neural
      doc.setFontSize(16);
      doc.text("N Neural", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(10);
      doc.text(`Relatório Gerado em: ${dataAtual}`, 14, 28);

      let head = [];
      let body = [];
      let titulo = "";

      if (tipo === 'os') {
        titulo = "Relatório Analítico de Ordens de Serviço";
        head = [['Nº OS', 'Cliente', 'Equipamento', 'Status', 'Valor (R$)']];
        const osList = await apiRequest('/os');
        osList.forEach(os => {
          body.push([
            `000${os.numero_os}`,
            os.cliente ? os.cliente.nome_completo : 'N/A',
            `${os.marca || ''} ${os.modelo || ''}`,
            os.status,
            `R$ ${(os.valor_liquido || 0).toFixed(2).replace('.', ',')}`
          ]);
        });
      } else if (tipo === 'estoque') {
        titulo = "Relatório de Posição de Estoque e Peças";
        head = [['ID', 'Peça', 'Categoria', 'Qtd Estoque', 'Custo (R$)']];
        const pecas = await apiRequest('/pecas');
        pecas.forEach(p => {
          body.push([
            p.id_peca,
            p.nome_peca,
            p.categoria,
            p.quantidade_estoque,
            `R$ ${(p.preco_custo_atual || 0).toFixed(2).replace('.', ',')}`
          ]);
        });
      } else if (tipo === 'tecnicos') {
        titulo = "Relatório de Equipe e Técnicos (Produtividade)";
        head = [['ID', 'Nome', 'Cargo', 'Salário Fixo']];
        const tecnicos = await apiRequest('/tecnicos');
        tecnicos.forEach(t => {
          body.push([
            t.id_tecnico,
            t.nome,
            t.cargo,
            `R$ ${(t.salario_fixo || 0).toFixed(2).replace('.', ',')}`
          ]);
        });
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(titulo, 14, 38);

      doc.autoTable({
        startY: 42,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [255, 107, 0], textColor: 255 },
        styles: { fontSize: 9 }
      });

      doc.save(`NNeural_Relatorio_${tipo}_${dataAtual.replace(/\//g, '-')}.pdf`);
      showToast(`Relatório de ${tipo.toUpperCase()} exportado com sucesso!`);
    } catch (err) {
      showToast('Erro ao gerar relatório: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 shadow-sm">
      <h2 className="text-xl font-black text-orange-600 uppercase mb-4">Relatórios do Sistema</h2>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h3 className="font-bold text-slate-800 text-sm mb-1">Relatório de OS por Período</h3>
          <p className="text-xs text-slate-500 mb-3">Exporte todas as OS concluídas e faturamento.</p>
          <button onClick={() => gerarRelatorioPDF('os')} className="btn-dorfic text-xs w-full py-2">
            Gerar PDF
          </button>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h3 className="font-bold text-slate-800 text-sm mb-1">Relatório de Giro de Estoque</h3>
          <p className="text-xs text-slate-500 mb-3">Acompanhe saídas e peças com baixo estoque.</p>
          <button onClick={() => gerarRelatorioPDF('estoque')} className="btn-dorfic text-xs w-full py-2">
            Gerar PDF
          </button>
        </div>

        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h3 className="font-bold text-slate-800 text-sm mb-1">Produtividade de Técnicos</h3>
          <p className="text-xs text-slate-500 mb-3">Veja a quantidade de serviços por técnico.</p>
          <button onClick={() => gerarRelatorioPDF('tecnicos')} className="btn-dorfic text-xs w-full py-2">
            Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
