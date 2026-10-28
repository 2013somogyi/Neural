const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tecnicos
router.get('/', (req, res) => {
  const tecnicos = db.find('tecnicos', t => t.id_empresa === req.user.id_empresa && t.ativo)
    .map(({ senha_hash, ...rest }) => rest);
  res.json(tecnicos);
});

// POST /api/tecnicos
router.post('/', (req, res) => {
  const { nome, login, cpf, cargo, salario_fixo, senha } = req.body;

  if (!nome || !login || !senha) {
    return res.status(400).json({ message: 'Nome, login e senha são obrigatórios.' });
  }

  const existing = db.findOne('tecnicos', t => t.login === login);
  if (existing) {
    return res.status(400).json({ message: 'Esse login já está em uso.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const senha_hash = bcrypt.hashSync(senha, salt);

  const newTecnico = db.insert('tecnicos', {
    id_empresa: req.user.id_empresa,
    nome,
    login,
    cpf: cpf || '',
    cargo: cargo || 'Técnico Hardware',
    salario_fixo: parseFloat(salario_fixo) || 0.00,
    senha_hash
  });

  const { senha_hash: _, ...result } = newTecnico;
  res.status(201).json(result);
});

// PUT /api/tecnicos/:id
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const tecnico = db.findOne('tecnicos', t => t.id_tecnico === id && t.id_empresa === req.user.id_empresa && t.ativo);

  if (!tecnico) {
    return res.status(404).json({ message: 'Técnico não encontrado.' });
  }

  const patch = { ...req.body };
  if (patch.senha) {
    const salt = bcrypt.genSaltSync(10);
    patch.senha_hash = bcrypt.hashSync(patch.senha, salt);
    delete patch.senha;
  }

  const updated = db.update('tecnicos', id, patch);
  const { senha_hash: _, ...result } = updated;
  res.json(result);
});

// DELETE /api/tecnicos/:id
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (id === req.user.id_tecnico) {
    return res.status(400).json({ message: 'Você não pode inativar o próprio usuário logado.' });
  }

  const tecnico = db.findOne('tecnicos', t => t.id_tecnico === id && t.id_empresa === req.user.id_empresa && t.ativo);
  if (!tecnico) {
    return res.status(404).json({ message: 'Técnico não encontrado.' });
  }

  db.update('tecnicos', id, { ativo: 0 });
  res.json({ message: 'Técnico inativado com sucesso.' });
});

module.exports = router;
