import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';

import { planoSchema } from '../validation/planoSchema';
import { turmaTreinamentoSchema } from '../validation/turmaTreinamentoSchema';
import { auditoriaItemSchema } from '../validation/auditoriaItemSchema';
import { matrizAcaoSchema } from '../validation/matrizAcaoSchema';

import {
  listarPlanosService,
  obterPlanoPorIdService,
  criarPlanoService,
  atualizarPlanoService,
  deletarPlanoService
} from '../services/planoService';
import {
  listarTurmasService,
  obterTurmaPorIdService,
  criarTurmaService,
  atualizarTurmaService,
  deletarTurmaService
} from '../services/turmaTreinamentoService';
import {
  listarAuditoriaItensService,
  obterAuditoriaItemPorIdService,
  criarAuditoriaItemService,
  atualizarAuditoriaItemService,
  deletarAuditoriaItemService
} from '../services/auditoriaItemService';
import {
  listarMatrizAcoesService,
  criarMatrizAcaoService,
  atualizarMatrizAcaoService,
  deletarMatrizAcaoService
} from '../services/matrizAcaoService';

function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

function parsePlanoId(req: AuthRequest): number {
  const id = Number(req.params.planoId);
  if (Number.isNaN(id)) throw new AppError('planoId inválido', 400);
  return id;
}

function parseItemId(req: AuthRequest): number {
  const id = Number(req.params.itemId);
  if (Number.isNaN(id)) throw new AppError('itemId inválido', 400);
  return id;
}

// ─── Planos ──────────────────────────────────────────────────────────────────

export async function listarPlanos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const filters = {
    empresaId:     toNumber(req.query.empresa_id),
    tipo:          req.query.tipo ? String(req.query.tipo) : undefined,
    status:        req.query.status ? String(req.query.status) : undefined,
    responsavelId: toNumber(req.query.responsavel_id),
    q:             req.query.q ? String(req.query.q) : undefined
  };
  const dados = await listarPlanosService(tenantId, filters);
  return res.json(dados);
}

export async function obterPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const dado = await obterPlanoPorIdService(id, tenantId);
  if (!dado) throw new AppError('Plano não encontrado', 404);
  return res.json(dado);
}

export async function criarPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = planoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const novo = await criarPlanoService(parseResult.data as any, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const parseResult = planoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const atualizado = await atualizarPlanoService(id, parseResult.data as any, tenantId);
  if (!atualizado) throw new AppError('Plano não encontrado', 404);
  return res.json(atualizado);
}

export async function deletarPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarPlanoService(id, tenantId);
  if (!ok) throw new AppError('Plano não encontrado', 404);
  return res.status(204).send();
}

// ─── Ações (sub-recurso de Plano de Ações) ───────────────────────────────────

export async function listarAcoesDePlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const dados = await listarMatrizAcoesService(tenantId, { planoId });
  return res.json(dados);
}

export async function criarAcaoEmPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const parseResult = matrizAcaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const novo = await criarMatrizAcaoService({ ...parseResult.data, plano_id: planoId } as any, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarAcaoEmPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const parseResult = matrizAcaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const atualizado = await atualizarMatrizAcaoService(itemId, { ...parseResult.data, plano_id: planoId } as any, tenantId);
  if (!atualizado) throw new AppError('Ação não encontrada', 404);
  return res.json(atualizado);
}

export async function deletarAcaoEmPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  parsePlanoId(req);
  const itemId = parseItemId(req);
  const ok = await deletarMatrizAcaoService(itemId, tenantId);
  if (!ok) throw new AppError('Ação não encontrada', 404);
  return res.status(204).send();
}

// ─── Turmas de Treinamento ────────────────────────────────────────────────────

export async function listarTurmas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const dados = await listarTurmasService(tenantId, planoId);
  return res.json(dados);
}

export async function criarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const parseResult = turmaTreinamentoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const nova = await criarTurmaService(parseResult.data as any, tenantId, planoId);
  return res.status(201).json(nova);
}

export async function atualizarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const parseResult = turmaTreinamentoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const atualizada = await atualizarTurmaService(itemId, parseResult.data as any, tenantId, planoId);
  if (!atualizada) throw new AppError('Turma não encontrada', 404);
  return res.json(atualizada);
}

export async function deletarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const ok = await deletarTurmaService(itemId, tenantId, planoId);
  if (!ok) throw new AppError('Turma não encontrada', 404);
  return res.status(204).send();
}

export async function obterTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const dado = await obterTurmaPorIdService(itemId, tenantId, planoId);
  if (!dado) throw new AppError('Turma não encontrada', 404);
  return res.json(dado);
}

// ─── Itens de Auditoria ───────────────────────────────────────────────────────

export async function listarAuditoriaItens(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const dados = await listarAuditoriaItensService(tenantId, planoId);
  return res.json(dados);
}

export async function criarAuditoriaItem(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const parseResult = auditoriaItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const novo = await criarAuditoriaItemService(parseResult.data as any, tenantId, planoId);
  return res.status(201).json(novo);
}

export async function atualizarAuditoriaItem(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const parseResult = auditoriaItemSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const atualizado = await atualizarAuditoriaItemService(itemId, parseResult.data as any, tenantId, planoId);
  if (!atualizado) throw new AppError('Item de auditoria não encontrado', 404);
  return res.json(atualizado);
}

export async function deletarAuditoriaItem(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const ok = await deletarAuditoriaItemService(itemId, tenantId, planoId);
  if (!ok) throw new AppError('Item de auditoria não encontrado', 404);
  return res.status(204).send();
}

export async function obterAuditoriaItem(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = parsePlanoId(req);
  const itemId = parseItemId(req);
  const dado = await obterAuditoriaItemPorIdService(itemId, tenantId, planoId);
  if (!dado) throw new AppError('Item de auditoria não encontrado', 404);
  return res.json(dado);
}
