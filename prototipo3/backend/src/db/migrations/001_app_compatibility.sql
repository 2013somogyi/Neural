USE NEURAL;

ALTER TABLE empresas ADD COLUMN nome_juridico VARCHAR(255) NULL;
ALTER TABLE empresas ADD COLUMN logradouro VARCHAR(255) NULL;
ALTER TABLE empresas ADD COLUMN numero VARCHAR(30) NULL;
ALTER TABLE empresas ADD COLUMN complemento VARCHAR(100) NULL;
ALTER TABLE empresas ADD COLUMN bairro VARCHAR(100) NULL;
ALTER TABLE empresas ADD COLUMN cidade VARCHAR(100) NULL;
ALTER TABLE empresas ADD COLUMN uf CHAR(2) NULL;
ALTER TABLE empresas ADD COLUMN cep CHAR(8) NULL;
ALTER TABLE empresas ADD COLUMN horario_funcionamento VARCHAR(100) NULL;
ALTER TABLE empresas ADD COLUMN modelo_estoque VARCHAR(30) NOT NULL DEFAULT 'Com Estoque';

UPDATE empresas
   SET nome_juridico = nome
 WHERE nome_juridico IS NULL;

ALTER TABLE clientes ADD COLUMN cpf_cnpj VARCHAR(14) NULL;
ALTER TABLE clientes ADD COLUMN rg VARCHAR(30) NULL;
ALTER TABLE clientes ADD COLUMN ponto_referencia VARCHAR(255) NULL;
ALTER TABLE clientes ADD COLUMN detalhes_geral TEXT NULL;
ALTER TABLE clientes ADD UNIQUE KEY uq_clientes_empresa_documento (id_empresa, cpf_cnpj);

ALTER TABLE fornecedores ADD COLUMN produtos TEXT NULL;

ALTER TABLE funcionarios MODIFY COLUMN cpf_normalizado CHAR(11) NULL;
ALTER TABLE funcionarios ADD COLUMN telefone_normalizado VARCHAR(11) NULL;
ALTER TABLE funcionarios ADD COLUMN cargo VARCHAR(100) NOT NULL DEFAULT 'Técnico';
ALTER TABLE funcionarios ADD COLUMN salario_fixo DECIMAL(10,2) NOT NULL DEFAULT 0.00;

ALTER TABLE itens_estoque ADD COLUMN categoria VARCHAR(100) NULL;

ALTER TABLE ordens_servico ADD COLUMN tipo_documento VARCHAR(50) NOT NULL DEFAULT 'OS';
ALTER TABLE ordens_servico ADD COLUMN prioridade VARCHAR(50) NOT NULL DEFAULT 'Média';
ALTER TABLE ordens_servico ADD COLUMN id_tecnico_responsavel BIGINT UNSIGNED NULL;
ALTER TABLE ordens_servico ADD COLUMN prazo_garantia_dias INT UNSIGNED NOT NULL DEFAULT 90;
ALTER TABLE ordens_servico ADD COLUMN condicoes_equipamento TEXT NULL;
ALTER TABLE ordens_servico ADD COLUMN acessorios TEXT NULL;
ALTER TABLE ordens_servico ADD COLUMN observacoes_tecnico TEXT NULL;
ALTER TABLE ordens_servico ADD COLUMN local_atendimento VARCHAR(255) NULL;
ALTER TABLE ordens_servico ADD COLUMN data_aprovacao DATETIME(6) NULL;
ALTER TABLE ordens_servico ADD COLUMN data_agendamento DATETIME(6) NULL;
ALTER TABLE ordens_servico ADD COLUMN data_fim_garantia DATE NULL;
ALTER TABLE ordens_servico ADD COLUMN termo_garantia TEXT NULL;
ALTER TABLE ordens_servico ADD COLUMN assinatura_cliente_url TEXT NULL;
ALTER TABLE ordens_servico ADD COLUMN data_assinatura DATETIME(6) NULL;
ALTER TABLE ordens_servico ADD KEY idx_os_tecnico (id_empresa, id_tecnico_responsavel);
ALTER TABLE ordens_servico
  ADD CONSTRAINT fk_os_tecnico
  FOREIGN KEY (id_empresa, id_tecnico_responsavel)
  REFERENCES funcionarios(id_empresa, id_funcionario);

CREATE TABLE os_historico_status (
  id_historico BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_empresa BIGINT UNSIGNED NOT NULL,
  id_os BIGINT UNSIGNED NOT NULL,
  status_anterior VARCHAR(50) NULL,
  status_novo VARCHAR(50) NOT NULL,
  id_usuario_mudou BIGINT UNSIGNED NOT NULL,
  criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id_historico),
  KEY idx_os_historico (id_empresa, id_os, criado_em),
  CONSTRAINT fk_os_historico_os
    FOREIGN KEY (id_empresa, id_os)
    REFERENCES ordens_servico(id_empresa, id_os),
  CONSTRAINT fk_os_historico_usuario
    FOREIGN KEY (id_empresa, id_usuario_mudou)
    REFERENCES usuarios(id_empresa, id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
