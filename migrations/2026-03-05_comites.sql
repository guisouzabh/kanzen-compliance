START TRANSACTION;

CREATE TABLE IF NOT EXISTS comites (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  nome varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci NULL,
  status enum('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_comites_tenant_nome (tenant_id, nome),
  KEY idx_comites_tenant (tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS comite_membros (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  comite_id int NOT NULL,
  usuario_id int NOT NULL,
  papel enum('PRESIDENTE','SECRETARIO','MEMBRO') NOT NULL DEFAULT 'MEMBRO',
  ativo tinyint(1) NOT NULL DEFAULT 1,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_comite_membros_unico (tenant_id, comite_id, usuario_id),
  KEY idx_comite_membros_tenant (tenant_id),
  KEY idx_comite_membros_comite (comite_id),
  KEY idx_comite_membros_usuario (usuario_id),
  CONSTRAINT fk_comite_membros_comite FOREIGN KEY (comite_id) REFERENCES comites (id) ON DELETE CASCADE,
  CONSTRAINT fk_comite_membros_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
