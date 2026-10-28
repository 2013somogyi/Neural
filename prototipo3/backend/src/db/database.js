const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const mysqlConfig = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  database: process.env.DB_NAME || 'NEURAL',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

class Database {
  constructor() {
    this.pool = null;
    this.isMysqlConnected = false;
    this.reset();
    this.initMySQL();
  }

  async initMySQL() {
    if (!mysql) return;
    try {
      // Connect without database first to ensure NEURAL db exists
      const conn = await mysql.createConnection({
        host: mysqlConfig.host,
        user: mysqlConfig.user,
        password: mysqlConfig.password,
        port: mysqlConfig.port
      });

      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\`;`);
      await conn.end();

      // Now create pool with target database
      this.pool = mysql.createPool(mysqlConfig);
      
      // Initialize Schema
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS empresas (
          id_empresa INT AUTO_INCREMENT PRIMARY KEY,
          nome_juridico VARCHAR(255) NOT NULL,
          cnpj VARCHAR(20) NOT NULL UNIQUE,
          telefone VARCHAR(30),
          email VARCHAR(255),
          logradouro VARCHAR(255),
          numero VARCHAR(20),
          complemento VARCHAR(100),
          bairro VARCHAR(100),
          cidade VARCHAR(100),
          uf VARCHAR(2),
          cep VARCHAR(10),
          horario VARCHAR(100),
          logo TEXT,
          plano VARCHAR(50) DEFAULT 'Prime',
          proximo_numero_os INT DEFAULT 1,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS tecnicos (
          id_tecnico INT AUTO_INCREMENT PRIMARY KEY,
          id_empresa INT NOT NULL,
          nome VARCHAR(255) NOT NULL,
          login VARCHAR(100) NOT NULL,
          cpf VARCHAR(20),
          cargo VARCHAR(100) DEFAULT 'Técnico',
          salario_fixo NUMERIC(10, 2) DEFAULT 0.00,
          senha_hash VARCHAR(255) NOT NULL,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_tecnicos_empresa FOREIGN KEY (id_empresa) REFERENCES empresas (id_empresa) ON DELETE CASCADE,
          CONSTRAINT uq_tecnicos_empresa_login UNIQUE (id_empresa, login)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS clientes (
          id_cliente INT AUTO_INCREMENT PRIMARY KEY,
          id_empresa INT NOT NULL,
          codigo VARCHAR(50),
          nome_completo VARCHAR(255) NOT NULL,
          cpf_cnpj VARCHAR(20),
          rg VARCHAR(30),
          telefone VARCHAR(30),
          email VARCHAR(255),
          logradouro VARCHAR(255),
          numero VARCHAR(20),
          complemento VARCHAR(100),
          bairro VARCHAR(100),
          cidade VARCHAR(100),
          uf VARCHAR(10),
          cep VARCHAR(10),
          ponto_referencia VARCHAR(255),
          detalhes_geral TEXT,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_clientes_empresa FOREIGN KEY (id_empresa) REFERENCES empresas (id_empresa) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS pecas (
          id_peca INT AUTO_INCREMENT PRIMARY KEY,
          id_empresa INT NOT NULL,
          nome_peca VARCHAR(255) NOT NULL,
          categoria VARCHAR(100),
          preco_custo_atual NUMERIC(10, 2) DEFAULT 0.00,
          preco_venda NUMERIC(10, 2) DEFAULT 0.00,
          quantidade_estoque INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_pecas_empresa FOREIGN KEY (id_empresa) REFERENCES empresas (id_empresa) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS fornecedores (
          id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
          id_empresa INT NOT NULL,
          nome_juridico VARCHAR(255) NOT NULL,
          cnpj VARCHAR(20),
          produtos TEXT,
          telefone VARCHAR(30),
          email VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_fornecedores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas (id_empresa) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS os (
          id_os INT AUTO_INCREMENT PRIMARY KEY,
          id_empresa INT NOT NULL,
          numero_os INT NOT NULL,
          id_cliente INT NOT NULL,
          tipo_documento VARCHAR(50) DEFAULT 'OS',
          status VARCHAR(50) DEFAULT 'Aberta',
          prioridade VARCHAR(50) DEFAULT 'Média',
          equipamento_tipo VARCHAR(100),
          marca VARCHAR(100),
          modelo VARCHAR(100),
          numero_serie VARCHAR(100),
          relato_problema TEXT,
          id_tecnico_responsavel INT,
          prazo_garantia_dias INT DEFAULT 90,
          valor_total NUMERIC(10, 2) DEFAULT 0.00,
          valor_desconto NUMERIC(10, 2) DEFAULT 0.00,
          valor_liquido NUMERIC(10, 2) DEFAULT 0.00,
          data_abertura DATE,
          data_conclusao DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_os_empresa FOREIGN KEY (id_empresa) REFERENCES empresas (id_empresa) ON DELETE CASCADE,
          CONSTRAINT fk_os_cliente FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente) ON DELETE RESTRICT,
          CONSTRAINT fk_os_tecnico FOREIGN KEY (id_tecnico_responsavel) REFERENCES tecnicos (id_tecnico) ON DELETE SET NULL,
          CONSTRAINT uq_os_empresa_numero UNIQUE (id_empresa, numero_os)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      this.isMysqlConnected = true;
      console.log(`✅ Conectado com sucesso ao MySQL na base ${mysqlConfig.database}`);

      await this.syncFromMySQL();
    } catch (err) {
      this.isMysqlConnected = false;
      console.log(`ℹ MySQL indisponível (${err.message}). Utilizando modo de dados em memória/persistência rápida.`);
    }
  }

  async syncFromMySQL() {
    if (!this.isMysqlConnected || !this.pool) return;
    try {
      const [empresasRows] = await this.pool.query('SELECT * FROM empresas');
      if (empresasRows.length === 0) {
        // Seed default records into MySQL
        for (const emp of this.empresas) {
          await this.saveToMySQL('empresas', emp);
        }
        for (const tec of this.tecnicos) {
          await this.saveToMySQL('tecnicos', tec);
        }
        for (const cli of this.clientes) {
          await this.saveToMySQL('clientes', cli);
        }
        for (const pec of this.pecas) {
          await this.saveToMySQL('pecas', pec);
        }
        for (const forn of this.fornecedores) {
          await this.saveToMySQL('fornecedores', forn);
        }
        for (const o of this.os) {
          await this.saveToMySQL('os', o);
        }
      } else {
        // Load existing MySQL rows into memory
        const tables = ['empresas', 'tecnicos', 'clientes', 'pecas', 'fornecedores', 'os'];
        for (const tbl of tables) {
          const [rows] = await this.pool.query(`SELECT * FROM \`${tbl}\``);
          this[tbl] = rows;
          const pk = this.getPkName(tbl);
          const maxId = rows.reduce((max, r) => Math.max(max, r[pk] || 0), 0);
          this.seq[tbl] = Math.max(this.seq[tbl], maxId);
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar com MySQL:', err);
    }
  }

  async saveToMySQL(table, row) {
    if (!this.isMysqlConnected || !this.pool) return;
    try {
      const keys = Object.keys(row).filter(k => row[k] !== undefined);
      const cols = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const values = keys.map(k => row[k]);
      const sql = `INSERT INTO \`${table}\` (${cols}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${keys.map(k => `\`${k}\` = VALUES(\`${k}\`)`).join(', ')}`;
      await this.pool.query(sql, values);
    } catch (err) {
      console.error(`Erro ao salvar na tabela ${table} em MySQL:`, err);
    }
  }

  async updateInMySQL(table, pkValue, patch) {
    if (!this.isMysqlConnected || !this.pool) return;
    try {
      const pkName = this.getPkName(table);
      const keys = Object.keys(patch).filter(k => patch[k] !== undefined);
      if (keys.length === 0) return;
      const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
      const values = [...keys.map(k => patch[k]), pkValue];
      const sql = `UPDATE \`${table}\` SET ${setClause} WHERE \`${pkName}\` = ?`;
      await this.pool.query(sql, values);
    } catch (err) {
      console.error(`Erro ao atualizar na tabela ${table} em MySQL:`, err);
    }
  }

  async deleteInMySQL(table, pkValue) {
    if (!this.isMysqlConnected || !this.pool) return;
    try {
      const pkName = this.getPkName(table);
      const sql = `DELETE FROM \`${table}\` WHERE \`${pkName}\` = ?`;
      await this.pool.query(sql, [pkValue]);
    } catch (err) {
      console.error(`Erro ao deletar da tabela ${table} em MySQL:`, err);
    }
  }

  reset() {
    this.empresas = [];
    this.tecnicos = [];
    this.clientes = [];
    this.pecas = [];
    this.fornecedores = [];
    this.os = [];
    this.seq = {
      empresas: 0,
      tecnicos: 0,
      clientes: 0,
      pecas: 0,
      fornecedores: 0,
      os: 0
    };
    this.seedDefaults();
  }

  seedDefaults() {
    const emp = this.insert('empresas', {
      nome_juridico: 'Neural Tech Soluções LTDA',
      cnpj: '12.345.678/0001-99',
      telefone: '(11) 98888-7777',
      email: 'contato@neuraltech.com.br',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Sala 402',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01310-100',
      horario: '08:00 as 18:00',
      plano: 'Prime',
      proximo_numero_os: 68
    });

    const salt = bcrypt.genSaltSync(10);
    const passHash = bcrypt.hashSync('123456', salt);

    const adm = this.insert('tecnicos', {
      id_empresa: emp.id_empresa,
      nome: 'Carlos Eduardo',
      login: 'admin',
      cpf: '123.456.789-00',
      cargo: 'Chefe de Oficina',
      salario_fixo: 4500.00,
      senha_hash: passHash
    });

    this.insert('tecnicos', {
      id_empresa: emp.id_empresa,
      nome: 'Marcos Vinicius',
      login: 'marcos.tec',
      cpf: '987.654.321-11',
      cargo: 'Técnico Hardware',
      salario_fixo: 3200.00,
      senha_hash: passHash
    });

    const cli1 = this.insert('clientes', {
      id_empresa: emp.id_empresa,
      codigo: '6967',
      nome_completo: 'Carl Johnson',
      cpf_cnpj: '678.326.510-58',
      rg: '767426594',
      telefone: '40028922',
      email: 'largatixaolimpica@gmail.com',
      logradouro: 'Rua sem saida',
      numero: '476',
      complemento: '',
      bairro: 'Ganton',
      cidade: 'Los Santos',
      uf: 'SA',
      cep: '00000-000',
      ponto_referencia: 'Após a ponte',
      detalhes_geral: 'Mora no meio do gueto'
    });

    this.insert('clientes', {
      id_empresa: emp.id_empresa,
      codigo: '7001',
      nome_completo: 'Lara Croft',
      cpf_cnpj: '111.222.333-44',
      rg: '987654321',
      telefone: '(11) 97777-1111',
      email: 'lara.croft@tomb.com',
      logradouro: 'Mansão Croft',
      numero: '01',
      complemento: 'Lote 2',
      bairro: 'Surrey',
      cidade: 'Londres',
      uf: 'SP',
      cep: '01452-000',
      ponto_referencia: 'Próximo ao museu',
      detalhes_geral: 'Cliente preferencial'
    });

    this.insert('pecas', {
      id_empresa: emp.id_empresa,
      nome_peca: 'SSD NVMe 1TB Kingston',
      categoria: 'Armazenamento',
      preco_custo_atual: 250.00,
      preco_venda: 420.00,
      quantidade_estoque: 15
    });

    this.insert('pecas', {
      id_empresa: emp.id_empresa,
      nome_peca: 'Pasta Térmica Implastec',
      categoria: 'Insumo',
      preco_custo_atual: 15.00,
      preco_venda: 45.00,
      quantidade_estoque: 40
    });

    this.insert('fornecedores', {
      id_empresa: emp.id_empresa,
      nome_juridico: 'Kabum Distribuidora S.A.',
      cnpj: '05.570.714/0001-59',
      produtos: 'Peças de Hardware em Geral',
      telefone: '(19) 2114-4400',
      email: 'compras@kabum.com.br'
    });

    this.insert('os', {
      id_empresa: emp.id_empresa,
      numero_os: 7,
      id_cliente: cli1.id_cliente,
      tipo_documento: 'OS',
      status: 'Em Execução',
      prioridade: 'Alta',
      equipamento_tipo: 'Console de Videogame',
      marca: 'Sony',
      modelo: 'PlayStation 5',
      numero_serie: 'PS5-88392',
      relato_problema: 'Aparelho desligando sozinho por superaquecimento',
      id_tecnico_responsavel: adm.id_tecnico,
      prazo_garantia_dias: 90,
      valor_total: 350.00,
      valor_desconto: 0.00,
      valor_liquido: 350.00,
      data_abertura: '2026-10-10'
    });
  }

  getPkName(table) {
    if (table === 'os') return 'id_os';
    if (table === 'empresas') return 'id_empresa';
    if (table === 'tecnicos') return 'id_tecnico';
    if (table === 'clientes') return 'id_cliente';
    if (table === 'pecas') return 'id_peca';
    return 'id_fornecedor';
  }

  insert(table, data) {
    this.seq[table]++;
    const pkName = this.getPkName(table);
    
    const row = {
      [pkName]: this.seq[table],
      ativo: 1,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      ...data
    };

    if (table === 'clientes' && !row.codigo) {
      row.codigo = String(4000 + row.id_cliente);
    }

    this[table].push(row);
    this.saveToMySQL(table, row);
    return row;
  }

  find(table, predicate) {
    return this[table].filter(predicate);
  }

  findOne(table, predicate) {
    return this[table].find(predicate);
  }

  update(table, pkValue, patch) {
    const pkName = this.getPkName(table);
    const index = this[table].findIndex(item => item[pkName] === pkValue);
    if (index === -1) return null;

    const updatedRow = {
      ...this[table][index],
      ...patch,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this[table][index] = updatedRow;
    this.updateInMySQL(table, pkValue, patch);
    return updatedRow;
  }

  delete(table, pkValue) {
    const pkName = this.getPkName(table);
    const index = this[table].findIndex(item => item[pkName] === pkValue);
    if (index === -1) return false;
    this[table].splice(index, 1);
    this.deleteInMySQL(table, pkValue);
    return true;
  }
}

const dbInstance = new Database();
module.exports = dbInstance;
