import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { SubArea } from '../types/SubArea';

async function validarArea(tenantId: number, areaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM areas WHERE tenant_id = ? AND id = ? AND ativo = 1',
    [areaId]
  );

  if (!rows.length) {
    throw new AppError('Área inválida para este tenant', 400);
  }
}

export async function listarSubAreasService(tenantId: number): Promise<SubArea[]> {
  return tenantQuery<SubArea>(
    tenantId,
    `
      SELECT sa.*,
             a.nome AS area_nome,
             u.id AS unidade_id,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM subareas sa
        JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id AND a.ativo = 1
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id AND u.ativo = 1
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE sa.tenant_id = ?
         AND sa.ativo = 1
       ORDER BY sa.id DESC
    `
  );
}

export async function criarSubAreaService(
  dados: SubArea,
  tenantId: number
): Promise<SubArea> {
  await validarArea(tenantId, dados.area_id);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO subareas (tenant_id, area_id, nome, descricao)
      VALUES (?, ?, ?, ?)
    `,
    [dados.area_id, dados.nome, dados.descricao ?? null]
  );

  const id = (result as any).insertId;
  const criada = await obterSubAreaPorIdService(id, tenantId);
  return (
    criada ?? {
      id,
      area_id: dados.area_id,
      nome: dados.nome,
      descricao: dados.descricao ?? null
    }
  );
}

export async function obterSubAreaPorIdService(
  id: number,
  tenantId: number
): Promise<SubArea | null> {
  const rows = await tenantQuery<SubArea>(
    tenantId,
    `
      SELECT sa.*,
             a.nome AS area_nome,
             u.id AS unidade_id,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM subareas sa
        JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id AND a.ativo = 1
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id AND u.ativo = 1
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE sa.tenant_id = ?
         AND sa.id = ?
         AND sa.ativo = 1
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarSubAreaService(
  id: number,
  dados: SubArea,
  tenantId: number
): Promise<SubArea | null> {
  await validarArea(tenantId, dados.area_id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE subareas
         SET tenant_id = ?, area_id = ?, nome = ?, descricao = ?
       WHERE tenant_id = ? AND id = ? AND ativo = 1
    `,
    [dados.area_id, dados.nome, dados.descricao ?? null, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterSubAreaPorIdService(id, tenantId);
}

export async function deletarSubAreaService(
  id: number,
  tenantId: number
): Promise<boolean> {
  await tenantExecute(
    tenantId,
    `
      UPDATE subarea2
         SET ativo = 0
       WHERE tenant_id = ?
         AND subarea_id = ?
         AND ativo = 1
    `,
    [id]
  );

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE subareas
         SET ativo = 0
       WHERE tenant_id = ?
         AND id = ?
         AND ativo = 1
    `,
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
