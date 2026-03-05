import { tenantExecute, tenantQuery } from '../db/tenantDb';

export async function salvarTags(
  tenantId: number,
  entityType: string,
  entityId: number,
  tags?: string[]
) {
  await tenantExecute(
    tenantId,
    'DELETE FROM tenant_tags WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );

  if (!tags || !tags.length) return;

  const insertSql =
    'INSERT INTO tenant_tags (tenant_id, entity_type, entity_id, tag) VALUES (?, ?, ?, ?)';

  for (const tag of tags) {
    await tenantExecute(tenantId, insertSql, [entityType, entityId, tag]);
  }
}

export async function buscarTagsMap(
  tenantId: number,
  entityType: string,
  entityIds: number[]
): Promise<Record<number, string[]>> {
  if (!entityIds.length) return {};

  const rows = await tenantQuery<{ entity_id: number; tag: string }>(
    tenantId,
    `SELECT entity_id, tag
       FROM tenant_tags
      WHERE tenant_id = ? AND entity_type = ? AND entity_id IN (?)
      ORDER BY id`,
    [entityType, entityIds]
  );

  return rows.reduce<Record<number, string[]>>((acc, row) => {
    acc[row.entity_id] = acc[row.entity_id] || [];
    acc[row.entity_id].push(row.tag);
    return acc;
  }, {});
}

export async function deletarTags(tenantId: number, entityType: string, entityId: number) {
  await tenantExecute(
    tenantId,
    'DELETE FROM tenant_tags WHERE tenant_id = ? AND entity_type = ? AND entity_id = ?',
    [entityType, entityId]
  );
}
