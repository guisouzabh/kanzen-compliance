import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarCategoriasDadoPessoalService,
  criarCategoriaDadoPessoalService,
  atualizarCategoriaDadoPessoalService,
  deletarCategoriaDadoPessoalService
} from '../services/categoriaDadoPessoalService';
import {
  categoriaDadoPessoalSchema,
  CategoriaDadoPessoalInput
} from '../validation/categoriaDadoPessoalSchema';

export async function listarCategorias(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const categorias = await listarCategoriasDadoPessoalService(tenantId);
  return res.json(categorias);
}

export async function criarCategoria(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = categoriaDadoPessoalSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: CategoriaDadoPessoalInput = parseResult.data;
  const nova = await criarCategoriaDadoPessoalService(dados, tenantId);
  return res.status(201).json(nova);
}

export async function atualizarCategoria(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);

  const parseResult = categoriaDadoPessoalSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }
  const dados: CategoriaDadoPessoalInput = parseResult.data;
  const atualizado = await atualizarCategoriaDadoPessoalService(id, dados, tenantId);
  if (!atualizado) throw new AppError('ID inválido', 404);
  return res.json(atualizado);
}

export async function deletarCategoria(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarCategoriaDadoPessoalService(id, tenantId);
  if (!ok) throw new AppError('ID inválido', 404);
  return res.status(204).send();
}
