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
       WHERE u.tenant_id = ? AND u.id = ?
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
         SET empresa_id = ?, nome = ?, descricao = ?
       WHERE tenant_id = ? AND id = ?
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
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM unidades WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
