import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarSubArea2Service,
  criarSubArea2Service,
  obterSubArea2PorIdService,
  atualizarSubArea2Service,
  deletarSubArea2Service
} from '../services/subarea2Service';
import { subarea2Schema, SubArea2Input } from '../validation/subarea2Schema';

export async function listarSubArea2(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const subareas = await listarSubArea2Service(tenantId);
  return res.json(subareas);
}

export async function criarSubArea2(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = subarea2Schema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: SubArea2Input = parseResult.data;
  const subarea2 = await criarSubArea2Service(dados, tenantId);

  return res.status(201).json(subarea2);
}

export async function obterSubArea2(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const subarea2 = await obterSubArea2PorIdService(id, tenantId);
  if (!subarea2) {
    throw new AppError('Subárea 2 não encontrada', 404);
  }

  return res.json(subarea2);
}

export async function atualizarSubArea2(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = subarea2Schema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: SubArea2Input = parseResult.data;
  const atualizada = await atualizarSubArea2Service(id, dados, tenantId);

  if (!atualizada) {
    throw new AppError('Subárea 2 não encontrada', 404);
  }

  return res.json(atualizada);
}

export async function deletarSubArea2(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarSubArea2Service(id, tenantId);
  if (!ok) {
    throw new AppError('Subárea 2 não encontrada', 404);
  }

  return res.status(204).send();
}
