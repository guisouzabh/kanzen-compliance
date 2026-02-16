import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { MatrizAcao } from '../types/MatrizAcao';

interface MatrizAcaoFilters {
  empresaId?: number;
  origemTyp?: string;
  origemId?: number;
  status?: string;
  statusPrazo?: string;
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

  return tenantQuery<MatrizAcao>(tenantId, sql, params.slice(1));
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

  return rows[0] ?? null;
}

export async function criarMatrizAcaoService(
  dados: MatrizAcao,
  tenantId: number
): Promise<MatrizAcao> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const status = dados.status ?? 'PLANEJADA';
  const prioridade = dados.prioridade ?? 3;
  const esforco = dados.esforco ?? 3;
  const statusPrazo = dados.status_prazo ?? 'NO_PRAZO';

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
      dados.empresa_id,
      dados.acao,
      dados.objetivo ?? null,
      status,
      prioridade,
      esforco,
      dados.prazo ?? null,
      statusPrazo,
      dados.origem ?? null,
      dados.origem_typ ?? null,
      dados.origem_id ?? null,
      dados.responsavel_id ?? null
    ]
  );

  const id = (result as any).insertId;
  const criada = await obterMatrizAcaoPorIdService(id, tenantId);
  return (
    criada ?? {
      ...dados,
      id,
      status,
      prioridade,
      esforco,
      status_prazo: statusPrazo
    }
  );
}

export async function atualizarMatrizAcaoService(
  id: number,
  dados: MatrizAcao,
  tenantId: number
): Promise<MatrizAcao | null> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const status = dados.status ?? 'PLANEJADA';
  const prioridade = dados.prioridade ?? 3;
  const esforco = dados.esforco ?? 3;
  const statusPrazo = dados.status_prazo ?? 'NO_PRAZO';

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
      dados.empresa_id,
      dados.acao,
      dados.objetivo ?? null,
      status,
      prioridade,
      esforco,
      dados.prazo ?? null,
      statusPrazo,
      dados.origem ?? null,
      dados.origem_typ ?? null,
      dados.origem_id ?? null,
      dados.responsavel_id ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return obterMatrizAcaoPorIdService(id, tenantId);
}

export async function deletarMatrizAcaoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM matriz_acoes WHERE tenant_id = ? AND id = ?',
    [id]
  );

  return (result as any).affectedRows > 0;
}
