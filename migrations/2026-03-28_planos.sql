-- Tabela principal de planos (cabeçalho genérico)
CREATE TABLE IF NOT EXISTS planos (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id      INT NOT NULL,
  empresa_id     INT NOT NULL,
  tipo           ENUM('ACOES','TREINAMENTO','AUDITORIA') NOT NULL,
  nome           VARCHAR(255) NOT NULL,
  descricao      TEXT NULL,
  status         ENUM('RASCUNHO','EM_ANDAMENTO','CONCLUIDO','CANCELADO') NOT NULL DEFAULT 'RASCUNHO',
  responsavel_id INT NULL,
  data_inicio    DATE NULL,
  data_fim       DATE NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_planos_empresa    FOREIGN KEY (empresa_id)     REFERENCES empresas(id),
  CONSTRAINT fk_planos_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- Adiciona plano_id em matriz_acoes (ações vinculadas a um Plano de Ações)
ALTER TABLE matriz_acoes
  ADD COLUMN plano_id INT NULL AFTER empresa_id,
  ADD CONSTRAINT fk_matriz_acoes_plano FOREIGN KEY (plano_id) REFERENCES planos(id) ON DELETE SET NULL;

-- Itens do Plano de Treinamento
CREATE TABLE IF NOT EXISTS turmas_treinamento (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id        INT NOT NULL,
  plano_id         INT NOT NULL,
  empresa_id       INT NOT NULL,
  tema             VARCHAR(255) NOT NULL,
  instrutor        VARCHAR(255) NULL,
  modalidade       ENUM('PRESENCIAL','ONLINE','HIBRIDO') NOT NULL DEFAULT 'PRESENCIAL',
  data_inicio      DATE NULL,
  data_fim         DATE NULL,
  carga_horaria    DECIMAL(6,1) NULL,
  local_realizacao VARCHAR(255) NULL,
  status           ENUM('AGENDADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'AGENDADA',
  responsavel_id   INT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_turmas_plano       FOREIGN KEY (plano_id)       REFERENCES planos(id) ON DELETE CASCADE,
  CONSTRAINT fk_turmas_empresa     FOREIGN KEY (empresa_id)     REFERENCES empresas(id),
  CONSTRAINT fk_turmas_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)
);

-- Itens do Plano de Auditoria
CREATE TABLE IF NOT EXISTS auditoria_itens (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id      INT NOT NULL,
  plano_id       INT NOT NULL,
  empresa_id     INT NOT NULL,
  descricao      VARCHAR(500) NOT NULL,
  tipo           ENUM('INTERNA','EXTERNA','TERCEIRA_PARTE') NOT NULL DEFAULT 'INTERNA',
  status         ENUM('PENDENTE','EM_ANDAMENTO','CONCLUIDA') NOT NULL DEFAULT 'PENDENTE',
  resultado      ENUM('CONFORME','NAO_CONFORME','EM_ANALISE') NULL,
  responsavel_id INT NULL,
  prazo          DATE NULL,
  requisito_id   INT NULL,
  processo_id    INT NULL,
  observacao     TEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_plano       FOREIGN KEY (plano_id)       REFERENCES planos(id) ON DELETE CASCADE,
  CONSTRAINT fk_audit_empresa     FOREIGN KEY (empresa_id)     REFERENCES empresas(id),
  CONSTRAINT fk_audit_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id),
  CONSTRAINT fk_audit_requisito   FOREIGN KEY (requisito_id)   REFERENCES requisitos(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_processo    FOREIGN KEY (processo_id)    REFERENCES processos(id) ON DELETE SET NULL
);
