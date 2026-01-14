import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { Area } from '../types/Area';

async function validarUnidade(tenantId: number, unidadeId: number) {
  const rows = await tenantQuery<{ id: number; empresa_id: number }>(
    tenantId,
    'SELECT id, empresa_id FROM unidades WHERE tenant_id = ? AND id = ?',
    [unidadeId]
  );

  if (!rows.length) {
    throw new AppError('Unidade inválida para este tenant', 400);
  }

  return rows[0];
}

export async function listarAreasService(tenantId: number): Promise<Area[]> {
  const rows = await tenantQuery<
    Area & { unidade_nome: string; empresa_id: number; empresa_nome: string }
  >(
    tenantId,
    `
      SELECT a.*,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM areas a
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE a.tenant_id = ?
       ORDER BY a.id DESC
    `
  );

  return rows;
}

export async function criarAreaService(dados: Area, tenantId: number): Promise<Area> {
  const unidade = await validarUnidade(tenantId, dados.unidade_id);

  const sql = `
    INSERT INTO areas (tenant_id, empresa_id, unidade_id, nome, descricao, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    unidade.empresa_id,
    dados.unidade_id,
    dados.nome,
    dados.descricao ?? null,
    dados.latitude ?? null,
    dados.longitude ?? null
  ]);

  const id = (result as any).insertId;
  const criada = await obterAreaPorIdService(id, tenantId);
  return (
    criada ?? {
      id,
      unidade_id: dados.unidade_id,
      nome: dados.nome,
      descricao: dados.descricao ?? null,
      latitude: dados.latitude ?? null,
      longitude: dados.longitude ?? null
    }
  );
}

export async function obterAreaPorIdService(
  id: number,
  tenantId: number
): Promise<Area | null> {
  const rows = await tenantQuery<
    Area & { unidade_nome: string; empresa_id: number; empresa_nome: string }
  >(
    tenantId,
    `
      SELECT a.*,
             u.nome AS unidade_nome,
             e.id AS empresa_id,
             e.nome AS empresa_nome
        FROM areas a
        JOIN unidades u ON u.id = a.unidade_id AND u.tenant_id = a.tenant_id
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE a.tenant_id = ? AND a.id = ?
    `,
    [id]
  );

  if (!rows.length) return null;
  return rows[0];
}

export async function atualizarAreaService(
  id: number,
  dados: Area,
  tenantId: number
): Promise<Area | null> {
  const unidade = await validarUnidade(tenantId, dados.unidade_id);

  const sql = `
    UPDATE areas
       SET empresa_id = ?, unidade_id = ?, nome = ?, descricao = ?, latitude = ?, longitude = ?
     WHERE tenant_id = ? AND id = ?
  `;

  const result = await tenantExecute(tenantId, sql, [
    unidade.empresa_id,
    dados.unidade_id,
    dados.nome,
    dados.descricao ?? null,
    dados.latitude ?? null,
    dados.longitude ?? null,
    tenantId,
    id
  ]);

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterAreaPorIdService(id, tenantId);
}

export async function deletarAreaService(id: number, tenantId: number): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM areas WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
