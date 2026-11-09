-- Initial schema for a new, empty NEURAL database.
-- Does not drop data; do not use to update an existing database.
CREATE DATABASE IF NOT EXISTS NEURAL
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE NEURAL;
SET time_zone = '+00:00';

CREATE TABLE empresas (
  id_empresa BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  cnpj_normalizado CHAR(14) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone_normalizado VARCHAR(11) NULL,
  logo_url TEXT NULL,
  proximo_numero_os BIGINT UNSIGNED NOT NULL DEFAULT 1,
  prazo_garantia_dias TINYINT UNSIGNED NOT NULL DEFAULT 90,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_empresa),
  UNIQUE KEY uq_empresas_cnpj (cnpj_normalizado),
  CONSTRAINT chk_empresas_cnpj CHECK (CHAR_LENGTH(cnpj_normalizado) = 14 AND cnpj_normalizado REGEXP '^[0-9]{14}$'),
  CONSTRAINT chk_empresas_garantia CHECK (prazo_garantia_dias BETWEEN 30 AND 90),
  CONSTRAINT chk_empresas_os CHECK (proximo_numero_os > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
  id_usuario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  login_normalizado VARCHAR(100) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('ADMIN','GERENTE','SUPERVISOR','FINANCEIRO','ATENDENTE','TECNICO','SUPRIMENTOS','ESTOQUISTA') NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_empresa_id (id_empresa, id_usuario),
  UNIQUE KEY uq_usuarios_login (login_normalizado),
  UNIQUE KEY uq_usuarios_empresa_email (id_empresa, email),
  CONSTRAINT fk_usuarios_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT chk_usuarios_login CHECK (login_normalizado = LOWER(TRIM(login_normalizado)) AND CHAR_LENGTH(login_normalizado) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE assinaturas (
  id_assinatura BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','PAST_DUE','CANCELED','EXPIRED') NOT NULL,
  assinatura_aberta_empresa BIGINT UNSIGNED GENERATED ALWAYS AS (
    CASE WHEN status IN ('ACTIVE','PAST_DUE') THEN id_empresa ELSE NULL END
  ) STORED,
  inicia_em DATETIME(6) NOT NULL,
  termina_em DATETIME(6) NULL,
  provedor_referencia VARCHAR(255) NULL,
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_assinatura),
  UNIQUE KEY uq_assinatura_aberta_empresa (assinatura_aberta_empresa),
  KEY idx_assinatura_empresa_status (id_empresa, status),
  CONSTRAINT fk_assinatura_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT chk_assinaturas_datas CHECK (termina_em IS NULL OR termina_em >= inicia_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE clientes (
  id_cliente BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone_normalizado VARCHAR(11) NOT NULL,
  email VARCHAR(255) NULL,
  cep CHAR(8) NULL,
  logradouro VARCHAR(255) NULL,
  numero VARCHAR(30) NULL,
  complemento VARCHAR(100) NULL,
  bairro VARCHAR(100) NULL,
  cidade VARCHAR(100) NULL,
  uf CHAR(2) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_cliente),
  UNIQUE KEY uq_clientes_empresa_id (id_empresa, id_cliente),
  UNIQUE KEY uq_clientes_empresa_telefone (id_empresa, telefone_normalizado),
  CONSTRAINT fk_clientes_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT chk_clientes_telefone CHECK (CHAR_LENGTH(telefone_normalizado) IN (10, 11) AND telefone_normalizado REGEXP '^[0-9]{10,11}$'),
  CONSTRAINT chk_clientes_cep CHECK (cep IS NULL OR (CHAR_LENGTH(cep) = 8 AND cep REGEXP '^[0-9]{8}$'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fornecedores (
  id_fornecedor BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  cnpj_normalizado CHAR(14) NOT NULL,
  telefone_normalizado VARCHAR(11) NULL,
  email VARCHAR(255) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_fornecedor),
  UNIQUE KEY uq_fornecedores_empresa_id (id_empresa, id_fornecedor),
  UNIQUE KEY uq_fornecedores_empresa_cnpj (id_empresa, cnpj_normalizado),
  CONSTRAINT fk_fornecedores_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT chk_fornecedores_cnpj CHECK (CHAR_LENGTH(cnpj_normalizado) = 14 AND cnpj_normalizado REGEXP '^[0-9]{14}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE funcionarios (
  id_funcionario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_usuario BIGINT UNSIGNED NULL,
  nome VARCHAR(255) NOT NULL,
  cpf_normalizado CHAR(11) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_funcionario),
  UNIQUE KEY uq_funcionarios_empresa_id (id_empresa, id_funcionario),
  UNIQUE KEY uq_funcionarios_empresa_cpf (id_empresa, cpf_normalizado),
  UNIQUE KEY uq_funcionarios_usuario (id_empresa, id_usuario),
  CONSTRAINT fk_funcionarios_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT fk_funcionarios_usuario FOREIGN KEY (id_empresa, id_usuario) REFERENCES usuarios(id_empresa, id_usuario),
  CONSTRAINT chk_funcionarios_cpf CHECK (CHAR_LENGTH(cpf_normalizado) = 11 AND cpf_normalizado REGEXP '^[0-9]{11}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE servicos (
  id_servico BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT NULL,
  preco DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id_servico),
  UNIQUE KEY uq_servicos_empresa_id (id_empresa, id_servico),
  CONSTRAINT fk_servicos_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT chk_servicos_preco CHECK (preco >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_estoque (
  id_peca BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_fornecedor BIGINT UNSIGNED NOT NULL,
  nome VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NULL,
  saldo_fisico INT UNSIGNED NOT NULL DEFAULT 0,
  saldo_reservado INT UNSIGNED NOT NULL DEFAULT 0,
  saldo_disponivel INT GENERATED ALWAYS AS (CAST(saldo_fisico AS SIGNED) - CAST(saldo_reservado AS SIGNED)) STORED,
  estoque_minimo INT UNSIGNED NOT NULL DEFAULT 0,
  custo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  preco_venda DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_peca),
  UNIQUE KEY uq_itens_empresa_id (id_empresa, id_peca),
  UNIQUE KEY uq_itens_empresa_sku (id_empresa, sku),
  KEY idx_itens_fornecedor (id_empresa, id_fornecedor),
  CONSTRAINT fk_itens_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT fk_itens_fornecedor FOREIGN KEY (id_empresa, id_fornecedor) REFERENCES fornecedores(id_empresa, id_fornecedor),
  CONSTRAINT chk_itens_reserva CHECK (saldo_reservado <= saldo_fisico),
  CONSTRAINT chk_itens_precos CHECK (custo_unitario >= 0 AND preco_venda >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ordens_servico (
  id_os BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  numero_os BIGINT UNSIGNED NOT NULL,
  id_cliente BIGINT UNSIGNED NOT NULL,
  id_criador BIGINT UNSIGNED NOT NULL,
  status ENUM('Aberta','Em Orçamento','Aprovada','Em Atendimento','Aguardando Peças','Concluída','Cancelada') NOT NULL DEFAULT 'Aberta',
  equipamento_tipo VARCHAR(100) NOT NULL,
  equipamento_marca VARCHAR(100) NULL,
  equipamento_modelo VARCHAR(100) NULL,
  equipamento_identificador VARCHAR(100) NULL,
  relato TEXT NOT NULL,
  garantia BOOLEAN NOT NULL DEFAULT FALSE,
  os_garantia_origem_id BIGINT UNSIGNED NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  desconto_percentual DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  valor_desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  valor_liquido DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  motivo_cancelamento VARCHAR(500) NULL,
  aberta_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  concluida_em DATETIME(6) NULL,
  criada_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizada_em TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  excluida_em DATETIME(6) NULL,
  PRIMARY KEY (id_os),
  UNIQUE KEY uq_os_empresa_id (id_empresa, id_os),
  UNIQUE KEY uq_os_empresa_numero (id_empresa, numero_os),
  KEY idx_os_garantia (id_empresa, id_cliente, equipamento_identificador, status, concluida_em),
  CONSTRAINT fk_os_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT fk_os_cliente FOREIGN KEY (id_empresa, id_cliente) REFERENCES clientes(id_empresa, id_cliente),
  CONSTRAINT fk_os_criador FOREIGN KEY (id_empresa, id_criador) REFERENCES usuarios(id_empresa, id_usuario),
  CONSTRAINT fk_os_garantia_origem FOREIGN KEY (id_empresa, os_garantia_origem_id) REFERENCES ordens_servico(id_empresa, id_os),
  CONSTRAINT chk_os_valores CHECK (subtotal >= 0 AND valor_desconto >= 0 AND valor_liquido >= 0),
  CONSTRAINT chk_os_desconto CHECK (desconto_percentual BETWEEN 0 AND 100),
  CONSTRAINT chk_os_liquido CHECK (valor_liquido = subtotal - valor_desconto),
  CONSTRAINT chk_os_conclusao CHECK ((status = 'Concluída' AND concluida_em IS NOT NULL) OR status <> 'Concluída')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE orcamentos (
  id_orcamento BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NOT NULL,
  versao INT UNSIGNED NOT NULL DEFAULT 1,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  motivo_recusa VARCHAR(500) NULL,
  emitido_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  decidido_em DATETIME(6) NULL,
  PRIMARY KEY (id_orcamento),
  UNIQUE KEY uq_orcamento_empresa_id (id_empresa, id_orcamento),
  UNIQUE KEY uq_orcamento_versao (id_empresa, id_os, versao),
  CONSTRAINT fk_orcamento_os FOREIGN KEY (id_empresa, id_os) REFERENCES ordens_servico(id_empresa, id_os)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_os (
  id_item_os BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NOT NULL,
  tipo ENUM('SERVICO','PECA') NOT NULL,
  id_servico BIGINT UNSIGNED NULL,
  id_peca BIGINT UNSIGNED NULL,
  descricao VARCHAR(500) NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  valor_unitario DECIMAL(12,2) NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id_item_os),
  UNIQUE KEY uq_itens_os_empresa_id (id_empresa, id_item_os),
  KEY idx_itens_os_os (id_empresa, id_os),
  CONSTRAINT fk_itens_os_os FOREIGN KEY (id_empresa, id_os) REFERENCES ordens_servico(id_empresa, id_os),
  CONSTRAINT fk_itens_os_servico FOREIGN KEY (id_empresa, id_servico) REFERENCES servicos(id_empresa, id_servico),
  CONSTRAINT fk_itens_os_peca FOREIGN KEY (id_empresa, id_peca) REFERENCES itens_estoque(id_empresa, id_peca),
  CONSTRAINT chk_itens_os_valores CHECK (quantidade > 0 AND valor_unitario >= 0 AND valor_total >= 0),
  CONSTRAINT chk_itens_os_tipo CHECK (
    (tipo = 'SERVICO' AND id_servico IS NOT NULL AND id_peca IS NULL) OR
    (tipo = 'PECA' AND id_peca IS NOT NULL AND id_servico IS NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reservas_estoque (
  id_reserva BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_item_os BIGINT UNSIGNED NOT NULL,
  id_peca BIGINT UNSIGNED NOT NULL,
  quantidade INT UNSIGNED NOT NULL,
  status ENUM('ACTIVE','RELEASED','CONSUMED') NOT NULL,
  criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_reserva),
  UNIQUE KEY uq_reserva_item_os (id_empresa, id_item_os),
  CONSTRAINT fk_reserva_item_os FOREIGN KEY (id_empresa, id_item_os) REFERENCES itens_os(id_empresa, id_item_os),
  CONSTRAINT fk_reserva_peca FOREIGN KEY (id_empresa, id_peca) REFERENCES itens_estoque(id_empresa, id_peca),
  CONSTRAINT chk_reserva_qtd CHECK (quantidade > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimentacoes_estoque (
  id_movimentacao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_peca BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NULL,
  id_usuario BIGINT UNSIGNED NULL,
  tipo ENUM('ENTRADA','AJUSTE','RESERVA','LIBERACAO','CONSUMO') NOT NULL,
  quantidade_anterior INT UNSIGNED NOT NULL,
  delta BIGINT NOT NULL,
  quantidade_posterior INT UNSIGNED NOT NULL,
  motivo VARCHAR(500) NOT NULL,
  criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_movimentacao),
  KEY idx_movimentacao_item_data (id_empresa, id_peca, criada_em),
  CONSTRAINT fk_mov_peca FOREIGN KEY (id_empresa, id_peca) REFERENCES itens_estoque(id_empresa, id_peca),
  CONSTRAINT fk_mov_os FOREIGN KEY (id_empresa, id_os) REFERENCES ordens_servico(id_empresa, id_os),
  CONSTRAINT fk_mov_usuario FOREIGN KEY (id_empresa, id_usuario) REFERENCES usuarios(id_empresa, id_usuario),
  CONSTRAINT chk_mov_quantidade CHECK (CAST(quantidade_posterior AS SIGNED) = CAST(quantidade_anterior AS SIGNED) + delta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE alertas_estoque (
  id_alerta BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_peca BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NULL,
  episodio INT UNSIGNED NOT NULL,
  saldo_disponivel_no_alerta INT UNSIGNED NOT NULL,
  estoque_minimo INT UNSIGNED NOT NULL,
  status ENUM('OPEN','RESOLVED') NOT NULL DEFAULT 'OPEN',
  criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolvido_em DATETIME(6) NULL,
  PRIMARY KEY (id_alerta),
  UNIQUE KEY uq_alerta_empresa_id (id_empresa, id_alerta),
  UNIQUE KEY uq_alerta_episodio (id_empresa, id_peca, episodio),
  CONSTRAINT fk_alerta_item FOREIGN KEY (id_empresa, id_peca) REFERENCES itens_estoque(id_empresa, id_peca),
  CONSTRAINT fk_alerta_os FOREIGN KEY (id_empresa, id_os) REFERENCES ordens_servico(id_empresa, id_os)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE minutas_compra (
  id_minuta BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_alerta BIGINT UNSIGNED NOT NULL,
  status ENUM('DRAFT','SENT','CANCELED') NOT NULL DEFAULT 'DRAFT',
  criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_minuta),
  UNIQUE KEY uq_minutas_empresa_id (id_empresa, id_minuta),
  UNIQUE KEY uq_minuta_alerta (id_empresa, id_alerta),
  CONSTRAINT fk_minuta_alerta FOREIGN KEY (id_empresa, id_alerta) REFERENCES alertas_estoque(id_empresa, id_alerta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE itens_minuta_compra (
  id_minuta BIGINT UNSIGNED NOT NULL,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_peca BIGINT UNSIGNED NOT NULL,
  quantidade_sugerida INT UNSIGNED NOT NULL,
  PRIMARY KEY (id_minuta, id_peca),
  CONSTRAINT fk_item_minuta FOREIGN KEY (id_empresa, id_minuta) REFERENCES minutas_compra(id_empresa, id_minuta),
  CONSTRAINT fk_item_minuta_peca FOREIGN KEY (id_empresa, id_peca) REFERENCES itens_estoque(id_empresa, id_peca),
  CONSTRAINT chk_minuta_qtd CHECK (quantidade_sugerida > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  entity_name VARCHAR(80) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action ENUM('CREATE','UPDATE','DELETE') NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  id_empresa BIGINT UNSIGNED NOT NULL,
  `timestamp` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  changes JSON NOT NULL,
  PRIMARY KEY (id),
  KEY idx_audit_entity (id_empresa, entity_name, entity_id, `timestamp`),
  KEY idx_audit_user_time (id_empresa, user_id, `timestamp`),
  CONSTRAINT fk_audit_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_outbox (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_usuario BIGINT UNSIGNED NULL,
  event_type VARCHAR(80) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  payload JSON NOT NULL,
  status ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(6) NULL,
  last_error VARCHAR(1000) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  sent_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_outbox_dispatch (status, next_attempt_at),
  CONSTRAINT fk_outbox_empresa FOREIGN KEY (id_empresa) REFERENCES empresas(id_empresa),
  CONSTRAINT fk_outbox_usuario FOREIGN KEY (id_empresa, id_usuario) REFERENCES usuarios(id_empresa, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE comentarios_os (
  id_comentario BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NOT NULL,
  id_usuario BIGINT UNSIGNED NOT NULL,
  texto TEXT NOT NULL,
  criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_comentario),
  KEY idx_comentarios_os (id_empresa, id_os, criado_em),
  CONSTRAINT fk_comentario_os FOREIGN KEY (id_empresa, id_os) REFERENCES ordens_servico(id_empresa, id_os),
  CONSTRAINT fk_comentario_usuario FOREIGN KEY (id_empresa, id_usuario) REFERENCES usuarios(id_empresa, id_usuario),
  CONSTRAINT chk_comentarios_texto CHECK (CHAR_LENGTH(TRIM(texto)) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notificacoes (
  id_notificacao BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_usuario BIGINT UNSIGNED NOT NULL,
  tipo VARCHAR(80) NOT NULL,
  referencia_tipo VARCHAR(80) NOT NULL,
  referencia_id BIGINT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  lida_em DATETIME(6) NULL,
  criada_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_notificacao),
  KEY idx_notificacoes_usuario (id_empresa, id_usuario, lida_em, criada_em),
  CONSTRAINT fk_notificacao_usuario FOREIGN KEY (id_empresa, id_usuario) REFERENCES usuarios(id_empresa, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //
CREATE TRIGGER audit_logs_no_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs is append-only';
END//

CREATE TRIGGER audit_logs_no_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
BEGIN
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'audit_logs is append-only';
END//
DELIMITER ;
