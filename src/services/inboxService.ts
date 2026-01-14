import { tenantQuery } from '../db/tenantDb';
import { InboxNotificacao } from '../types/InboxNotificacao';

interface InboxFilters {
  usuarioId?: number;
  status?: string;
  tipo?: string;
  prioridade?: string;
  remetente?: string;
  q?: string;
  createdFrom?: string;
  createdTo?: string;
}

export async function listarInboxService(
  tenantId: number,
  filters: InboxFilters
): Promise<InboxNotificacao[]> {
  const conditions: string[] = ['n.tenant_id = ?'];
  const params: Array<string | number> = [tenantId];

  if (filters.usuarioId) {
    conditions.push('n.usuario_id = ?');
    params.push(filters.usuarioId);
  }
  if (filters.status) {
    conditions.push('n.status = ?');
    params.push(filters.status);
  }
  if (filters.tipo) {
    conditions.push('n.tipo = ?');
    params.push(filters.tipo);
  }
  if (filters.prioridade) {
    conditions.push('n.prioridade = ?');
    params.push(filters.prioridade);
  }
  if (filters.remetente) {
    conditions.push('n.remetente LIKE ?');
    params.push(`%${filters.remetente}%`);
  }
  if (filters.q) {
    conditions.push('(n.titulo LIKE ? OR n.corpo LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  if (filters.createdFrom) {
    conditions.push('n.created_at >= ?');
    params.push(filters.createdFrom);
  }
  if (filters.createdTo) {
    conditions.push('n.created_at <= ?');
    params.push(filters.createdTo);
  }

  const sql = `
    SELECT n.*, u.nome AS usuario_nome
      FROM inbox_notificacoes n
      JOIN usuarios u ON u.id = n.usuario_id AND u.tenant_id = n.tenant_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY n.created_at DESC, n.id DESC
  `;

  return tenantQuery<InboxNotificacao>(tenantId, sql, params.slice(1));
}
