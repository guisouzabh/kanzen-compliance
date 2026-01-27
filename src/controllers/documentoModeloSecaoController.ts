import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  listarDocumentoModeloSecaoPorDocumentoService,
  criarDocumentoModeloSecaoService,
  obterDocumentoModeloSecaoPorIdService,
  atualizarDocumentoModeloSecaoService,
  deletarDocumentoModeloSecaoService
} from '../services/documentoModeloSecaoService';
import {
  documentoModeloSecaoSchema,
  DocumentoModeloSecaoInput
} from '../validation/documentoModeloSecaoSchema';

export async function listarDocumentoModeloSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoRegulatorioId = Number(req.params.documentoRegulatorioId);
  if (Number.isNaN(documentoRegulatorioId)) {
    throw new AppError('ID inválido', 400);
  }

  const secoes = await listarDocumentoModeloSecaoPorDocumentoService(
    documentoRegulatorioId,
    tenantId
  );
  return res.json(secoes);
}

export async function criarDocumentoModeloSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoRegulatorioId = Number(req.params.documentoRegulatorioId);
  if (Number.isNaN(documentoRegulatorioId)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoModeloSecaoSchema.safeParse({
    ...req.body,
    documento_regulatorio_id: documentoRegulatorioId
  });
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoModeloSecaoInput = parseResult.data;
  const nova = await criarDocumentoModeloSecaoService(dados, tenantId);
  return res.status(201).json(nova);
}

export async function obterDocumentoModeloSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const secao = await obterDocumentoModeloSecaoPorIdService(id, tenantId);
  if (!secao) {
    throw new AppError('Seção não encontrada', 404);
  }

  return res.json(secao);
}

export async function atualizarDocumentoModeloSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoModeloSecaoSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const dados: DocumentoModeloSecaoInput = parseResult.data;
  const atualizado = await atualizarDocumentoModeloSecaoService(id, dados, tenantId);
  if (!atualizado) {
    throw new AppError('ID inválido', 404);
  }

  return res.json(atualizado);
}

export async function deletarDocumentoModeloSecao(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    throw new AppError('ID inválido', 400);
  }

  const ok = await deletarDocumentoModeloSecaoService(id, tenantId);
  if (!ok) {
    throw new AppError('ID inválido', 404);
  }

  return res.status(204).send();
}
