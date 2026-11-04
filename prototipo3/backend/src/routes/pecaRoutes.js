const express = require('express');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function validPrice(value) {
  return value === undefined || (Number.isFinite(Number(value)) && Number(value) >= 0);
}

const selectParts = `SELECT i.id_peca, i.id_empresa, i.nome AS nome_peca, i.categoria,
                            i.preco_venda, i.custo_unitario AS preco_custo_atual,
                            i.saldo_disponivel AS quantidade_estoque,
                            i.saldo_fisico, i.saldo_reservado, i.estoque_minimo,
                            i.id_fornecedor, f.nome AS fornecedor_nome, i.ativo
                       FROM itens_estoque i
                       LEFT JOIN fornecedores f
                         ON f.id_empresa = i.id_empresa AND f.id_fornecedor = i.id_fornecedor`;

async function supplierIsActive(connection, companyId, supplierId) {
  const [rows] = await connection.execute(
    `SELECT id_fornecedor FROM fornecedores
      WHERE id_fornecedor = ? AND id_empresa = ? AND ativo = 1`,
    [supplierId, companyId]
  );
  return Boolean(rows[0]);
}

router.get('/', requireRoles('Admin', 'Tecnico'), async (req, res) => {
  const active = req.query.ativo === '0' && req.user.perfil === 'Admin' ? 0 : 1;
  const rows = await db.query(
    `${selectParts}
      WHERE i.id_empresa = ? AND i.ativo = ?
      ORDER BY i.nome`,
    [req.user.id_empresa, active]
  );
  res.json(rows);
});

router.post('/', requireRoles('Admin'), async (req, res) => {
  const { nome_peca, categoria, preco_custo_atual, preco_venda, id_fornecedor } = req.body;
  if (!nome_peca) return res.status(400).json({ message: 'Nome da peça é obrigatório.' });
  if (!isValidId(id_fornecedor)) {
    return res.status(400).json({ message: 'Selecione um fornecedor para a peça.' });
  }
  if (!validPrice(preco_custo_atual) || !validPrice(preco_venda)) {
    return res.status(400).json({ message: 'Os preços devem ser maiores ou iguais a zero.' });
  }
  if (req.body.quantidade_estoque !== undefined) {
    return res.status(400).json({ message: 'O saldo só pode ser alterado por movimentação de estoque.' });
  }

  const id = await db.withTransaction(async connection => {
    if (!await supplierIsActive(connection, req.user.id_empresa, id_fornecedor)) return null;
    const [result] = await connection.execute(
      `INSERT INTO itens_estoque
        (id_empresa, id_fornecedor, nome, categoria, custo_unitario, preco_venda)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.id_empresa,
        id_fornecedor,
        String(nome_peca).trim(),
        String(categoria || '').trim() || null,
        Number(preco_custo_atual || 0),
        Number(preco_venda || 0)
      ]
    );
    return result.insertId;
  });
  if (!id) return res.status(400).json({ message: 'Fornecedor não encontrado ou inativo nesta empresa.' });
  const rows = await db.query(
    `${selectParts} WHERE i.id_peca = ? AND i.id_empresa = ?`,
    [id, req.user.id_empresa]
  );
  res.status(201).json(rows[0]);
});

router.put('/:id', requireRoles('Admin'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Peça não encontrada.' });
  const allowedFields = ['nome_peca', 'categoria', 'id_fornecedor', 'preco_custo_atual', 'preco_venda'];
  const entries = Object.entries(req.body);
  if (req.body.quantidade_estoque !== undefined) {
    return res.status(400).json({ message: 'O saldo só pode ser alterado por movimentação de estoque.' });
  }
  if (!entries.length || entries.some(([field]) => !allowedFields.includes(field))) {
    return res.status(400).json({ message: 'A solicitação contém campos vazios ou não permitidos.' });
  }
  if (!validPrice(req.body.preco_custo_atual) || !validPrice(req.body.preco_venda)) {
    return res.status(400).json({ message: 'Os preços devem ser maiores ou iguais a zero.' });
  }

  const columnMap = { nome_peca: 'nome', preco_custo_atual: 'custo_unitario' };
  const updated = await db.withTransaction(async connection => {
    const [existing] = await connection.execute(
      `SELECT id_peca FROM itens_estoque
        WHERE id_peca = ? AND id_empresa = ? AND ativo = 1
        FOR UPDATE`,
      [req.params.id, req.user.id_empresa]
    );
    if (!existing[0]) return false;
    if (req.body.id_fornecedor !== undefined
      && !await supplierIsActive(connection, req.user.id_empresa, req.body.id_fornecedor)) {
      return 'invalid-supplier';
    }
    const assignments = entries.map(([field]) => `\`${columnMap[field] || field}\` = ?`);
    const values = entries.map(([, value]) => value === '' ? null : value);
    await connection.execute(
      `UPDATE itens_estoque SET ${assignments.join(', ')}
        WHERE id_peca = ? AND id_empresa = ?`,
      [...values, req.params.id, req.user.id_empresa]
    );
    return true;
  });
  if (updated === 'invalid-supplier') {
    return res.status(400).json({ message: 'Fornecedor não encontrado ou inativo nesta empresa.' });
  }
  if (!updated) return res.status(404).json({ message: 'Peça não encontrada.' });
  const rows = await db.query(
    `${selectParts} WHERE i.id_peca = ? AND i.id_empresa = ?`,
    [req.params.id, req.user.id_empresa]
  );
  res.json(rows[0]);
});

router.delete('/:id', requireRoles('Admin'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Peça não encontrada.' });
  const result = await db.query(
    'UPDATE itens_estoque SET ativo = 0 WHERE id_peca = ? AND id_empresa = ? AND ativo = 1',
    [req.params.id, req.user.id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Peça não encontrada.' });
  res.json({ message: 'Peça inativada com sucesso.' });
});

module.exports = router;
