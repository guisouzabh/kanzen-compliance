-- Módulo de Treinamento LGPD
-- Executar após 2026-03-28_planos.sql

-- ─── Expandir turmas_treinamento ──────────────────────────────────────────────
ALTER TABLE turmas_treinamento
  ADD COLUMN slug                  VARCHAR(40)  NULL AFTER status,
  ADD COLUMN prazo_conclusao       DATE         NULL AFTER slug,
  ADD COLUMN created_by_usuario_id INT          NULL AFTER prazo_conclusao,
  ADD UNIQUE  KEY uk_turma_slug (tenant_id, slug),
  ADD CONSTRAINT fk_turma_created_by FOREIGN KEY (created_by_usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;

-- ─── Colaboradores (entidade transversal) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS colaboradores (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id        INT          NOT NULL,
  empresa_id       INT          NOT NULL,
  usuario_id       INT          NULL,
  nome             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  cpf              VARCHAR(20)  NULL,
  data_nascimento  DATE         NULL,
  identificador    VARCHAR(100) NULL,
  cargo            VARCHAR(150) NULL,
  ativo            TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_colabs_empresa  FOREIGN KEY (empresa_id)  REFERENCES empresas(id),
  CONSTRAINT fk_colabs_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios(id) ON DELETE SET NULL,
  UNIQUE KEY uk_colab_email (tenant_id, empresa_id, email),
  INDEX idx_colabs_tenant (tenant_id),
  INDEX idx_colabs_empresa (tenant_id, empresa_id)
);

-- ─── Fila de email (infraestrutura genérica) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS email_queue (
  id                 BIGINT        AUTO_INCREMENT PRIMARY KEY,
  tenant_id          INT           NOT NULL,
  destinatario_email VARCHAR(255)  NOT NULL,
  destinatario_nome  VARCHAR(255)  NULL,
  assunto            VARCHAR(500)  NOT NULL,
  corpo_html         LONGTEXT      NOT NULL,
  tipo               VARCHAR(50)   NOT NULL,
  referencia_tipo    VARCHAR(50)   NULL,
  referencia_id      INT           NULL,
  status             ENUM('PENDENTE','ENVIADO','ERRO') NOT NULL DEFAULT 'PENDENTE',
  tentativas         TINYINT       NOT NULL DEFAULT 0,
  erro_mensagem      TEXT          NULL,
  agendado_para      DATETIME      NULL,
  enviado_em         DATETIME      NULL,
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_status   (status),
  INDEX idx_email_tenant   (tenant_id),
  INDEX idx_email_agendado (agendado_para)
);

-- ─── Configurações de treinamento (1:1 com planos tipo TREINAMENTO) ───────────
CREATE TABLE IF NOT EXISTS configuracoes_treinamento (
  id                      INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id               INT          NOT NULL,
  plano_id                INT          NOT NULL,
  quiz_habilitado         TINYINT(1)   NOT NULL DEFAULT 0,
  nota_minima             DECIMAL(5,2) NULL,
  max_tentativas          TINYINT      NULL,
  tipo_identificador      VARCHAR(50)  NOT NULL DEFAULT 'CPF',
  label_identificador     VARCHAR(100) NOT NULL DEFAULT 'CPF',
  link_publico_habilitado TINYINT(1)   NOT NULL DEFAULT 1,
  created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE,
  UNIQUE KEY uk_config_plano (tenant_id, plano_id)
);

-- ─── Materiais do plano (template aplicado a todas as turmas) ─────────────────
CREATE TABLE IF NOT EXISTS treinamento_materiais (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id  INT          NOT NULL,
  plano_id   INT          NOT NULL,
  titulo     VARCHAR(255) NOT NULL,
  tipo       ENUM('LINK','PDF','VIDEO') NOT NULL,
  url        VARCHAR(500) NOT NULL,
  ordem      INT          NOT NULL DEFAULT 0,
  ativo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mat_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE,
  INDEX idx_mat_plano (tenant_id, plano_id, ordem)
);

-- ─── Perguntas do quiz (vinculadas ao plano) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS treinamento_quiz_perguntas (
  id                INT       AUTO_INCREMENT PRIMARY KEY,
  tenant_id         INT       NOT NULL,
  plano_id          INT       NOT NULL,
  pergunta          TEXT      NOT NULL,
  alternativas_json LONGTEXT  NOT NULL,
  ordem             INT       NOT NULL DEFAULT 0,
  ativo             TINYINT(1) NOT NULL DEFAULT 1,
  created_at        TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_quiz_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE CASCADE,
  INDEX idx_quiz_plano (tenant_id, plano_id, ordem)
);

-- ─── Materiais extras da turma (além dos herdados do plano) ──────────────────
CREATE TABLE IF NOT EXISTS treinamento_turma_materiais (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id  INT          NOT NULL,
  turma_id   INT          NOT NULL,
  titulo     VARCHAR(255) NOT NULL,
  tipo       ENUM('LINK','PDF','VIDEO') NOT NULL,
  url        VARCHAR(500) NOT NULL,
  ordem      INT          NOT NULL DEFAULT 0,
  ativo      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_turma_mat_turma FOREIGN KEY (turma_id) REFERENCES turmas_treinamento(id) ON DELETE CASCADE,
  INDEX idx_turma_mat (tenant_id, turma_id)
);

-- ─── Participantes (vínculo turma ↔ colaborador) ─────────────────────────────
CREATE TABLE IF NOT EXISTS treinamento_participantes (
  id                    INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id             INT          NOT NULL,
  turma_id              INT          NOT NULL,
  colaborador_id        INT          NOT NULL,
  status                ENUM('PENDENTE','EM_ANDAMENTO','APROVADO','REPROVADO') NOT NULL DEFAULT 'PENDENTE',
  nota_final            DECIMAL(5,2) NULL,
  tentativas_realizadas TINYINT      NOT NULL DEFAULT 0,
  concluido_em          DATETIME     NULL,
  magic_token           VARCHAR(100) NULL,
  magic_token_expira_em DATETIME     NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_part_turma FOREIGN KEY (turma_id)       REFERENCES turmas_treinamento(id) ON DELETE CASCADE,
  CONSTRAINT fk_part_colab FOREIGN KEY (colaborador_id) REFERENCES colaboradores(id),
  UNIQUE KEY uk_participante   (tenant_id, turma_id, colaborador_id),
  UNIQUE KEY uk_magic_token    (magic_token),
  INDEX idx_part_turma (tenant_id, turma_id)
);

-- ─── Execuções do quiz (cada tentativa de um participante) ───────────────────
CREATE TABLE IF NOT EXISTS treinamento_execucoes (
  id               INT          AUTO_INCREMENT PRIMARY KEY,
  tenant_id        INT          NOT NULL,
  participante_id  INT          NOT NULL,
  tentativa_numero TINYINT      NOT NULL,
  nota             DECIMAL(5,2) NULL,
  total_perguntas  INT          NOT NULL,
  total_acertos    INT          NOT NULL DEFAULT 0,
  status           ENUM('EM_ANDAMENTO','FINALIZADA') NOT NULL DEFAULT 'EM_ANDAMENTO',
  iniciado_em      DATETIME     NOT NULL,
  finalizado_em    DATETIME     NULL,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_exec_part FOREIGN KEY (participante_id) REFERENCES treinamento_participantes(id) ON DELETE CASCADE,
  UNIQUE KEY uk_execucao (participante_id, tentativa_numero),
  INDEX idx_exec_part (tenant_id, participante_id)
);

-- ─── Respostas individuais de cada tentativa ──────────────────────────────────
CREATE TABLE IF NOT EXISTS treinamento_respostas (
  id                INT        AUTO_INCREMENT PRIMARY KEY,
  tenant_id         INT        NOT NULL,
  execucao_id       INT        NOT NULL,
  pergunta_id       INT        NOT NULL,
  alternativa_index TINYINT    NOT NULL,
  correta           TINYINT(1) NOT NULL,
  created_at        TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resp_exec FOREIGN KEY (execucao_id)  REFERENCES treinamento_execucoes(id) ON DELETE CASCADE,
  CONSTRAINT fk_resp_perg FOREIGN KEY (pergunta_id)  REFERENCES treinamento_quiz_perguntas(id),
  UNIQUE KEY uk_resposta (execucao_id, pergunta_id),
  INDEX idx_resp_exec (tenant_id, execucao_id)
);
