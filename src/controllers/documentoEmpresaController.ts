import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDocumentosEmpresaService,
  criarDocumentoEmpresaService,
  obterDocumentoEmpresaPorIdService,
  atualizarDocumentoEmpresaService,
  deletarDocumentoEmpresaService,
  listarDocumentosArquivosService,
  criarDocumentoArquivoService,
  deletarDocumentoArquivoService
} from '../services/documentoEmpresaService';
import {
  documentoEmpresaSchema,
  DocumentoEmpresaInput
} from '../validation/documentoEmpresaSchema';
import {
  documentoArquivoSchema,
  DocumentoArquivoInput
} from '../validation/documentoArquivoSchema';

export async function listarDocumentosEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentos = await listarDocumentosEmpresaService(tenantId);
  return res.json(documentos);
}

export async function criarDocumentoEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const parseResult = documentoEmpresaSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoEmpresaInput = parseResult.data;
  const novo = await criarDocumentoEmpresaService(dados, tenantId);
  return res.status(201).json(novo);
}

export async function obterDocumentoEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const documento = await obterDocumentoEmpresaPorIdService(id, tenantId);
  if (!documento) {
    throw new AppError('Documento da empresa não encontrado', 404);
  }

  return res.json(documento);
}

export async function atualizarDocumentoEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoEmpresaSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoEmpresaInput = parseResult.data;
  const atualizado = await atualizarDocumentoEmpresaService(id, dados, tenantId);
  if (!atualizado) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(atualizado);
}

export async function deletarDocumentoEmpresa(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoEmpresaService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}

export async function listarDocumentosArquivos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  if (Number.isNaN(documentoEmpresaId)) {
    throw new AppError('ID inválido', 400);
  }

  const arquivos = await listarDocumentosArquivosService(documentoEmpresaId, tenantId);
  return res.json(arquivos);
}

export async function criarDocumentoArquivo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  if (Number.isNaN(documentoEmpresaId)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoArquivoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoArquivoInput = parseResult.data;
  const novo = await criarDocumentoArquivoService(documentoEmpresaId, dados, tenantId);
  return res.status(201).json(novo);
}

export async function deletarDocumentoArquivo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);
  if (Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoArquivoService(documentoEmpresaId, arquivoId, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
