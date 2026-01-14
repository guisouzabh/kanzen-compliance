-- Adiciona hierarquia (até 3 níveis) em áreas e relacionamento N:N com empresas
ALTER TABLE areas
  ADD COLUMN parent_id BIGINT UNSIGNED NULL AFTER id,
  ADD KEY idx_areas_parent (parent_id),
  ADD CONSTRAINT fk_areas_parent FOREIGN KEY (parent_id) REFERENCES areas(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS area_empresas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id BIGINT UNSIGNED NOT NULL,
  area_id BIGINT UNSIGNED NOT NULL,
  empresa_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_area_empresa (tenant_id, area_id, empresa_id),
  KEY idx_area_empresas_tenant_area (tenant_id, area_id),
  KEY idx_area_empresas_tenant_empresa (tenant_id, empresa_id),
  CONSTRAINT fk_area_empresas_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE,
  CONSTRAINT fk_area_empresas_empresa FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);
