START TRANSACTION;

CREATE TABLE IF NOT EXISTS matriz_acoes (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  acao varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  objetivo text COLLATE utf8mb4_unicode_ci NULL,
  status enum('PLANEJADA','EM_ANDAMENTO','CONCLUIDA','IMPEDIDA') NOT NULL DEFAULT 'PLANEJADA',
  prioridade tinyint NOT NULL DEFAULT 3,
  esforco tinyint NOT NULL DEFAULT 3,
  prazo date NULL,
  status_prazo enum('NAO_APLICAVEL','NO_PRAZO','ATRASADA') NOT NULL DEFAULT 'NO_PRAZO',
  origem text COLLATE utf8mb4_unicode_ci NULL,
  origem_typ varchar(50) COLLATE utf8mb4_unicode_ci NULL,
  origem_id int NULL,
  responsavel_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_matriz_acoes_tenant (tenant_id),
  KEY idx_matriz_acoes_empresa (empresa_id),
  KEY idx_matriz_acoes_status (status),
  KEY idx_matriz_acoes_prazo (prazo),
  KEY idx_matriz_acoes_origem (origem_typ, origem_id),
  CONSTRAINT fk_matriz_acoes_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
  CONSTRAINT fk_matriz_acoes_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
