START TRANSACTION;

ALTER TABLE empresas
  ADD COLUMN parametro_maturidade tinyint NOT NULL DEFAULT 0;

COMMIT;
