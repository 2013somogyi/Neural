const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');

const migrationId = '001_app_compatibility';
const migrationPath = path.join(__dirname, 'migrations', `${migrationId}.sql`);
const requiredBaseTables = [
  'empresas',
  'usuarios',
  'clientes',
  'fornecedores',
  'funcionarios',
  'itens_estoque',
  'ordens_servico'
];

function splitStatements(sql) {
  const source = sql.replace(/^\uFEFF/, '');
  const statements = [];
  let statement = '';
  let quote = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (character === '\n') {
        lineComment = false;
        statement += character;
      }
      continue;
    }
    if (blockComment) {
      if (character === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      statement += character;
      if (character === '\\' && quote !== '`' && next) {
        statement += next;
        index += 1;
      } else if (character === quote) {
        if (next === quote) {
          statement += next;
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if ((character === '-' && next === '-' && /\s/.test(source[index + 2] || ' '))
      || character === '#') {
      lineComment = true;
      index += character === '-' ? 1 : 0;
    } else if (character === '/' && next === '*') {
      blockComment = true;
      index += 1;
    } else if (character === '\'' || character === '"' || character === '`') {
      quote = character;
      statement += character;
    } else if (character === ';') {
      if (statement.trim()) statements.push(statement.trim());
      statement = '';
    } else {
      statement += character;
    }
  }

  if (quote) throw new Error('Arquivo SQL terminou com uma string ou identificador sem fechar.');
  if (blockComment) throw new Error('Arquivo SQL terminou com um comentário sem fechar.');
  if (statement.trim()) statements.push(statement.trim());
  return statements;
}

async function tableExists(connection, table) {
  const [rows] = await connection.execute(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return rows.length > 0;
}

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT COLUMN_NAME, IS_NULLABLE
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0] || null;
}

async function indexExists(connection, table, index) {
  const [rows] = await connection.execute(
    `SELECT INDEX_NAME
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ? AND INDEX_NAME = ?
      LIMIT 1`,
    [table, index]
  );
  return rows.length > 0;
}

async function constraintExists(connection, table, constraint) {
  const [rows] = await connection.execute(
    `SELECT CONSTRAINT_NAME
       FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?`,
    [table, constraint]
  );
  return rows.length > 0;
}

async function shouldSkipStatement(connection, statement) {
  const useDatabase = statement.match(/^USE\s+`?([a-zA-Z0-9_]+)`?$/i);
  if (useDatabase) {
    if (useDatabase[1].toLowerCase() !== process.env.DB_NAME.toLowerCase()) {
      throw new Error(
        `A migration seleciona "${useDatabase[1]}", mas DB_NAME aponta para "${process.env.DB_NAME}".`
      );
    }
    return true;
  }

  const addColumn = statement.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+COLUMN\s+`?([a-zA-Z0-9_]+)`?/i
  );
  if (addColumn) {
    return Boolean(await columnExists(connection, addColumn[1], addColumn[2]));
  }

  const modifyColumn = statement.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+MODIFY\s+COLUMN\s+`?([a-zA-Z0-9_]+)`?/i
  );
  if (modifyColumn) {
    const column = await columnExists(connection, modifyColumn[1], modifyColumn[2]);
    if (!column) {
      throw new Error(`Não foi encontrada a coluna ${modifyColumn[1]}.${modifyColumn[2]} para ajustar.`);
    }
    return column.IS_NULLABLE === 'YES';
  }

  const addIndex = statement.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+(?:UNIQUE\s+)?KEY\s+`?([a-zA-Z0-9_]+)`?/i
  );
  if (addIndex) {
    return indexExists(connection, addIndex[1], addIndex[2]);
  }

  const addConstraint = statement.match(
    /^ALTER\s+TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD\s+CONSTRAINT\s+`?([a-zA-Z0-9_]+)`?/i
  );
  if (addConstraint) {
    return constraintExists(connection, addConstraint[1], addConstraint[2]);
  }

  const createTable = statement.match(/^CREATE\s+TABLE\s+`?([a-zA-Z0-9_]+)`?/i);
  if (createTable) {
    return tableExists(connection, createTable[1]);
  }

  if (/^UPDATE\s+/i.test(statement)) return false;
  throw new Error(`Comando de migration não suportado pelo executor: ${statement.slice(0, 80)}`);
}

async function runMigration() {
  const dbName = process.env.DB_NAME;
  const user = process.env.DB_USER;
  if (!dbName || !user) {
    throw new Error('Configure DB_NAME e DB_USER no arquivo .env antes de executar a migration.');
  }
  if (dbName.toLowerCase() !== 'neural') {
    throw new Error(`A migration só pode ser aplicada à base NEURAL; DB_NAME está como "${dbName}".`);
  }

  const port = Number(process.env.DB_PORT || 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT deve ser uma porta TCP válida.');
  }

  const sql = await fs.readFile(migrationPath, 'utf8');
  const statements = splitStatements(sql);
  const checksum = crypto.createHash('sha256').update(sql).digest('hex');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port,
    user,
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    timezone: 'Z'
  });
  const lockName = `neural:${migrationId}`;
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.execute('SELECT GET_LOCK(?, 0) AS acquired', [lockName]);
    lockAcquired = lockRows[0]?.acquired === 1;
    if (!lockAcquired) {
      throw new Error('Outra execução da migration está ativa; aguarde e tente novamente.');
    }

    const [databaseRows] = await connection.query('SELECT DATABASE() AS selectedDatabase');
    if (databaseRows[0]?.selectedDatabase?.toLowerCase() !== 'neural') {
      throw new Error(`Conexão selecionou a base errada: ${databaseRows[0]?.selectedDatabase || '(nenhuma)'}.`);
    }

    const [baseTables] = await connection.execute(
      `SELECT TABLE_NAME
         FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (${requiredBaseTables.map(() => '?').join(', ')})`,
      requiredBaseTables
    );
    const existingTables = new Set(baseTables.map(row => row.TABLE_NAME));
    const missingTables = requiredBaseTables.filter(table => !existingTables.has(table));
    if (missingTables.length) {
      throw new Error(
        `A base NEURAL não corresponde ao schema esperado. Tabelas ausentes: ${missingTables.join(', ')}.`
      );
    }

    await connection.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         migration_id VARCHAR(120) NOT NULL,
         checksum CHAR(64) NOT NULL,
         applied_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
         PRIMARY KEY (migration_id)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    );

    const [appliedRows] = await connection.execute(
      'SELECT checksum FROM schema_migrations WHERE migration_id = ?',
      [migrationId]
    );
    if (appliedRows[0]) {
      if (appliedRows[0].checksum !== checksum) {
        throw new Error('A migration já foi registrada com outro conteúdo; não altere um arquivo já aplicado.');
      }
      console.log(`Migration ${migrationId} já aplicada na base ${dbName}.`);
      return;
    }

    let executed = 0;
    let skipped = 0;
    for (const statement of statements) {
      if (await shouldSkipStatement(connection, statement)) {
        skipped += 1;
        continue;
      }
      await connection.query(statement);
      executed += 1;
    }

    await connection.execute(
      'INSERT INTO schema_migrations (migration_id, checksum) VALUES (?, ?)',
      [migrationId, checksum]
    );
    console.log(
      `Migration ${migrationId} concluída em ${dbName}. ` +
      `Comandos executados: ${executed}; já existentes: ${skipped}.`
    );
  } finally {
    if (lockAcquired) {
      await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
    }
    await connection.end();
  }
}

if (require.main === module) {
  runMigration().catch(error => {
    console.error(`Falha ao executar migration: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { splitStatements, runMigration };
