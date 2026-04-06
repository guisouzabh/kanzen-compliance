import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { Plano } from '../types/Plano';

interface PlanoFilters {
  empresaId?: number;
  tipo?: string;
  status?: string;
  responsavelId?: number;
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

export async function listarPlanosService(
  tenantId: number,
  filters: PlanoFilters = {}
): Promise<Plano[]> {
  const conditions: string[] = ['p.tenant_id = ?'];
  const params: Array<string | number> = [tenantId];

  if (filters.empresaId) {
    conditions.push('p.empresa_id = ?');
    params.push(filters.empresaId);
  }
  if (filters.tipo) {
    conditions.push('p.tipo = ?');
    params.push(filters.tipo);
  }
  if (filters.status) {
    conditions.push('p.status = ?');
    params.push(filters.status);
  }
  if (filters.responsavelId) {
    conditions.push('p.responsavel_id = ?');
    params.push(filters.responsavelId);
  }
  if (filters.q) {
    conditions.push('(p.nome LIKE ? OR p.descricao LIKE ?)');
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }

  const sql = `
    SELECT p.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
      FROM planos p
      JOIN empresas e ON e.id = p.empresa_id AND e.tenant_id = p.tenant_id
      LEFT JOIN usuarios u ON u.id = p.responsavel_id AND u.tenant_id = p.tenant_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY p.id DESC
  `;

  return tenantQuery<Plano>(tenantId, sql, params.slice(1));
}

export async function obterPlanoPorIdService(
  id: number,
  tenantId: number
): Promise<Plano | null> {
  const rows = await tenantQuery<Plano>(
    tenantId,
    `
      SELECT p.*, e.nome AS empresa_nome, u.nome AS responsavel_nome
        FROM planos p
        JOIN empresas e ON e.id = p.empresa_id AND e.tenant_id = p.tenant_id
        LEFT JOIN usuarios u ON u.id = p.responsavel_id AND u.tenant_id = p.tenant_id
       WHERE p.tenant_id = ? AND p.id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarPlanoService(
  dados: Plano,
  tenantId: number
): Promise<Plano> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const status = dados.status ?? 'RASCUNHO';

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO planos (tenant_id, empresa_id, tipo, nome, descricao, status, responsavel_id, data_inicio, data_fim)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      dados.tipo,
      dados.nome,
      dados.descricao ?? null,
      status,
      dados.responsavel_id ?? null,
      dados.data_inicio ?? null,
      dados.data_fim ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterPlanoPorIdService(id, tenantId);
  return criado!;
}

export async function atualizarPlanoService(
  id: number,
  dados: Plano,
  tenantId: number
): Promise<Plano | null> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const status = dados.status ?? 'RASCUNHO';

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE planos
         SET tenant_id      = ?,
             empresa_id     = ?,
             tipo           = ?,
             nome           = ?,
             descricao      = ?,
             status         = ?,
             responsavel_id = ?,
             data_inicio    = ?,
             data_fim       = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.tipo,
      dados.nome,
      dados.descricao ?? null,
      status,
      dados.responsavel_id ?? null,
      dados.data_inicio ?? null,
      dados.data_fim ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterPlanoPorIdService(id, tenantId);
}

export async function deletarPlanoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const planos = await tenantQuery<{ id: number; tipo: string }>(
    tenantId,
    'SELECT id, tipo FROM planos WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const plano = planos[0];
  if (!plano) return false;

  if (plano.tipo === 'ACOES') {
    const vinculadas = await tenantQuery<{ total: number }>(
      tenantId,
      'SELECT COUNT(*) AS total FROM matriz_acoes WHERE tenant_id = ? AND plano_id = ?',
      [id]
    );
    const totalAcoes = Number(vinculadas[0]?.total || 0);
    if (totalAcoes > 0) {
      throw new AppError(
        'Não é possível excluir o plano: existem ações vinculadas. Remova as ações primeiro.',
        409
      );
    }
  }

  const result = await tenantExecute(
    tenantId,
    'DELETE FROM planos WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return (result as any).affectedRows > 0;
}

export async function validarPlanoDoTenant(
  tenantId: number,
  planoId: number,
  tipo?: string
): Promise<void> {
  const sql = tipo
    ? 'SELECT id FROM planos WHERE tenant_id = ? AND id = ? AND tipo = ?'
    : 'SELECT id FROM planos WHERE tenant_id = ? AND id = ?';
  const params = tipo ? [planoId, tipo] : [planoId];
  const rows = await tenantQuery<{ id: number }>(tenantId, sql, params);
  if (!rows.length) throw new AppError('Plano não encontrado', 404);
}
