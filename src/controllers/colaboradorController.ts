import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import { colaboradorSchema } from '../validation/colaboradorSchema';
import {
  listarColaboradoresService,
  obterColaboradorPorIdService,
  criarColaboradorService,
  atualizarColaboradorService,
  deletarColaboradorService
} from '../services/colaboradorService';

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

export async function listarColaboradores(req: AuthRequest, res: Response) {
  const tenantId  = req.usuario!.tenantId;
  const empresaId = toNumber(req.query.empresa_id);
  const dados = await listarColaboradoresService(tenantId, empresaId);
  return res.json(dados);
}

export async function obterColaborador(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const dado = await obterColaboradorPorIdService(id, tenantId);
  if (!dado) throw new AppError('Colaborador não encontrado', 404);
  return res.json(dado);
}

export async function criarColaborador(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parse = colaboradorSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const novo = await criarColaboradorService(parse.data, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarColaborador(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const parse = colaboradorSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const atualizado = await atualizarColaboradorService(id, parse.data, tenantId);
  if (!atualizado) throw new AppError('Colaborador não encontrado', 404);
  return res.json(atualizado);
}

export async function deletarColaborador(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarColaboradorService(id, tenantId);
  if (!ok) throw new AppError('Colaborador não encontrado', 404);
  return res.status(204).send();
}
