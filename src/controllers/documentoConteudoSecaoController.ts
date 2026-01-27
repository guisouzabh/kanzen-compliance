import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDocumentoConteudoSecaoService,
  criarDocumentoConteudoSecaoService,
  obterDocumentoConteudoSecaoPorIdService,
  atualizarDocumentoConteudoSecaoService,
  deletarDocumentoConteudoSecaoService
} from '../services/documentoConteudoSecaoService';
import {
  documentoConteudoSecaoSchema,
  DocumentoConteudoSecaoInput
} from '../validation/documentoConteudoSecaoSchema';

export async function listarDocumentoConteudoSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoConteudoId = Number(req.params.documentoConteudoId);
  if (Number.isNaN(documentoConteudoId)) {
    throw new AppError('ID inválido', 400);
  }

  const secoes = await listarDocumentoConteudoSecaoService(documentoConteudoId, tenantId);
  return res.json(secoes);
}

export async function criarDocumentoConteudoSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoConteudoId = Number(req.params.documentoConteudoId);
  if (Number.isNaN(documentoConteudoId)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoConteudoSecaoSchema.safeParse({
    ...req.body,
    documento_conteudo_id: documentoConteudoId
  });
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoConteudoSecaoInput = parseResult.data;
  const nova = await criarDocumentoConteudoSecaoService(dados, tenantId);
  return res.status(201).json(nova);
}

export async function obterDocumentoConteudoSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const secao = await obterDocumentoConteudoSecaoPorIdService(id, tenantId);
  if (!secao) {
    throw new AppError('Seção não encontrada', 404);
  }

  return res.json(secao);
}

export async function atualizarDocumentoConteudoSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoConteudoSecaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoConteudoSecaoInput = parseResult.data;
  const atualizado = await atualizarDocumentoConteudoSecaoService(id, dados, tenantId);
  if (!atualizado) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(atualizado);
}

export async function deletarDocumentoConteudoSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoConteudoSecaoService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
