import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { MatrizAcao } from '../types/MatrizAcao';
import { buscarTagsMap, deletarTags, salvarTags } from './tagService';

const TAG_ENTITY_MATRIZ_ACAO = 'MATRIZ_ACAO';

interface MatrizAcaoFilters {
  empresaId?: number;
  origemTyp?: string;
  origemId?: number;
  status?: string;
  statusPrazo?: string;
  prioridade?: number;
  responsavelId?: number;
  prazoFaixa?: string;
  q?: string;
}

async function validarEmpresa(tenantId: number, empresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );
  if (!rows.length) throw new AppError('Empresa inválida para este tenant', 400);
}

async function validarResponsavel(tenantId: number, responsavelId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [responsavelId]
  );
  if (!rows.length) throw new AppError('Responsável inválido para este tenant', 400);
}

export async function listarMatrizAcoesService(
  tenantId: number,
  filters: MatrizAcaoFilters = {}
): Promise<MatrizAcao[]> {
  const conditions: string[] = ['a.tenant_id = ?'];
  const params: Array<string | number> = [tenantId];

  if (filters.empresaId) {
    conditions.push('a.empresa_id = ?');
    params.push(filters.empresaId);
  }
  if (filters.origemTyp) {
    conditions.push('a.origem_typ = ?');
    params.push(filters.origemTyp);
  }
  if (filters.origemId) {
    conditions.push('a.origem_id = ?');
    params.push(filters.origemId);
  }
  if (filters.status) {
    conditions.push('a.status = ?');
    params.push(filters.status);
  }
  if (filters.statusPrazo) {
    conditions.push('a.status_prazo = ?');
    params.push(filters.statusPrazo);
  }
  if (filters.prioridade) {
    conditions.push('a.prioridade = ?');
    params.push(filters.prioridade);
  }
  if (filters.responsavelId) {
    conditions.push('a.responsavel_id = ?');
    params.push(filters.responsavelId);
  }
  if (filters.prazoFaixa) {
    if (filters.prazoFaixa === 'HOJE') {
      conditions.push('a.prazo = CURRENT_DATE()');
    }
    if (filters.prazoFaixa === 'PROXIMOS_7_DIAS') {
      conditions.push('a.prazo IS NOT NULL AND a.prazo BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)');
    }
    if (filters.prazoFaixa === 'PROXIMOS_30_DIAS') {
      conditions.push('a.prazo IS NOT NULL AND a.prazo BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY)');
    }
    if (filters.prazoFaixa === 'PROXIMOS_90_DIAS') {
      conditions.push('a.prazo IS NOT NULL AND a.prazo BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)');
    }
    if (filters.prazoFaixa === 'PROXIMOS_6_MESES') {
      conditions.push('a.prazo IS NOT NULL AND a.prazo BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 6 MONTH)');
    }
    if (filters.prazoFaixa === 'MAIOR_QUE_6_MESES') {
      conditions.push('a.prazo IS NOT NULL AND a.prazo > DATE_ADD(CURRENT_DATE(), INTERVAL 6 MONTH)');
    }
  }
  if (filters.q) {
    conditions.push('(a.acao LIKE ? OR a.objetivo LIKE ? OR a.origem LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`);
  }

  const sql = `
    SELECT a.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
      FROM matriz_acoes a
      JOIN empresas e ON e.id = a.empresa_id AND e.tenant_id = a.tenant_id
      LEFT JOIN usuarios u ON u.id = a.responsavel_id AND u.tenant_id = a.tenant_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.id DESC
  `;

  const acoes = await tenantQuery<MatrizAcao>(tenantId, sql, params.slice(1));
  const ids = acoes.map((acao) => acao.id!).filter(Boolean);
  const tagsMap = await buscarTagsMap(tenantId, TAG_ENTITY_MATRIZ_ACAO, ids);

  return acoes.map((acao) => ({
    ...acao,
    tags: tagsMap[acao.id!] || []
  }));
}

export async function obterMatrizAcaoPorIdService(
  id: number,
  tenantId: number
): Promise<MatrizAcao | null> {
  const rows = await tenantQuery<MatrizAcao>(
    tenantId,
    `
      SELECT a.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
        FROM matriz_acoes a
        JOIN empresas e ON e.id = a.empresa_id AND e.tenant_id = a.tenant_id
        LEFT JOIN usuarios u ON u.id = a.responsavel_id AND u.tenant_id = a.tenant_id
       WHERE a.tenant_id = ? AND a.id = ?
    `,
    [id]
  );

  const acao = rows[0];
  if (!acao) return null;

  const tagsMap = await buscarTagsMap(tenantId, TAG_ENTITY_MATRIZ_ACAO, [id]);
  return {
    ...acao,
    tags: tagsMap[id] || []
  };
}

export async function criarMatrizAcaoService(
  dados: MatrizAcao,
  tenantId: number
): Promise<MatrizAcao> {
  const { tags, ...acaoSemTags } = dados;

  await validarEmpresa(tenantId, acaoSemTags.empresa_id);
  if (acaoSemTags.responsavel_id) {
    await validarResponsavel(tenantId, acaoSemTags.responsavel_id);
  }

  const status = acaoSemTags.status ?? 'PLANEJADA';
  const prioridade = acaoSemTags.prioridade ?? 3;
  const esforco = acaoSemTags.esforco ?? 3;
  const statusPrazo = acaoSemTags.status_prazo ?? 'NO_PRAZO';

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO matriz_acoes (
        tenant_id,
        empresa_id,
        acao,
        objetivo,
        status,
        prioridade,
        esforco,
        prazo,
        status_prazo,
        origem,
        origem_typ,
        origem_id,
        responsavel_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      acaoSemTags.empresa_id,
      acaoSemTags.acao,
      acaoSemTags.objetivo ?? null,
      status,
      prioridade,
      esforco,
      acaoSemTags.prazo ?? null,
      statusPrazo,
      acaoSemTags.origem ?? null,
      acaoSemTags.origem_typ ?? null,
      acaoSemTags.origem_id ?? null,
      acaoSemTags.responsavel_id ?? null
    ]
  );

  const id = (result as any).insertId;
  await salvarTags(tenantId, TAG_ENTITY_MATRIZ_ACAO, id, tags);
  const criada = await obterMatrizAcaoPorIdService(id, tenantId);
  return (
    criada ?? {
      ...acaoSemTags,
      id,
      status,
      prioridade,
      esforco,
      status_prazo: statusPrazo,
      tags: tags || []
    }
  );
}

export async function atualizarMatrizAcaoService(
  id: number,
  dados: MatrizAcao,
  tenantId: number
): Promise<MatrizAcao | null> {
  const { tags, ...acaoSemTags } = dados;

  await validarEmpresa(tenantId, acaoSemTags.empresa_id);
  if (acaoSemTags.responsavel_id) {
    await validarResponsavel(tenantId, acaoSemTags.responsavel_id);
  }

  const status = acaoSemTags.status ?? 'PLANEJADA';
  const prioridade = acaoSemTags.prioridade ?? 3;
  const esforco = acaoSemTags.esforco ?? 3;
  const statusPrazo = acaoSemTags.status_prazo ?? 'NO_PRAZO';

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE matriz_acoes
         SET tenant_id = ?,
             empresa_id = ?,
             acao = ?,
             objetivo = ?,
             status = ?,
             prioridade = ?,
             esforco = ?,
             prazo = ?,
             status_prazo = ?,
             origem = ?,
             origem_typ = ?,
             origem_id = ?,
             responsavel_id = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      acaoSemTags.empresa_id,
      acaoSemTags.acao,
      acaoSemTags.objetivo ?? null,
      status,
      prioridade,
      esforco,
      acaoSemTags.prazo ?? null,
      statusPrazo,
      acaoSemTags.origem ?? null,
      acaoSemTags.origem_typ ?? null,
      acaoSemTags.origem_id ?? null,
      acaoSemTags.responsavel_id ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  await salvarTags(tenantId, TAG_ENTITY_MATRIZ_ACAO, id, tags);
  return obterMatrizAcaoPorIdService(id, tenantId);
}

export async function deletarMatrizAcaoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  await deletarTags(tenantId, TAG_ENTITY_MATRIZ_ACAO, id);
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM matriz_acoes WHERE tenant_id = ? AND id = ?',
    [id]
  );

  return (result as any).affectedRows > 0;
}
