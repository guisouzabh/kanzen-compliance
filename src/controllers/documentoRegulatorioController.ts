import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDocumentosRegulatoriosService,
  criarDocumentoRegulatorioService,
  obterDocumentoRegulatorioPorIdService,
  atualizarDocumentoRegulatorioService,
  deletarDocumentoRegulatorioService
} from '../services/documentoRegulatorioService';
import {
  documentoRegulatorioSchema,
  DocumentoRegulatorioInput
} from '../validation/documentoRegulatorioSchema';

export async function listarDocumentosRegulatorios(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentos = await listarDocumentosRegulatoriosService(tenantId);
  return res.json(documentos);
}

export async function criarDocumentoRegulatorio(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = documentoRegulatorioSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoRegulatorioInput = parseResult.data;
  const documento = await criarDocumentoRegulatorioService(dados, tenantId);

  return res.status(201).json(documento);
}

export async function obterDocumentoRegulatorio(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const documento = await obterDocumentoRegulatorioPorIdService(id, tenantId);
  if (!documento) {
    throw new AppError('Documento regulatório não encontrado', 404);
  }

  return res.json(documento);
}

export async function atualizarDocumentoRegulatorio(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoRegulatorioSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoRegulatorioInput = parseResult.data;
  const atualizada = await atualizarDocumentoRegulatorioService(id, dados, tenantId);

  if (!atualizada) {
    throw new AppError('Documento regulatório não encontrado', 404);
  }

  return res.json(atualizada);
}

export async function deletarDocumentoRegulatorio(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoRegulatorioService(id, tenantId);
  if (!ok) {
    throw new AppError('Documento regulatório não encontrado', 404);
  }

  return res.status(204).send();
}
