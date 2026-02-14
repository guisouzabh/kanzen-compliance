START TRANSACTION;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_modelos (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  nome varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  versao int NOT NULL DEFAULT 1,
  ativo tinyint NOT NULL DEFAULT 1,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lgpd_diag_modelo_tenant (tenant_id),
  KEY idx_lgpd_diag_modelo_ativo (tenant_id, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_perguntas (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  modelo_id int NOT NULL,
  codigo varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  dominio varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  pergunta text COLLATE utf8mb4_unicode_ci NOT NULL,
  opcao_0 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  opcao_1 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  opcao_2 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  opcao_3 varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  peso tinyint NOT NULL DEFAULT 1,
  ordem int NOT NULL DEFAULT 0,
  ativo tinyint NOT NULL DEFAULT 1,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lgpd_diag_perguntas_tenant (tenant_id),
  KEY idx_lgpd_diag_perguntas_modelo (modelo_id),
  KEY idx_lgpd_diag_perguntas_dominio (dominio),
  CONSTRAINT fk_lgpd_diag_perguntas_modelo
    FOREIGN KEY (modelo_id) REFERENCES lgpd_diagnostico_modelos (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_execucoes (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  modelo_id int NOT NULL,
  status varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RASCUNHO',
  nota_geral decimal(5,2) NOT NULL DEFAULT 0,
  total_peso int NOT NULL DEFAULT 0,
  max_pontos int NOT NULL DEFAULT 0,
  pontos decimal(10,2) NOT NULL DEFAULT 0,
  criado_por_usuario_id int NULL,
  atualizado_por_usuario_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lgpd_diag_exec_tenant (tenant_id),
  KEY idx_lgpd_diag_exec_empresa (empresa_id),
  KEY idx_lgpd_diag_exec_modelo (modelo_id),
  CONSTRAINT fk_lgpd_diag_exec_empresa
    FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
  CONSTRAINT fk_lgpd_diag_exec_modelo
    FOREIGN KEY (modelo_id) REFERENCES lgpd_diagnostico_modelos (id) ON DELETE RESTRICT,
  CONSTRAINT fk_lgpd_diag_exec_criado_por
    FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_lgpd_diag_exec_atualizado_por
    FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_respostas (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  execucao_id int NOT NULL,
  pergunta_id int NOT NULL,
  dominio varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  opcao tinyint NOT NULL,
  valor tinyint NOT NULL,
  peso tinyint NOT NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lgpd_diag_resposta (execucao_id, pergunta_id),
  KEY idx_lgpd_diag_resposta_tenant (tenant_id),
  KEY idx_lgpd_diag_resposta_exec (execucao_id),
  CONSTRAINT fk_lgpd_diag_resposta_exec
    FOREIGN KEY (execucao_id) REFERENCES lgpd_diagnostico_execucoes (id) ON DELETE CASCADE,
  CONSTRAINT fk_lgpd_diag_resposta_pergunta
    FOREIGN KEY (pergunta_id) REFERENCES lgpd_diagnostico_perguntas (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lgpd_diagnostico_resultados_dominio (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  execucao_id int NOT NULL,
  dominio varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  nota decimal(5,2) NOT NULL DEFAULT 0,
  total_peso int NOT NULL DEFAULT 0,
  max_pontos int NOT NULL DEFAULT 0,
  pontos decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_lgpd_diag_resultado (execucao_id, dominio),
  KEY idx_lgpd_diag_resultado_tenant (tenant_id),
  KEY idx_lgpd_diag_resultado_exec (execucao_id),
  CONSTRAINT fk_lgpd_diag_resultado_exec
    FOREIGN KEY (execucao_id) REFERENCES lgpd_diagnostico_execucoes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
