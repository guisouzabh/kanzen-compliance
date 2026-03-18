import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import {
  PrivacyCase,
  PrivacyCaseAttachment,
  PrivacyCaseComDetalhes,
  PrivacyCaseDecisionApproval,
  PrivacyCaseIncidentDetails,
  PrivacyCaseOrigem,
  PrivacyCaseSeveridade,
  PrivacyCaseStatus,
  PrivacyCaseTimelineEvento,
  PrivacyCaseTimelineItem
} from '../types/PrivacyCase';
import {
  PrivacyCaseAssignInput,
  PrivacyCaseCommunicationDecisionFinalizeInput,
  PrivacyCaseCommunicationDecisionRequestInput,
  PrivacyCaseCreateInput,
  PrivacyCaseDecisionApprovalInput,
  PrivacyCaseTimelineCreateInput,
  PrivacyCaseUpdateInput
} from '../validation/privacyCaseSchema';

interface PrivacyCaseFilters {
  empresaId?: number;
  origem?: PrivacyCaseOrigem;
  status?: PrivacyCaseStatus;
  severidade?: PrivacyCaseSeveridade;
  q?: string;
}

interface PrivacyCaseAnexoCreatePayload {
  nome_arquivo: string;
  caminho_arquivo: string;
  tipo_mime?: string | null;
  tamanho_bytes: number;
  local_path: string;
}

interface ComiteResumo {
  id: number;
  nome: string;
  empresa_id: number;
}

interface ComiteMembroAtivo {
  usuario_id: number;
  usuario_nome: string;
}

interface IncidentDetailsPatch {
  comite_id_decisao?: number | null;
  dados_afetados?: string | null;
  titulares_afetados_estimado?: number | null;
  impacto_descricao?: string | null;
  medidas_contencao?: string | null;
  decisao_comunicar_anpd?: 'PENDENTE' | 'SIM' | 'NAO';
  decisao_comunicar_titulares?: 'PENDENTE' | 'SIM' | 'NAO';
  justificativa_decisao?: string | null;
  data_decisao?: string | null;
  decisao_por_usuario_id?: number | null;
}

function gerarProtocolo() {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10).replace(/-/g, '');
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INC-${data}-${hora}-${rand}`;
}

function boolToDb(value: boolean | number | null | undefined, fallback = false): number {
  if (value === undefined || value === null) return fallback ? 1 : 0;
  if (typeof value === 'number') return value ? 1 : 0;
  return value ? 1 : 0;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function hasOwnField<T extends object>(obj: T, key: keyof T): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function parseMetadata(metadataJson: string | null | undefined): Record<string, unknown> | null {
  if (!metadataJson) return null;
  try {
    const parsed = JSON.parse(metadataJson);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch (_err) {
    return null;
  }
}

function serializeMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
  if (!metadata) return null;
  return JSON.stringify(metadata);
}

async function criarInboxNotificacaoSafe(
  tenantId: number,
  payload: {
    usuario_id: number;
    titulo: string;
    corpo: string;
    tipo?: 'ALERTA' | 'AVISO' | 'INFO';
    prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA';
    remetente?: string;
    referencia_tipo?: string | null;
    referencia_id?: number | null;
  }
) {
  try {
    await tenantExecute(
      tenantId,
      `
        INSERT INTO inbox_notificacoes (
          tenant_id,
          usuario_id,
          titulo,
          corpo,
          tipo,
          prioridade,
          status,
          remetente,
          referencia_tipo,
          referencia_id
        ) VALUES (?, ?, ?, ?, ?, ?, 'NAO_LIDA', ?, ?, ?)
      `,
      [
        payload.usuario_id,
        payload.titulo,
        payload.corpo,
        payload.tipo ?? 'INFO',
        payload.prioridade ?? 'MEDIA',
        payload.remetente ?? 'Canal LGPD',
        payload.referencia_tipo ?? null,
        payload.referencia_id ?? null
      ]
    );
  } catch (err) {
    // Não deve bloquear o fluxo principal do caso.
    console.warn('[PrivacyCase] Falha ao criar notificação de inbox:', err);
  }
}

async function validarEmpresa(tenantId: number, empresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );
  if (!rows.length) {
    throw new AppError('Empresa inválida para este tenant', 400);
  }
}

async function validarUsuario(tenantId: number, usuarioId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );
  if (!rows.length) {
    throw new AppError('Usuário inválido para este tenant', 400);
  }
}

async function obterComiteValido(
  tenantId: number,
  comiteId: number,
  empresaId: number
): Promise<ComiteResumo> {
  const rows = await tenantQuery<ComiteResumo>(
    tenantId,
    'SELECT id, nome, empresa_id FROM comites WHERE tenant_id = ? AND id = ? AND empresa_id = ?',
    [comiteId, empresaId]
  );

  if (!rows.length) {
    throw new AppError('Comitê inválido para este caso', 400);
  }

  return rows[0];
}

async function listarMembrosAtivosComite(
  tenantId: number,
  comiteId: number
): Promise<ComiteMembroAtivo[]> {
  return tenantQuery<ComiteMembroAtivo>(
    tenantId,
    `
      SELECT cm.usuario_id, u.nome AS usuario_nome
        FROM comite_membros cm
        JOIN usuarios u ON u.id = cm.usuario_id AND u.tenant_id = cm.tenant_id
       WHERE cm.tenant_id = ?
         AND cm.comite_id = ?
         AND cm.ativo = 1
       ORDER BY cm.id ASC
    `,
    [comiteId]
  );
}

async function validarUsuarioMembroAtivoComite(
  tenantId: number,
  comiteId: number,
  usuarioId: number
): Promise<void> {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM comite_membros
       WHERE tenant_id = ?
         AND comite_id = ?
         AND usuario_id = ?
         AND ativo = 1
       LIMIT 1
    `,
    [comiteId, usuarioId]
  );

  if (!rows.length) {
    throw new AppError('Usuário não é membro ativo do comitê informado', 403);
  }
}

async function obterPrivacyCaseBasePorId(
  id: number,
  tenantId: number
): Promise<PrivacyCase | null> {
  const rows = await tenantQuery<PrivacyCase>(
    tenantId,
    `
      SELECT c.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
        FROM privacy_cases c
        JOIN empresas e ON e.id = c.empresa_id AND e.tenant_id = c.tenant_id
        LEFT JOIN usuarios u ON u.id = c.responsavel_id AND u.tenant_id = c.tenant_id
       WHERE c.tenant_id = ? AND c.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

async function listarDetalhesIncidentesPorCaseIds(
  tenantId: number,
  privacyCaseIds: number[]
): Promise<Record<number, PrivacyCaseIncidentDetails>> {
  if (!privacyCaseIds.length) return {};

  const placeholders = privacyCaseIds.map(() => '?').join(',');
  const rows = await tenantQuery<PrivacyCaseIncidentDetails>(
    tenantId,
    `
      SELECT d.*, c.nome AS comite_nome_decisao
        FROM privacy_case_incident_details d
        LEFT JOIN comites c ON c.id = d.comite_id_decisao AND c.tenant_id = d.tenant_id
       WHERE d.tenant_id = ?
         AND d.privacy_case_id IN (${placeholders})
    `,
    privacyCaseIds
  );

  return rows.reduce<Record<number, PrivacyCaseIncidentDetails>>((acc, row) => {
    acc[row.privacy_case_id] = row;
    return acc;
  }, {});
}

async function obterDetalhesIncidentePorCaseId(
  privacyCaseId: number,
  tenantId: number
): Promise<PrivacyCaseIncidentDetails | null> {
  const rows = await tenantQuery<PrivacyCaseIncidentDetails>(
    tenantId,
    `
      SELECT d.*, c.nome AS comite_nome_decisao
        FROM privacy_case_incident_details d
        LEFT JOIN comites c ON c.id = d.comite_id_decisao AND c.tenant_id = d.tenant_id
       WHERE d.tenant_id = ? AND d.privacy_case_id = ?
    `,
    [privacyCaseId]
  );
  return rows[0] ?? null;
}

async function criarDetalhesIncidente(
  privacyCaseId: number,
  tenantId: number,
  detalhes?: IncidentDetailsPatch
) {
  if (detalhes?.decisao_por_usuario_id) {
    await validarUsuario(tenantId, detalhes.decisao_por_usuario_id);
  }

  await tenantExecute(
    tenantId,
    `
      INSERT INTO privacy_case_incident_details (
        tenant_id,
        privacy_case_id,
        comite_id_decisao,
        dados_afetados,
        titulares_afetados_estimado,
        impacto_descricao,
        medidas_contencao,
        decisao_comunicar_anpd,
        decisao_comunicar_titulares,
        justificativa_decisao,
        data_decisao,
        decisao_por_usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      privacyCaseId,
      detalhes?.comite_id_decisao ?? null,
      normalizeNullableText(detalhes?.dados_afetados),
      detalhes?.titulares_afetados_estimado ?? null,
      normalizeNullableText(detalhes?.impacto_descricao),
      normalizeNullableText(detalhes?.medidas_contencao),
      detalhes?.decisao_comunicar_anpd ?? 'PENDENTE',
      detalhes?.decisao_comunicar_titulares ?? 'PENDENTE',
      normalizeNullableText(detalhes?.justificativa_decisao),
      detalhes?.data_decisao ?? null,
      detalhes?.decisao_por_usuario_id ?? null
    ]
  );
}

async function atualizarDetalhesIncidente(
  privacyCaseId: number,
  tenantId: number,
  patch: IncidentDetailsPatch
) {
  const atual = await obterDetalhesIncidentePorCaseId(privacyCaseId, tenantId);
  if (!atual) {
    await criarDetalhesIncidente(privacyCaseId, tenantId, patch);
    return;
  }

  const decisorId = hasOwnField(patch, 'decisao_por_usuario_id')
    ? (patch.decisao_por_usuario_id ?? null)
    : (atual.decisao_por_usuario_id ?? null);

  if (decisorId) {
    await validarUsuario(tenantId, decisorId);
  }

  const comiteIdDecisao = hasOwnField(patch, 'comite_id_decisao')
    ? (patch.comite_id_decisao ?? null)
    : (atual.comite_id_decisao ?? null);

  const dadosAfetados = hasOwnField(patch, 'dados_afetados')
    ? normalizeNullableText(patch.dados_afetados)
    : (atual.dados_afetados ?? null);

  const titularesAfetadosEstimado = hasOwnField(patch, 'titulares_afetados_estimado')
    ? (patch.titulares_afetados_estimado ?? null)
    : (atual.titulares_afetados_estimado ?? null);

  const impactoDescricao = hasOwnField(patch, 'impacto_descricao')
    ? normalizeNullableText(patch.impacto_descricao)
    : (atual.impacto_descricao ?? null);

  const medidasContencao = hasOwnField(patch, 'medidas_contencao')
    ? normalizeNullableText(patch.medidas_contencao)
    : (atual.medidas_contencao ?? null);

  const decisaoAnpd = hasOwnField(patch, 'decisao_comunicar_anpd')
    ? (patch.decisao_comunicar_anpd ?? 'PENDENTE')
    : (atual.decisao_comunicar_anpd ?? 'PENDENTE');

  const decisaoTitulares = hasOwnField(patch, 'decisao_comunicar_titulares')
    ? (patch.decisao_comunicar_titulares ?? 'PENDENTE')
    : (atual.decisao_comunicar_titulares ?? 'PENDENTE');

  const justificativa = hasOwnField(patch, 'justificativa_decisao')
    ? normalizeNullableText(patch.justificativa_decisao)
    : (atual.justificativa_decisao ?? null);

  const dataDecisao = hasOwnField(patch, 'data_decisao')
    ? (patch.data_decisao ?? null)
    : (atual.data_decisao ?? null);

  await tenantExecute(
    tenantId,
    `
      UPDATE privacy_case_incident_details
         SET tenant_id = ?,
             comite_id_decisao = ?,
             dados_afetados = ?,
             titulares_afetados_estimado = ?,
             impacto_descricao = ?,
             medidas_contencao = ?,
             decisao_comunicar_anpd = ?,
             decisao_comunicar_titulares = ?,
             justificativa_decisao = ?,
             data_decisao = ?,
             decisao_por_usuario_id = ?
       WHERE tenant_id = ? AND privacy_case_id = ?
    `,
    [
      comiteIdDecisao,
      dadosAfetados,
      titularesAfetadosEstimado,
      impactoDescricao,
      medidasContencao,
      decisaoAnpd,
      decisaoTitulares,
      justificativa,
      dataDecisao,
      decisorId,
      tenantId,
      privacyCaseId
    ]
  );
}

async function registrarTimeline(
  privacyCaseId: number,
  tenantId: number,
  eventoTipo: PrivacyCaseTimelineEvento,
  descricao: string,
  metadata?: Record<string, unknown> | null,
  usuarioId?: number
) {
  await tenantExecute(
    tenantId,
    `
      INSERT INTO privacy_case_timeline (
        tenant_id,
        privacy_case_id,
        evento_tipo,
        descricao,
        metadata_json,
        criado_por_usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `,
    [privacyCaseId, eventoTipo, descricao, serializeMetadata(metadata), usuarioId ?? null]
  );
}

async function garantirPrivacyCaseExiste(privacyCaseId: number, tenantId: number): Promise<PrivacyCase> {
  const privacyCase = await obterPrivacyCaseBasePorId(privacyCaseId, tenantId);
  if (!privacyCase) {
    throw new AppError('Caso de privacidade não encontrado', 404);
  }
  return privacyCase;
}

async function obterAnexoPrivacyCasePorId(
  privacyCaseId: number,
  anexoId: number,
  tenantId: number
): Promise<PrivacyCaseAttachment | null> {
  const rows = await tenantQuery<PrivacyCaseAttachment>(
    tenantId,
    `
      SELECT a.*, u.nome AS enviado_por_usuario_nome
        FROM privacy_case_attachments a
        LEFT JOIN usuarios u ON u.id = a.enviado_por_usuario_id AND u.tenant_id = a.tenant_id
       WHERE a.tenant_id = ? AND a.privacy_case_id = ? AND a.id = ?
       LIMIT 1
    `,
    [privacyCaseId, anexoId]
  );

  return rows[0] ?? null;
}

async function obterAprovacoesDecisaoPorComite(
  privacyCaseId: number,
  comiteId: number,
  tenantId: number
): Promise<PrivacyCaseDecisionApproval[]> {
  return tenantQuery<PrivacyCaseDecisionApproval>(
    tenantId,
    `
      SELECT a.*, u.nome AS usuario_nome, c.nome AS comite_nome
        FROM privacy_case_decision_approvals a
        JOIN usuarios u ON u.id = a.usuario_id AND u.tenant_id = a.tenant_id
        JOIN comites c ON c.id = a.comite_id AND c.tenant_id = a.tenant_id
       WHERE a.tenant_id = ?
         AND a.privacy_case_id = ?
         AND a.comite_id = ?
       ORDER BY a.updated_at DESC, a.id DESC
    `,
    [privacyCaseId, comiteId]
  );
}

export async function listarPrivacyCasesService(
  tenantId: number,
  filters: PrivacyCaseFilters = {}
): Promise<PrivacyCaseComDetalhes[]> {
  const conditions: string[] = ['c.tenant_id = ?'];
  const params: Array<number | string> = [tenantId];

  if (filters.empresaId) {
    conditions.push('c.empresa_id = ?');
    params.push(filters.empresaId);
  }
  if (filters.origem) {
    conditions.push('c.origem = ?');
    params.push(filters.origem);
  }
  if (filters.status) {
    conditions.push('c.status = ?');
    params.push(filters.status);
  }
  if (filters.severidade) {
    conditions.push('c.severidade = ?');
    params.push(filters.severidade);
  }
  if (filters.q) {
    conditions.push('(c.titulo LIKE ? OR c.descricao LIKE ? OR c.protocolo LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  const rows = await tenantQuery<PrivacyCase>(
    tenantId,
    `
      SELECT c.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
        FROM privacy_cases c
        JOIN empresas e ON e.id = c.empresa_id AND e.tenant_id = c.tenant_id
        LEFT JOIN usuarios u ON u.id = c.responsavel_id AND u.tenant_id = c.tenant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.created_at DESC, c.id DESC
    `,
    params.slice(1)
  );

  const caseIds = rows.map((item) => item.id).filter((id): id is number => typeof id === 'number');
  const detalhesMap = await listarDetalhesIncidentesPorCaseIds(tenantId, caseIds);

  return rows.map((item) => ({
    ...item,
    detalhes_incidente: item.id ? (detalhesMap[item.id] ?? null) : null
  }));
}

export async function obterPrivacyCasePorIdService(
  id: number,
  tenantId: number
): Promise<PrivacyCaseComDetalhes | null> {
  const privacyCase = await obterPrivacyCaseBasePorId(id, tenantId);
  if (!privacyCase) return null;

  const detalhes = await obterDetalhesIncidentePorCaseId(id, tenantId);

  return {
    ...privacyCase,
    detalhes_incidente: detalhes
  };
}

export async function criarPrivacyCaseService(
  dados: PrivacyCaseCreateInput,
  tenantId: number,
  usuarioId?: number
): Promise<PrivacyCaseComDetalhes> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarUsuario(tenantId, dados.responsavel_id);
  }

  const protocolo = gerarProtocolo();
  const status = dados.status ?? 'ABERTO';
  const severidade = dados.severidade ?? 'MEDIA';
  const anonimo = boolToDb(dados.anonimo, false);
  const aceitaContato = anonimo ? 0 : boolToDb(dados.aceita_contato, false);

  const reportanteNome = anonimo ? null : normalizeNullableText(dados.reportante_nome);
  const reportanteEmail = anonimo ? null : normalizeNullableText(dados.reportante_email);
  const reportanteCanal = anonimo ? null : normalizeNullableText(dados.reportante_canal);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO privacy_cases (
        tenant_id,
        empresa_id,
        protocolo,
        tipo_case,
        origem,
        titulo,
        descricao,
        status,
        severidade,
        responsavel_id,
        prazo,
        anonimo,
        reportante_nome,
        reportante_email,
        reportante_canal,
        aceita_contato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      protocolo,
      'EVENTO_INCIDENTE',
      dados.origem,
      dados.titulo,
      dados.descricao,
      status,
      severidade,
      dados.responsavel_id ?? null,
      dados.prazo ?? null,
      anonimo,
      reportanteNome,
      reportanteEmail,
      reportanteCanal,
      aceitaContato
    ]
  );

  const id = (result as { insertId: number }).insertId;

  await criarDetalhesIncidente(id, tenantId, dados.detalhes_incidente);

  await registrarTimeline(
    id,
    tenantId,
    'CRIACAO',
    'Caso de privacidade criado',
    {
      protocolo,
      origem: dados.origem,
      status,
      severidade
    },
    usuarioId
  );

  const criado = await obterPrivacyCasePorIdService(id, tenantId);
  if (!criado) {
    throw new AppError('Falha ao criar caso de privacidade', 500);
  }

  return criado;
}

export async function atualizarPrivacyCaseService(
  id: number,
  dados: PrivacyCaseUpdateInput,
  tenantId: number,
  usuarioId?: number
): Promise<PrivacyCaseComDetalhes | null> {
  const atual = await obterPrivacyCasePorIdService(id, tenantId);
  if (!atual) return null;

  if (Object.keys(dados).length === 0) {
    return atual;
  }

  const empresaId = dados.empresa_id ?? atual.empresa_id;
  await validarEmpresa(tenantId, empresaId);

  const responsavelId = hasOwnField(dados, 'responsavel_id')
    ? (dados.responsavel_id ?? null)
    : (atual.responsavel_id ?? null);

  if (responsavelId) {
    await validarUsuario(tenantId, responsavelId);
  }

  const anonimo = hasOwnField(dados, 'anonimo')
    ? boolToDb(dados.anonimo ?? false, false)
    : boolToDb(atual.anonimo, false);

  const aceitaContato = anonimo
    ? 0
    : hasOwnField(dados, 'aceita_contato')
      ? boolToDb(dados.aceita_contato ?? false, false)
      : boolToDb(atual.aceita_contato, false);

  const reportanteNome = anonimo
    ? null
    : hasOwnField(dados, 'reportante_nome')
      ? normalizeNullableText(dados.reportante_nome)
      : normalizeNullableText(atual.reportante_nome);

  const reportanteEmail = anonimo
    ? null
    : hasOwnField(dados, 'reportante_email')
      ? normalizeNullableText(dados.reportante_email)
      : normalizeNullableText(atual.reportante_email);

  const reportanteCanal = anonimo
    ? null
    : hasOwnField(dados, 'reportante_canal')
      ? normalizeNullableText(dados.reportante_canal)
      : normalizeNullableText(atual.reportante_canal);

  const origem = dados.origem ?? atual.origem;
  const titulo = dados.titulo ?? atual.titulo;
  const descricao = dados.descricao ?? atual.descricao;
  const status = dados.status ?? atual.status ?? 'ABERTO';
  const severidade = dados.severidade ?? atual.severidade ?? 'MEDIA';
  const prazo = hasOwnField(dados, 'prazo') ? (dados.prazo ?? null) : (atual.prazo ?? null);

  await tenantExecute(
    tenantId,
    `
      UPDATE privacy_cases
         SET tenant_id = ?,
             empresa_id = ?,
             origem = ?,
             titulo = ?,
             descricao = ?,
             status = ?,
             severidade = ?,
             responsavel_id = ?,
             prazo = ?,
             anonimo = ?,
             reportante_nome = ?,
             reportante_email = ?,
             reportante_canal = ?,
             aceita_contato = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      empresaId,
      origem,
      titulo,
      descricao,
      status,
      severidade,
      responsavelId,
      prazo,
      anonimo,
      reportanteNome,
      reportanteEmail,
      reportanteCanal,
      aceitaContato,
      tenantId,
      id
    ]
  );

  const tinhaDetalhesPatch = !!dados.detalhes_incidente;
  if (dados.detalhes_incidente) {
    await atualizarDetalhesIncidente(id, tenantId, dados.detalhes_incidente);
  }

  if ((atual.status ?? 'ABERTO') !== status) {
    await registrarTimeline(
      id,
      tenantId,
      'MUDANCA_STATUS',
      `Status alterado de ${atual.status ?? 'ABERTO'} para ${status}`,
      {
        status_anterior: atual.status ?? 'ABERTO',
        status_novo: status
      },
      usuarioId
    );
  }

  if ((atual.severidade ?? 'MEDIA') !== severidade) {
    await registrarTimeline(
      id,
      tenantId,
      'MUDANCA_SEVERIDADE',
      `Severidade alterada de ${atual.severidade ?? 'MEDIA'} para ${severidade}`,
      {
        severidade_anterior: atual.severidade ?? 'MEDIA',
        severidade_nova: severidade
      },
      usuarioId
    );
  }

  const houveMudancaGeral =
    atual.empresa_id !== empresaId ||
    atual.origem !== origem ||
    atual.titulo !== titulo ||
    atual.descricao !== descricao ||
    (atual.responsavel_id ?? null) !== responsavelId ||
    (atual.prazo ?? null) !== prazo ||
    boolToDb(atual.anonimo, false) !== anonimo ||
    normalizeNullableText(atual.reportante_nome) !== reportanteNome ||
    normalizeNullableText(atual.reportante_email) !== reportanteEmail ||
    normalizeNullableText(atual.reportante_canal) !== reportanteCanal ||
    boolToDb(atual.aceita_contato, false) !== aceitaContato ||
    tinhaDetalhesPatch;

  if (houveMudancaGeral) {
    await registrarTimeline(
      id,
      tenantId,
      'ATUALIZACAO',
      'Caso de privacidade atualizado',
      {
        atualizou_detalhes_incidente: tinhaDetalhesPatch
      },
      usuarioId
    );
  }

  return obterPrivacyCasePorIdService(id, tenantId);
}

export async function atribuirPrivacyCaseService(
  privacyCaseId: number,
  payload: PrivacyCaseAssignInput,
  tenantId: number,
  usuarioId?: number
): Promise<PrivacyCaseComDetalhes> {
  const atual = await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  await validarUsuario(tenantId, payload.responsavel_id);

  const statusNovo = payload.status ?? 'EM_ANALISE';
  const prazoNovo = hasOwnField(payload, 'prazo') ? (payload.prazo ?? null) : (atual.prazo ?? null);

  await tenantExecute(
    tenantId,
    `
      UPDATE privacy_cases
         SET tenant_id = ?,
             responsavel_id = ?,
             prazo = ?,
             status = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [payload.responsavel_id, prazoNovo, statusNovo, tenantId, privacyCaseId]
  );

  if ((atual.status ?? 'ABERTO') !== statusNovo) {
    await registrarTimeline(
      privacyCaseId,
      tenantId,
      'MUDANCA_STATUS',
      `Status alterado de ${atual.status ?? 'ABERTO'} para ${statusNovo}`,
      {
        status_anterior: atual.status ?? 'ABERTO',
        status_novo: statusNovo
      },
      usuarioId
    );
  }

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'ATUALIZACAO',
    'Caso atribuído para responsável',
    {
      responsavel_id: payload.responsavel_id,
      prazo: prazoNovo
    },
    usuarioId
  );

  await criarInboxNotificacaoSafe(tenantId, {
    usuario_id: payload.responsavel_id,
    titulo: `Novo caso LGPD atribuído (${atual.protocolo})`,
    corpo: `Você foi atribuído ao caso ${atual.protocolo}: ${atual.titulo}`,
    tipo: 'ALERTA',
    prioridade: atual.severidade === 'ALTA' ? 'ALTA' : 'MEDIA',
    referencia_tipo: 'PRIVACY_CASE',
    referencia_id: privacyCaseId
  });

  const atualizado = await obterPrivacyCasePorIdService(privacyCaseId, tenantId);
  if (!atualizado) throw new AppError('Caso de privacidade não encontrado', 404);
  return atualizado;
}

export async function solicitarDecisaoComunicacaoPrivacyCaseService(
  privacyCaseId: number,
  payload: PrivacyCaseCommunicationDecisionRequestInput,
  tenantId: number,
  usuarioId?: number
): Promise<{ privacy_case: PrivacyCaseComDetalhes; comite_id: number; membros_notificados: number }> {
  const atual = await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  if (atual.status === 'CONCLUIDO' || atual.status === 'DESCARTADO') {
    throw new AppError('Não é possível solicitar decisão para caso encerrado', 400);
  }

  const comite = await obterComiteValido(tenantId, payload.comite_id, atual.empresa_id);
  const membros = await listarMembrosAtivosComite(tenantId, payload.comite_id);

  if (membros.length < 2) {
    throw new AppError('Comitê precisa ter ao menos 2 membros ativos para decisão', 400);
  }

  await tenantExecute(
    tenantId,
    `
      UPDATE privacy_cases
         SET tenant_id = ?, status = 'DECISAO_COMUNICACAO'
       WHERE tenant_id = ? AND id = ?
    `,
    [tenantId, privacyCaseId]
  );

  await atualizarDetalhesIncidente(privacyCaseId, tenantId, {
    comite_id_decisao: payload.comite_id,
    decisao_comunicar_anpd: 'PENDENTE',
    decisao_comunicar_titulares: 'PENDENTE',
    justificativa_decisao: null,
    data_decisao: null,
    decisao_por_usuario_id: null
  });

  await tenantExecute(
    tenantId,
    'DELETE FROM privacy_case_decision_approvals WHERE tenant_id = ? AND privacy_case_id = ?',
    [privacyCaseId]
  );

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'DECISAO_COMUNICACAO',
    `Solicitada decisão de comunicação para o comitê ${comite.nome}`,
    {
      comite_id: comite.id,
      comite_nome: comite.nome,
      quorum_minimo: 2,
      mensagem: normalizeNullableText(payload.mensagem)
    },
    usuarioId
  );

  for (const membro of membros) {
    await criarInboxNotificacaoSafe(tenantId, {
      usuario_id: membro.usuario_id,
      titulo: `Decisão LGPD pendente (${atual.protocolo})`,
      corpo: normalizeNullableText(payload.mensagem)
        ? `Caso ${atual.protocolo}: ${payload.mensagem}`
        : `Você precisa registrar sua decisão no caso ${atual.protocolo}.`,
      tipo: 'ALERTA',
      prioridade: atual.severidade === 'ALTA' ? 'ALTA' : 'MEDIA',
      referencia_tipo: 'PRIVACY_CASE',
      referencia_id: privacyCaseId
    });
  }

  const atualizado = await obterPrivacyCasePorIdService(privacyCaseId, tenantId);
  if (!atualizado) throw new AppError('Caso de privacidade não encontrado', 404);

  return {
    privacy_case: atualizado,
    comite_id: payload.comite_id,
    membros_notificados: membros.length
  };
}

export async function listarAprovacoesDecisaoPrivacyCaseService(
  privacyCaseId: number,
  tenantId: number
): Promise<PrivacyCaseDecisionApproval[]> {
  const privacyCase = await garantirPrivacyCaseExiste(privacyCaseId, tenantId);
  const detalhes = await obterDetalhesIncidentePorCaseId(privacyCaseId, tenantId);

  if (!detalhes?.comite_id_decisao) {
    return [];
  }

  await obterComiteValido(tenantId, detalhes.comite_id_decisao, privacyCase.empresa_id);
  return obterAprovacoesDecisaoPorComite(privacyCaseId, detalhes.comite_id_decisao, tenantId);
}

export async function registrarAprovacaoDecisaoPrivacyCaseService(
  privacyCaseId: number,
  payload: PrivacyCaseDecisionApprovalInput,
  tenantId: number,
  usuarioId: number
): Promise<PrivacyCaseDecisionApproval> {
  const privacyCase = await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  if (privacyCase.status !== 'DECISAO_COMUNICACAO') {
    throw new AppError('Caso não está em fase de decisão de comunicação', 400);
  }

  await validarUsuario(tenantId, usuarioId);
  const comite = await obterComiteValido(tenantId, payload.comite_id, privacyCase.empresa_id);
  await validarUsuarioMembroAtivoComite(tenantId, payload.comite_id, usuarioId);

  const detalhes = await obterDetalhesIncidentePorCaseId(privacyCaseId, tenantId);
  if (detalhes?.comite_id_decisao && detalhes.comite_id_decisao !== payload.comite_id) {
    throw new AppError('Este caso está vinculado a outro comitê para decisão', 400);
  }

  await atualizarDetalhesIncidente(privacyCaseId, tenantId, {
    comite_id_decisao: payload.comite_id
  });

  const aprovado = boolToDb(payload.aprovado, true);

  await tenantExecute(
    tenantId,
    `
      INSERT INTO privacy_case_decision_approvals (
        tenant_id,
        privacy_case_id,
        comite_id,
        usuario_id,
        aprovado,
        decisao_comunicar_anpd,
        decisao_comunicar_titulares,
        justificativa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        comite_id = VALUES(comite_id),
        aprovado = VALUES(aprovado),
        decisao_comunicar_anpd = VALUES(decisao_comunicar_anpd),
        decisao_comunicar_titulares = VALUES(decisao_comunicar_titulares),
        justificativa = VALUES(justificativa),
        updated_at = CURRENT_TIMESTAMP
    `,
    [
      privacyCaseId,
      payload.comite_id,
      usuarioId,
      aprovado,
      payload.decisao_comunicar_anpd ?? null,
      payload.decisao_comunicar_titulares ?? null,
      normalizeNullableText(payload.justificativa)
    ]
  );

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'DECISAO_COMUNICACAO',
    aprovado
      ? `Aprovação registrada no comitê ${comite.nome}`
      : `Voto não favorável registrado no comitê ${comite.nome}`,
    {
      comite_id: comite.id,
      usuario_id: usuarioId,
      aprovado,
      decisao_comunicar_anpd: payload.decisao_comunicar_anpd ?? null,
      decisao_comunicar_titulares: payload.decisao_comunicar_titulares ?? null
    },
    usuarioId
  );

  if (privacyCase.responsavel_id) {
    await criarInboxNotificacaoSafe(tenantId, {
      usuario_id: privacyCase.responsavel_id,
      titulo: `Novo voto no caso ${privacyCase.protocolo}`,
      corpo: `Um membro do comitê ${comite.nome} registrou decisão para o caso ${privacyCase.protocolo}.`,
      tipo: 'INFO',
      prioridade: 'MEDIA',
      referencia_tipo: 'PRIVACY_CASE',
      referencia_id: privacyCaseId
    });
  }

  const rows = await tenantQuery<PrivacyCaseDecisionApproval>(
    tenantId,
    `
      SELECT a.*, u.nome AS usuario_nome, c.nome AS comite_nome
        FROM privacy_case_decision_approvals a
        JOIN usuarios u ON u.id = a.usuario_id AND u.tenant_id = a.tenant_id
        JOIN comites c ON c.id = a.comite_id AND c.tenant_id = a.tenant_id
       WHERE a.tenant_id = ?
         AND a.privacy_case_id = ?
         AND a.comite_id = ?
         AND a.usuario_id = ?
       LIMIT 1
    `,
    [privacyCaseId, payload.comite_id, usuarioId]
  );

  const approval = rows[0];
  if (!approval) {
    throw new AppError('Falha ao registrar aprovação', 500);
  }

  return approval;
}

export async function finalizarDecisaoComunicacaoPrivacyCaseService(
  privacyCaseId: number,
  payload: PrivacyCaseCommunicationDecisionFinalizeInput,
  tenantId: number,
  usuarioId?: number
): Promise<{ privacy_case: PrivacyCaseComDetalhes; aprovacoes_validas: number }> {
  const privacyCase = await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  if (privacyCase.status !== 'DECISAO_COMUNICACAO' && privacyCase.status !== 'EM_ANALISE') {
    throw new AppError('Caso não está apto para finalização de decisão de comunicação', 400);
  }

  const comite = await obterComiteValido(tenantId, payload.comite_id, privacyCase.empresa_id);
  const membros = await listarMembrosAtivosComite(tenantId, payload.comite_id);

  if (membros.length < 2) {
    throw new AppError('Comitê não atende ao quórum mínimo de 2 membros ativos', 400);
  }

  const aprovacoes = await obterAprovacoesDecisaoPorComite(privacyCaseId, payload.comite_id, tenantId);
  const aprovacoesFavoraveis = aprovacoes.filter((item) => boolToDb(item.aprovado, false) === 1);

  const aprovacoesConsenso = aprovacoesFavoraveis.filter(
    (item) =>
      item.decisao_comunicar_anpd === payload.decisao_comunicar_anpd &&
      item.decisao_comunicar_titulares === payload.decisao_comunicar_titulares
  );

  if (aprovacoesConsenso.length < 2) {
    throw new AppError(
      'É necessário no mínimo 2 aprovações favoráveis do comitê com a mesma decisão final',
      400
    );
  }

  const statusFinal = payload.status_final ?? 'CONCLUIDO';

  await atualizarDetalhesIncidente(privacyCaseId, tenantId, {
    comite_id_decisao: payload.comite_id,
    decisao_comunicar_anpd: payload.decisao_comunicar_anpd,
    decisao_comunicar_titulares: payload.decisao_comunicar_titulares,
    justificativa_decisao: normalizeNullableText(payload.justificativa_decisao),
    data_decisao: payload.data_decisao ?? new Date().toISOString().slice(0, 19).replace('T', ' '),
    decisao_por_usuario_id: usuarioId ?? null
  });

  await tenantExecute(
    tenantId,
    `
      UPDATE privacy_cases
         SET tenant_id = ?, status = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [statusFinal, tenantId, privacyCaseId]
  );

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'DECISAO_COMUNICACAO',
    `Decisão de comunicação finalizada com quórum do comitê ${comite.nome}`,
    {
      comite_id: comite.id,
      decisao_comunicar_anpd: payload.decisao_comunicar_anpd,
      decisao_comunicar_titulares: payload.decisao_comunicar_titulares,
      aprovacoes_validas: aprovacoesConsenso.length
    },
    usuarioId
  );

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'MUDANCA_STATUS',
    `Status alterado para ${statusFinal} após decisão de comunicação`,
    {
      status_novo: statusFinal
    },
    usuarioId
  );

  if (privacyCase.responsavel_id) {
    await criarInboxNotificacaoSafe(tenantId, {
      usuario_id: privacyCase.responsavel_id,
      titulo: `Decisão de comunicação finalizada (${privacyCase.protocolo})`,
      corpo: `Caso ${privacyCase.protocolo} teve decisão final registrada pelo comitê ${comite.nome}.`,
      tipo: 'ALERTA',
      prioridade: privacyCase.severidade === 'ALTA' ? 'ALTA' : 'MEDIA',
      referencia_tipo: 'PRIVACY_CASE',
      referencia_id: privacyCaseId
    });
  }

  const atualizado = await obterPrivacyCasePorIdService(privacyCaseId, tenantId);
  if (!atualizado) throw new AppError('Caso de privacidade não encontrado', 404);

  return {
    privacy_case: atualizado,
    aprovacoes_validas: aprovacoesConsenso.length
  };
}

export async function listarPrivacyCaseTimelineService(
  privacyCaseId: number,
  tenantId: number
): Promise<PrivacyCaseTimelineItem[]> {
  await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  const rows = await tenantQuery<PrivacyCaseTimelineItem>(
    tenantId,
    `
      SELECT t.*, u.nome AS criado_por_usuario_nome
        FROM privacy_case_timeline t
        LEFT JOIN usuarios u ON u.id = t.criado_por_usuario_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.privacy_case_id = ?
       ORDER BY t.created_at DESC, t.id DESC
    `,
    [privacyCaseId]
  );

  return rows.map((item) => ({
    ...item,
    metadata: parseMetadata(item.metadata_json)
  }));
}

export async function adicionarPrivacyCaseTimelineService(
  privacyCaseId: number,
  payload: PrivacyCaseTimelineCreateInput,
  tenantId: number,
  usuarioId?: number
): Promise<PrivacyCaseTimelineItem> {
  await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  const eventoTipo = payload.evento_tipo ?? 'COMENTARIO';
  await registrarTimeline(
    privacyCaseId,
    tenantId,
    eventoTipo,
    payload.descricao,
    payload.metadata ?? null,
    usuarioId
  );

  const rows = await tenantQuery<PrivacyCaseTimelineItem>(
    tenantId,
    `
      SELECT t.*, u.nome AS criado_por_usuario_nome
        FROM privacy_case_timeline t
        LEFT JOIN usuarios u ON u.id = t.criado_por_usuario_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.privacy_case_id = ?
       ORDER BY t.id DESC
       LIMIT 1
    `,
    [privacyCaseId]
  );

  const item = rows[0];
  if (!item) {
    throw new AppError('Falha ao registrar timeline', 500);
  }

  return {
    ...item,
    metadata: parseMetadata(item.metadata_json)
  };
}

export async function listarPrivacyCaseAnexosService(
  privacyCaseId: number,
  tenantId: number
): Promise<PrivacyCaseAttachment[]> {
  await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  return tenantQuery<PrivacyCaseAttachment>(
    tenantId,
    `
      SELECT a.*, u.nome AS enviado_por_usuario_nome
        FROM privacy_case_attachments a
        LEFT JOIN usuarios u ON u.id = a.enviado_por_usuario_id AND u.tenant_id = a.tenant_id
       WHERE a.tenant_id = ? AND a.privacy_case_id = ?
       ORDER BY a.created_at DESC, a.id DESC
    `,
    [privacyCaseId]
  );
}

export async function criarPrivacyCaseAnexoService(
  privacyCaseId: number,
  payload: PrivacyCaseAnexoCreatePayload,
  tenantId: number,
  usuarioId?: number
): Promise<PrivacyCaseAttachment> {
  await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  let hashArquivo: string | null = null;
  try {
    hashArquivo = crypto.createHash('sha256').update(fs.readFileSync(payload.local_path)).digest('hex');
  } catch (_err) {
    hashArquivo = null;
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO privacy_case_attachments (
        tenant_id,
        privacy_case_id,
        nome_arquivo,
        caminho_arquivo,
        tipo_mime,
        tamanho_bytes,
        hash_arquivo,
        enviado_por_usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      privacyCaseId,
      payload.nome_arquivo,
      payload.caminho_arquivo,
      payload.tipo_mime ?? null,
      payload.tamanho_bytes,
      hashArquivo,
      usuarioId ?? null
    ]
  );

  const anexoId = (result as { insertId: number }).insertId;

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'ANEXO_ADICIONADO',
    `Anexo ${payload.nome_arquivo} adicionado ao caso`,
    {
      anexo_id: anexoId,
      nome_arquivo: payload.nome_arquivo
    },
    usuarioId
  );

  const anexo = await obterAnexoPrivacyCasePorId(privacyCaseId, anexoId, tenantId);
  if (!anexo) {
    throw new AppError('Falha ao salvar anexo do caso', 500);
  }

  return anexo;
}

export async function deletarPrivacyCaseAnexoService(
  privacyCaseId: number,
  anexoId: number,
  tenantId: number,
  usuarioId?: number
): Promise<boolean> {
  await garantirPrivacyCaseExiste(privacyCaseId, tenantId);

  const anexo = await obterAnexoPrivacyCasePorId(privacyCaseId, anexoId, tenantId);
  if (!anexo) return false;

  await tenantExecute(
    tenantId,
    'DELETE FROM privacy_case_attachments WHERE tenant_id = ? AND privacy_case_id = ? AND id = ?',
    [privacyCaseId, anexoId]
  );

  await registrarTimeline(
    privacyCaseId,
    tenantId,
    'ANEXO_REMOVIDO',
    `Anexo ${anexo.nome_arquivo} removido do caso`,
    {
      anexo_id: anexoId,
      nome_arquivo: anexo.nome_arquivo
    },
    usuarioId
  );

  const localPath = path.resolve(__dirname, '..', '..', anexo.caminho_arquivo.replace(/^\//, ''));
  await fs.promises.unlink(localPath).catch(() => undefined);

  return true;
}
