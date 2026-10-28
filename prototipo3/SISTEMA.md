# N Neural - Documentação do Sistema de Gestão Empresarial

Este documento apresenta a especificação técnica completa, o modelo relacional de banco de dados SQL, a documentação das rotas da API REST NodeJS/Express, a arquitetura do frontend React, o processo detalhado de tradução/migração do protótipo monolítico para uma aplicação moderna e as instruções passo a passo para execução do projeto.

---

## 1. Visão Geral da Arquitetura

O sistema **N Neural** é uma plataforma de gestão empresarial para assistências técnicas e empresas de serviços. Ele gerencia o fluxo completo desde o cadastro de empresas/planos, abertura e controle de Ordens de Serviço (O.S.), gestão de estoque e peças, fornecedores, equipe de técnicos e faturamento/relatórios.

### Tecnologias Utilizadas
- **Frontend:** React 18 (Vite), Tailwind CSS (Design System "Dorfic"), Context API, Chart.js / react-chartjs-2, jsPDF / jspdf-autotable, FontAwesome 6.
- **Backend:** NodeJS, Express.js, JWT (JSON Web Tokens) para autenticação Stateless, Bcrypt.js para hash seguro de senhas, CORS, API RESTful.
- **Banco de Dados:** Modelo Relacional SQL ANSI (Compatível com PostgreSQL, MySQL) com suporte Multi-tenant (isolamento por `id_empresa`), integridade referencial, chave estrangeira e restrições únicas.

---

## 2. Esquema do Banco de Dados (SQL DDL)

O arquivo de definição de banco de dados está localizado em `backend/src/db/schema.sql`:

```sql
-- Tabela EMPRESAS
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

-- Tabela TECNICOS / USUÁRIOS
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

-- Tabela CLIENTES
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

-- Tabela PECAS / ESTOQUE
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

-- Tabela FORNECEDORES
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

-- Tabela OS (ORDENS DE SERVIÇO)
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

-- Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON clientes(id_empresa);
CREATE INDEX IF NOT EXISTS idx_tecnicos_empresa ON tecnicos(id_empresa);
CREATE INDEX IF NOT EXISTS idx_os_empresa ON os(id_empresa);
CREATE INDEX IF NOT EXISTS idx_pecas_empresa ON pecas(id_empresa);
CREATE INDEX IF NOT EXISTS idx_fornecedores_empresa ON fornecedores(id_empresa);
```

---

## 3. Endpoints da API REST (NodeJS Backend)

Todas as rotas protegidas exigem o cabeçalho `Authorization: Bearer <TOKEN_JWT>`. O backend filtra automaticamente os dados pela empresa (`id_empresa`) vinculada ao token JWT.

| Método | Endpoint | Descrição |
|---|---|---|
| `GET` | `/api/health` | Healthcheck do serviço |
| `POST` | `/api/auth/login` | Autenticação de usuários (`login`, `senha`) |
| `POST` | `/api/auth/register-company` | Cadastro onboarding de empresa e administrador principal |
| `GET` | `/api/dashboard` | Retorna métricas de faturamento, totais de OS, garantias e entidades |
| `GET` | `/api/clientes` | Lista clientes (parâmetros de busca opcionais: `busca`, `tipo`) |
| `GET` | `/api/clientes/:id` | Retorna os detalhes de um cliente e suas OS associadas |
| `POST` | `/api/clientes` | Cadastra novo cliente |
| `PUT` | `/api/clientes/:id` | Atualiza dados de um cliente |
| `DELETE` | `/api/clientes/:id` | Inativa cliente (soft delete) |
| `GET` | `/api/os` | Lista ordens de serviço (filtros por `status` e `busca`) |
| `GET` | `/api/os/:id` | Retorna detalhes da OS, dados do cliente e técnico |
| `POST` | `/api/os` | Abre nova OS com numeração sequencial automática da empresa |
| `PUT` | `/api/os/:id` | Atualiza status, valores e relato da OS |
| `DELETE` | `/api/os/:id` | Remove uma OS |
| `GET` | `/api/pecas` | Lista peças do estoque |
| `POST` | `/api/pecas` | Cadastra nova peça |
| `PUT` | `/api/pecas/:id` | Atualiza dados da peça |
| `DELETE` | `/api/pecas/:id` | Remove peça do estoque |
| `GET` | `/api/fornecedores` | Lista fornecedores |
| `POST` | `/api/fornecedores` | Cadastra novo fornecedor |
| `PUT` | `/api/fornecedores/:id` | Atualiza dados do fornecedor |
| `DELETE` | `/api/fornecedores/:id` | Remove fornecedor |
| `GET` | `/api/tecnicos` | Lista técnicos/usuários da empresa |
| `POST` | `/api/tecnicos` | Cadastra novo técnico com hash de senha |
| `PUT` | `/api/tecnicos/:id` | Atualiza dados/senha do técnico |
| `DELETE` | `/api/tecnicos/:id` | Inativa um técnico |

---

## 4. Processo de Tradução e Migração

O protótipo original era um arquivo HTML monolítico com JavaScript embutido manipulando dados mock em memória. O processo de tradução seguiu as seguintes etapas:

1. **Separação em Camadas (Decoupling):**
   - **Camada de Dados:** Extração e formalização da estrutura de tabelas em SQL DDL padrão.
   - **Camada de Negócio / API:** Criação do servidor NodeJS com Express.js, fornecendo rotas RESTful para cada entidade e aplicando isolamento multi-tenant (`id_empresa`).
   - **Camada de Apresentação:** Decomposição da interface em componentes React modulares.

2. **Refatoração do Frontend em React:**
   - Criação do `AuthContext` para gerenciar estado global de login, dados da empresa ativa, token JWT e alternância de tema Claro/Escuro (Dark Mode).
   - Conversão dos Wireframes e telas em Views/Componentes React (`LandingView`, `LoginView`, `CheckoutView`, `CadEmpresaView`, `CadAdmView`, `MainLayout`).
   - Implementação das abas funcionais (`DashboardTab`, `ClientesTab`, `OSTab`, `EstoqueTab`, `FornecedoresTab`, `RelatoriosTab`, `TecnicosTab`, `ConfigTab`, `SuporteTab`).

3. **Validações e Funcionalidades Avançadas:**
   - Cálculo automático do Valor Líquido na OS (`valor_total - valor_desconto`).
   - Numeração automática e sequencial por empresa (`proximo_numero_os`).
   - Modais interativos para edição, inativação e consulta de histórico de cliente.
   - Exportação de relatórios dinâmicos formatados em PDF utilizando `jsPDF` e `jspdf-autotable`.

---

## 5. Instruções para Execução do Projeto

### Pré-requisitos
- Node.js (v18+) e npm (v9+)

### Executando o Backend (NodeJS)

```bash
cd backend
npm install
node src/server.js
```
O servidor estará rodando em `http://localhost:4000`.

### Executando os Testes de Integração da API Backend

```bash
node backend/tests/api.test.js
```

### Executando o Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```
O frontend estará acessível em `http://localhost:3000` (com proxy automático configurado no Vite para as chamadas `/api`).

---
*Documentação gerada automaticamente pelo agente de engenharia de software N Neural.*
