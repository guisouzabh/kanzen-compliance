import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  adicionarComiteMembroService,
  atualizarComiteService,
  criarComiteService,
  deletarComiteService,
  listarComiteMembrosService,
  listarComitesService,
  obterComitePorIdService,
  removerComiteMembroService
} from '../services/comiteService';
import {
  comiteMembroCreateSchema,
  comiteSchema,
  ComiteInput,
  ComiteMembroCreateInput
} from '../validation/comiteSchema';
import { ComiteTipo } from '../types/Comite';

function parseId(value: string | string[] | undefined, mensagem = 'ID inválido'): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const id = Number(rawValue);
  if (Number.isNaN(id)) {
    throw new AppError(mensagem, 400);
  }
  return id;
}

export async function listarComites(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const rawTipo = Array.isArray(req.query.tipo) ? req.query.tipo[0] : req.query.tipo;
  const rawEmpresaId = Array.isArray(req.query.empresa_id) ? req.query.empresa_id[0] : req.query.empresa_id;
  let tipo: ComiteTipo | undefined;
  let empresaId: number | undefined;

  if (rawTipo != null) {
    if (rawTipo !== 'COMITE' && rawTipo !== 'DPO') {
      throw new AppError('Tipo de comitê inválido', 400);
    }
    tipo = rawTipo;
  }

  if (rawEmpresaId != null) {
    const parsedEmpresaId = Number(rawEmpresaId);
    if (Number.isNaN(parsedEmpresaId) || parsedEmpresaId <= 0) {
      throw new AppError('Empresa inválida', 400);
    }
    empresaId = parsedEmpresaId;
  }

  const comites = await listarComitesService(tenantId, { tipo, empresaId });
  return res.json(comites);
}

export async function criarComite(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = comiteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: ComiteInput = parseResult.data;
  const comite = await criarComiteService(dados, tenantId);
  return res.status(201).json(comite);
}

export async function obterComite(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);
  const comite = await obterComitePorIdService(id, tenantId);
  if (!comite) throw new AppError('Comitê não encontrado', 404);
  return res.json(comite);
}

export async function atualizarComite(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = comiteSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: ComiteInput = parseResult.data;
  const comite = await atualizarComiteService(id, dados, tenantId);
  if (!comite) throw new AppError('Comitê não encontrado', 404);
  return res.json(comite);
}

export async function deletarComite(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);
  const ok = await deletarComiteService(id, tenantId);
  if (!ok) throw new AppError('Comitê não encontrado', 404);
  return res.status(204).send();
}

export async function listarComiteMembros(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const comiteId = parseId(req.params.id, 'ID do comitê inválido');
  const membros = await listarComiteMembrosService(comiteId, tenantId);
  return res.json(membros);
}

export async function adicionarComiteMembro(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const comiteId = parseId(req.params.id, 'ID do comitê inválido');

  const parseResult = comiteMembroCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: ComiteMembroCreateInput = parseResult.data;
  const membro = await adicionarComiteMembroService(comiteId, dados, tenantId);
  return res.status(201).json(membro);
}

export async function removerComiteMembro(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const comiteId = parseId(req.params.id, 'ID do comitê inválido');
  const membroId = parseId(req.params.membroId, 'ID do membro inválido');
  const ok = await removerComiteMembroService(comiteId, membroId, tenantId);
  if (!ok) throw new AppError('Membro não encontrado no comitê', 404);
  return res.status(204).send();
}
