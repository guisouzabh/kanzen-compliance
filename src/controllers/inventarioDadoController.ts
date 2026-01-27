import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarInventarioService,
  criarInventarioService,
  atualizarInventarioService,
  deletarInventarioService
} from '../services/inventarioDadoService';
import { inventarioDadoSchema, InventarioDadoInput } from '../validation/inventarioDadoSchema';

export async function listarInventario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarInventarioService(tenantId);
  return res.json(dados);
}

export async function criarInventario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = inventarioDadoSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: InventarioDadoInput = parseResult.data;
  const novo = await criarInventarioService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarInventario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = inventarioDadoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: InventarioDadoInput = parseResult.data;
  const atualizado = await atualizarInventarioService(id, dados, tenantId);
  if (!atualizado) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(atualizado);
}

export async function deletarInventario(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarInventarioService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
