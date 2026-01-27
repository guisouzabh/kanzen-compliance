import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDocumentoConteudoPorDocumentoEmpresaService,
  criarDocumentoConteudoService,
  obterDocumentoConteudoPorIdService,
  atualizarDocumentoConteudoService,
  deletarDocumentoConteudoService
} from '../services/documentoConteudoService';
import {
  documentoConteudoSchema,
  DocumentoConteudoInput
} from '../validation/documentoConteudoSchema';

export async function listarDocumentoConteudo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.documentoEmpresaId);
  if (Number.isNaN(documentoEmpresaId)) {
    throw new AppError('ID inválido', 400);
  }

  const conteudos = await listarDocumentoConteudoPorDocumentoEmpresaService(
    documentoEmpresaId,
    tenantId
  );
  return res.json(conteudos);
}

export async function criarDocumentoConteudo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.documentoEmpresaId);
  if (Number.isNaN(documentoEmpresaId)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoConteudoSchema.safeParse({
    ...req.body,
    documento_empresa_id: documentoEmpresaId
  });

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoConteudoInput = parseResult.data;
  const novo = await criarDocumentoConteudoService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function obterDocumentoConteudo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const conteudo = await obterDocumentoConteudoPorIdService(id, tenantId);
  if (!conteudo) {
    throw new AppError('Conteúdo não encontrado', 404);
  }

  return res.json(conteudo);
}

export async function atualizarDocumentoConteudo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoConteudoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoConteudoInput = parseResult.data;
  const atualizado = await atualizarDocumentoConteudoService(id, dados, tenantId);
  if (!atualizado) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(atualizado);
}

export async function deletarDocumentoConteudo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoConteudoService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
