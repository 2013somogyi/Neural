const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');
const { digitsOnly, isValidCnpj } = require('../utils/validation');
const { normalizeBrazilianPhone } = require('../utils/normalization');
const { toApiRole } = require('../utils/roles');

const router = express.Router();

router.post('/login', async (req, res) => {
  const login = String(req.body.login || '').trim().toLowerCase();
  const { senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ message: 'Login e senha são obrigatórios.' });
  }

  const users = await db.query(
    `SELECT u.id_usuario, u.id_empresa, u.nome, u.login_normalizado,
            u.senha_hash, u.perfil, f.id_funcionario AS id_tecnico,
            f.cargo, e.nome_juridico, e.nome AS nome_empresa,
            e.modelo_estoque
       FROM usuarios u
       JOIN empresas e ON e.id_empresa = u.id_empresa AND e.ativo = 1
       LEFT JOIN funcionarios f
         ON f.id_empresa = u.id_empresa AND f.id_usuario = u.id_usuario AND f.ativo = 1
      WHERE u.ativo = 1
        AND (u.login_normalizado = ? OR LOWER(u.email) = ?)
      LIMIT 2`,
    [login, login]
  );
  const user = users.length === 1 ? users[0] : null;
  if (!user || !bcrypt.compareSync(senha, user.senha_hash)) {
    return res.status(401).json({ message: 'Login ou senha inválidos.' });
  }

  const payload = {
    id_usuario: user.id_usuario,
    id_tecnico: user.id_tecnico,
    id_empresa: user.id_empresa,
    nome: user.nome,
    login: user.login_normalizado,
    perfil: toApiRole(user.perfil),
    cargo: user.cargo || toApiRole(user.perfil)
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

  return res.json({
    token,
    user: payload,
    empresa: {
      id_empresa: user.id_empresa,
      nome_juridico: user.nome_juridico || user.nome_empresa,
      modelo_estoque: user.modelo_estoque
    }
  });
});

router.post('/register-company', async (req, res) => {
  const { empresa, adm } = req.body;
  const requiredCompanyFields = [
    'nome_juridico', 'cnpj', 'telefone', 'email', 'logradouro',
    'numero', 'bairro', 'cidade', 'uf', 'cep'
  ];

  if (!empresa || requiredCompanyFields.some(field => !String(empresa[field] || '').trim())) {
    return res.status(400).json({ message: 'Preencha todos os dados obrigatórios da empresa.' });
  }
  if (!isValidCnpj(empresa.cnpj)) {
    return res.status(400).json({ message: 'Informe um CNPJ válido.' });
  }
  if (!adm || !adm.nome || !adm.login || !adm.senha) {
    return res.status(400).json({ message: 'Nome, login e senha do administrador são obrigatórios.' });
  }
  if (String(adm.senha).length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  if (!['Com Estoque', 'Sem Estoque'].includes(empresa.modelo_estoque || 'Com Estoque')) {
    return res.status(400).json({ message: 'Selecione um modelo de estoque válido.' });
  }

  const normalizedPhone = normalizeBrazilianPhone(empresa.telefone);
  if (!normalizedPhone) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }
  if (digitsOnly(empresa.cep).length !== 8) {
    return res.status(400).json({ message: 'Informe um CEP válido com 8 dígitos.' });
  }

  try {
    const result = await db.withTransaction(async connection => {
      const [company] = await connection.execute(
        `INSERT INTO empresas
          (nome, nome_juridico, cnpj_normalizado, email, telefone_normalizado,
           logradouro, numero, complemento, bairro, cidade, uf, cep,
           horario_funcionamento, modelo_estoque)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empresa.nome_juridico.trim(),
          empresa.nome_juridico.trim(),
          digitsOnly(empresa.cnpj),
          empresa.email.trim().toLowerCase(),
          normalizedPhone,
          empresa.logradouro.trim(),
          empresa.numero.trim(),
          empresa.complemento?.trim() || null,
          empresa.bairro.trim(),
          empresa.cidade.trim(),
          empresa.uf.trim().toUpperCase(),
          digitsOnly(empresa.cep),
          empresa.horario_funcionamento?.trim() || null,
          empresa.modelo_estoque || 'Com Estoque'
        ]
      );
      const passwordHash = bcrypt.hashSync(adm.senha, 12);
      await connection.execute(
        `INSERT INTO usuarios
          (id_empresa, nome, email, login_normalizado, senha_hash, perfil)
         VALUES (?, ?, ?, ?, ?, 'ADMIN')`,
        [
          company.insertId,
          String(adm.nome).trim(),
          empresa.email.trim().toLowerCase(),
          String(adm.login).trim().toLowerCase(),
          passwordHash
        ]
      );
      return { id_empresa: company.insertId };
    });

    return res.status(201).json({
      message: 'Empresa e administrador cadastrados com sucesso.',
      ...result
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'CNPJ, e-mail ou login indisponível.' });
    }
    throw error;
  }
});

module.exports = router;
