-- Impacto no documento regulatório (0 a 5)

ALTER TABLE `documentos_regulatorios`
  ADD COLUMN `impacto` tinyint NOT NULL DEFAULT 3 AFTER `periodicidade`;
