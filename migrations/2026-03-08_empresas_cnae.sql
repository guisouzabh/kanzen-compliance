START TRANSACTION;

ALTER TABLE empresas
  ADD COLUMN ramo_atuacao varchar(255) COLLATE utf8mb4_unicode_ci NULL AFTER razao_social,
  ADD COLUMN cnae_principal_codigo varchar(10) COLLATE utf8mb4_unicode_ci NULL AFTER ramo_atuacao,
  ADD COLUMN cnae_principal_descricao varchar(255) COLLATE utf8mb4_unicode_ci NULL AFTER cnae_principal_codigo,
  ADD COLUMN cnaes_secundarios_json longtext COLLATE utf8mb4_unicode_ci NULL AFTER cnae_principal_descricao;

COMMIT;
