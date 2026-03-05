START TRANSACTION;

ALTER TABLE tenant_tags
  ADD COLUMN entity_type varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'REQUISITO' AFTER tenant_id,
  ADD COLUMN entity_id int NULL AFTER entity_type;

UPDATE tenant_tags
   SET entity_type = 'REQUISITO',
       entity_id = requisito_id;

ALTER TABLE tenant_tags
  DROP FOREIGN KEY fk_tag_requisito;

ALTER TABLE tenant_tags
  DROP INDEX fk_tag_requisito,
  DROP COLUMN requisito_id,
  MODIFY COLUMN entity_id int NOT NULL,
  ADD INDEX idx_tags_entity (entity_type, entity_id);

COMMIT;
