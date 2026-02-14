START TRANSACTION;

CREATE TABLE IF NOT EXISTS status_lgpd (
  id tinyint NOT NULL,
  nome varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO status_lgpd (id, nome) VALUES
  (0, 'DPO'),
  (1, 'Governanca de Dados'),
  (2, 'Inventarios de Dados'),
  (3, 'Direito dos Titulares'),
  (4, 'Seguranca da Informacao e Incidentes'),
  (5, 'Risco e Impacto'),
  (6, 'Retencao e Descarte'),
  (7, 'Cultura e Evidencia')
ON DUPLICATE KEY UPDATE
  nome = VALUES(nome);

CREATE TABLE IF NOT EXISTS empresa_dados_status (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  status_lgpd_id tinyint NOT NULL,
  percentual decimal(5,2) NOT NULL DEFAULT 0,
  descricao_sistema text COLLATE utf8mb4_unicode_ci,
  comentarios text COLLATE utf8mb4_unicode_ci,
  versao int NOT NULL DEFAULT 1,
  criado_por_usuario_id int NULL,
  atualizado_por_usuario_id int NULL,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_empresa_dados_status_tenant (tenant_id),
  KEY idx_empresa_dados_status_empresa (empresa_id),
  KEY idx_empresa_dados_status_status (status_lgpd_id),
  CONSTRAINT fk_empresa_dados_status_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE,
  CONSTRAINT fk_empresa_dados_status_status FOREIGN KEY (status_lgpd_id) REFERENCES status_lgpd (id) ON DELETE RESTRICT,
  CONSTRAINT fk_empresa_dados_status_criado_por FOREIGN KEY (criado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL,
  CONSTRAINT fk_empresa_dados_status_atualizado_por FOREIGN KEY (atualizado_por_usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
