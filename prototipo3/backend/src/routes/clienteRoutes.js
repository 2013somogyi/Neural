const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/clientes
router.get('/', (req, res) => {
  const { busca, tipo } = req.query;
  let clientes = db.find('clientes', c => c.id_empresa === req.user.id_empresa && c.ativo);

  if (busca) {
    const q = busca.toLowerCase();
    clientes = clientes.filter(c => {
      if (tipo === 'codigo') return String(c.codigo).toLowerCase().includes(q);
      if (tipo === 'telefone') return String(c.telefone).toLowerCase().includes(q);
      return c.nome_completo.toLowerCase().includes(q);
    });
  }

  res.json(clientes);
});

// GET /api/clientes/:id
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cliente = db.findOne('clientes', c => c.id_cliente === id && c.id_empresa === req.user.id_empresa && c.ativo);

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado.' });
  }

  const osList = db.find('os', o => o.id_cliente === id && o.id_empresa === req.user.id_empresa);

  res.json({
    ...cliente,
    os: osList
  });
});

// POST /api/clientes
router.post('/', (req, res) => {
  const { nome_completo, cpf_cnpj, rg, telefone, email, logradouro, numero, complemento, bairro, cidade, uf, cep, ponto_referencia, detalhes_geral } = req.body;

  if (!nome_completo || !cpf_cnpj || !telefone || !email) {
    return res.status(400).json({ message: 'Nome, CPF/CNPJ, Telefone e E-mail são obrigatórios.' });
  }

  const cliente = db.insert('clientes', {
    id_empresa: req.user.id_empresa,
    nome_completo,
    cpf_cnpj,
    rg: rg || '',
    telefone,
    email,
    logradouro: logradouro || '',
    numero: numero || '',
    complemento: complemento || '',
    bairro: bairro || '',
    cidade: cidade || '',
    uf: uf || '',
    cep: cep || '',
    ponto_referencia: ponto_referencia || '',
    detalhes_geral: detalhes_geral || ''
  });

  res.status(201).json(cliente);
});

// PUT /api/clientes/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cliente = db.findOne('clientes', c => c.id_cliente === id && c.id_empresa === req.user.id_empresa && c.ativo);

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado.' });
  }

  const updated = db.update('clientes', id, req.body);
  res.json(updated);
});

// DELETE /api/clientes/:id (Soft delete)
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const cliente = db.findOne('clientes', c => c.id_cliente === id && c.id_empresa === req.user.id_empresa && c.ativo);

  if (!cliente) {
    return res.status(404).json({ message: 'Cliente não encontrado.' });
  }

  db.update('clientes', id, { ativo: 0 });
  res.json({ message: 'Cliente inativado com sucesso.' });
});

module.exports = router;
