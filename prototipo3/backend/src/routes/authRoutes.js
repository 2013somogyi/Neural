const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
  }

  const user = db.findOne('tecnicos', t => t.login === login && t.ativo);
  if (!user) {
    return res.status(401).json({ message: 'Login ou senha inválidos.' });
  }

  const match = bcrypt.compareSync(senha, user.senha_hash);
  if (!match) {
    return res.status(401).json({ message: 'Login ou senha inválidos.' });
  }

  const empresa = db.findOne('empresas', e => e.id_empresa === user.id_empresa);

  const payload = {
    id_tecnico: user.id_tecnico,
    id_empresa: user.id_empresa,
    nome: user.nome,
    login: user.login,
    cargo: user.cargo
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    token,
    user: payload,
    empresa
  });
});

// POST /api/auth/register-company
router.post('/register-company', (req, res) => {
  const { empresa, adm } = req.body;

  if (!empresa || !empresa.nome_juridico || !empresa.cnpj) {
    return res.status(400).json({ message: 'Dados da empresa são obrigatórios.' });
  }

  if (!adm || !adm.nome || !adm.login || !adm.senha) {
    return res.status(400).json({ message: 'Dados do administrador são obrigatórios.' });
  }

  // Check unique CNPJ
  const existingEmp = db.findOne('empresas', e => e.cnpj === empresa.cnpj);
  if (existingEmp) {
    return res.status(400).json({ message: 'Já existe uma empresa cadastrada com este CNPJ.' });
  }

  // Check unique login
  const existingUser = db.findOne('tecnicos', t => t.login === adm.login);
  if (existingUser) {
    return res.status(400).json({ message: 'Esse login de administrador já está em uso.' });
  }

  const newEmp = db.insert('empresas', {
    nome_juridico: empresa.nome_juridico,
    cnpj: empresa.cnpj,
    telefone: empresa.telefone || '',
    email: empresa.email || '',
    logradouro: empresa.logradouro || '',
    numero: empresa.numero || '',
    complemento: empresa.complemento || '',
    bairro: empresa.bairro || '',
    cidade: empresa.cidade || '',
    uf: empresa.uf || '',
    cep: empresa.cep || '',
    horario: empresa.horario || '08:00 as 18:00',
    plano: empresa.plano || 'Prime',
    proximo_numero_os: 1
  });

  const salt = bcrypt.genSaltSync(10);
  const passHash = bcrypt.hashSync(adm.senha, salt);

  const newAdm = db.insert('tecnicos', {
    id_empresa: newEmp.id_empresa,
    nome: adm.nome,
    login: adm.login,
    cpf: adm.cpf || '',
    cargo: 'Administrador',
    salario_fixo: 0.00,
    senha_hash: passHash
  });

  return res.status(201).json({
    message: 'Empresa e Administrador cadastrados com sucesso!',
    id_empresa: newEmp.id_empresa,
    id_tecnico: newAdm.id_tecnico
  });
});

module.exports = router;
