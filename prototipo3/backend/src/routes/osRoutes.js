const express = require('express');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { getOrderVisibilityFilter } = require('../services/orderVisibility');

const router = express.Router();
router.use(authMiddleware);

const selectOrders = `SELECT o.*,
                             o.equipamento_marca AS marca,
                             o.equipamento_modelo AS modelo,
                             o.equipamento_identificador AS numero_serie,
                             o.subtotal AS valor_total,
                             DATE(o.aberta_em) AS data_abertura,
                             DATE(o.concluida_em) AS data_fechamento,
                             DATE(o.concluida_em) AS data_conclusao,
                             (o.excluida_em IS NULL) AS ativo,
                             c.nome AS cliente_nome,
                             c.id_cliente AS cliente_id,
                             f.id_funcionario AS id_tecnico_responsavel,
                             t.nome AS tecnico_nome
                        FROM ordens_servico o
                        JOIN clientes c
                          ON c.id_empresa = o.id_empresa AND c.id_cliente = o.id_cliente
                        LEFT JOIN funcionarios f
                          ON f.id_empresa = o.id_empresa
                         AND f.id_funcionario = o.id_tecnico_responsavel
                        LEFT JOIN usuarios t
                          ON t.id_empresa = f.id_empresa AND t.id_usuario = f.id_usuario`;

const allowedUpdateFields = [
  'id_tecnico_responsavel', 'tipo_documento', 'status', 'prioridade',
  'equipamento_tipo', 'marca', 'modelo', 'numero_serie',
  'condicoes_equipamento', 'acessorios', 'observacoes_tecnico',
  'local_atendimento', 'data_aprovacao', 'data_agendamento',
  'valor_total', 'valor_desconto', 'prazo_garantia_dias',
  'termo_garantia', 'assinatura_cliente_url', 'data_assinatura'
];

const validStatuses = [
  'Aberta', 'Em Orçamento', 'Aprovada', 'Em Atendimento',
  'Aguardando Peças', 'Concluída', 'Cancelada'
];
const allowedTransitions = {
  'Aberta': ['Em Orçamento', 'Cancelada'],
  'Em Orçamento': ['Aprovada', 'Cancelada'],
  'Aprovada': ['Em Atendimento', 'Cancelada'],
  'Em Atendimento': ['Aguardando Peças', 'Concluída', 'Cancelada'],
  'Aguardando Peças': ['Em Atendimento', 'Cancelada'],
  'Concluída': [],
  'Cancelada': []
};

function isValidId(value) {
  return /^\d+$/.test(String(value)) && Number(value) > 0;
}

function isValidMoney(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

function mapOrder(row) {
  return {
    ...row,
    cliente: row.cliente_id ? {
      id_cliente: row.cliente_id,
      nome_completo: row.cliente_nome
    } : null,
    tecnico: row.tecnico_nome ? {
      id_tecnico: row.id_tecnico_responsavel,
      nome: row.tecnico_nome
    } : null
  };
}

async function validateTechnician(connection, companyId, technicianId) {
  const [rows] = await connection.execute(
    `SELECT f.id_funcionario
       FROM funcionarios f
       JOIN usuarios u
         ON u.id_empresa = f.id_empresa AND u.id_usuario = f.id_usuario
      WHERE f.id_funcionario = ? AND f.id_empresa = ?
        AND f.ativo = 1 AND u.ativo = 1 AND u.perfil = 'TECNICO'`,
    [technicianId, companyId]
  );
  return Boolean(rows[0]);
}

router.get('/', requireRoles('Admin', 'Tecnico', 'Financeiro'), async (req, res) => {
  const visibility = getOrderVisibilityFilter(req.user, 'o');
  const conditions = ['o.id_empresa = ?', 'o.excluida_em IS NULL'];
  const values = [req.user.id_empresa];
  if (req.query.status) {
    conditions.push('o.status = ?');
    values.push(req.query.status);
  }
  if (req.query.busca) {
    conditions.push('(c.nome LIKE ? OR o.equipamento_tipo LIKE ? OR CAST(o.numero_os AS CHAR) LIKE ?)');
    const search = `%${String(req.query.busca).trim()}%`;
    values.push(search, search, search);
  }
  values.push(...visibility.values);
  const rows = await db.query(
    `${selectOrders}
      WHERE ${conditions.join(' AND ')}${visibility.sql}
      ORDER BY o.aberta_em DESC, o.id_os DESC`,
    values
  );
  res.json(rows.map(mapOrder));
});

router.get('/:id', requireRoles('Admin', 'Tecnico', 'Financeiro'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  const visibility = getOrderVisibilityFilter(req.user, 'o');
  const rows = await db.query(
    `${selectOrders}
      WHERE o.id_os = ? AND o.id_empresa = ? AND o.excluida_em IS NULL${visibility.sql}`,
    [req.params.id, req.user.id_empresa, ...visibility.values]
  );
  if (!rows[0]) return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  res.json(mapOrder(rows[0]));
});

router.post('/', requireRoles('Admin', 'Tecnico'), async (req, res) => {
  if (req.body.numero_os !== undefined) {
    return res.status(400).json({ message: 'A numeração da OS é gerada exclusivamente pelo sistema.' });
  }
  const { id_cliente, equipamento_tipo, relato_problema } = req.body;
  if (!id_cliente || !equipamento_tipo || !relato_problema) {
    return res.status(400).json({ message: 'Cliente, equipamento e relato do problema são obrigatórios.' });
  }
  if (!['OS', 'Orçamento'].includes(req.body.tipo_documento || 'OS')) {
    return res.status(400).json({ message: 'Tipo de documento inválido.' });
  }
  if (req.body.status !== undefined && req.body.status !== 'Aberta') {
    return res.status(400).json({ message: 'Uma nova ordem deve iniciar com status Aberta.' });
  }
  const warrantyDays = Number(req.body.prazo_garantia_dias || 90);
  if (!Number.isInteger(warrantyDays) || warrantyDays < 30 || warrantyDays > 90) {
    return res.status(400).json({ message: 'O prazo de garantia deve ficar entre 30 e 90 dias.' });
  }

  const technicianId = req.user.perfil === 'Tecnico'
    ? req.user.id_tecnico
    : (req.body.id_tecnico_responsavel || null);
  const created = await db.withTransaction(async connection => {
    const [clients] = await connection.execute(
      'SELECT id_cliente FROM clientes WHERE id_cliente = ? AND id_empresa = ? AND ativo = 1',
      [id_cliente, req.user.id_empresa]
    );
    if (!clients[0]) return { error: 'client' };
    if (technicianId && !await validateTechnician(connection, req.user.id_empresa, technicianId)) {
      return { error: 'technician' };
    }

    const [companies] = await connection.execute(
      `SELECT proximo_numero_os
         FROM empresas
        WHERE id_empresa = ? AND ativo = 1
        FOR UPDATE`,
      [req.user.id_empresa]
    );
    if (!companies[0]) return { error: 'company' };
    const orderNumber = companies[0].proximo_numero_os;
    await connection.execute(
      'UPDATE empresas SET proximo_numero_os = proximo_numero_os + 1 WHERE id_empresa = ?',
      [req.user.id_empresa]
    );

    const [result] = await connection.execute(
      `INSERT INTO ordens_servico
        (id_empresa, numero_os, id_cliente, id_criador, id_tecnico_responsavel,
         tipo_documento, prioridade, status, equipamento_tipo, equipamento_marca,
         equipamento_modelo, equipamento_identificador, relato, prazo_garantia_dias,
         subtotal, desconto_percentual, valor_desconto, valor_liquido)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Aberta', ?, ?, ?, ?, ?, ?, 0, 0, 0, 0)`,
      [
        req.user.id_empresa,
        orderNumber,
        id_cliente,
        req.user.id_usuario,
        technicianId,
        req.body.tipo_documento || 'OS',
        req.body.prioridade || 'Média',
        String(equipamento_tipo).trim(),
        req.body.marca || null,
        req.body.modelo || null,
        req.body.numero_serie || null,
        String(relato_problema).trim(),
        warrantyDays
      ]
    );
    await connection.execute(
      `INSERT INTO os_historico_status
        (id_empresa, id_os, status_anterior, status_novo, id_usuario_mudou)
       VALUES (?, ?, NULL, 'Aberta', ?)`,
      [req.user.id_empresa, result.insertId, req.user.id_usuario]
    );
    return { id_os: result.insertId };
  });

  if (created.error === 'client') return res.status(404).json({ message: 'Cliente não encontrado.' });
  if (created.error === 'technician') return res.status(404).json({ message: 'Técnico não encontrado.' });
  if (created.error === 'company') return res.status(404).json({ message: 'Empresa não encontrada.' });
  const rows = await db.query(
    `${selectOrders} WHERE o.id_os = ? AND o.id_empresa = ?`,
    [created.id_os, req.user.id_empresa]
  );
  res.status(201).json(mapOrder(rows[0]));
});

router.put('/:id', requireRoles('Admin', 'Tecnico'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  if (req.body.numero_os !== undefined) {
    return res.status(400).json({ message: 'A numeração da OS é gerada exclusivamente pelo sistema.' });
  }
  const entries = Object.entries(req.body);
  if (!entries.length || entries.some(([field]) => !allowedUpdateFields.includes(field))) {
    return res.status(400).json({ message: 'A solicitação contém campos vazios ou não permitidos.' });
  }
  if (req.user.perfil === 'Tecnico' && entries.some(([field]) => field === 'id_tecnico_responsavel')) {
    return res.status(403).json({ message: 'Técnicos não podem alterar o responsável pela OS.' });
  }
  if (req.body.status !== undefined && !validStatuses.includes(req.body.status)) {
    return res.status(400).json({ message: 'Status inválido.' });
  }
  for (const field of ['valor_total', 'valor_desconto']) {
    if (req.body[field] !== undefined && !isValidMoney(req.body[field])) {
      return res.status(400).json({ message: 'Os valores da OS devem ser maiores ou iguais a zero.' });
    }
    if (req.body.prazo_garantia_dias !== undefined) {
      const warrantyDays = Number(req.body.prazo_garantia_dias);
      if (!Number.isInteger(warrantyDays) || warrantyDays < 30 || warrantyDays > 90) {
        return res.status(400).json({ message: 'O prazo de garantia deve ficar entre 30 e 90 dias.' });
      }
    }
  }
  if (req.body.id_tecnico_responsavel && !isValidId(req.body.id_tecnico_responsavel)) {
    return res.status(400).json({ message: 'Técnico responsável inválido.' });
  }

  const visibility = getOrderVisibilityFilter(req.user, 'o');
  const updated = await db.withTransaction(async connection => {
    const [orders] = await connection.execute(
      `SELECT o.status, o.subtotal, o.valor_desconto, o.prazo_garantia_dias
         FROM ordens_servico o
        WHERE o.id_os = ? AND o.id_empresa = ? AND o.excluida_em IS NULL${visibility.sql}
        FOR UPDATE`,
      [req.params.id, req.user.id_empresa, ...visibility.values]
    );
    const order = orders[0];
    if (!order) return { error: 'not-found' };

    if (req.body.id_tecnico_responsavel
      && !await validateTechnician(connection, req.user.id_empresa, req.body.id_tecnico_responsavel)) {
      return { error: 'technician' };
    }

    const nextStatus = req.body.status || order.status;
    if (req.body.status && req.body.status !== order.status
      && !allowedTransitions[order.status].includes(req.body.status)) {
      return { error: 'transition' };
    }
    const total = req.body.valor_total === undefined ? Number(order.subtotal) : Number(req.body.valor_total);
    const discount = req.body.valor_desconto === undefined ? Number(order.valor_desconto) : Number(req.body.valor_desconto);
    if (discount > total) return { error: 'discount' };

    const columnMap = {
      marca: 'equipamento_marca',
      modelo: 'equipamento_modelo',
      numero_serie: 'equipamento_identificador',
      valor_total: 'subtotal'
    };
    const assignments = [];
    const values = [];
    for (const [field, value] of entries) {
      if (field === 'status' || field === 'valor_total' || field === 'valor_desconto') continue;
      assignments.push(`\`${columnMap[field] || field}\` = ?`);
      values.push(value === '' ? null : value);
    }
    if (req.body.valor_total !== undefined || req.body.valor_desconto !== undefined) {
      assignments.push('subtotal = ?', 'valor_desconto = ?', 'valor_liquido = ?');
      values.push(total, discount, Number((total - discount).toFixed(2)));
    }
    if (req.body.status) {
      assignments.push('status = ?');
      values.push(req.body.status);
    }
    if (req.body.status === 'Concluída') {
      const warrantyDays = Number(req.body.prazo_garantia_dias ?? order.prazo_garantia_dias);
      assignments.push(
        'concluida_em = CURRENT_TIMESTAMP(6)',
        'data_fim_garantia = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY)'
      );
      values.push(warrantyDays);
    }
    await connection.execute(
      `UPDATE ordens_servico SET ${assignments.join(', ')}
        WHERE id_os = ? AND id_empresa = ?`,
      [...values, req.params.id, req.user.id_empresa]
    );
    if (req.body.status && req.body.status !== order.status) {
      await connection.execute(
        `INSERT INTO os_historico_status
          (id_empresa, id_os, status_anterior, status_novo, id_usuario_mudou)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id_empresa, req.params.id, order.status, req.body.status, req.user.id_usuario]
      );
    }
    return {};
  });

  if (updated.error === 'not-found') return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  if (updated.error === 'technician') return res.status(404).json({ message: 'Técnico não encontrado.' });
  if (updated.error === 'transition') return res.status(400).json({ message: 'Transição de status não permitida.' });
  if (updated.error === 'discount') return res.status(400).json({ message: 'O desconto não pode ser maior que o valor total.' });
  const rows = await db.query(
    `${selectOrders} WHERE o.id_os = ? AND o.id_empresa = ?`,
    [req.params.id, req.user.id_empresa]
  );
  res.json(mapOrder(rows[0]));
});

router.delete('/:id', requireRoles('Admin'), async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  const result = await db.query(
    `UPDATE ordens_servico SET excluida_em = CURRENT_TIMESTAMP(6)
      WHERE id_os = ? AND id_empresa = ? AND excluida_em IS NULL`,
    [req.params.id, req.user.id_empresa]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Ordem de Serviço não encontrada.' });
  res.json({ message: 'Ordem de Serviço inativada com sucesso.' });
});

module.exports = router;
