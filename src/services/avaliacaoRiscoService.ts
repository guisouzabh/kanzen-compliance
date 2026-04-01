import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { AvaliacaoRisco, NivelRisco } from '../types/AvaliacaoRisco';
import { AvaliacaoRiscoInput } from '../validation/avaliacaoRiscoSchema';

// Matriz 5×5: [probabilidade][impacto]
const MATRIZ_RISCO: NivelRisco[][] = [
  ['BAIXO',  'BAIXO',  'BAIXO',  'MEDIO',  'MEDIO'],   // Raro
  ['BAIXO',  'BAIXO',  'MEDIO',  'MEDIO',  'ALTO'],    // Improvável
  ['BAIXO',  'MEDIO',  'MEDIO',  'ALTO',   'CRITICO'], // Possível
  ['MEDIO',  'MEDIO',  'ALTO',   'CRITICO','CRITICO'], // Provável
  ['MEDIO',  'ALTO',   'CRITICO','CRITICO','CRITICO']  // Quase certo
];

function calcularNivelRisco(probabilidade: number, impacto: number): NivelRisco {
  return MATRIZ_RISCO[probabilidade][impacto];
}

async function validarInventario(tenantId: number, inventarioId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM inventario_dados WHERE tenant_id = ? AND id = ?',
    [tenantId, inventarioId]
  );
  if (!rows.length) throw new AppError('Item do inventário não encontrado', 404);
}

export async function listarAvaliacoesRiscoService(
  tenantId: number,
  empresaId?: number
): Promise<AvaliacaoRisco[]> {
  let sql = `
    SELECT ar.*, i.dado_tratado, i.categoria, i.dados_sensiveis,
           u.nome AS avaliado_por_nome
    FROM avaliacao_risco ar
    INNER JOIN inventario_dados i ON i.id = ar.inventario_id
    LEFT JOIN usuarios u ON u.id = ar.avaliado_por_usuario_id
    WHERE ar.tenant_id = ?
  `;
  const params: Array<string | number> = [tenantId];

  if (empresaId) {
    // inventario_dados não tem empresa_id diretamente, mas processo pode — filtramos via tenant
  }

  sql += ' ORDER BY ar.nivel_risco DESC, ar.updated_at DESC';
  return tenantQuery<AvaliacaoRisco>(tenantId, sql, params);
}

export async function obterAvaliacaoPorInventarioService(
  tenantId: number,
  inventarioId: number
): Promise<AvaliacaoRisco | null> {
  const rows = await tenantQuery<AvaliacaoRisco>(
    tenantId,
    `SELECT ar.*, u.nome AS avaliado_por_nome
     FROM avaliacao_risco ar
     LEFT JOIN usuarios u ON u.id = ar.avaliado_por_usuario_id
     WHERE ar.tenant_id = ? AND ar.inventario_id = ?
     LIMIT 1`,
    [tenantId, inventarioId]
  );
  return rows[0] ?? null;
}

export async function listarHistoricoService(
  tenantId: number,
  avaliacaoRiscoId: number
) {
  return tenantQuery(
    tenantId,
    `SELECT h.*, u.nome AS alterado_por_nome
     FROM historico_avaliacao_risco h
     LEFT JOIN usuarios u ON u.id = h.alterado_por_usuario_id
     WHERE h.tenant_id = ? AND h.avaliacao_risco_id = ?
     ORDER BY h.created_at DESC`,
    [tenantId, avaliacaoRiscoId]
  );
}

export async function salvarAvaliacaoRiscoService(
  dados: AvaliacaoRiscoInput,
  tenantId: number,
  usuarioId: number
): Promise<AvaliacaoRisco> {
  await validarInventario(tenantId, dados.inventario_id);

  const nivelRisco = calcularNivelRisco(dados.probabilidade, dados.impacto);

  const existente = await obterAvaliacaoPorInventarioService(tenantId, dados.inventario_id);

  if (existente) {
    // Salvar histórico antes de atualizar
    await tenantExecute(
      tenantId,
      `INSERT INTO historico_avaliacao_risco
         (tenant_id, avaliacao_risco_id, probabilidade_anterior, impacto_anterior,
          nivel_risco_anterior, justificativa_anterior, medidas_mitigatorias_anterior,
          responsavel_anterior, alterado_por_usuario_id, motivo_alteracao)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId,
        existente.id,
        existente.probabilidade,
        existente.impacto,
        existente.nivel_risco,
        existente.justificativa,
        existente.medidas_mitigatorias,
        existente.responsavel_risco,
        usuarioId,
        dados.motivo_alteracao ?? null
      ]
    );

    await tenantExecute(
      tenantId,
      `UPDATE avaliacao_risco
       SET probabilidade = ?, impacto = ?, nivel_risco = ?,
           justificativa = ?, medidas_mitigatorias = ?,
           responsavel_risco = ?, avaliado_por_usuario_id = ?,
           versao = versao + 1, updated_at = NOW()
       WHERE id = ? AND tenant_id = ?`,
      [
        dados.probabilidade,
        dados.impacto,
        nivelRisco,
        dados.justificativa,
        dados.medidas_mitigatorias,
        dados.responsavel_risco,
        usuarioId,
        existente.id,
        tenantId
      ]
    );

    const atualizado = await obterAvaliacaoPorInventarioService(tenantId, dados.inventario_id);
    return atualizado!;
  }

  // Inserção nova
  const result = await tenantExecute(
    tenantId,
    `INSERT INTO avaliacao_risco
       (tenant_id, inventario_id, probabilidade, impacto, nivel_risco,
        justificativa, medidas_mitigatorias, responsavel_risco, avaliado_por_usuario_id, versao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [
      tenantId,
      dados.inventario_id,
      dados.probabilidade,
      dados.impacto,
      nivelRisco,
      dados.justificativa,
      dados.medidas_mitigatorias,
      dados.responsavel_risco,
      usuarioId
    ]
  );

  const novoId = (result as any).insertId;
  const novo = await tenantQuery<AvaliacaoRisco>(
    tenantId,
    'SELECT * FROM avaliacao_risco WHERE id = ? AND tenant_id = ?',
    [novoId, tenantId]
  );
  return novo[0];
}
