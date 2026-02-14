ALTER TABLE inventario_dados
  ADD COLUMN quantidade_existente int NULL,
  ADD COLUMN quantidade_inserida_mes int NULL,
  ADD COLUMN quantidade_tratada_mes int NULL,
  ADD COLUMN principal_agente varchar(255) COLLATE utf8mb4_unicode_ci NULL;
