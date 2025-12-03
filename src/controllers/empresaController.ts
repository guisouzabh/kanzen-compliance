import { Empresa } from '../types/Empresa';
import {
  listarEmpresasService,
  criarEmpresaService,
  obterEmpresaPorIdService,
  atualizarEmpresaService,
  deletarEmpresaService
} from '../services/empresaService';
import { AppError } from '../errors/AppError';
import { Request, Response } from 'express';
import { empresaSchema, EmpresaInput } from '../validation/empresaSchema';

export async function listarEmpresas(req: Request, res: Response) {
  try {
    const empresas = await listarEmpresasService();
    res.json(empresas);
  } catch (err) {
    console.error('Erro ao listar empresas:', err);
    res.status(500).json({ erro: 'Erro interno ao listar empresas.' });
  }
}

export async function criarEmpresa(req: Request, res: Response) {
  try {
    const parseResult = empresaSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        erro: 'Dados inválidos',
        detalhes: parseResult.error.issues
      });
    }

    const dados: EmpresaInput = parseResult.data;

    const novaEmpresa = await criarEmpresaService(dados);

    res.status(201).json(novaEmpresa);
  } catch (err) {
    console.error('Erro ao criar empresa:', err);
    res.status(500).json({ erro: 'Erro interno ao criar empresa.' });
  }
}

export async function atualizarEmpresa(req: Request, res: Response) {
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

    const empresaAtualizada = await atualizarEmpresaService(id, dados);

    if (!empresaAtualizada) {
      throw new AppError('ID inválido', 404);
    }

    res.json(empresaAtualizada);
}


export async function obterEmpresaPorId(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const empresa = await obterEmpresaPorIdService(id);

  if (!empresa) {
    throw new AppError('Empresa não encontrada', 404);
  }

  return res.json(empresa);
}

export async function deletarEmpresa(req: Request, res: Response) {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      throw new AppError('ID inválido', 400);
    }

    const ok = await deletarEmpresaService(id);
    if (!ok) {
      throw new AppError('ID inválido', 404);
    }

    res.status(204).send();
}
