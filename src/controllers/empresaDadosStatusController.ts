import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarEmpresaDadosStatusService,
  criarEmpresaDadosStatusService,
  atualizarEmpresaDadosStatusService,
  deletarEmpresaDadosStatusService
} from '../services/empresaDadosStatusService';
import {
  empresaDadosStatusSchema,
  EmpresaDadosStatusInput
} from '../validation/empresaDadosStatusSchema';

export async function listarEmpresaDadosStatus(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : undefined;
  if (req.query.empresa_id && Number.isNaN(empresaId)) {
    throw new AppError('empresa_id inválido', 400);
  }
  const dados = await listarEmpresaDadosStatusService(tenantId, empresaId);
  return res.json(dados);
}

export async function criarEmpresaDadosStatus(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario?.id;
  const parseResult = empresaDadosStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: EmpresaDadosStatusInput = parseResult.data;
  const novo = await criarEmpresaDadosStatusService(dados, tenantId, usuarioId);
  return res.status(201).json(novo);
}

export async function atualizarEmpresaDadosStatus(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario?.id;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = empresaDadosStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: EmpresaDadosStatusInput = parseResult.data;
  const atualizado = await atualizarEmpresaDadosStatusService(id, dados, tenantId, usuarioId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarEmpresaDadosStatus(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarEmpresaDadosStatusService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}
