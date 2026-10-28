const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/pecas
router.get('/', (req, res) => {
  const pecas = db.find('pecas', p => p.id_empresa === req.user.id_empresa);
  res.json(pecas);
});

// POST /api/pecas
router.post('/', (req, res) => {
  const { nome_peca, categoria, preco_custo_atual, preco_venda, quantidade_estoque } = req.body;

  if (!nome_peca) {
    return res.status(400).json({ message: 'Nome da peça é obrigatório.' });
  }

  const newPeca = db.insert('pecas', {
    id_empresa: req.user.id_empresa,
    nome_peca,
    categoria: categoria || 'Geral',
    preco_custo_atual: parseFloat(preco_custo_atual) || 0.00,
    preco_venda: parseFloat(preco_venda) || 0.00,
    quantidade_estoque: parseInt(quantidade_estoque) || 0
  });

  res.status(201).json(newPeca);
});

// PUT /api/pecas/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const peca = db.findOne('pecas', p => p.id_peca === id && p.id_empresa === req.user.id_empresa);

  if (!peca) {
    return res.status(404).json({ message: 'Peça não encontrada.' });
  }

  const updated = db.update('pecas', id, req.body);
  res.json(updated);
});

// DELETE /api/pecas/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = db.delete('pecas', id);

  if (!deleted) {
    return res.status(404).json({ message: 'Peça não encontrada.' });
  }

  res.json({ message: 'Peça removida com sucesso.' });
});

module.exports = router;
