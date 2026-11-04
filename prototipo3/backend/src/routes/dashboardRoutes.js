const express = require('express');
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, requireRoles('Admin'));

router.get('/', async (req, res) => {
  const companyId = req.user.id_empresa;
  const [companies, orders, clients, parts, technicians] = await Promise.all([
    db.query(
      `SELECT id_empresa, nome AS nome_juridico, cnpj_normalizado AS cnpj,
              telefone_normalizado AS telefone, email, modelo_estoque
         FROM empresas WHERE id_empresa = ? AND ativo = 1`,
      [companyId]
    ),
    db.query(
      `SELECT COUNT(*) AS qtdOS,
              COALESCE(SUM(CASE WHEN status = 'Concluída' THEN valor_liquido ELSE 0 END), 0) AS faturamentoTotal,
              COALESCE(SUM(CASE WHEN status = 'Concluída'
                AND data_fim_garantia >= CURRENT_DATE THEN 1 ELSE 0 END), 0) AS garantiasAtivas
         FROM ordens_servico
        WHERE id_empresa = ? AND excluida_em IS NULL`,
      [companyId]
    ),
    db.query('SELECT COUNT(*) AS totalClientes FROM clientes WHERE id_empresa = ? AND ativo = 1', [companyId]),
    db.query('SELECT COUNT(*) AS totalPecas FROM itens_estoque WHERE id_empresa = ? AND ativo = 1', [companyId]),
    db.query(
      `SELECT COUNT(*) AS totalTecnicos
         FROM funcionarios f
         JOIN usuarios u ON u.id_empresa = f.id_empresa AND u.id_usuario = f.id_usuario
        WHERE f.id_empresa = ? AND f.ativo = 1 AND u.ativo = 1 AND u.perfil = 'TECNICO'`,
      [companyId]
    )
  ]);

  if (!companies[0]) return res.status(404).json({ message: 'Empresa não encontrada.' });
  res.json({
    empresa: companies[0],
    faturamentoTotal: orders[0].faturamentoTotal,
    qtdOS: orders[0].qtdOS,
    garantiasAtivas: orders[0].garantiasAtivas,
    totalClientes: clients[0].totalClientes,
    totalPecas: parts[0].totalPecas,
    totalTecnicos: technicians[0].totalTecnicos
  });
});

module.exports = router;
