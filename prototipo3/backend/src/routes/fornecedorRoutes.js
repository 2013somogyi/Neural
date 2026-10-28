const express = require('express');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/fornecedores
router.get('/', (req, res) => {
  const fornecedores = db.find('fornecedores', f => f.id_empresa === req.user.id_empresa);
  res.json(fornecedores);
});

// POST /api/fornecedores
router.post('/', (req, res) => {
  const { nome_juridico, cnpj, produtos, telefone, email } = req.body;

  if (!nome_juridico) {
    return res.status(400).json({ message: 'Nome jurídico é obrigatório.' });
  }

  const newFornecedor = db.insert('fornecedores', {
    id_empresa: req.user.id_empresa,
    nome_juridico,
    cnpj: cnpj || '',
    produtos: produtos || '',
    telefone: telefone || '',
    email: email || ''
  });

  res.status(201).json(newFornecedor);
});

// PUT /api/fornecedores/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const fornecedor = db.findOne('fornecedores', f => f.id_fornecedor === id && f.id_empresa === req.user.id_empresa);

  if (!fornecedor) {
    return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  }

  const updated = db.update('fornecedores', id, req.body);
  res.json(updated);
});

// DELETE /api/fornecedores/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const deleted = db.delete('fornecedores', id);

  if (!deleted) {
    return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  }

  res.json({ message: 'Fornecedor removido com sucesso.' });
});

module.exports = router;
