import { tenantQuery } from '../db/tenantDb';
import { Usuario } from '../types/Usuario';

export async function listarUsuariosService(tenantId: number): Promise<Usuario[]> {
  return tenantQuery<Usuario>(
    tenantId,
    `
      SELECT id, nome, email, tenant_id, empresa_id, area_id
        FROM usuarios
       WHERE tenant_id = ?
       ORDER BY id DESC
    `
  );
}
