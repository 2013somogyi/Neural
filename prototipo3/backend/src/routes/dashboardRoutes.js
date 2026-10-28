const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard
router.get('/', (req, res) => {
  const empresa = db.findOne('empresas', e => e.id_empresa === req.user.id_empresa);
  const osList = db.find('os', o => o.id_empresa === req.user.id_empresa);
  const clientes = db.find('clientes', c => c.id_empresa === req.user.id_empresa && c.ativo);
  const pecas = db.find('pecas', p => p.id_empresa === req.user.id_empresa);
  const tecnicos = db.find('tecnicos', t => t.id_empresa === req.user.id_empresa && t.ativo);

  const faturamentoTotal = osList.reduce((acc, o) => acc + (o.valor_liquido || 0), 0);
  const qtdOS = osList.length;

  const agora = Date.now();
  const garantiasAtivas = osList.filter(o => {
    if (o.status !== 'Concluída' || !o.data_conclusao) return false;
    const dataConc = new Date(o.data_conclusao + 'T00:00:00').getTime();
    const prazoMs = (o.prazo_garantia_dias || 0) * 24 * 60 * 60 * 1000;
    return (dataConc + prazoMs) >= agora;
  }).length;

  res.json({
    empresa,
    faturamentoTotal,
    qtdOS,
    garantiasAtivas,
    totalClientes: clientes.length,
    totalPecas: pecas.length,
    totalTecnicos: tecnicos.length
  });
});

module.exports = router;
