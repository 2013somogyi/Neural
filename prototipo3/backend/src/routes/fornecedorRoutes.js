const express = require('express');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { digitsOnly, isValidCnpj } = require('../utils/validation');
const { normalizeBrazilianPhone } = require('../utils/normalization');

const router = express.Router();
router.use(authMiddleware, requireRoles('Admin'));

const supplierSelect = `SELECT id_fornecedor, id_empresa, nome AS nome_juridico,
                               cnpj_normalizado AS cnpj, produtos,
                               telefone_normalizado AS telefone, email, ativo
                          FROM fornecedores`;

function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function handleDuplicate(error, res) {
  if (error.code !== 'ER_DUP_ENTRY') return false;
  res.status(409).json({ message: 'Já existe um fornecedor com este CNPJ nesta empresa.' });
  return true;
}

router.get('/', async (req, res) => {
  const active = req.query.ativo === '0' ? 0 : 1;
  const rows = await db.query(
    `${supplierSelect}
      WHERE id_empresa = ? AND ativo = ?
      ORDER BY nome`,
    [req.user.id_empresa, active]
  );
  res.json(rows);
});

router.post('/', async (req, res) => {
  const { nome_juridico, cnpj, produtos, telefone, email } = req.body;
  if (!nome_juridico || !cnpj) {
    return res.status(400).json({ message: 'Nome jurídico e CNPJ são obrigatórios.' });
  }
  if (!isValidCnpj(cnpj)) return res.status(400).json({ message: 'Informe um CNPJ válido.' });
  const normalizedPhone = normalizeBrazilianPhone(telefone);
  if (telefone && !normalizedPhone) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO fornecedores
        (id_empresa, nome, cnpj_normalizado, produtos, telefone_normalizado, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id_empresa,
        String(nome_juridico).trim(),
        digitsOnly(cnpj),
        produtos?.trim() || null,
        normalizedPhone,
        email?.trim().toLowerCase() || null
      ]
    );
    const rows = await db.query(
      `${supplierSelect} WHERE id_fornecedor = ? AND id_empresa = ?`,
      [result.insertId, req.user.id_empresa]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (!handleDuplicate(error, res)) throw error;
  }
});

router.put('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  const allowedFields = ['nome_juridico', 'cnpj', 'produtos', 'telefone', 'email'];
  const entries = Object.entries(req.body);
  if (!entries.length || entries.some(([field]) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: 'A solicitação contém campos vazios ou não permitidos.' });
  }
  if (req.body.cnpj !== undefined && !isValidCnpj(req.body.cnpj)) {
    return res.status(400).json({ message: 'Informe um CNPJ válido.' });
  }
  if (req.body.telefone && !normalizeBrazilianPhone(req.body.telefone)) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }

  const columnMap = { nome_juridico: 'nome', cnpj: 'cnpj_normalizado', telefone: 'telefone_normalizado' };
  const assignments = entries.map(([field]) => `\`${columnMap[field] || field}\` = ?`).join(', ');
  const values = entries.map(([field, value]) => {
    if (value === '') return null;
    if (field === 'cnpj') return digitsOnly(value);
    if (field === 'telefone') return normalizeBrazilianPhone(value);
    if (field === 'email') return String(value).trim().toLowerCase();
    return typeof value === 'string' ? value.trim() : value;
  });

  try {
    const result = await db.query(
      `UPDATE fornecedores SET ${assignments}
        WHERE id_fornecedor = ? AND id_empresa = ? AND ativo = 1`,
      [...values, req.params.id, req.user.id_empresa]
    );
    if (!result.affectedRows) {
      const rows = await db.query(
        'SELECT id_fornecedor FROM fornecedores WHERE id_fornecedor = ? AND id_empresa = ? AND ativo = 1',
        [req.params.id, req.user.id_empresa]
      );
      if (!rows[0]) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
    }
    const rows = await db.query(
      `${supplierSelect} WHERE id_fornecedor = ? AND id_empresa = ?`,
      [req.params.id, req.user.id_empresa]
    );
    res.json(rows[0]);
  } catch (error) {
    if (!handleDuplicate(error, res)) throw error;
  }
});

router.delete('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  const result = await db.query(
    'UPDATE fornecedores SET ativo = 0 WHERE id_fornecedor = ? AND id_empresa = ? AND ativo = 1',
    [req.params.id, req.user.id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Fornecedor não encontrado.' });
  res.json({ message: 'Fornecedor inativado com sucesso.' });
});

module.exports = router;
