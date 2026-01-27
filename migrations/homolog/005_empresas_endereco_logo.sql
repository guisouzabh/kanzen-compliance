ALTER TABLE empresas
  ADD COLUMN cep varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN endereco varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN cidade varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN estado varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  ADD COLUMN logo_url varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL;
