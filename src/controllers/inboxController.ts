import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { listarInboxService } from '../services/inboxService';

export async function listarInbox(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const {
    usuario_id,
    status,
    tipo,
    prioridade,
    remetente,
    q,
    created_from,
    created_to
  } = req.query;

  const usuarioId = usuario_id ? Number(usuario_id) : undefined;

  const notificacoes = await listarInboxService(tenantId, {
    usuarioId: Number.isNaN(usuarioId) ? undefined : usuarioId,
    status: status ? String(status) : undefined,
    tipo: tipo ? String(tipo) : undefined,
    prioridade: prioridade ? String(prioridade) : undefined,
    remetente: remetente ? String(remetente) : undefined,
    q: q ? String(q) : undefined,
    createdFrom: created_from ? String(created_from) : undefined,
    createdTo: created_to ? String(created_to) : undefined
  });

  return res.json(notificacoes);
}
