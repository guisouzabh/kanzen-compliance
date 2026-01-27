-- Impacto no documento da empresa

ALTER TABLE `documentos_empresa`
  ADD COLUMN `impacto` tinyint DEFAULT NULL AFTER `documento_regulatorio_id`;
