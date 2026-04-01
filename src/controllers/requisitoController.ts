import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  criarCheckinService,
  criarRequisitoService,
  deletarRequisitoService,
  listarCheckinsService,
  listarRequisitosService,
  listarRequisitosPorUsuarioService,
  obterRequisitoComCheckinsService,
  obterRequisitoPorIdService,
  usuarioTemAcessoRequisito,
  atualizarRequisitoService
} from '../services/requisitoService';
import {
  requisitoCheckinSchema,
  requisitoSchema,
  RequisitoCheckinInput,
  RequisitoInput
} from '../validation/requisitoSchema';

// Requisitos
export async function listarRequisitos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const role = req.usuario!.role;
  const usuarioId = req.usuario!.id;
  const requisitos =
    role === 'USUARIO_TAREFA'
      ? await listarRequisitosPorUsuarioService(tenantId, usuarioId)
      : await listarRequisitosService(tenantId);
  return res.json(requisitos);
}

export async function criarRequisito(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = requisitoSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: RequisitoInput = parseResult.data;
  const novo = await criarRequisitoService(dados as any, tenantId);
  return res.status(201).json(novo);
}

export async function obterRequisito(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  if (req.usuario?.role === 'USUARIO_TAREFA') {
    const permitido = await usuarioTemAcessoRequisito(tenantId, requisitoId, req.usuario.id);
    if (!permitido) {
      throw new AppError('Acesso negado', 403);
    }
  }

  const requisito = await obterRequisitoComCheckinsService(requisitoId, tenantId);
  if (!requisito) {
    throw new AppError('Requisito não encontrado', 404);
  }

  return res.json(requisito);
}

export async function atualizarRequisito(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  if (req.usuario?.role === 'USUARIO_TAREFA') {
    const permitido = await usuarioTemAcessoRequisito(tenantId, requisitoId, req.usuario.id);
    if (!permitido) {
      throw new AppError('Acesso negado', 403);
    }
  }

  const parseResult = requisitoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: RequisitoInput = parseResult.data;
  const atualizado = await atualizarRequisitoService(requisitoId, dados as any, tenantId);

  if (!atualizado) {
    throw new AppError('Requisito não encontrado', 404);
  }

  return res.json(atualizado);
}

export async function deletarRequisito(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  if (req.usuario?.role === 'USUARIO_TAREFA') {
    const permitido = await usuarioTemAcessoRequisito(tenantId, requisitoId, req.usuario.id);
    if (!permitido) {
      throw new AppError('Acesso negado', 403);
    }
  }

  const removido = await deletarRequisitoService(requisitoId, tenantId);
  if (!removido) {
    throw new AppError('Requisito não encontrado', 404);
  }

  return res.status(204).send();
}

// Check-ins
export async function listarCheckins(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  if (req.usuario?.role === 'USUARIO_TAREFA') {
    const permitido = await usuarioTemAcessoRequisito(tenantId, requisitoId, req.usuario.id);
    if (!permitido) {
      throw new AppError('Acesso negado', 403);
    }
  }

  const requisito = await obterRequisitoPorIdService(requisitoId, tenantId);
  if (!requisito) {
    throw new AppError('Requisito não encontrado', 404);
  }

  const checkins = await listarCheckinsService(requisitoId, tenantId);
  return res.json(checkins);
}

export async function criarCheckin(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const requisitoId = Number(req.params.id);

  if (Number.isNaN(requisitoId)) {
    throw new AppError('ID inválido', 400);
  }

  if (req.usuario?.role === 'USUARIO_TAREFA') {
    const permitido = await usuarioTemAcessoRequisito(tenantId, requisitoId, req.usuario.id);
    if (!permitido) {
      throw new AppError('Acesso negado', 403);
    }
  }

  const parseResult = requisitoCheckinSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: RequisitoCheckinInput = parseResult.data;
  const checkin = await criarCheckinService(requisitoId, dados, tenantId);

  if (!checkin) {
    throw new AppError('Requisito não encontrado', 404);
  }

  return res.status(201).json(checkin);
}
