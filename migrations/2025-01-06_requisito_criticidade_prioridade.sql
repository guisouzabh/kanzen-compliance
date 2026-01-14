START TRANSACTION;

ALTER TABLE requisitos
  ADD COLUMN criticidade tinyint NOT NULL DEFAULT 3 AFTER modo,
  ADD COLUMN prioridade tinyint NOT NULL DEFAULT 3 AFTER criticidade;

COMMIT;
