import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import { avaliacaoRiscoSchema } from '../validation/avaliacaoRiscoSchema';
import {
  listarAvaliacoesRiscoService,
  obterAvaliacaoPorInventarioService,
  listarHistoricoService,
  salvarAvaliacaoRiscoService
} from '../services/avaliacaoRiscoService';

export async function listarAvaliacoesRisco(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarAvaliacoesRiscoService(tenantId);
  return res.json(dados);
}

export async function obterAvaliacaoPorInventario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const inventarioId = Number(req.params.inventarioId);
  if (Number.isNaN(inventarioId)) throw new AppError('ID inválido', 400);

  const dado = await obterAvaliacaoPorInventarioService(tenantId, inventarioId);
  return res.json(dado ?? null);
}

export async function listarHistorico(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const avaliacaoId = Number(req.params.id);
  if (Number.isNaN(avaliacaoId)) throw new AppError('ID inválido', 400);

  const historico = await listarHistoricoService(tenantId, avaliacaoId);
  return res.json(historico);
}

export async function salvarAvaliacaoRisco(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario!.id;

  const parseResult = avaliacaoRiscoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const salvo = await salvarAvaliacaoRiscoService(parseResult.data, tenantId, usuarioId);
  return res.status(200).json(salvo);
}
