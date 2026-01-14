import { pool } from '../config/db';

/**
 * SELECTs com tenant obrigatório.
 * Regra: primeira ? do SQL SEMPRE é tenant_id.
 */
export async function tenantQuery<T>(
  tenantId: number,
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const [rows] = await pool.query(sql, [tenantId, ...params]);
  return rows as T[];
}

/**
 * INSERT/UPDATE/DELETE com tenant obrigatório.
 * Regra: primeira ? do SQL SEMPRE é tenant_id (coluna ou filtro).
 */
export async function tenantExecute(
  tenantId: number,
  sql: string,
  params: any[] = []
): Promise<any> {
  const [result] = await pool.query(sql, [tenantId, ...params]);
  return result;
}
