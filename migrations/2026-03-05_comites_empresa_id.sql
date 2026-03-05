START TRANSACTION;

ALTER TABLE comites
  ADD COLUMN empresa_id int NULL AFTER tenant_id;

UPDATE comites c
JOIN (
  SELECT tenant_id, MIN(id) AS empresa_id
    FROM empresas
   GROUP BY tenant_id
) e ON e.tenant_id = c.tenant_id
SET c.empresa_id = e.empresa_id
WHERE c.empresa_id IS NULL;

ALTER TABLE comites
  MODIFY COLUMN empresa_id int NOT NULL;

ALTER TABLE comites
  ADD KEY idx_comites_empresa (empresa_id);

ALTER TABLE comites
  ADD CONSTRAINT fk_comites_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE;

ALTER TABLE comites
  DROP INDEX uk_comites_tenant_nome,
  ADD UNIQUE KEY uk_comites_tenant_empresa_nome (tenant_id, empresa_id, nome);

COMMIT;
