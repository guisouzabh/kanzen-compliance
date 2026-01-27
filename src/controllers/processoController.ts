import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarProcessosService,
  criarProcessoService,
  atualizarProcessoService,
  deletarProcessoService
} from '../services/processoService';
import { processoSchema, ProcessoInput } from '../validation/processoSchema';

export async function listarProcessos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarProcessosService(tenantId);
  return res.json(dados);
}

export async function criarProcesso(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = processoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: ProcessoInput = parseResult.data;
  const novo = await criarProcessoService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarProcesso(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = processoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: ProcessoInput = parseResult.data;
  const atualizado = await atualizarProcessoService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarProcesso(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarProcessoService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}
