import path from 'path';
import { Response } from 'express';
import { pool } from '../config/db';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import {
  adicionarPrivacyCaseTimelineService,
  atribuirPrivacyCaseService,
  atualizarPrivacyCaseService,
  criarPrivacyCaseAnexoService,
  criarPrivacyCaseService,
  deletarPrivacyCaseAnexoService,
  finalizarDecisaoComunicacaoPrivacyCaseService,
  listarAprovacoesDecisaoPrivacyCaseService,
  listarPrivacyCaseAnexosService,
  listarPrivacyCaseTimelineService,
  listarPrivacyCasesService,
  obterPrivacyCasePorIdService,
  registrarAprovacaoDecisaoPrivacyCaseService,
  solicitarDecisaoComunicacaoPrivacyCaseService
} from '../services/privacyCaseService';
import {
  privacyCaseAssignSchema,
  privacyCaseCommunicationDecisionFinalizeSchema,
  privacyCaseCommunicationDecisionRequestSchema,
  privacyCaseCreateSchema,
  privacyCaseDecisionApprovalSchema,
  privacyCasePublicCreateSchema,
  privacyCaseTimelineCreateSchema,
  privacyCaseUpdateSchema,
  PrivacyCaseAssignInput,
  PrivacyCaseCommunicationDecisionFinalizeInput,
  PrivacyCaseCommunicationDecisionRequestInput,
  PrivacyCaseCreateInput,
  PrivacyCaseDecisionApprovalInput,
  PrivacyCasePublicCreateInput,
  PrivacyCaseTimelineCreateInput,
  PrivacyCaseUpdateInput
} from '../validation/privacyCaseSchema';
import { PrivacyCaseOrigem, PrivacyCaseSeveridade, PrivacyCaseStatus } from '../types/PrivacyCase';

function parseId(value: string | string[] | undefined, label = 'ID inválido'): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  if (Number.isNaN(id)) {
    throw new AppError(label, 400);
  }
  return id;
}

function parseOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

async function obterTenantIdPorEmpresa(empresaId: number): Promise<number> {
  const [rows] = await pool.query(
    'SELECT tenant_id FROM empresas WHERE id = ? LIMIT 1',
    [empresaId]
  );

  const row = (rows as Array<{ tenant_id: number }>)[0];
  if (!row) {
    throw new AppError('Empresa inválida', 400);
  }

  return Number(row.tenant_id);
}

export async function listarPrivacyCases(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const origemRaw = req.query.origem ? String(req.query.origem).toUpperCase() : undefined;
  const statusRaw = req.query.status ? String(req.query.status).toUpperCase() : undefined;
  const severidadeRaw = req.query.severidade ? String(req.query.severidade).toUpperCase() : undefined;

  const origem: PrivacyCaseOrigem | undefined =
    origemRaw === 'INTERNO' || origemRaw === 'EXTERNO' ? origemRaw : undefined;

  const status: PrivacyCaseStatus | undefined =
    statusRaw === 'ABERTO' ||
    statusRaw === 'EM_TRIAGEM' ||
    statusRaw === 'EM_ANALISE' ||
    statusRaw === 'DECISAO_COMUNICACAO' ||
    statusRaw === 'CONCLUIDO' ||
    statusRaw === 'DESCARTADO'
      ? statusRaw
      : undefined;

  const severidade: PrivacyCaseSeveridade | undefined =
    severidadeRaw === 'ALTA' || severidadeRaw === 'MEDIA' || severidadeRaw === 'BAIXA'
      ? severidadeRaw
      : undefined;

  const filtros = {
    empresaId: parseOptionalNumber(req.query.empresa_id),
    origem,
    status,
    severidade,
    q: req.query.q ? String(req.query.q) : undefined
  };

  const dados = await listarPrivacyCasesService(tenantId, filtros);
  return res.json(dados);
}

export async function obterPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const dado = await obterPrivacyCasePorIdService(id, tenantId);
  if (!dado) {
    throw new AppError('Caso de privacidade não encontrado', 404);
  }

  return res.json(dado);
}

export async function criarPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;

  const parseResult = privacyCaseCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const dados: PrivacyCaseCreateInput = parseResult.data;
  const novo = await criarPrivacyCaseService(dados, tenantId, req.usuario?.id);
  return res.status(201).json(novo);
}

export async function criarPrivacyCasePublico(req: AuthRequest, res: Response) {
  const parseResult = privacyCasePublicCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const dados: PrivacyCasePublicCreateInput = parseResult.data;
  const tenantId = await obterTenantIdPorEmpresa(dados.empresa_id);

  const novo = await criarPrivacyCaseService(
    {
      ...dados,
      origem: 'EXTERNO',
      anonimo: dados.anonimo ?? true
    },
    tenantId
  );

  return res.status(201).json({
    id: novo.id,
    protocolo: novo.protocolo,
    status: novo.status
  });
}

export async function atualizarPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = privacyCaseUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const dados: PrivacyCaseUpdateInput = parseResult.data;
  const atualizado = await atualizarPrivacyCaseService(id, dados, tenantId, req.usuario?.id);
  if (!atualizado) {
    throw new AppError('Caso de privacidade não encontrado', 404);
  }

  return res.json(atualizado);
}

export async function atribuirPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = privacyCaseAssignSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const payload: PrivacyCaseAssignInput = parseResult.data;
  const atualizado = await atribuirPrivacyCaseService(id, payload, tenantId, req.usuario?.id);
  return res.json(atualizado);
}

export async function solicitarDecisaoComunicacaoPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = privacyCaseCommunicationDecisionRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const payload: PrivacyCaseCommunicationDecisionRequestInput = parseResult.data;
  const resultado = await solicitarDecisaoComunicacaoPrivacyCaseService(
    id,
    payload,
    tenantId,
    req.usuario?.id
  );

  return res.json(resultado);
}

export async function listarAprovacoesDecisaoPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const aprovacoes = await listarAprovacoesDecisaoPrivacyCaseService(id, tenantId);
  return res.json(aprovacoes);
}

export async function registrarAprovacaoDecisaoPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const usuarioId = req.usuario?.id;
  const id = parseId(req.params.id);

  if (!usuarioId) {
    throw new AppError('Usuário não autenticado', 401);
  }

  const parseResult = privacyCaseDecisionApprovalSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const payload: PrivacyCaseDecisionApprovalInput = parseResult.data;
  const aprovacao = await registrarAprovacaoDecisaoPrivacyCaseService(
    id,
    payload,
    tenantId,
    usuarioId
  );

  return res.status(201).json(aprovacao);
}

export async function finalizarDecisaoComunicacaoPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = parseId(req.params.id);

  const parseResult = privacyCaseCommunicationDecisionFinalizeSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const payload: PrivacyCaseCommunicationDecisionFinalizeInput = parseResult.data;
  const resultado = await finalizarDecisaoComunicacaoPrivacyCaseService(
    id,
    payload,
    tenantId,
    req.usuario?.id
  );

  return res.json(resultado);
}

export async function listarTimelinePrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const privacyCaseId = parseId(req.params.id);

  const itens = await listarPrivacyCaseTimelineService(privacyCaseId, tenantId);
  return res.json(itens);
}

export async function adicionarTimelinePrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const privacyCaseId = parseId(req.params.id);

  const parseResult = privacyCaseTimelineCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parseResult.error.issues });
  }

  const payload: PrivacyCaseTimelineCreateInput = parseResult.data;
  const item = await adicionarPrivacyCaseTimelineService(
    privacyCaseId,
    payload,
    tenantId,
    req.usuario?.id
  );

  return res.status(201).json(item);
}

export async function listarAnexosPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const privacyCaseId = parseId(req.params.id);

  const anexos = await listarPrivacyCaseAnexosService(privacyCaseId, tenantId);
  return res.json(anexos);
}

export async function uploadAnexoPrivacyCase(
  req: AuthRequest & { file?: Express.Multer.File },
  res: Response
) {
  const tenantId = req.usuario!.tenantId;
  const privacyCaseId = parseId(req.params.id);

  if (!req.file) {
    throw new AppError('Arquivo não enviado', 400);
  }

  const arquivosRoot = path.resolve(__dirname, '..', '..', 'arquivos-s3');
  const relativePath = path.relative(arquivosRoot, req.file.path);
  const normalizedPath = relativePath.split(path.sep).join('/');
  const publicPath = `/arquivos-s3/${normalizedPath}`;

  const anexo = await criarPrivacyCaseAnexoService(
    privacyCaseId,
    {
      nome_arquivo: req.file.originalname,
      caminho_arquivo: publicPath,
      tipo_mime: req.file.mimetype,
      tamanho_bytes: req.file.size,
      local_path: req.file.path
    },
    tenantId,
    req.usuario?.id
  );

  return res.status(201).json({
    ...anexo,
    url: `${req.protocol}://${req.get('host')}${publicPath}`,
    path: publicPath
  });
}

export async function deletarAnexoPrivacyCase(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const privacyCaseId = parseId(req.params.id);
  const anexoId = parseId(req.params.anexoId);

  const ok = await deletarPrivacyCaseAnexoService(privacyCaseId, anexoId, tenantId, req.usuario?.id);
  if (!ok) {
    throw new AppError('Anexo não encontrado', 404);
  }

  return res.status(204).send();
}
