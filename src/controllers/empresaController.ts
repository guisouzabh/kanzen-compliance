import { Empresa } from '../types/Empresa';
import {
  listarEmpresasService,
  criarEmpresaService,
  obterEmpresaPorIdService,
  atualizarEmpresaService,
  deletarEmpresaService
} from '../services/empresaService';
import { AppError } from '../errors/AppError';
import { Response } from 'express';
import { empresaSchema, EmpresaInput } from '../validation/empresaSchema';
import { AuthRequest } from '../middleware/authMiddleware';

// LISTAR
export async function listarEmpresas(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const empresas = await listarEmpresasService(tenantId);
  return res.json(empresas);
}

// CRIAR
export async function criarEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = empresaSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: EmpresaInput = parseResult.data;
  const nova = await criarEmpresaService(dados, tenantId);
  return res.status(201).json(nova);
}

// ATUALIZAR
export async function atualizarEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = empresaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: EmpresaInput = parseResult.data;

  const empresaAtualizada = await atualizarEmpresaService(id, dados, tenantId);

  if (!empresaAtualizada) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(empresaAtualizada);
}

// OBTER POR ID
export async function obterEmpresaPorId(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const empresa = await obterEmpresaPorIdService(id, tenantId);

  if (!empresa) {
    throw new AppError('Empresa não encontrada', 404);
  }

  return res.json(empresa);
}

// DELETAR
export async function deletarEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarEmpresaService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
