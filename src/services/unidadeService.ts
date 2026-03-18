import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { Unidade } from '../types/Unidade';

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

export async function listarUnidadesService(tenantId: number): Promise<Unidade[]> {
  return tenantQuery<Unidade>(
    tenantId,
    `
      SELECT u.*, e.nome AS empresa_nome
        FROM unidades u
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE u.tenant_id = ?
         AND u.ativo = 1
       ORDER BY u.id DESC
    `
  );
}

export async function criarUnidadeService(
  dados: Unidade,
  tenantId: number
): Promise<Unidade> {
  await validarEmpresa(tenantId, dados.empresa_id);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO unidades (tenant_id, empresa_id, nome, descricao)
      VALUES (?, ?, ?, ?)
    `,
    [dados.empresa_id, dados.nome, dados.descricao ?? null]
  );

  const id = (result as any).insertId;
  const criada = await obterUnidadePorIdService(id, tenantId);
  return (
    criada ?? {
      id,
      empresa_id: dados.empresa_id,
      nome: dados.nome,
      descricao: dados.descricao ?? null
    }
  );
}

export async function obterUnidadePorIdService(
  id: number,
  tenantId: number
): Promise<Unidade | null> {
  const rows = await tenantQuery<Unidade>(
    tenantId,
    `
      SELECT u.*, e.nome AS empresa_nome
        FROM unidades u
        JOIN empresas e ON e.id = u.empresa_id AND e.tenant_id = u.tenant_id
       WHERE u.tenant_id = ?
         AND u.id = ?
         AND u.ativo = 1
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarUnidadeService(
  id: number,
  dados: Unidade,
  tenantId: number
): Promise<Unidade | null> {
  await validarEmpresa(tenantId, dados.empresa_id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE unidades
         SET tenant_id = ?, empresa_id = ?, nome = ?, descricao = ?
       WHERE tenant_id = ?
         AND id = ?
         AND ativo = 1
    `,
    [dados.empresa_id, dados.nome, dados.descricao ?? null, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterUnidadePorIdService(id, tenantId);
}

export async function deletarUnidadeService(
  id: number,
  tenantId: number
): Promise<boolean> {
  await tenantExecute(
    tenantId,
    `
      UPDATE subarea2 s2
      JOIN subareas sa ON sa.id = s2.subarea_id AND sa.tenant_id = s2.tenant_id
      JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id
         SET s2.ativo = 0
       WHERE s2.tenant_id = ?
         AND a.unidade_id = ?
         AND s2.ativo = 1
    `,
    [id]
  );

  await tenantExecute(
    tenantId,
    `
      UPDATE subareas sa
      JOIN areas a ON a.id = sa.area_id AND a.tenant_id = sa.tenant_id
         SET sa.ativo = 0
       WHERE sa.tenant_id = ?
         AND a.unidade_id = ?
         AND sa.ativo = 1
    `,
    [id]
  );

  await tenantExecute(
    tenantId,
    `
      UPDATE areas
         SET ativo = 0
       WHERE tenant_id = ?
         AND unidade_id = ?
         AND ativo = 1
    `,
    [id]
  );

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE unidades
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
