START TRANSACTION;

ALTER TABLE comites
  ADD COLUMN tipo enum('COMITE','DPO') NOT NULL DEFAULT 'COMITE' AFTER status;

ALTER TABLE comites
  ADD KEY idx_comites_tenant_tipo (tenant_id, tipo);

COMMIT;
