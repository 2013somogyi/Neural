const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { normalizeBrazilianPhone } = require('../utils/normalization');

const router = express.Router();
router.use(authMiddleware, requireRoles('Admin'));

const technicianSelect = `SELECT f.id_funcionario AS id_tecnico, f.id_empresa,
                                 u.id_usuario, u.nome, u.login_normalizado AS login,
                                 u.email, f.telefone_normalizado AS telefone,
                                 f.cargo, f.salario_fixo, f.ativo
                            FROM funcionarios f
                            JOIN usuarios u
                              ON u.id_empresa = f.id_empresa AND u.id_usuario = f.id_usuario`;

function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function sendDuplicateLogin(error, res) {
  if (error.code !== 'ER_DUP_ENTRY') return false;
  res.status(409).json({ message: 'Login ou e-mail indisponível.' });
  return true;
}

function validateSalary(value) {
  if (value === undefined || value === '') return 0;
  const salary = Number(value);
  return Number.isFinite(salary) && salary >= 0 ? salary : null;
}

router.get('/', async (req, res) => {
  const active = req.query.ativo === '0' ? 0 : 1;
  const technicians = await db.query(
    `${technicianSelect}
      WHERE f.id_empresa = ? AND f.ativo = ? AND u.ativo = 1
      ORDER BY u.nome`,
    [req.user.id_empresa, active]
  );
  res.json(technicians);
});

router.post('/', async (req, res) => {
  const { nome, login, email, senha, telefone, cargo } = req.body;
  if (!nome || !login || !email || !senha) {
    return res.status(400).json({ message: 'Nome, login, e-mail e senha são obrigatórios.' });
  }
  if (String(senha).length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  const normalizedPhone = normalizeBrazilianPhone(telefone);
  if (telefone && !normalizedPhone) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }
  const salary = validateSalary(req.body.salario_fixo);
  if (salary === null) {
    return res.status(400).json({ message: 'Informe um salário válido, maior ou igual a zero.' });
  }

  try {
    const newTechnician = await db.withTransaction(async connection => {
      const passwordHash = bcrypt.hashSync(senha, 12);
      const [user] = await connection.execute(
        `INSERT INTO usuarios
          (id_empresa, nome, email, login_normalizado, senha_hash, perfil)
         VALUES (?, ?, ?, ?, ?, 'TECNICO')`,
        [
          req.user.id_empresa,
          String(nome).trim(),
          String(email).trim().toLowerCase(),
          String(login).trim().toLowerCase(),
          passwordHash
        ]
      );
      const [technician] = await connection.execute(
        `INSERT INTO funcionarios
          (id_empresa, id_usuario, nome, cpf_normalizado, telefone_normalizado, cargo, salario_fixo)
         VALUES (?, ?, ?, NULL, ?, ?, ?)`,
        [
          req.user.id_empresa,
          user.insertId,
          String(nome).trim(),
          normalizedPhone,
          String(cargo || 'Técnico').trim(),
          salary
        ]
      );
      return technician.insertId;
    });

    const rows = await db.query(
      `${technicianSelect}
        WHERE f.id_funcionario = ? AND f.id_empresa = ?`,
      [newTechnician, req.user.id_empresa]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    if (!sendDuplicateLogin(error, res)) throw error;
  }
});

router.put('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Técnico não encontrado.' });
  const allowedFields = ['nome', 'login', 'email', 'telefone', 'cargo', 'salario_fixo', 'senha'];
  const entries = Object.entries(req.body);
  if (!entries.length || entries.some(([field]) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: 'A solicitação contém campos vazios ou não permitidos.' });
  }
  if (req.body.senha !== undefined && String(req.body.senha).length < 8) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres.' });
  }
  if (req.body.telefone && !normalizeBrazilianPhone(req.body.telefone)) {
    return res.status(400).json({ message: 'Informe um telefone com DDD válido.' });
  }
  const salary = req.body.salario_fixo === undefined
    ? undefined
    : validateSalary(req.body.salario_fixo);
  if (salary === null) {
    return res.status(400).json({ message: 'Informe um salário válido, maior ou igual a zero.' });
  }

  try {
    const found = await db.withTransaction(async connection => {
      const [rows] = await connection.execute(
        `SELECT f.id_funcionario, f.id_usuario
           FROM funcionarios f
           JOIN usuarios u ON u.id_empresa = f.id_empresa AND u.id_usuario = f.id_usuario
          WHERE f.id_funcionario = ? AND f.id_empresa = ? AND f.ativo = 1 AND u.ativo = 1
          FOR UPDATE`,
        [req.params.id, req.user.id_empresa]
      );
      if (!rows[0]) return false;

      const userUpdates = [];
      const userValues = [];
      const technicianUpdates = [];
      const technicianValues = [];
      for (const [field, value] of entries) {
        if (['nome', 'login', 'email', 'senha'].includes(field)) {
          const column = field === 'login' ? 'login_normalizado' : field === 'senha' ? 'senha_hash' : field;
          const normalizedValue = field === 'senha'
            ? bcrypt.hashSync(value, 12)
            : field === 'login' || field === 'email'
              ? String(value).trim().toLowerCase()
              : String(value).trim();
          userUpdates.push(`\`${column}\` = ?`);
          userValues.push(normalizedValue);
          if (field === 'nome') {
            technicianUpdates.push('nome = ?');
            technicianValues.push(normalizedValue);
          }
        } else {
          const column = field === 'telefone' ? 'telefone_normalizado' : field;
          const normalizedValue = field === 'telefone'
            ? normalizeBrazilianPhone(value)
            : field === 'salario_fixo'
              ? salary
              : value;
          technicianUpdates.push(`\`${column}\` = ?`);
          technicianValues.push(normalizedValue);
        }
      }

      if (userUpdates.length) {
        await connection.execute(
          `UPDATE usuarios SET ${userUpdates.join(', ')}
            WHERE id_usuario = ? AND id_empresa = ?`,
          [...userValues, rows[0].id_usuario, req.user.id_empresa]
        );
      }
      if (technicianUpdates.length) {
        await connection.execute(
          `UPDATE funcionarios SET ${technicianUpdates.join(', ')}
            WHERE id_funcionario = ? AND id_empresa = ?`,
          [...technicianValues, req.params.id, req.user.id_empresa]
        );
      }
      return true;
    });

    if (!found) return res.status(404).json({ message: 'Técnico não encontrado.' });
    const rows = await db.query(
      `${technicianSelect}
        WHERE f.id_funcionario = ? AND f.id_empresa = ?`,
      [req.params.id, req.user.id_empresa]
    );
    res.json(rows[0]);
  } catch (error) {
    if (!sendDuplicateLogin(error, res)) throw error;
  }
});

router.delete('/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Técnico não encontrado.' });
  const result = await db.query(
    `UPDATE funcionarios SET ativo = 0
      WHERE id_funcionario = ? AND id_empresa = ? AND ativo = 1`,
    [req.params.id, req.user.id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Técnico não encontrado.' });
  await db.query(
    `UPDATE usuarios SET ativo = 0
      WHERE id_usuario = (
        SELECT id_usuario FROM funcionarios
         WHERE id_funcionario = ? AND id_empresa = ?
      ) AND id_empresa = ? AND perfil = 'TECNICO'`,
    [req.params.id, req.user.id_empresa, req.user.id_empresa]
  );
  res.json({ message: 'Técnico inativado com sucesso.' });
});

module.exports = router;
