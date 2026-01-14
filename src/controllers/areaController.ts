import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarAreasService,
  criarAreaService,
  obterAreaPorIdService,
  atualizarAreaService,
  deletarAreaService
} from '../services/areaService';
import { areaSchema, AreaInput } from '../validation/areaSchema';

export async function listarAreas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const areas = await listarAreasService(tenantId);
  return res.json(areas);
}

export async function criarArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = areaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: AreaInput = parseResult.data;
  const area = await criarAreaService(dados, tenantId);

  return res.status(201).json(area);
}

export async function obterArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const area = await obterAreaPorIdService(id, tenantId);
  if (!area) {
    throw new AppError('Área não encontrada', 404);
  }

  return res.json(area);
}

export async function atualizarArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = areaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: AreaInput = parseResult.data;
  const atualizada = await atualizarAreaService(id, dados, tenantId);

  if (!atualizada) {
    throw new AppError('Área não encontrada', 404);
  }

  return res.json(atualizada);
}

export async function deletarArea(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarAreaService(id, tenantId);
  if (!ok) {
    throw new AppError('Área não encontrada', 404);
  }

  return res.status(204).send();
}
