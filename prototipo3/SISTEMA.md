# N Neural — Especificação técnica

Este documento consolida as regras de negócio, critérios não funcionais, estados da OS, contratos HTTP e schema alvo do N Neural. O schema SQL abaixo é uma **especificação de referência para uma instalação nova**; não é uma migração automática do banco existente. Antes de aplicá-lo em ambiente com dados, deve ser criada e validada uma migração específica.

## 1. Regras de Negócio Consolidadas (RNs)

### RN01 — IDs e multi-tenancy

- As chaves primárias são `BIGINT UNSIGNED AUTO_INCREMENT`, persistidas sem prefixo. São identificadores técnicos, não editáveis e não reiniciados por empresa.
- A unicidade da chave técnica é global entre tenants dentro da respectiva entidade/tabela; IDs de tabelas diferentes podem ter o mesmo valor numérico. IDs de negócio, como `numero_os`, são isolados por `id_empresa`. O prefixo distingue entidades na apresentação e nunca é usado como chave estrangeira.
- O `display_id` é formado por `prefixo_entidade + id com no mínimo 5 algarismos`, exibido com o nome da entidade: `EMP-100104`, `OS-200104`, `FOR-300104`, `CLI-400104`, `FUN-500104`, `ITE-600104`. O sufixo é o ID técnico preenchido à esquerda com zeros; o ID técnico `104` da OS, por exemplo, resulta em `OS-200104`.
- A API aceita e devolve o ID técnico em `id` e o identificador formatado em `display_id`. Não se aceita `display_id` em lugar de `id` em chaves estrangeiras ou operações de escrita.
- `numero_os` é um número sequencial legível, independente do ID técnico, único por empresa (`UNIQUE(id_empresa, numero_os)`). A alocação bloqueia a linha da empresa com `SELECT ... FOR UPDATE`, incrementa `proximo_numero_os` e grava a OS na mesma transação.
- Toda consulta ou alteração de dados de negócio exige escopo `id_empresa` obtido do token autenticado; nunca se confia em `id_empresa` enviado pelo cliente HTTP.

### RN02–RN04 — Normalização e unicidade

- Antes de validar ou persistir telefone, CPF ou CNPJ, a API remove tudo que não for dígito. A forma normalizada é persistida em coluna própria e é a usada em consultas e restrições únicas.
- Telefone de cliente é obrigatório. Após remover pontuação, um prefixo internacional `55` é removido somente quando restarem 10 ou 11 dígitos. O valor final deve conter 10 ou 11 dígitos. A unicidade é por empresa e inclui clientes ativos e inativos.
- CNPJ de fornecedor é obrigatório, deve conter 14 dígitos e passar pela validação dos dígitos verificadores. A unicidade é por empresa e inclui fornecedores ativos e inativos.
- CPF de funcionário é obrigatório, deve conter 11 dígitos e passar pela validação dos dígitos verificadores. A unicidade é por empresa e inclui funcionários ativos e inativos.
- A remoção de pontuação, por si só, não valida o documento. Valores vazios, comprimentos incorretos, sequências repetidas e dígitos verificadores inválidos recebem `422 VALIDATION_ERROR`.
- Soft delete/inativação não libera telefone, CPF ou CNPJ para reutilização. Reativar um registro conserva sua chave normalizada. Um conflito de unicidade retorna `409 DUPLICATE_IDENTIFIER`.
- O CNPJ da empresa é normalizado e único globalmente, pois identifica a pessoa jurídica, não apenas um tenant.

### RN05 — Assinatura e autorização

- As rotas de negócio exigem, nesta ordem: autenticação válida, tenant correspondente e assinatura `ACTIVE`, com `inicia_em <= agora UTC` e `termina_em` nulo ou estritamente posterior a agora. Apenas essa condição permite acesso. `PAST_DUE`, `CANCELED` e `EXPIRED` bloqueiam imediatamente; grace period é **zero dias**. Uma assinatura `ACTIVE` que atinge `termina_em` deixa de autorizar imediatamente e deve ser marcada `EXPIRED`. A confirmação de pagamento só libera o acesso depois de o backend registrar `ACTIVE`.
- A checagem de assinatura é ignorada somente para: `GET /api/health`; `POST /api/auth/login`; `POST /api/auth/register-company`; `POST /api/auth/logout` (continua exigindo autenticação); `GET /api/checkout`; `POST /api/payments` (autenticado); `POST /api/payments/webhook` (assinatura do provedor obrigatória); `GET` e `POST /api/support` (autenticado). Rotas de webhook devem validar assinatura e idempotência próprias.
- A aplicação redireciona sessões autenticadas sem plano ativo para a tela `/checkout`. A API retorna `403 SUBSCRIPTION_REQUIRED` com `status_assinatura` e `checkout_url`; não retorna dados da funcionalidade bloqueada.
- Ausência de assinatura equivale a acesso bloqueado. Usuários sem autenticação recebem `401`, não o redirecionamento de assinatura.
- `login` é único globalmente e não diferencia maiúsculas/minúsculas; o banco guarda sua forma normalizada em minúsculas. A senha nunca é normalizada.

### RN06–RN08 e RN11 — Estoque, reservas e suprimentos

- Cada item de estoque pertence a uma empresa e deve referenciar um fornecedor cadastrado da mesma empresa. Fornecedor inativo não pode ser associado a novo item; a inativação não remove vínculos históricos.
- `saldo_fisico` é a quantidade real em prateleira. Só entradas, ajustes de inventário aprovados e finalização da OS o alteram.
- `saldo_reservado` é a soma das reservas ativas de OS em `Em Atendimento`. `saldo_disponivel = saldo_fisico - saldo_reservado`; nunca pode ser negativo. `saldo_disponivel` é calculado pelo banco, não enviado pelo cliente.
- Ao entrar em `Em Atendimento`, o sistema reserva atomicamente todas as peças da OS. Se qualquer item não tiver saldo disponível suficiente, nenhuma reserva é criada e o status não muda; a operação responde `409 INSUFFICIENT_STOCK`. O usuário pode colocar a OS em `Aguardando Peças`. Reservas são liberadas ao sair de `Em Atendimento` para `Aguardando Peças` ou `Cancelada`.
- Ao retornar de `Aguardando Peças` para `Em Atendimento`, a reserva integral é refeita; não há reserva parcial. Uma falha deixa a OS em `Aguardando Peças`.
- A emissão/visualização de pré-fechamento valida saldo, reservas e integridade dos itens, sem baixar estoque. A finalização da OS, em uma única transação, valida novamente, baixa `saldo_fisico`, consome as reservas e grava movimentações. Não é permitido finalizar duas vezes.
- A reserva e a baixa bloqueiam as linhas de estoque com `SELECT ... FOR UPDATE`, sempre em ordem crescente de `id_peca`, dentro de transação InnoDB. A aplicação atualiza item, reserva, movimentação, status e auditoria na mesma transação; qualquer falha faz rollback. O isolamento mínimo é `READ COMMITTED`. Operações de entrada e inventário usam o mesmo bloqueio.
- O alerta normal é aberto quando `saldo_disponivel` cruza de `> estoque_minimo` para `<= estoque_minimo`, quando um item é criado já no limiar/abaixo dele ou quando uma alteração do mínimo coloca o saldo no limiar/abaixo. Há no máximo um alerta aberto por item por episódio abaixo do limiar; novas movimentações no mesmo episódio não duplicam alertas. O alerta é resolvido quando o saldo volta a `> estoque_minimo`. Uma nova queda inicia novo episódio.
- Se uma reserva de OS em `Em Atendimento` fizer o saldo disponível ficar **estritamente abaixo** do mínimo, além do alerta, é criada uma minuta de Pedido de Compra. Há no máximo uma minuta por alerta/episódio. A minuta fica em `DRAFT`, não é enviada ao fornecedor, contém fornecedor associado ao item, item, saldo físico, reservado, disponível, mínimo, quantidade sugerida `MAX(estoque_minimo - saldo_disponivel, 1)`, OS de origem e data/hora. Ela só pode ser convertida/enviada por ação explícita de usuário autorizado. Se o alerta foi aberto exatamente no mínimo, a minuta é criada na primeira reserva que levar o saldo abaixo dele.
- Alertas, minutas e movimentos são persistidos; falha ao persistir qualquer efeito relacionado à reserva causa rollback da reserva.

### RN09 — Garantia automática

- Cada empresa configura `prazo_garantia_dias` entre 30 e 90, inclusive; o padrão é 90. Valor fora do intervalo é rejeitado no banco e na API.
- Ao abrir uma OS, o sistema procura a OS anterior mais recente do mesmo cliente e do mesmo `equipamento_identificador` normalizado, dentro da mesma empresa, com status `Concluída` e `concluida_em` entre agora menos o prazo configurado e agora, inclusive. O marco é a data/hora de conclusão, não abertura ou aprovação.
- `equipamento_identificador` representa número de série, IMEI ou placa, conforme o tipo de equipamento. É normalizado removendo espaços e pontuação e convertendo para maiúsculas. Se não for informado, não há correspondência automática e a OS não é classificada como garantia.
- Se houver correspondência, a nova OS recebe `garantia = true` e referência `os_garantia_origem_id`. Os valores unitários de mão de obra (`SERVICO`) são gravados como `0.00`; não é um desconto de 100%. Peças continuam cobradas normalmente, salvo desconto independente autorizado. Itens de serviço adicionados depois também recebem valor zero.
- A transação de abertura grava a OS, seus itens e a auditoria; gera notificação interna ao perfil `SUPERVISOR` (ou, se não houver, `ADMIN`). Falha na notificação é registrada e repetida pelo mecanismo assíncrono, mas não desfaz uma OS válida.
- Se existirem várias OS elegíveis, usa-se a concluída mais recentemente; empate é resolvido pelo maior `id_os`.

### RN10 — Ciclo de vida da OS

- A máquina e suas únicas transições permitidas estão na seção 3. Qualquer salto não listado retorna `409 INVALID_STATUS_TRANSITION`; a API nunca aceita atualização direta de `status` pelo endpoint genérico de edição.
- `Concluída` e `Cancelada` são estados terminais. OS concluída não pode ser reaberta nem cancelada; OS cancelada não pode ser reaberta.
- Cancelar exige perfil `ADMIN` ou `GERENTE` e motivo não vazio. A transição libera reservas ativas e não baixa estoque.
- Aprovada é o estado após aprovação do orçamento. A aprovação não inicia atendimento automaticamente: a passagem para `Em Atendimento` é explícita e sujeita à reserva integral das peças.

### RN12 — Descontos

- O desconto é percentual, aplicado uma única vez na emissão da OS/orçamento sobre o subtotal bruto de serviços mais peças, antes de impostos (impostos não são calculados neste fluxo). `valor_desconto = ROUND(subtotal * percentual / 100, 2)`; `valor_liquido = subtotal - valor_desconto`.
- `ADMIN` pode aplicar de 0% a 100%; `GERENTE`, de 0% a 25%, inclusive; todos os demais perfis têm limite de 0%. Valores negativos ou acima da alçada retornam `403 DISCOUNT_LIMIT_EXCEEDED`.
- O backend recalcula totais usando preços e quantidades armazenados; valores totais enviados pelo cliente são ignorados. Após emissão, alterações em itens ou desconto exigem reemissão autorizada e geram auditoria do valor anterior e novo. OS de garantia mantêm mão de obra a zero antes de calcular o desconto.

### RN13 — Fila e histórico

- A fila permite filtro por intervalo de datas e atalhos `diário`, `semanal`, `mensal` e `anual`, usando o fuso horário configurado para a empresa. Os intervalos são inclusivos no início e exclusivos no fim.
- Comentários têm autor, instante, texto não vazio e vínculo à OS. Edição ou exclusão de comentário não é permitida; correção deve ser feita por novo comentário, preservando o histórico. Criar comentário também gera evento `CREATE` na auditoria da OS.

### RN14 — Exclusão de OS

- Exclusão lógica de OS só pode ser iniciada por perfil `ADMIN`, com confirmação explícita (`confirm=true`) e motivo não vazio. Sem qualquer condição, responde `403` ou `422`, conforme autorização ou validação.
- OS concluída não pode ser excluída. OS com reserva ativa não pode ser excluída até a liberação transacional. Exclusão lógica preserva OS, itens, movimentos e auditoria; não apaga registros físicos nem desfaz estoque consumido.
- A rota `DELETE /api/os/:id` exige confirmação e motivo e grava evento `DELETE` na auditoria. Para todos os outros perfis, a API responde `403 FORBIDDEN`.

### RN15 — Auditoria inviolável

- Toda criação, alteração e exclusão lógica de OS, status, valores, itens, reservas e movimentos gera um registro append-only na mesma transação da alteração. O registro contém entidade, ID técnico da entidade, ação, usuário (ou `NULL` para processo de sistema), timestamp UTC com microssegundos e `changes` JSON no formato `{ "campo": { "old_value": ..., "new_value": ... } }`. Em `CREATE`, `old_value` é `null`; em `DELETE`, `new_value` é `null`.
- Alterações sem mudança efetiva não geram evento. Falha ao inserir auditoria aborta a operação de negócio.
- Não existem endpoints `PUT`, `PATCH` ou `DELETE` para registros de auditoria. A consulta é somente leitura e respeita o tenant.
- O usuário da aplicação no MySQL possui apenas `SELECT` e `INSERT` em `audit_logs`. Triggers `BEFORE UPDATE` e `BEFORE DELETE` também recusam tais operações com erro SQL. Administradores da aplicação não podem alterar ou apagar logs. A conta DBA de infraestrutura não é usada pela aplicação.

### RN16 — Orçamento e OS

- Emitir orçamento coloca a OS em `Em Orçamento` e grava a versão e os valores emitidos. Aprovar orçamento muda seu estado para `APPROVED` e a OS para `Aprovada`; recusar exige motivo, marca o orçamento `REJECTED` e a OS `Cancelada`, sem cobrança ou baixa de estoque.
- A aprovação não significa início de atendimento. Atendimento começa apenas com a transição autorizada para `Em Atendimento` e reserva integral das peças.

## 2. Requisitos Não Funcionais Técnicos (RNFs)

### RNF01 — Arquitetura

- O backend separa rotas/controladores HTTP, serviços de aplicação/regras de negócio, repositórios de persistência e modelos de dados; a UI React é a camada de apresentação. Regra de autorização, cálculo financeiro, transição e estoque é aplicada no backend, nunca exclusivamente na UI.
- Critério de aceite: teste de integração demonstra que chamadas diretas à API não contornam regras aplicadas pela interface.

### RNF02 — Disponibilidade

- Disponibilidade mensal mínima: `99,9%`, medida por mês civil, por sondas externas a cada minuto no endpoint de saúde que valida processo e conectividade com o banco.
- Fórmula: `(minutos do mês - minutos de indisponibilidade não planejada) / minutos do mês * 100`. Manutenções planejadas só são excluídas se anunciadas com pelo menos 24 horas de antecedência e registradas.
- Critério de aceite: relatório mensal >= 99,9%; `/api/health` retorna HTTP `200` e `database: "connected"` quando API e banco estão prontos, e HTTP `503` quando a API não pode atender.

### RNF03 — Tema escuro

- O tema escuro cobre todas as telas, modais, tabelas, formulários e estados de erro/carregamento. Preferência é persistida por usuário/dispositivo e não reduz contraste abaixo de WCAG 2.1 AA para texto.
- Critério de aceite: teste visual das telas principais em tema claro e escuro, sem texto ou controles ilegíveis.

### RNF04 — ViaCEP

- A UI consulta `GET https://viacep.com.br/ws/{cep}/json/` para CEP com oito dígitos, com timeout total de 3.000 ms. Resposta de CEP inexistente, timeout, erro HTTP ou indisponibilidade mantém os campos de endereço editáveis para preenchimento manual, apresenta aviso não bloqueante e não apaga valores já digitados.
- Critério de aceite: em qualquer falha externa, a tela continua utilizável e o formulário pode ser salvo com endereço manual válido.

### RNF05 — Logo em orçamento

- O PDF incorpora o logo da empresa no momento da emissão, preservando a cópia do documento emitido. Logo ausente ou indisponível usa o asset padrão `frontend/public/logo-orcamento-padrao.svg`, com identidade neutra “N Neural”; a geração do PDF não falha por esse motivo.
- Critério de aceite: PDF válido, com logo da empresa quando configurado e fallback padrão quando não configurado.

### RNF06 — Autenticação

- Todas as rotas privadas validam token, usuário ativo e tenant antes de acessar dados. Senhas são armazenadas com hash Argon2id ou bcrypt com fator de custo vigente; tokens têm expiração e segredos fora do repositório.
- Critério de aceite: requisições sem token recebem `401`, com token inválido/expirado recebem `401`, e tenant divergente não acessa nem altera dados.

### RNF07 — Notificação de login

- E-mail é gerado apenas depois de autenticação bem-sucedida (`HTTP 200`). Tentativas malsucedidas (`HTTP 401`) não enviam e-mail.
- A notificação é enfileirada de modo assíncrono em outbox persistente na mesma transação de autenticação. Falha do gateway não bloqueia o login: registra `WARN` com correlation ID e agenda até cinco tentativas, com backoff de `1, 5, 15, 60` minutos entre tentativas. Após esgotar tentativas, a mensagem fica em estado `FAILED` para análise operacional; a falha não é silenciosa.
- Critério de aceite: login permanece bem-sucedido quando o gateway está indisponível; a mensagem persiste, tentativas e falha final ficam consultáveis em logs/métricas, sem registrar senha ou token.

## 3. Diagrama/Tabela de Máquina de Estados da OS

Estados persistidos (API e banco): `Aberta`, `Em Orçamento`, `Aprovada`, `Em Atendimento`, `Aguardando Peças`, `Concluída`, `Cancelada`.

```text
Aberta -> Em Orçamento -> Aprovada -> Em Atendimento -> Concluída
   |            |             |             |
   +----------> Cancelada <----+             +-> Aguardando Peças
                                               ^         |
                                               +---------+
```

| Estado atual | Próximo estado permitido | Condições |
|---|---|---|
| Aberta | Em Orçamento | Orçamento completo emitido e valores recalculados |
| Aberta | Cancelada | ADMIN/GERENTE; motivo obrigatório |
| Em Orçamento | Aprovada | Orçamento pendente aprovado por usuário autorizado |
| Em Orçamento | Cancelada | Orçamento recusado com motivo ou cancelamento autorizado |
| Aprovada | Em Atendimento | Reserva de todas as peças concluída atomicamente |
| Aprovada | Aguardando Peças | Usuário autorizado registra falta de peça e motivo |
| Aprovada | Cancelada | ADMIN/GERENTE; motivo obrigatório |
| Em Atendimento | Aguardando Peças | Libera reservas ativas; motivo obrigatório |
| Em Atendimento | Concluída | Fechamento final validado; baixa e auditoria na mesma transação |
| Em Atendimento | Cancelada | ADMIN/GERENTE; libera reservas; motivo obrigatório |
| Aguardando Peças | Em Atendimento | Todas as peças reservadas integralmente |
| Aguardando Peças | Cancelada | ADMIN/GERENTE; motivo obrigatório |
| Concluída | — | Terminal; nenhuma transição permitida |
| Cancelada | — | Terminal; nenhuma transição permitida |

Saltos como `Aberta -> Concluída`, `Em Orçamento -> Em Atendimento` e `Aprovada -> Concluída` são sempre proibidos. A coluna `status` só é alterada pelo serviço de transição após validar estado, papel, precondições e efeitos de estoque. Toda transição grava auditoria.

## 4. Modelagem da Tabela de Auditoria e Estoque

### Auditoria

`audit_logs` é append-only, com chave técnica, nome e ID da entidade, ação `CREATE|UPDATE|DELETE`, usuário ator, instante UTC e JSON `changes`. Cada evento da OS, item, valor, status e estoque é registrado na mesma transação da operação. Triggers SQL rejeitam `UPDATE` e `DELETE`; o usuário de runtime não recebe privilégios para essas operações. Não há endpoint de mutação de auditoria.

### Estoque

- `itens_estoque.saldo_fisico`: quantidade física contada.
- `itens_estoque.saldo_reservado`: total ativo reservado para itens de OS em `Em Atendimento`, mantido dentro da mesma transação que altera reservas.
- `itens_estoque.saldo_disponivel`: coluna gerada `saldo_fisico - saldo_reservado`.
- `reservas_estoque`: uma reserva por linha de peça da OS, com quantidade e estado `ACTIVE|RELEASED|CONSUMED`.
- `movimentacoes_estoque`: trilha de entrada, ajuste, reserva, liberação e consumo; inclui usuário, OS, quantidade anterior, delta e quantidade posterior.
- Em `ENTRADA`, `AJUSTE` e `CONSUMO`, esses três campos descrevem `saldo_fisico`; em `RESERVA` e `LIBERACAO`, descrevem `saldo_disponivel`. A quantidade anterior mais o delta deve ser igual à posterior.
- `alertas_estoque` e `minutas_compra`: episódio de limiar e minuta de compra idempotente por alerta.
- Todos os comandos de reserva/baixa bloqueiam linhas de estoque, validam `saldo_disponivel`, atualizam saldos, registram movimentos e auditoria atomicamente.

## 5. Schema de referência para criação do banco (MySQL 8.0.16+)

As definições de tabela abaixo refletem o schema usado, com InnoDB e collation `utf8mb4_unicode_ci`. O script de instalação cria e seleciona `NEURAL` com essa collation, desativa temporariamente e depois reativa `FOREIGN_KEY_CHECKS`, e também executa `DROP DATABASE IF EXISTS NEURAL` antes de recriar o banco. Esse `DROP` apaga todos os dados existentes nessa base e não está repetido no bloco abaixo; não o execute em produção nem em uma base com dados que devam ser preservados. Para banco existente, use uma migração revisada, não a recriação.

O MySQL 8.0.16 ou superior é necessário para que as restrições `CHECK` sejam efetivamente aplicadas. A collation `utf8mb4_unicode_ci` evita a incompatibilidade com `utf8mb4_0900_ai_ci` em servidores antigos, mas não torna as restrições `CHECK` efetivas em versões antigas do MySQL. As conexões de aplicação e de migração devem usar fuso UTC. Antes de produção, validar em ambiente descartável e confirmar os grants do usuário de runtime. O backend atual ainda exige adaptação de nomes e consultas antes de usar este modelo.

```sql
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
```

### Restrições de banco e obrigações transacionais

- A API valida dígitos verificadores de CPF/CNPJ; o banco aplica unicidade, tamanho e integridade referencial como última barreira. Erros de chave única são convertidos em `409 DUPLICATE_IDENTIFIER`, não em erro genérico.
- Atualizações de `saldo_fisico` e `saldo_reservado` só são feitas por serviço transacional. Não se concede acesso SQL de escrita direta a esses campos para usuários finais.
- `audit_logs` exige `INSERT`/`SELECT` para a aplicação; conceder `UPDATE`/`DELETE` é proibido. Os triggers devem existir em produção e ser verificados no health/deploy check.
- Índices e FKs com `id_empresa` impedem associação entre registros de tenants diferentes. Exclusões em entidades referenciadas são restringidas; a operação normal é inativação.

## Contratos de API

Todas as rotas usam prefixo `/api`. Rotas privadas exigem o cabeçalho `Authorization` no esquema Bearer com token JWT válido e obtêm `id_empresa` e `id_usuario` do token. JSON é UTF-8. Datas são ISO 8601 UTC. Escritas que criam ou atualizam dados validam tenant, perfil e assinatura no backend. Respostas de entidades incluem `id` técnico e `display_id`; por exemplo, `{ "id": 104, "display_id": "OS-200104" }`. `login_normalizado` é produzido pela API após `trim` e conversão para minúsculas.

### Envelope de erro

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Estoque disponível insuficiente.",
    "details": { "id_peca": 104, "saldo_disponivel": 1, "solicitado": 2 },
    "request_id": "uuid"
  }
}
```

`400` JSON malformado; `401` autenticação; `403` perfil ou assinatura; `404` recurso inexistente no tenant; `409` conflito de unicidade/estado/estoque; `422` validação de campo; `429` limite de requisições; `500` falha inesperada sem detalhes internos. Toda resposta de erro inclui `request_id`; não expõe SQL, token, senha ou stack trace.

| Método e endpoint | Acesso | Contrato e efeitos |
|---|---|---|
| `GET /api/health` | Público, bypass | `200 { "status":"ok", "database":"connected" }`; `503` se dependência essencial indisponível |
| `POST /api/auth/login` | Público, bypass | Body `{ "login":"...", "senha":"..." }`; `200` com token e usuário; `401` em credenciais inválidas. Enfileira notificação apenas em sucesso |
| `POST /api/auth/register-company` | Público, bypass | Cria empresa, usuário ADMIN e assinatura inicial em transação; valida CNPJ, login e política de assinatura |
| `POST /api/auth/logout` | Autenticado, bypass | Invalida sessão/refresh token; retorna `204` |
| `GET /api/checkout` | Autenticado, bypass | Retorna opções e estado da assinatura; não retorna dados de negócio |
| `POST /api/payments` | Autenticado, bypass | Cria intenção de pagamento; corpo e idempotência definidos pelo provedor configurado |
| `POST /api/payments/webhook` | Público com assinatura de provedor | Atualiza assinatura de forma idempotente; só `ACTIVE` libera acesso |
| `GET, POST /api/support` | Autenticado, bypass | Consulta/cria solicitação de suporte sem liberar acesso às demais funções |
| `POST /api/clientes` | ADMIN, GERENTE, ATENDENTE | Cria cliente; telefone normalizado; duplicidade `409` |
| `PUT /api/clientes/:id` | ADMIN, GERENTE, ATENDENTE | Atualiza cliente dentro do tenant; valida novamente unicidade normalizada |
| `DELETE /api/clientes/:id` | ADMIN, GERENTE | Inativa cliente; não apaga nem libera telefone |
| `POST /api/fornecedores` | ADMIN, GERENTE | Cria fornecedor; exige CNPJ válido normalizado e único na empresa |
| `PUT /api/fornecedores/:id` | ADMIN, GERENTE | Atualiza fornecedor no tenant; conflitos de CNPJ retornam `409` |
| `POST /api/funcionarios` | ADMIN, GERENTE | Cria funcionário; exige CPF válido normalizado e único na empresa |
| `PUT /api/funcionarios/:id` | ADMIN, GERENTE | Atualiza funcionário no tenant; conflitos de CPF retornam `409` |
| `POST /api/estoque` | ADMIN, GERENTE | Cria item com fornecedor ativo do mesmo tenant; saldo e mínimo não podem ser negativos |
| `PUT /api/estoque/:id` | ADMIN, GERENTE | Atualiza dados/mínimo; fornecedor deve pertencer ao tenant; alteração do mínimo recalcula alerta |
| `POST /api/estoque/:id/movimentacoes` | ADMIN, GERENTE, ESTOQUISTA | Body identifica `ENTRADA` ou `AJUSTE`, quantidade e motivo; bloqueia linha, recalcula alertas e registra movimento/auditoria em transação |
| `POST /api/os` | ADMIN, GERENTE, ATENDENTE | Body `{ "id_cliente":104, "equipamento_tipo":"...", "equipamento_identificador":"...", "relato":"..." }`; abre OS, aloca `numero_os` por tenant, avalia garantia e grava auditoria |
| `GET /api/os` | ADMIN, GERENTE, SUPERVISOR, ATENDENTE, TECNICO | Lista somente OS do tenant; aceita `inicio`, `fim`, `periodo` (`diario`, `semanal`, `mensal`, `anual`) e `status`; intervalo início inclusivo/fim exclusivo |
| `POST /api/os/:id/orcamentos` | ADMIN, GERENTE, ATENDENTE | Body contém itens e `desconto_percentual`; emite nova versão de orçamento, recalcula valores/alçada e muda OS `Aberta -> Em Orçamento` |
| `POST /api/orcamentos/:id/aprovar` | ADMIN, GERENTE, ATENDENTE autorizado | Body vazio; orçamento `APPROVED`; OS `Em Orçamento -> Aprovada` |
| `POST /api/orcamentos/:id/recusar` | ADMIN, GERENTE, ATENDENTE autorizado | Body `{ "motivo":"..." }`; orçamento `REJECTED`; OS `Cancelada`, sem cobrança |
| `PATCH /api/os/:id/status` | ADMIN, GERENTE, SUPERVISOR conforme transição | Body `{ "status":"Em Atendimento", "motivo":"..." }`; executa matriz de estados, reserva/liberação de estoque e auditoria atomicamente; insuficiência responde `409` sem alteração parcial |
| `POST /api/os/:id/itens` | ADMIN, GERENTE, ATENDENTE | Adiciona serviço/peça; valida tenant, quantidade e preços; mão de obra de garantia fica a zero |
| `POST /api/os/:id/comentarios` | ADMIN, GERENTE, SUPERVISOR, ATENDENTE, TECNICO | Cria comentário não vazio e imutável; autor é obtido do token |
| `GET /api/os/:id/fechamento/validacao` | ADMIN, GERENTE, FINANCEIRO | Pré-valida itens e reservas; não baixa estoque |
| `POST /api/os/:id/fechamento` | ADMIN, GERENTE, FINANCEIRO | Finaliza em transação, valida saldo novamente, consome reservas, baixa estoque, marca `Concluída` e audita; repetição responde `409 ALREADY_FINALIZED` |
| `DELETE /api/os/:id?confirm=true` | ADMIN | Body `{ "motivo":"..." }`; exige confirmação explícita; exclusão lógica e auditoria |
| `GET /api/os/:id/auditoria` | ADMIN, GERENTE, SUPERVISOR | Retorna eventos somente leitura, paginados e restritos ao tenant |
| `GET /api/estoque/:id/movimentacoes` | ADMIN, GERENTE, FINANCEIRO, ATENDENTE | Histórico somente leitura com paginação e intervalo de datas |
| `GET /api/estoque/alertas` | ADMIN, GERENTE, SUPERVISOR, SUPRIMENTOS | Lista alertas abertos/resolvidos do tenant |
| `GET /api/suprimentos/minutas/:id` | ADMIN, GERENTE, SUPRIMENTOS | Retorna minuta `DRAFT`; não envia pedido ao fornecedor |

`POST /api/os/:id/fechamento` e transições de status usam transações InnoDB e são idempotentes: cada requisição repetida não pode duplicar baixa, movimentação, reserva, orçamento ou evento de notificação. Quando aplicável, o cliente envia `Idempotency-Key`; o backend persiste a chave e o resultado por tenant. O perfil `ESTOQUISTA` é permitido somente nas rotas de movimentação e consulta de estoque.

## Execução e estado de implementação

O projeto usa Node.js 20.19+ ou 22.12+, Express, React/Vite e MySQL. O backend local inicia na porta `4000`, o frontend na `3000`; `npm test` executa os testes do backend. A configuração requer `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` e `JWT_SECRET` com pelo menos 32 caracteres.

O backend usa o schema plural deste documento. Faça backup da base antes da migração e confira que `backend/.env` aponta para `DB_NAME=NEURAL`. Na pasta `backend`, execute `npm run execute_migration` para aplicar `backend/src/db/migrations/001_app_compatibility.sql`. O executor valida o servidor, a base e as tabelas de origem; usa lock para evitar execução concorrente e mantém o checksum em `schema_migrations`. Os comandos já presentes no schema são detectados e ignorados, permitindo retomar após interrupção. A migração acrescenta campos usados pela interface e o histórico de status sem apagar tabelas ou dados. O usuário configurado precisa de permissão de conexão, leitura do `information_schema` e alteração/criação das tabelas. `backend/src/db/database.js` verifica a conexão, as tabelas e as colunas requeridas ao iniciar; não executa DDL automaticamente. `backend/src/db/schema.sql` está desativado por ser um schema legado incompatível; use o DDL deste documento e as migrações versionadas.
