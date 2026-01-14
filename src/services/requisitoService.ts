import { logChange } from './auditService';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import {
  Requisito,
  RequisitoCheckin,
  RequisitoComCheckins
} from '../types/Requisito';
import { pool } from '../config/db';

async function validarArea(tenantId: number, areaId: number) {
  const areas = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM areas WHERE tenant_id = ? AND id = ?',
    [areaId]
  );
  if (!areas.length) {
    throw new AppError('Área responsável inválida para este tenant', 400);
  }
}

async function validarUsuario(tenantId: number, usuarioId: number) {
  const usuarios = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );
  if (!usuarios.length) {
    throw new AppError('Usuário responsável inválido para este tenant', 400);
  }
}

async function validarClassificacao(tenantId: number, classificacaoId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM classificacoes WHERE tenant_id = ? AND id = ?',
    [classificacaoId]
  );

  if (!rows.length) {
    throw new AppError('Classificação inválida para este tenant', 400);
  }
}

async function validarClassificacao(tenantId: number, classificacaoId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM classificacoes WHERE tenant_id = ? AND id = ?',
    [classificacaoId]
  );

  if (!rows.length) {
    throw new AppError('Classificação inválida para este tenant', 400);
  }
}

async function validarRequisitoBase(requisitoBaseId: number) {
  const [rows] = await pool.query('SELECT id FROM requisito_base WHERE id = ?', [requisitoBaseId]);
  if (!(rows as any[]).length) {
    throw new AppError('Requisito base inválido', 400);
  }
}

async function salvarTags(tenantId: number, requisitoId: number, tags?: string[]) {
  await tenantExecute(
    tenantId,
    'DELETE FROM requisito_tags WHERE tenant_id = ? AND requisito_id = ?',
    [requisitoId]
  );

  if (!tags || !tags.length) return;

  const insertSql =
    'INSERT INTO requisito_tags (tenant_id, requisito_id, tag) VALUES (?, ?, ?)';

  for (const tag of tags) {
    await tenantExecute(tenantId, insertSql, [requisitoId, tag]);
  }
}

async function buscarTagsMap(
  tenantId: number,
  requisitoIds: number[]
): Promise<Record<number, string[]>> {
  if (!requisitoIds.length) return {};

  const rows = await tenantQuery<{ requisito_id: number; tag: string }>(
    tenantId,
    `SELECT requisito_id, tag
       FROM requisito_tags
      WHERE tenant_id = ? AND requisito_id IN (?)
      ORDER BY id`,
    [requisitoIds]
  );

  return rows.reduce<Record<number, string[]>>((acc, row) => {
    acc[row.requisito_id] = acc[row.requisito_id] || [];
    acc[row.requisito_id].push(row.tag);
    return acc;
  }, {});
}

async function salvarOutrasAreas(
  tenantId: number,
  requisitoId: number,
  outrasAreas?: number[]
) {
  await tenantExecute(
    tenantId,
    'DELETE FROM requisito_outras_areas WHERE tenant_id = ? AND requisito_id = ?',
    [requisitoId]
  );

  if (!outrasAreas || !outrasAreas.length) return;

  const sql =
    'INSERT INTO requisito_outras_areas (tenant_id, requisito_id, area_id) VALUES (?, ?, ?)';
  for (const areaId of outrasAreas) {
    await tenantExecute(tenantId, sql, [requisitoId, areaId]);
  }
}

async function buscarOutrasAreasMap(
  tenantId: number,
  requisitoIds: number[]
): Promise<Record<number, { ids: number[]; nomes: string[] }>> {
  if (!requisitoIds.length) return {};

  const rows = await tenantQuery<{ requisito_id: number; area_id: number; area_nome: string }>(
    tenantId,
    `SELECT ro.requisito_id, ro.area_id, a.nome AS area_nome
       FROM requisito_outras_areas ro
       JOIN areas a ON a.id = ro.area_id AND a.tenant_id = ro.tenant_id
      WHERE ro.tenant_id = ? AND ro.requisito_id IN (?)
      ORDER BY ro.id`,
    [requisitoIds]
  );

  return rows.reduce<Record<number, { ids: number[]; nomes: string[] }>>((acc, row) => {
    acc[row.requisito_id] = acc[row.requisito_id] || { ids: [], nomes: [] };
    acc[row.requisito_id].ids.push(row.area_id);
    acc[row.requisito_id].nomes.push(row.area_nome);
    return acc;
  }, {});
}

// Lista requisitos do tenant
export async function listarRequisitosService(tenantId: number): Promise<Requisito[]> {
  const requisitos = await tenantQuery<Requisito & {
    area_responsavel_nome: string;
    usuario_responsavel_nome: string | null;
    classificacao_nome: string | null;
  }>(
    tenantId,
    `
      SELECT r.*, a.nome AS area_responsavel_nome, u.nome AS usuario_responsavel_nome, c.nome AS classificacao_nome
        FROM requisitos r
        JOIN areas a ON a.id = r.area_responsavel_id AND a.tenant_id = r.tenant_id
        LEFT JOIN usuarios u ON u.id = r.usuario_responsavel_id AND u.tenant_id = r.tenant_id
        LEFT JOIN classificacoes c ON c.id = r.classificacao_id AND c.tenant_id = r.tenant_id
       WHERE r.tenant_id = ?
       ORDER BY r.id DESC
    `
  );

  const ids = requisitos.map((r) => r.id!).filter(Boolean);
  const [tagsMap, outrasAreasMap] = await Promise.all([
    buscarTagsMap(tenantId, ids),
    buscarOutrasAreasMap(tenantId, ids)
  ]);

  return requisitos.map((r) => ({
    ...r,
    tags: tagsMap[r.id!] || [],
    outras_areas_ids: outrasAreasMap[r.id!]?.ids || [],
    outras_areas_nomes: outrasAreasMap[r.id!]?.nomes || []
  }));
}

// Cria requisito
export async function criarRequisitoService(
  dados: Requisito,
  tenantId: number
): Promise<Requisito> {
  const { tags, outras_areas_ids, ...requisitoSemTags } = dados;

  await validarArea(tenantId, requisitoSemTags.area_responsavel_id);
  await validarClassificacao(tenantId, requisitoSemTags.classificacao_id);
  if (requisitoSemTags.usuario_responsavel_id) {
    await validarUsuario(tenantId, requisitoSemTags.usuario_responsavel_id);
  }
  await validarRequisitoBase(requisitoSemTags.requisito_base_id);
  if (outras_areas_ids && outras_areas_ids.length) {
    for (const areaId of outras_areas_ids) {
      await validarArea(tenantId, areaId);
    }
  }

  const sql = `
    INSERT INTO requisitos
      (tenant_id, requisito_base_id, titulo, descricao, tipo, status, origem, modo, criticidade, prioridade, classificacao_id, area_responsavel_id, usuario_responsavel_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    requisitoSemTags.requisito_base_id,
    requisitoSemTags.titulo,
    requisitoSemTags.descricao,
    requisitoSemTags.tipo,
    requisitoSemTags.status,
    requisitoSemTags.origem,
    requisitoSemTags.modo ?? 'RASCUNHO',
    requisitoSemTags.criticidade ?? 3,
    requisitoSemTags.prioridade ?? 3,
    requisitoSemTags.classificacao_id,
    requisitoSemTags.area_responsavel_id,
    requisitoSemTags.usuario_responsavel_id ?? null
  ]);

  const id = (result as any).insertId;
  await salvarTags(tenantId, id, tags);
  await salvarOutrasAreas(tenantId, id, outras_areas_ids);
  await logChange('Requisito', 'CREATE', { tenantId, id, ...requisitoSemTags, tags, outras_areas_ids });

  const criado = await obterRequisitoPorIdService(id, tenantId);
  return (
    criado ?? {
      id,
      ...requisitoSemTags,
      tags: tags || [],
      outras_areas_ids: outras_areas_ids || [],
      outras_areas_nomes: []
    }
  );
}

// Busca requisito por ID
export async function obterRequisitoPorIdService(
  id: number,
  tenantId: number
): Promise<Requisito | null> {
  const requisitos = await tenantQuery<Requisito & {
    area_responsavel_nome: string;
    usuario_responsavel_nome: string | null;
    classificacao_nome: string | null;
  }>(
    tenantId,
    `
      SELECT r.*, a.nome AS area_responsavel_nome, u.nome AS usuario_responsavel_nome, c.nome AS classificacao_nome
        FROM requisitos r
        JOIN areas a ON a.id = r.area_responsavel_id AND a.tenant_id = r.tenant_id
        LEFT JOIN usuarios u ON u.id = r.usuario_responsavel_id AND u.tenant_id = r.tenant_id
        LEFT JOIN classificacoes c ON c.id = r.classificacao_id AND c.tenant_id = r.tenant_id
       WHERE r.tenant_id = ? AND r.id = ?
    `,
    [id]
  );

  if (!requisitos.length) {
    return null;
  }

  const tagsMap = await buscarTagsMap(tenantId, [id]);
  const outrasAreasMap = await buscarOutrasAreasMap(tenantId, [id]);
  await logChange('Requisito', 'INFO', { tenantId, id });
  return {
    ...requisitos[0],
    tags: tagsMap[id] || [],
    outras_areas_ids: outrasAreasMap[id]?.ids || [],
    outras_areas_nomes: outrasAreasMap[id]?.nomes || []
  };
}

// Busca requisito e check-ins
export async function obterRequisitoComCheckinsService(
  id: number,
  tenantId: number
): Promise<RequisitoComCheckins | null> {
  const requisito = await obterRequisitoPorIdService(id, tenantId);
  if (!requisito) return null;

  const checkins = await listarCheckinsService(id, tenantId);
  return { ...requisito, checkins };
}

// Atualiza requisito
export async function atualizarRequisitoService(
  id: number,
  dados: Requisito,
  tenantId: number
): Promise<Requisito | null> {
  const { tags, outras_areas_ids, ...requisitoSemTags } = dados;

  await validarArea(tenantId, requisitoSemTags.area_responsavel_id);
  await validarClassificacao(tenantId, requisitoSemTags.classificacao_id);
  if (requisitoSemTags.usuario_responsavel_id) {
    await validarUsuario(tenantId, requisitoSemTags.usuario_responsavel_id);
  }
  await validarRequisitoBase(requisitoSemTags.requisito_base_id);
  if (outras_areas_ids && outras_areas_ids.length) {
    for (const areaId of outras_areas_ids) {
      await validarArea(tenantId, areaId);
    }
  }

  // tenant_id vem primeiro para alinhar com tenantExecute (que injeta tenantId como 1º parâmetro)
  const sql = `
    UPDATE requisitos
       SET tenant_id = ?, requisito_base_id = ?, titulo = ?, descricao = ?, tipo = ?, status = ?, origem = ?, modo = ?, criticidade = ?, prioridade = ?, classificacao_id = ?, area_responsavel_id = ?, usuario_responsavel_id = ?
     WHERE tenant_id = ? AND id = ?
  `;

  const result = await tenantExecute(tenantId, sql, [
    requisitoSemTags.requisito_base_id,
    requisitoSemTags.titulo,
    requisitoSemTags.descricao,
    requisitoSemTags.tipo,
    requisitoSemTags.status,
    requisitoSemTags.origem,
    requisitoSemTags.modo ?? 'RASCUNHO',
    requisitoSemTags.criticidade ?? 3,
    requisitoSemTags.prioridade ?? 3,
    requisitoSemTags.classificacao_id,
    requisitoSemTags.area_responsavel_id,
    requisitoSemTags.usuario_responsavel_id ?? null,
    tenantId,
    id
  ]);

  const { affectedRows } = result as any;
  if (!affectedRows) {
    return null;
  }

  await salvarTags(tenantId, id, tags);
  await salvarOutrasAreas(tenantId, id, outras_areas_ids);
  await logChange('Requisito', 'UPDATE', { tenantId, id, ...requisitoSemTags, tags, outras_areas_ids });

  return obterRequisitoPorIdService(id, tenantId);
}

// Deleta requisito e check-ins associados
export async function deletarRequisitoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  await tenantExecute(
    tenantId,
    'DELETE FROM requisito_checkins WHERE tenant_id = ? AND requisito_id = ?',
    [id]
  );
  await tenantExecute(
    tenantId,
    'DELETE FROM requisito_tags WHERE tenant_id = ? AND requisito_id = ?',
    [id]
  );
  await tenantExecute(
    tenantId,
    'DELETE FROM requisito_outras_areas WHERE tenant_id = ? AND requisito_id = ?',
    [id]
  );

  const result = await tenantExecute(
    tenantId,
    'DELETE FROM requisitos WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  await logChange('Requisito', 'DELETE', { tenantId, id, removedCheckins: true });

  return !!affectedRows;
}

// Lista check-ins de um requisito
export async function listarCheckinsService(
  requisitoId: number,
  tenantId: number
): Promise<RequisitoCheckin[]> {
  return tenantQuery<RequisitoCheckin>(
    tenantId,
    `
      SELECT * FROM requisito_checkins
       WHERE tenant_id = ? AND requisito_id = ?
       ORDER BY data DESC
    `,
    [requisitoId]
  );
}

// Cria check-in para um requisito
export async function criarCheckinService(
  requisitoId: number,
  dados: Omit<RequisitoCheckin, 'id' | 'requisito_id'>,
  tenantId: number
): Promise<RequisitoCheckin | null> {
  const requisitoExiste = await obterRequisitoPorIdService(requisitoId, tenantId);
  if (!requisitoExiste) {
    return null;
  }

  const sql = `
    INSERT INTO requisito_checkins
      (tenant_id, requisito_id, descricao, data, responsavel, anexo, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    requisitoId,
    dados.descricao,
    dados.data,
    dados.responsavel,
    dados.anexo ?? null,
    dados.status
  ]);

  const id = (result as any).insertId;
  await tenantExecute(
    tenantId,
    'UPDATE requisitos SET tenant_id = ?, status = ? WHERE tenant_id = ? AND id = ?',
    [dados.status, tenantId, requisitoId]
  );

  await logChange('RequisitoCheckin', 'CREATE', { tenantId, requisitoId, id, ...dados });

  return {
    id,
    requisito_id: requisitoId,
    ...dados
  };
}
