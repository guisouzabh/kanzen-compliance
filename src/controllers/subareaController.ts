import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarSubAreasService,
  criarSubAreaService,
  obterSubAreaPorIdService,
  atualizarSubAreaService,
  deletarSubAreaService
} from '../services/subareaService';
import { subareaSchema, SubAreaInput } from '../validation/subareaSchema';

export async function listarSubAreas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const subareas = await listarSubAreasService(tenantId);
  return res.json(subareas);
}

export async function criarSubArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = subareaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: SubAreaInput = parseResult.data;
  const subarea = await criarSubAreaService(dados, tenantId);

  return res.status(201).json(subarea);
}

export async function obterSubArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const subarea = await obterSubAreaPorIdService(id, tenantId);
  if (!subarea) {
    throw new AppError('Subárea não encontrada', 404);
  }

  return res.json(subarea);
}

export async function atualizarSubArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = subareaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: SubAreaInput = parseResult.data;
  const atualizada = await atualizarSubAreaService(id, dados, tenantId);

  if (!atualizada) {
    throw new AppError('Subárea não encontrada', 404);
  }

  return res.json(atualizada);
}

export async function deletarSubArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarSubAreaService(id, tenantId);
  if (!ok) {
    throw new AppError('Subárea não encontrada', 404);
  }

  return res.status(204).send();
}
