const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/os
router.get('/', (req, res) => {
  const { status, busca } = req.query;
  let osList = db.find('os', o => o.id_empresa === req.user.id_empresa);

  if (status) {
    osList = osList.filter(o => o.status === status);
  }

  if (busca) {
    const q = busca.toLowerCase();
    osList = osList.filter(o => {
      const cliente = db.findOne('clientes', c => c.id_cliente === o.id_cliente);
      const clienteNome = cliente ? cliente.nome_completo.toLowerCase() : '';
      return clienteNome.includes(q) || (o.equipamento_tipo && o.equipamento_tipo.toLowerCase().includes(q));
    });
  }

  // Populate client & technician details
  const result = osList.map(o => {
    const cliente = db.findOne('clientes', c => c.id_cliente === o.id_cliente);
    const tecnico = o.id_tecnico_responsavel ? db.findOne('tecnicos', t => t.id_tecnico === o.id_tecnico_responsavel) : null;
    return {
      ...o,
      cliente: cliente ? { id_cliente: cliente.id_cliente, nome_completo: cliente.nome_completo, codigo: cliente.codigo } : null,
      tecnico: tecnico ? { id_tecnico: tecnico.id_tecnico, nome: tecnico.nome } : null
    };
  });

  res.json(result);
});

// GET /api/os/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const osItem = db.findOne('os', o => o.id_os === id && o.id_empresa === req.user.id_empresa);

  if (!osItem) {
    return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  }

  const cliente = db.findOne('clientes', c => c.id_cliente === osItem.id_cliente);
  const tecnico = osItem.id_tecnico_responsavel ? db.findOne('tecnicos', t => t.id_tecnico === osItem.id_tecnico_responsavel) : null;

  res.json({
    ...osItem,
    cliente,
    tecnico
  });
});

// POST /api/os
router.post('/', (req, res) => {
  const {
    id_cliente,
    tipo_documento,
    prioridade,
    equipamento_tipo,
    marca,
    modelo,
    numero_serie,
    relato_problema,
    id_tecnico_responsavel,
    prazo_garantia_dias
  } = req.body;

  if (!id_cliente || !equipamento_tipo || !marca || !modelo || !relato_problema) {
    return res.status(400).json({ message: 'Cliente, Tipo do Equipamento, Marca, Modelo e Relato do Problema são obrigatórios.' });
  }

  const empresa = db.findOne('empresas', e => e.id_empresa === req.user.id_empresa);
  const numero_os = empresa.proximo_numero_os;

  // Increment company OS counter
  db.update('empresas', empresa.id_empresa, { proximo_numero_os: numero_os + 1 });

  const newOS = db.insert('os', {
    id_empresa: req.user.id_empresa,
    numero_os,
    id_cliente: parseInt(id_cliente),
    tipo_documento: tipo_documento || 'OS',
    status: 'Aberta',
    prioridade: prioridade || 'Média',
    equipamento_tipo,
    marca,
    modelo,
    numero_serie: numero_serie || '',
    relato_problema,
    id_tecnico_responsavel: id_tecnico_responsavel ? parseInt(id_tecnico_responsavel) : null,
    prazo_garantia_dias: prazo_garantia_dias ? parseInt(prazo_garantia_dias) : 90,
    valor_total: 0.00,
    valor_desconto: 0.00,
    valor_liquido: 0.00,
    data_abertura: new Date().toISOString().split('T')[0]
  });

  res.status(201).json(newOS);
});

// PUT /api/os/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const osItem = db.findOne('os', o => o.id_os === id && o.id_empresa === req.user.id_empresa);

  if (!osItem) {
    return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  }

  const patch = { ...req.body };
  if (patch.valor_total !== undefined || patch.valor_desconto !== undefined) {
    const total = patch.valor_total !== undefined ? parseFloat(patch.valor_total) : osItem.valor_total;
    const desconto = patch.valor_desconto !== undefined ? parseFloat(patch.valor_desconto) : osItem.valor_desconto;
    patch.valor_liquido = Math.max(0, total - desconto);
  }

  if (patch.status === 'Concluída' && !osItem.data_conclusao) {
    patch.data_conclusao = new Date().toISOString().split('T')[0];
  }

  const updated = db.update('os', id, patch);
  res.json(updated);
});

// DELETE /api/os/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = db.delete('os', id);

  if (!deleted) {
    return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  }

  res.json({ message: 'Ordem de Serviço removida com sucesso.' });
});

module.exports = router;
