START TRANSACTION;

RENAME TABLE requisito_tags TO tenant_tags;

COMMIT;
