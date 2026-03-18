import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { buscarCnaesOnlineService } from '../services/cnaeService';

export async function buscarCnaes(req: AuthRequest, res: Response) {
  const q = String(req.query.q ?? '').trim();
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20;

  const data = await buscarCnaesOnlineService(q, limit);
  return res.json(data);
}
