const mysql = require('mysql2/promise');

const requiredEnvironment = ['DB_USER', 'DB_NAME'];
const missingEnvironment = requiredEnvironment.filter(name => !process.env[name]);

if (missingEnvironment.length > 0) {
  throw new Error(`Configure as variáveis de ambiente obrigatórias: ${missingEnvironment.join(', ')}.`);
}

const port = Number(process.env.DB_PORT || 3306);
const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT || 10);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT deve ser uma porta TCP válida.');
}
if (!Number.isInteger(connectionLimit) || connectionLimit < 1) {
  throw new Error('DB_CONNECTION_LIMIT deve ser um inteiro positivo.');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit,
  queueLimit: 0,
  decimalNumbers: true
});

const requiredTables = [
  'empresas', 'usuarios', 'assinaturas', 'clientes', 'fornecedores', 'funcionarios',
  'servicos', 'itens_estoque', 'ordens_servico', 'orcamentos', 'itens_os',
  'reservas_estoque', 'movimentacoes_estoque', 'alertas_estoque', 'minutas_compra',
  'itens_minuta_compra', 'audit_logs', 'notification_outbox', 'comentarios_os',
  'notificacoes', 'os_historico_status'
];

const requiredColumns = {
  empresas: ['nome_juridico', 'logradouro', 'numero', 'modelo_estoque'],
  usuarios: ['login_normalizado', 'perfil', 'senha_hash'],
  clientes: ['cpf_cnpj', 'rg', 'ponto_referencia'],
  fornecedores: ['produtos'],
  funcionarios: ['telefone_normalizado', 'cargo', 'salario_fixo'],
  itens_estoque: ['categoria'],
  ordens_servico: [
    'tipo_documento', 'prioridade', 'id_tecnico_responsavel', 'prazo_garantia_dias',
    'condicoes_equipamento', 'acessorios', 'observacoes_tecnico', 'local_atendimento',
    'data_aprovacao', 'data_agendamento', 'data_fim_garantia', 'termo_garantia',
    'assinatura_cliente_url', 'data_assinatura'
  ]
};

async function initialize() {
  try {
    await pool.query('SELECT 1');
    const [existingTables] = await pool.execute(
      `SELECT TABLE_NAME
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${requiredTables.map(() => '?').join(', ')})`,
      requiredTables
    );
    const existingTableSet = new Set(existingTables.map(row => row.TABLE_NAME));
    const missingTables = requiredTables.filter(table => !existingTableSet.has(table));

    const requiredColumnNames = Object.entries(requiredColumns)
      .flatMap(([table, columns]) => columns.map(column => ({ table, column })));
    const columnTables = Object.keys(requiredColumns);
    const [existingColumns] = await pool.execute(
      `SELECT TABLE_NAME, COLUMN_NAME
         FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${columnTables.map(() => '?').join(', ')})`,
      columnTables
    );
    const existingColumnSet = new Set(
      existingColumns.map(row => `${row.TABLE_NAME}.${row.COLUMN_NAME}`)
    );
    const missingColumns = requiredColumnNames
      .filter(({ table, column }) => !existingColumnSet.has(`${table}.${column}`))
      .map(({ table, column }) => `${table}.${column}`);

    if (missingTables.length || missingColumns.length) {
      const problems = [
        missingTables.length ? `tabelas ausentes: ${missingTables.join(', ')}` : null,
        missingColumns.length ? `colunas ausentes: ${missingColumns.join(', ')}` : null
      ].filter(Boolean).join('; ');
      throw new Error(
        `Schema incompatível na base "${process.env.DB_NAME}" (${problems}). ` +
        'Use o schema plural do projeto e aplique as migrações em backend/src/db/migrations.'
      );
    }

    console.log(`Conectado ao MySQL na base ${process.env.DB_NAME}.`);
  } catch (error) {
    await pool.end();
    throw new Error(`Falha ao conectar ou validar o schema do MySQL: ${error.message}`, { cause: error });
  }
}

const ready = initialize();

async function query(sql, values = []) {
  await ready;
  const [rows] = await pool.execute(sql, values);
  return rows;
}

async function withTransaction(work) {
  await ready;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  ready,
  query,
  withTransaction,
  close: () => pool.end()
};
