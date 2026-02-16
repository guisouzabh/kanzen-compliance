import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarMatrizAcoesService,
  obterMatrizAcaoPorIdService,
  criarMatrizAcaoService,
  atualizarMatrizAcaoService,
  deletarMatrizAcaoService
} from '../services/matrizAcaoService';
import { matrizAcaoSchema, MatrizAcaoInput } from '../validation/matrizAcaoSchema';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export async function listarMatrizAcoes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const filters = {
    empresaId: toNumber(req.query.empresa_id),
    origemTyp: req.query.origem_typ ? String(req.query.origem_typ) : undefined,
    origemId: toNumber(req.query.origem_id),
    status: req.query.status ? String(req.query.status) : undefined,
    statusPrazo: req.query.status_prazo ? String(req.query.status_prazo) : undefined,
    q: req.query.q ? String(req.query.q) : undefined
  };

  const dados = await listarMatrizAcoesService(tenantId, filters);
  return res.json(dados);
}

export async function obterMatrizAcao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const dado = await obterMatrizAcaoPorIdService(id, tenantId);
  if (!dado) throw new AppError('ID inválido', 404);
  return res.json(dado);
}

export async function criarMatrizAcao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = matrizAcaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const dados: MatrizAcaoInput = parseResult.data;
  const novo = await criarMatrizAcaoService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarMatrizAcao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = matrizAcaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const dados: MatrizAcaoInput = parseResult.data;
  const atualizado = await atualizarMatrizAcaoService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarMatrizAcao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarMatrizAcaoService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}
