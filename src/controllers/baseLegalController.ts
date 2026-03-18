import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import { baseLegalEmpresaSchema, BaseLegalEmpresaInput } from '../validation/baseLegalEmpresaSchema';
import { dmBaseLegalSchema, DmBaseLegalInput } from '../validation/dmBaseLegalSchema';
import {
  atualizarBaseLegalEmpresaService,
  atualizarDmBaseLegalService,
  criarBaseLegalEmpresaService,
  criarDmBaseLegalService,
  inativarBaseLegalEmpresaService,
  inativarDmBaseLegalService,
  listarBaseLegalEmpresaService,
  listarDmBaseLegaisService
} from '../services/baseLegalService';

function parseId(rawValue: unknown, mensagem = 'ID inválido'): number {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (typeof value !== 'string') {
    throw new AppError(mensagem, 400);
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError(mensagem, 400);
  }
  return parsed;
}

function parseEmpresaId(rawValue: unknown): number {
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  if (typeof value !== 'string') {
    throw new AppError('Empresa é obrigatória', 400);
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new AppError('Empresa inválida', 400);
  }

  return parsed;
}

export async function listarDmBaseLegais(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDmBaseLegaisService(tenantId);
  return res.json(dados);
}

export async function criarDmBaseLegal(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = dmBaseLegalSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const payload: DmBaseLegalInput = parseResult.data;
  const criado = await criarDmBaseLegalService(payload, tenantId);
  return res.status(201).json(criado);
}

export async function atualizarDmBaseLegal(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = dmBaseLegalSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const payload: DmBaseLegalInput = parseResult.data;
  const atualizado = await atualizarDmBaseLegalService(id, payload, tenantId);

  if (!atualizado) {
    throw new AppError('Base legal não encontrada', 404);
  }

  return res.json(atualizado);
}

export async function deletarDmBaseLegal(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const ok = await inativarDmBaseLegalService(id, tenantId);
  if (!ok) {
    throw new AppError('Base legal não encontrada', 404);
  }

  return res.status(204).send();
}

export async function listarBaseLegalEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const empresaId = parseEmpresaId(req.query.empresa_id);
  const dados = await listarBaseLegalEmpresaService(tenantId, empresaId);
  return res.json(dados);
}

export async function criarBaseLegalEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = baseLegalEmpresaSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const payload: BaseLegalEmpresaInput = parseResult.data;
  const criado = await criarBaseLegalEmpresaService(payload, tenantId);
  return res.status(201).json(criado);
}

export async function atualizarBaseLegalEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = baseLegalEmpresaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const payload: BaseLegalEmpresaInput = parseResult.data;
  const atualizado = await atualizarBaseLegalEmpresaService(id, payload, tenantId);
  if (!atualizado) {
    throw new AppError('Base legal da empresa não encontrada', 404);
  }

  return res.json(atualizado);
}

export async function deletarBaseLegalEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);
  const ok = await inativarBaseLegalEmpresaService(id, tenantId);

  if (!ok) {
    throw new AppError('Base legal da empresa não encontrada', 404);
  }

  return res.status(204).send();
}
