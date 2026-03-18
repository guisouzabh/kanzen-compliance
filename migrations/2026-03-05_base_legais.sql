START TRANSACTION;

CREATE TABLE IF NOT EXISTS dm_base_legais (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  codigo varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  nome varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  ativo tinyint(1) NOT NULL DEFAULT 1,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_dm_base_legais_tenant_codigo (tenant_id, codigo),
  KEY idx_dm_base_legais_tenant (tenant_id),
  KEY idx_dm_base_legais_ativo (tenant_id, ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS base_legal_empresa (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  base_legal_id int NOT NULL,
  status enum('ATIVA','INATIVA') NOT NULL DEFAULT 'ATIVA',
  fundamento_juridico_empresa text COLLATE utf8mb4_unicode_ci NULL,
  data_inicio_vigencia date NULL,
  data_termino_vigencia date NULL,
  deleted tinyint(1) NOT NULL DEFAULT 0,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_base_legal_empresa_unico (tenant_id, empresa_id, base_legal_id),
  KEY idx_base_legal_empresa_tenant (tenant_id),
  KEY idx_base_legal_empresa_empresa (empresa_id),
  KEY idx_base_legal_empresa_base_legal (base_legal_id),
  KEY idx_base_legal_empresa_deleted (tenant_id, deleted),
  CONSTRAINT fk_base_legal_empresa_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
  CONSTRAINT fk_base_legal_empresa_base FOREIGN KEY (base_legal_id) REFERENCES dm_base_legais (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
