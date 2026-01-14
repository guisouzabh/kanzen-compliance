import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { SubArea2 } from '../types/SubArea2';

async function validarSubArea(tenantId: number, subareaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM subareas WHERE tenant_id = ? AND id = ?',
    [subareaId]
  );

  if (!rows.length) {
    throw new AppError('Subárea inválida para este tenant', 400);
  }
}

export async function listarSubArea2Service(tenantId: number): Promise<SubArea2[]> {
  return tenantQuery<SubArea2>(
    tenantId,
    `
      SELECT s2.*,
             sa.nome AS subarea_nome,
             a.id AS area_id,
             a.nome AS area_nome,
             u.id AS unidade_id,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM subarea2 s2
        JOIN subareas sa ON sa.id = s2.subarea_id AND sa.tenant_id = s2.tenant_id
        JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE s2.tenant_id = ?
       ORDER BY s2.id DESC
    `
  );
}

export async function criarSubArea2Service(
  dados: SubArea2,
  tenantId: number
): Promise<SubArea2> {
  await validarSubArea(tenantId, dados.subarea_id);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO subarea2 (tenant_id, subarea_id, nome, descricao)
      VALUES (?, ?, ?, ?)
    `,
    [dados.subarea_id, dados.nome, dados.descricao ?? null]
  );

  const id = (result as any).insertId;
  const criada = await obterSubArea2PorIdService(id, tenantId);
  return (
    criada ?? {
      id,
      subarea_id: dados.subarea_id,
      nome: dados.nome,
      descricao: dados.descricao ?? null
    }
  );
}

export async function obterSubArea2PorIdService(
  id: number,
  tenantId: number
): Promise<SubArea2 | null> {
  const rows = await tenantQuery<SubArea2>(
    tenantId,
    `
      SELECT s2.*,
             sa.nome AS subarea_nome,
             a.id AS area_id,
             a.nome AS area_nome,
             u.id AS unidade_id,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM subarea2 s2
        JOIN subareas sa ON sa.id = s2.subarea_id AND sa.tenant_id = s2.tenant_id
        JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE s2.tenant_id = ? AND s2.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarSubArea2Service(
  id: number,
  dados: SubArea2,
  tenantId: number
): Promise<SubArea2 | null> {
  await validarSubArea(tenantId, dados.subarea_id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE subarea2
         SET subarea_id = ?, nome = ?, descricao = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [dados.subarea_id, dados.nome, dados.descricao ?? null, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterSubArea2PorIdService(id, tenantId);
}

export async function deletarSubArea2Service(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM subarea2 WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
