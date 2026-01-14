import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { requisitoTarefaSchema, RequisitoTarefaInput } from '../validation/tarefaSchema';
import {
  listarTarefasService,
  criarTarefaService,
  atualizarStatusTarefaService
} from '../services/tarefaService';
import { AppError } from '../errors/AppError';

export async function listarTarefas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  const tarefas = await listarTarefasService(requisitoId, tenantId);
  return res.json(tarefas);
}

export async function criarTarefa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  const parse = requisitoTarefaSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  }

  const dados: RequisitoTarefaInput = parse.data;
  const tarefa = await criarTarefaService(requisitoId, { ...dados, status: 'ABERTO' }, tenantId);
  return res.status(201).json(tarefa);
}

export async function atualizarTarefa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);
  const tarefaId = Number(req.params.tarefaId);

  if (Number.isNaN(requisitoId) || Number.isNaN(tarefaId)) {
    throw new AppError('ID inválido', 400);
  }

  const { status } = req.body as { status?: 'ABERTO' | 'FECHADO' };
  if (!status || !['ABERTO', 'FECHADO'].includes(status)) {
    throw new AppError('Status inválido', 400);
  }

  const tarefa = await atualizarStatusTarefaService(requisitoId, tarefaId, status, tenantId);
  if (!tarefa) {
    throw new AppError('Tarefa não encontrada', 404);
  }

  return res.json(tarefa);
}
