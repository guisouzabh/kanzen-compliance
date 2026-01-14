START TRANSACTION;

CREATE TABLE IF NOT EXISTS unidades (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  empresa_id int NOT NULL,
  nome varchar(150) NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_unidades_tenant (tenant_id),
  KEY fk_unidades_empresa (empresa_id),
  CONSTRAINT fk_unidades_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO unidades (tenant_id, empresa_id, nome)
SELECT e.tenant_id, e.id, CONCAT('Unidade ', e.nome)
  FROM empresas e
  LEFT JOIN unidades u ON u.tenant_id = e.tenant_id AND u.empresa_id = e.id
 WHERE u.id IS NULL;

ALTER TABLE areas ADD COLUMN unidade_id int NULL AFTER empresa_id;

UPDATE areas a
JOIN unidades u ON u.tenant_id = a.tenant_id AND u.empresa_id = a.empresa_id
   SET a.unidade_id = u.id
 WHERE a.unidade_id IS NULL;

UPDATE areas a
JOIN (
  SELECT tenant_id, MIN(id) AS unidade_id
    FROM unidades
   GROUP BY tenant_id
) umin ON umin.tenant_id = a.tenant_id
   SET a.unidade_id = umin.unidade_id
 WHERE a.unidade_id IS NULL;

ALTER TABLE areas MODIFY unidade_id int NOT NULL;
ALTER TABLE areas ADD KEY idx_areas_unidade (unidade_id);
ALTER TABLE areas
  ADD CONSTRAINT fk_areas_unidade FOREIGN KEY (unidade_id) REFERENCES unidades (id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS subareas (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  area_id int NOT NULL,
  nome varchar(150) NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subareas_tenant (tenant_id),
  KEY fk_subareas_area (area_id),
  CONSTRAINT fk_subareas_area FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subarea2 (
  id int NOT NULL AUTO_INCREMENT,
  tenant_id int NOT NULL,
  subarea_id int NOT NULL,
  nome varchar(150) NOT NULL,
  descricao text COLLATE utf8mb4_unicode_ci,
  created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subarea2_tenant (tenant_id),
  KEY fk_subarea2_subarea (subarea_id),
  CONSTRAINT fk_subarea2_subarea FOREIGN KEY (subarea_id) REFERENCES subareas (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
