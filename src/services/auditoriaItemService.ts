import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { AuditoriaItem } from '../types/AuditoriaItem';
import { validarPlanoDoTenant } from './planoService';

async function validarResponsavel(tenantId: number, responsavelId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [responsavelId]
  );
  if (!rows.length) throw new AppError('Responsável inválido para este tenant', 400);
}

export async function listarAuditoriaItensService(
  tenantId: number,
  planoId: number
): Promise<AuditoriaItem[]> {
  return tenantQuery<AuditoriaItem>(
    tenantId,
    `
      SELECT ai.*, u.nome AS responsavel_nome
        FROM auditoria_itens ai
        LEFT JOIN usuarios u ON u.id = ai.responsavel_id AND u.tenant_id = ai.tenant_id
       WHERE ai.tenant_id = ? AND ai.plano_id = ?
       ORDER BY ai.id ASC
    `,
    [planoId]
  );
}

export async function obterAuditoriaItemPorIdService(
  id: number,
  tenantId: number,
  planoId: number
): Promise<AuditoriaItem | null> {
  const rows = await tenantQuery<AuditoriaItem>(
    tenantId,
    `
      SELECT ai.*, u.nome AS responsavel_nome
        FROM auditoria_itens ai
        LEFT JOIN usuarios u ON u.id = ai.responsavel_id AND u.tenant_id = ai.tenant_id
       WHERE ai.tenant_id = ? AND ai.plano_id = ? AND ai.id = ?
    `,
    [planoId, id]
  );
  return rows[0] ?? null;
}

export async function criarAuditoriaItemService(
  dados: AuditoriaItem,
  tenantId: number,
  planoId: number
): Promise<AuditoriaItem> {
  await validarPlanoDoTenant(tenantId, planoId, 'AUDITORIA');
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO auditoria_itens
        (tenant_id, plano_id, empresa_id, descricao, tipo, status, resultado, responsavel_id, prazo, requisito_id, processo_id, observacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      planoId,
      dados.empresa_id,
      dados.descricao,
      dados.tipo ?? 'INTERNA',
      dados.status ?? 'PENDENTE',
      dados.resultado ?? null,
      dados.responsavel_id ?? null,
      dados.prazo ?? null,
      dados.requisito_id ?? null,
      dados.processo_id ?? null,
      dados.observacao ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterAuditoriaItemPorIdService(id, tenantId, planoId);
  return criado!;
}

export async function atualizarAuditoriaItemService(
  id: number,
  dados: AuditoriaItem,
  tenantId: number,
  planoId: number
): Promise<AuditoriaItem | null> {
  await validarPlanoDoTenant(tenantId, planoId, 'AUDITORIA');
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE auditoria_itens
         SET tenant_id      = ?,
             empresa_id     = ?,
             descricao      = ?,
             tipo           = ?,
             status         = ?,
             resultado      = ?,
             responsavel_id = ?,
             prazo          = ?,
             requisito_id   = ?,
             processo_id    = ?,
             observacao     = ?
       WHERE tenant_id = ? AND plano_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.descricao,
      dados.tipo ?? 'INTERNA',
      dados.status ?? 'PENDENTE',
      dados.resultado ?? null,
      dados.responsavel_id ?? null,
      dados.prazo ?? null,
      dados.requisito_id ?? null,
      dados.processo_id ?? null,
      dados.observacao ?? null,
      tenantId,
      planoId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterAuditoriaItemPorIdService(id, tenantId, planoId);
}

export async function deletarAuditoriaItemService(
  id: number,
  tenantId: number,
  planoId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM auditoria_itens WHERE tenant_id = ? AND plano_id = ? AND id = ?',
    [planoId, id]
  );
  return (result as any).affectedRows > 0;
}
