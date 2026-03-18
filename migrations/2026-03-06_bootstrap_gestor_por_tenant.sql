START TRANSACTION;

UPDATE usuarios u
JOIN (
  SELECT tenant_id, MIN(id) AS primeiro_usuario_id
    FROM usuarios
   GROUP BY tenant_id
) primeiro_usuario ON primeiro_usuario.primeiro_usuario_id = u.id
LEFT JOIN (
  SELECT DISTINCT tenant_id
    FROM usuarios
   WHERE role = 'GESTOR'
 ) gestor_existente ON gestor_existente.tenant_id = u.tenant_id
   SET u.role = 'GESTOR'
 WHERE gestor_existente.tenant_id IS NULL
   AND COALESCE(u.role, '') <> 'GESTOR';

COMMIT;
