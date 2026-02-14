import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { EmpresaDadosStatus } from '../types/EmpresaDadosStatus';
import { AppError } from '../errors/AppError';

async function validarEmpresa(tenantId: number, empresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );
  if (!rows.length) throw new AppError('Empresa inválida para este tenant', 400);
}

async function validarStatusLgpd(tenantId: number, statusId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM status_lgpd WHERE id = ?',
    [statusId]
  );
  if (!rows.length) throw new AppError('Status LGPD inválido', 400);
}

export async function listarEmpresaDadosStatusService(
  tenantId: number,
  empresaId?: number
): Promise<EmpresaDadosStatus[]> {
  const conditions: string[] = ['eds.tenant_id = ?'];
  const params: Array<number> = [];
  if (empresaId) {
    conditions.push('eds.empresa_id = ?');
    params.push(empresaId);
  }

  return tenantQuery<EmpresaDadosStatus>(
    tenantId,
    `
      SELECT eds.*, e.nome AS empresa_nome, s.nome AS status_lgpd_nome
        FROM empresa_dados_status eds
        JOIN empresas e ON e.id = eds.empresa_id AND e.tenant_id = eds.tenant_id
        JOIN status_lgpd s ON s.id = eds.status_lgpd_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY eds.updated_at DESC
    `,
    params
  );
}

export async function obterEmpresaDadosStatusPorIdService(
  id: number,
  tenantId: number
): Promise<EmpresaDadosStatus | null> {
  const rows = await tenantQuery<EmpresaDadosStatus>(
    tenantId,
    `
      SELECT eds.*, e.nome AS empresa_nome, s.nome AS status_lgpd_nome
        FROM empresa_dados_status eds
        JOIN empresas e ON e.id = eds.empresa_id AND e.tenant_id = eds.tenant_id
        JOIN status_lgpd s ON s.id = eds.status_lgpd_id
       WHERE eds.tenant_id = ? AND eds.id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarEmpresaDadosStatusService(
  dados: EmpresaDadosStatus,
  tenantId: number,
  usuarioId?: number
): Promise<EmpresaDadosStatus> {
  await validarEmpresa(tenantId, dados.empresa_id);
  await validarStatusLgpd(tenantId, dados.status_lgpd_id);

  const versao = dados.versao ?? 1;

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO empresa_dados_status (
        tenant_id,
        empresa_id,
        status_lgpd_id,
        percentual,
        descricao_sistema,
        comentarios,
        versao,
        criado_por_usuario_id,
        atualizado_por_usuario_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      dados.status_lgpd_id,
      dados.percentual,
      dados.descricao_sistema ?? null,
      dados.comentarios ?? null,
      versao,
      usuarioId ?? null,
      usuarioId ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterEmpresaDadosStatusPorIdService(id, tenantId);
  return (
    criado ?? {
      ...dados,
      id,
      versao,
      criado_por_usuario_id: usuarioId ?? null,
      atualizado_por_usuario_id: usuarioId ?? null
    }
  );
}

export async function atualizarEmpresaDadosStatusService(
  id: number,
  dados: EmpresaDadosStatus,
  tenantId: number,
  usuarioId?: number
): Promise<EmpresaDadosStatus | null> {
  await validarEmpresa(tenantId, dados.empresa_id);
  await validarStatusLgpd(tenantId, dados.status_lgpd_id);

  const versao = dados.versao ?? 1;

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE empresa_dados_status
         SET tenant_id = ?,
             empresa_id = ?,
             status_lgpd_id = ?,
             percentual = ?,
             descricao_sistema = ?,
             comentarios = ?,
             versao = ?,
             atualizado_por_usuario_id = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.status_lgpd_id,
      dados.percentual,
      dados.descricao_sistema ?? null,
      dados.comentarios ?? null,
      versao,
      usuarioId ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterEmpresaDadosStatusPorIdService(id, tenantId);
}

export async function deletarEmpresaDadosStatusService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM empresa_dados_status WHERE tenant_id = ? AND id = ?',
    [id]
  );
  const { affectedRows } = result as any;
  return !!affectedRows;
}
