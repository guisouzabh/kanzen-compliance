START TRANSACTION;

ALTER TABLE lgpd_diagnostico_respostas
  ADD COLUMN observacoes text COLLATE utf8mb4_unicode_ci NULL AFTER peso;

COMMIT;
