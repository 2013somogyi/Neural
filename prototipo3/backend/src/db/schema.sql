-- Schema SQL para o N Neural - MySQL

DROP DATABASE IF EXISTS NEURAL; 
CREATE DATABASE IF NOT EXISTS NEURAL; 
USE NEURAL; 
 
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
 
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(id_empresa); 
CREATE INDEX IF NOT EXISTS idx_tecnicos_empresa ON tecnicos(id_empresa); 
CREATE INDEX IF NOT EXISTS idx_os_empresa ON os(id_empresa); 
CREATE INDEX IF NOT EXISTS idx_pecas_empresa ON pecas(id_empresa); 
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON fornecedores(id_empresa);
