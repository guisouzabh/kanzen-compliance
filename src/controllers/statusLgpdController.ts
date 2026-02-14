import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { listarStatusLgpdService } from '../services/statusLgpdService';

export async function listarStatusLgpd(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarStatusLgpdService(tenantId);
  return res.json(dados);
}
