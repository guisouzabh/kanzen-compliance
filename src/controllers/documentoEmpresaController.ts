import { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import path from 'path';
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
  deletarDocumentoArquivoService,
  obterDocumentoArquivoPorIdService,
  atualizarHashDocumentoArquivoService,
  atualizarStatusDocumentoArquivoService,
  publicarDocumentoArquivoService,
  listarDocumentosPublicadosVencidosService,
  listarDocumentosPublicadosVencendo30DiasService,
  listarDocumentosNaoPublicadosAtivosService,
  listarHistoricoArquivadoService
} from '../services/documentoEmpresaService';
import {
  documentoEmpresaSchema,
  DocumentoEmpresaInput
} from '../validation/documentoEmpresaSchema';
import {
  documentoArquivoSchema,
  DocumentoArquivoInput,
  documentoArquivoStatusSchema,
  DocumentoArquivoStatusInput
} from '../validation/documentoArquivoSchema';

const ONLYOFFICE_JWT_SECRET = process.env.ONLYOFFICE_JWT_SECRET || 'dev_onlyoffice_secret_123';
const ONLYOFFICE_DOCUMENT_SERVER_URL =
  process.env.ONLYOFFICE_DOCUMENT_SERVER_URL || 'http://localhost:8082';

function getOnlyofficePublicApiBase(req: Request) {
  return (
    process.env.ONLYOFFICE_PUBLIC_API_BASE_URL ||
    process.env.PUBLIC_API_BASE_URL ||
    `${req.protocol}://${req.get('host')}/api/v1`
  );
}

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
  const novo = await criarDocumentoArquivoService(
    documentoEmpresaId,
    {
      ...dados,
      documento_empresa_id: documentoEmpresaId
    },
    tenantId
  );
  return res.status(201).json(novo);
}

export async function atualizarStatusDocumentoArquivo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);
  if (Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    throw new AppError('ID inválido', 400);
  }

  const parseResult = documentoArquivoStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: parseResult.error.issues
    });
  }

  const payload: DocumentoArquivoStatusInput = parseResult.data;
  const atualizado = await atualizarStatusDocumentoArquivoService(
    documentoEmpresaId,
    arquivoId,
    payload,
    tenantId
  );
  return res.json(atualizado);
}

export async function publicarDocumentoArquivo(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);
  if (Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    throw new AppError('ID inválido', 400);
  }

  const publicado = await publicarDocumentoArquivoService(documentoEmpresaId, arquivoId, tenantId);
  return res.json(publicado);
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

export async function uploadDocumentoRegulatorioWord(
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response
) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  if (Number.isNaN(documentoEmpresaId)) {
    throw new AppError('ID inválido', 400);
  }
  if (!req.file) {
    throw new AppError('Arquivo não enviado', 400);
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!['.doc', '.docx'].includes(ext)) {
    throw new AppError('Apenas arquivos Word (.doc, .docx) são permitidos', 400);
  }

  const hashArquivo = crypto
    .createHash('sha256')
    .update(fs.readFileSync(req.file.path))
    .digest('hex');
  const publicPath = `/arquivos-s3/documentos-regulatorios/${tenantId}/${documentoEmpresaId}/${req.file.filename}`;

  const novo = await criarDocumentoArquivoService(
    documentoEmpresaId,
    {
      documento_empresa_id: documentoEmpresaId,
      tipo_arquivo: 'DOCUMENTO_PRINCIPAL',
      status: 'RASCUNHO',
      nome_arquivo: req.file.originalname,
      caminho_arquivo: publicPath,
      hash_arquivo: hashArquivo,
      versao: typeof req.body?.versao === 'string' ? req.body.versao : null
    },
    tenantId
  );

  const fileUrl = `${req.protocol}://${req.get('host')}${publicPath}`;

  return res.status(201).json({
    ...novo,
    url: fileUrl,
    path: publicPath
  });
}

export async function obterOnlyofficeEditConfig(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);

  if (Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    throw new AppError('ID inválido', 400);
  }

  const arquivo = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!arquivo) {
    throw new AppError('Arquivo não encontrado', 404);
  }

  const ext = path.extname(arquivo.nome_arquivo).toLowerCase();
  if (ext !== '.docx') {
    throw new AppError('Somente arquivos .docx podem ser editados no OnlyOffice', 400);
  }

  const publicApiBase = getOnlyofficePublicApiBase(req);

  const downloadToken = jwt.sign(
    {
      type: 'onlyoffice-download',
      tenantId,
      documentoEmpresaId,
      arquivoId
    },
    ONLYOFFICE_JWT_SECRET,
    { expiresIn: '20m' }
  );

  const callbackToken = jwt.sign(
    {
      type: 'onlyoffice-callback',
      tenantId,
      documentoEmpresaId,
      arquivoId
    },
    ONLYOFFICE_JWT_SECRET,
    { expiresIn: '24h' }
  );

  const documentUrl = `${publicApiBase}/onlyoffice/documentos-empresa/${documentoEmpresaId}/arquivos/${arquivoId}/download?token=${encodeURIComponent(
    downloadToken
  )}`;
  const callbackUrl = `${publicApiBase}/onlyoffice/documentos-empresa/${documentoEmpresaId}/arquivos/${arquivoId}/callback?token=${encodeURIComponent(
    callbackToken
  )}`;

  const config = {
    documentType: 'word',
    document: {
      title: arquivo.nome_arquivo,
      url: documentUrl,
      fileType: 'docx',
      key: `${tenantId}-${arquivo.id}-${arquivo.hash_arquivo ?? Date.now()}`,
      permissions: {
        edit: true,
        download: true,
        print: true
      }
    },
    editorConfig: {
      mode: 'edit',
      lang: 'pt-BR',
      callbackUrl,
      user: {
        id: String(req.usuario!.id),
        name: req.usuario!.nome
      },
      customization: {
        autosave: true,
        forcesave: true
      }
    }
  };

  const token = jwt.sign(config, ONLYOFFICE_JWT_SECRET, { expiresIn: '20m' });

  return res.json({
    documentServerUrl: ONLYOFFICE_DOCUMENT_SERVER_URL,
    config,
    token
  });
}

export async function downloadArquivoOnlyoffice(req: Request, res: Response) {
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);
  const token = String(req.query.token || '');

  if (!token || Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    throw new AppError('Parâmetros inválidos', 400);
  }

  let payload: any;
  try {
    payload = jwt.verify(token, ONLYOFFICE_JWT_SECRET);
  } catch (_err) {
    throw new AppError('Token inválido', 401);
  }

  if (
    payload?.type !== 'onlyoffice-download' ||
    payload?.documentoEmpresaId !== documentoEmpresaId ||
    payload?.arquivoId !== arquivoId
  ) {
    throw new AppError('Token inválido', 401);
  }

  const tenantId = Number(payload.tenantId);
  const arquivo = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!arquivo) {
    throw new AppError('Arquivo não encontrado', 404);
  }

  const localPath = path.resolve(__dirname, '..', '..', arquivo.caminho_arquivo.replace(/^\//, ''));
  if (!fs.existsSync(localPath)) {
    throw new AppError('Arquivo físico não encontrado', 404);
  }

  return res.sendFile(localPath);
}

export async function callbackOnlyofficeDocumento(req: Request, res: Response) {
  const documentoEmpresaId = Number(req.params.id);
  const arquivoId = Number(req.params.arquivoId);
  const token = String(req.query.token || '');

  if (!token || Number.isNaN(documentoEmpresaId) || Number.isNaN(arquivoId)) {
    return res.status(200).json({ error: 1 });
  }

  let payload: any;
  try {
    payload = jwt.verify(token, ONLYOFFICE_JWT_SECRET);
  } catch (_err) {
    return res.status(200).json({ error: 1 });
  }

  if (
    payload?.type !== 'onlyoffice-callback' ||
    payload?.documentoEmpresaId !== documentoEmpresaId ||
    payload?.arquivoId !== arquivoId
  ) {
    return res.status(200).json({ error: 1 });
  }

  const tenantId = Number(payload.tenantId);
  const status = Number(req.body?.status);
  const fileUrl = req.body?.url;

  if (![2, 6].includes(status) || !fileUrl) {
    return res.status(200).json({ error: 0 });
  }

  const arquivo = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!arquivo) {
    return res.status(200).json({ error: 1 });
  }

  const localPath = path.resolve(__dirname, '..', '..', arquivo.caminho_arquivo.replace(/^\//, ''));

  const response = await fetch(fileUrl);
  if (!response.ok) {
    return res.status(200).json({ error: 1 });
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(localPath, fileBuffer);
  const hashArquivo = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  await atualizarHashDocumentoArquivoService(
    documentoEmpresaId,
    arquivoId,
    hashArquivo,
    tenantId
  );

  return res.status(200).json({ error: 0 });
}

export async function listarDocumentosPublicadosVencidos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDocumentosPublicadosVencidosService(tenantId);
  return res.json(dados);
}

export async function listarDocumentosPublicadosVencendo30Dias(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDocumentosPublicadosVencendo30DiasService(tenantId);
  return res.json(dados);
}

export async function listarDocumentosNaoPublicadosAtivos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarDocumentosNaoPublicadosAtivosService(tenantId);
  return res.json(dados);
}

export async function listarHistoricoArquivado(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarHistoricoArquivadoService(tenantId);
  return res.json(dados);
}
