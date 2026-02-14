import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarSolicitacoesTitularService,
  criarSolicitacaoTitularService,
  atualizarSolicitacaoTitularService,
  deletarSolicitacaoTitularService
} from '../services/solicitacaoTitularService';
import {
  solicitacaoTitularSchema,
  SolicitacaoTitularInput
} from '../validation/solicitacaoTitularSchema';

export async function listarSolicitacoesTitular(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarSolicitacoesTitularService(tenantId);
  return res.json(dados);
}

export async function criarSolicitacaoTitular(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = solicitacaoTitularSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: SolicitacaoTitularInput = parseResult.data;
  const novo = await criarSolicitacaoTitularService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarSolicitacaoTitular(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = solicitacaoTitularSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: SolicitacaoTitularInput = parseResult.data;
  const atualizado = await atualizarSolicitacaoTitularService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarSolicitacaoTitular(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarSolicitacaoTitularService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}
