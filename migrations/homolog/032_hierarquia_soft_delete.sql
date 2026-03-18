ALTER TABLE unidades
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER descricao,
  ADD KEY idx_unidades_ativo (tenant_id, ativo);

ALTER TABLE areas
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER descricao,
  ADD KEY idx_areas_ativo (tenant_id, ativo);

ALTER TABLE subareas
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER descricao,
  ADD KEY idx_subareas_ativo (tenant_id, ativo);

ALTER TABLE subarea2
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1 AFTER descricao,
  ADD KEY idx_subarea2_ativo (tenant_id, ativo);
