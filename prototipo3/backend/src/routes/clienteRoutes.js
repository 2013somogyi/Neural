const express = require('express');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { digitsOnly, isValidCpf, isValidCnpj } = require('../utils/validation');
const { normalizeBrazilianPhone } = require('../utils/normalization');

const router = express.Router();
router.use(authMiddleware);

const editableFields = [
  'nome_completo', 'cpf_cnpj', 'rg', 'telefone', 'email', 'logradouro',
  'numero', 'complemento', 'bairro', 'cidade', 'uf', 'cep', 'ponto_referencia'
];

const clientSelect = `SELECT id_cliente, id_empresa, CAST(id_cliente AS CHAR) AS codigo,
                             nome AS nome_completo, cpf_cnpj, rg,
                             telefone_normalizado AS telefone, email, cep,
                             logradouro, numero, complemento, bairro, cidade, uf,
                             ponto_referencia, detalhes_geral, ativo,
                             criado_em AS created_at, atualizado_em AS updated_at
                        FROM clientes`;

function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function normalizeDocument(value) {
  const document = digitsOnly(value);
  if (document.length === 11 && isValidCpf(document)) return document;
  if (document.length === 14 && isValidCnpj(document)) return document;
  return null;
}

function mapClientError(error, res) {
  if (error.code === 'ER_DUP_ENTRY') {
    res.status(409).json({ message: 'Já existe um cliente com este CPF/CNPJ ou telefone nesta empresa.' });
    return true;
  }
  return false;
}

function getClientValues(body, fields) {
  return fields.map(field => {
    const value = body[field];
    if (value === undefined || value === null || value === '') return null;
    if (field === 'cpf_cnpj') return normalizeDocument(value);
    if (field === 'telefone') return normalizeBrazilianPhone(value);
    if (field === 'uf') return String(value).trim().toUpperCase();
    if (field === 'cep') return digitsOnly(value);
    return typeof value === 'string' ? value.trim() : value;
  });
}

router.get('/', requireRoles('Admin', 'Tecnico', 'Financeiro'), async (req, res) => {
  const search = String(req.query.busca || '').trim();
  const searchType = ['nome', 'telefone', 'codigo'].includes(req.query.tipo) ? req.query.tipo : 'nome';
  const active = req.query.ativo === '0' && req.user.perfil === 'Admin' ? 0 : 1;
  const conditions = ['id_empresa = ?', 'ativo = ?'];
  const values = [req.user.id_empresa, active];
  if (search) {
    conditions.push(searchType === 'codigo'
      ? 'CAST(id_cliente AS CHAR) LIKE ?'
      : searchType === 'telefone'
        ? 'telefone_normalizado LIKE ?'
        : 'nome LIKE ?');
    values.push(`%${searchType === 'telefone' ? digitsOnly(search) : search}%`);
  }
  const clients = await db.query(
    `${clientSelect}
      WHERE ${conditions.join(' AND ')}
      ORDER BY nome`,
    values
  );
  res.json(clients);
});

router.get('/:id', requireRoles('Admin', 'Tecnico', 'Financeiro'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Cliente não encontrado.' });

  const rows = await db.query(
    `${clientSelect}
      WHERE id_cliente = ? AND id_empresa = ? AND ativo = 1`,
    [req.params.id, req.user.id_empresa]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Cliente não encontrado.' });

  const orders = await db.query(
    `SELECT id_os, numero_os, tipo_documento, status, equipamento_tipo,
            valor_liquido, DATE(aberta_em) AS data_abertura
       FROM ordens_servico
      WHERE id_cliente = ? AND id_empresa = ? AND excluida_em IS NULL
      ORDER BY aberta_em DESC`,
    [req.params.id, req.user.id_empresa]
  );
  res.json({ ...rows[0], os: orders });
});

router.post('/', requireRoles('Admin', 'Tecnico'), async (req, res) => {
  const fields = Object.keys(req.body);
  if (fields.some(field => !editableFields.includes(field))) {
    return res.status(400).json({ message: 'Há campos não permitidos na solicitação.' });
  }
  const { nome_completo, cpf_cnpj, telefone } = req.body;
  if (!nome_completo || !cpf_cnpj || !telefone) {
    return res.status(400).json({ message: 'Nome, CPF/CNPJ e telefone são obrigatórios.' });
  }
  const document = normalizeDocument(cpf_cnpj);
  if (!document) return res.status(400).json({ message: 'Informe um CPF ou CNPJ válido.' });
  const phone = normalizeBrazilianPhone(telefone);
  if (!phone) return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  if (req.body.cep && digitsOnly(req.body.cep).length !== 8) {
    return res.status(400).json({ message: 'Informe um CEP válido com 8 dígitos.' });
  }
  if (req.body.uf && String(req.body.uf).trim().length !== 2) {
    return res.status(400).json({ message: 'Informe uma UF com 2 letras.' });
  }

  const values = getClientValues(req.body, editableFields);
  values[editableFields.indexOf('cpf_cnpj')] = document;
  values[editableFields.indexOf('telefone')] = phone;
  try {
    const result = await db.query(
      `INSERT INTO clientes
        (id_empresa, nome, cpf_cnpj, rg, telefone_normalizado, email, logradouro,
         numero, complemento, bairro, cidade, uf, cep, ponto_referencia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id_empresa, ...values]
    );
    const rows = await db.query(
      `${clientSelect} WHERE id_cliente = ? AND id_empresa = ?`,
      [result.insertId, req.user.id_empresa]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (!mapClientError(error, res)) throw error;
  }
});

router.put('/:id', requireRoles('Admin', 'Tecnico'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Cliente não encontrado.' });
  const entries = Object.entries(req.body);
  if (!entries.length || entries.some(([field]) => !editableFields.includes(field))) {
    return res.status(400).json({ message: 'A solicitação contém campos vazios ou não permitidos.' });
  }
  if (req.body.cpf_cnpj !== undefined && !normalizeDocument(req.body.cpf_cnpj)) {
    return res.status(400).json({ message: 'Informe um CPF ou CNPJ válido.' });
  }
  if (req.body.telefone !== undefined && !normalizeBrazilianPhone(req.body.telefone)) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }
  if (req.body.cep && digitsOnly(req.body.cep).length !== 8) {
    return res.status(400).json({ message: 'Informe um CEP válido com 8 dígitos.' });
  }
  if (req.body.uf && String(req.body.uf).trim().length !== 2) {
    return res.status(400).json({ message: 'Informe uma UF com 2 letras.' });
  }

  const columnMap = {
    nome_completo: 'nome',
    telefone: 'telefone_normalizado'
  };
  const assignments = entries.map(([field]) => `\`${columnMap[field] || field}\` = ?`).join(', ');
  const normalizedValues = entries.map(([field, value]) => {
    if (field === 'cpf_cnpj') return normalizeDocument(value);
    if (field === 'telefone') return normalizeBrazilianPhone(value);
    if (field === 'uf' && value) return String(value).trim().toUpperCase();
    if (field === 'cep' && value) return digitsOnly(value);
    return value === '' ? null : value;
  });

  try {
    const result = await db.query(
      `UPDATE clientes SET ${assignments}
        WHERE id_cliente = ? AND id_empresa = ? AND ativo = 1`,
      [...normalizedValues, req.params.id, req.user.id_empresa]
    );
    if (result.affectedRows === 0) {
      const existing = await db.query(
        'SELECT id_cliente FROM clientes WHERE id_cliente = ? AND id_empresa = ? AND ativo = 1',
        [req.params.id, req.user.id_empresa]
      );
      if (!existing[0]) return res.status(404).json({ message: 'Cliente não encontrado.' });
    }
    const rows = await db.query(
      `${clientSelect} WHERE id_cliente = ? AND id_empresa = ?`,
      [req.params.id, req.user.id_empresa]
    );
    res.json(rows[0]);
  } catch (error) {
    if (!mapClientError(error, res)) throw error;
  }
});

router.delete('/:id', requireRoles('Admin'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Cliente não encontrado.' });
  const result = await db.query(
    'UPDATE clientes SET ativo = 0 WHERE id_cliente = ? AND id_empresa = ? AND ativo = 1',
    [req.params.id, req.user.id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Cliente não encontrado.' });
  res.json({ message: 'Cliente inativado com sucesso.' });
});

module.exports = router;
