import { tenantQuery } from '../db/tenantDb';
import { StatusLgpd } from '../types/StatusLgpd';

export async function listarStatusLgpdService(tenantId: number): Promise<StatusLgpd[]> {
  return tenantQuery<StatusLgpd>(
    tenantId,
    'SELECT id, nome FROM status_lgpd ORDER BY id ASC'
  );
}
