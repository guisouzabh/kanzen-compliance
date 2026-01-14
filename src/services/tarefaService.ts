import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { RequisitoTarefa } from '../types/Tarefa';

async function validarRequisito(tenantId: number, requisitoId: number) {
  const existe = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM requisitos WHERE tenant_id = ? AND id = ?',
    [requisitoId]
  );
  if (!existe.length) {
    throw new AppError('Requisito não encontrado', 404);
  }
}

async function validarUsuario(tenantId: number, usuarioId: number) {
  const existe = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );
  if (!existe.length) {
    throw new AppError('Usuário inválido para este tenant', 400);
  }
}

export async function listarTarefasService(
  requisitoId: number,
  tenantId: number
): Promise<RequisitoTarefa[]> {
  await validarRequisito(tenantId, requisitoId);
  return tenantQuery<RequisitoTarefa>(
    tenantId,
    `
      SELECT t.*, u.nome AS responsavel_nome
        FROM requisito_tarefas t
        LEFT JOIN usuarios u ON u.id = t.responsavel_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.requisito_id = ?
       ORDER BY t.id DESC
    `,
    [requisitoId]
  );
}

export async function criarTarefaService(
  requisitoId: number,
  dados: Omit<RequisitoTarefa, 'id' | 'requisito_id' | 'created_at' | 'responsavel_nome'>,
  tenantId: number
): Promise<RequisitoTarefa> {
  await validarRequisito(tenantId, requisitoId);
  if (dados.responsavel_id) {
    await validarUsuario(tenantId, dados.responsavel_id);
  }

  const sql = `
    INSERT INTO requisito_tarefas (tenant_id, requisito_id, titulo, responsavel_id, status)
    VALUES (?, ?, ?, ?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [
    requisitoId,
    dados.titulo,
    dados.responsavel_id ?? null,
    dados.status || 'ABERTO'
  ]);

  const id = (result as any).insertId;
  const [tarefa] = await listarTarefasService(requisitoId, tenantId);
  return tarefa || { id, requisito_id: requisitoId, ...dados, status: dados.status || 'ABERTO' };
}

export async function atualizarStatusTarefaService(
  requisitoId: number,
  tarefaId: number,
  status: 'ABERTO' | 'FECHADO',
  tenantId: number
): Promise<RequisitoTarefa | null> {
  await validarRequisito(tenantId, requisitoId);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE requisito_tarefas
         SET status = ?
       WHERE tenant_id = ? AND requisito_id = ? AND id = ?
    `,
    [status, requisitoId, tarefaId]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  const tarefas = await tenantQuery<RequisitoTarefa & { responsavel_nome: string | null }>(
    tenantId,
    `
      SELECT t.*, u.nome AS responsavel_nome
        FROM requisito_tarefas t
        LEFT JOIN usuarios u ON u.id = t.responsavel_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.requisito_id = ? AND t.id = ?
    `,
    [requisitoId, tarefaId]
  );

  return tarefas[0] || null;
}
