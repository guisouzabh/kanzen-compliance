import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarUnidadesService,
  criarUnidadeService,
  obterUnidadePorIdService,
  atualizarUnidadeService,
  deletarUnidadeService
} from '../services/unidadeService';
import { unidadeSchema, UnidadeInput } from '../validation/unidadeSchema';

export async function listarUnidades(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const unidades = await listarUnidadesService(tenantId);
  return res.json(unidades);
}

export async function criarUnidade(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = unidadeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: UnidadeInput = parseResult.data;
  const unidade = await criarUnidadeService(dados, tenantId);

  return res.status(201).json(unidade);
}

export async function obterUnidade(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const unidade = await obterUnidadePorIdService(id, tenantId);
  if (!unidade) {
    throw new AppError('Unidade não encontrada', 404);
  }

  return res.json(unidade);
}

export async function atualizarUnidade(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = unidadeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: UnidadeInput = parseResult.data;
  const atualizada = await atualizarUnidadeService(id, dados, tenantId);

  if (!atualizada) {
    throw new AppError('Unidade não encontrada', 404);
  }

  return res.json(atualizada);
}

export async function deletarUnidade(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarUnidadeService(id, tenantId);
  if (!ok) {
    throw new AppError('Unidade não encontrada', 404);
  }

  return res.status(204).send();
}
