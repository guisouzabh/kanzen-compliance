import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { Processo } from '../types/Processo';
import { AppError } from '../errors/AppError';

async function validarDuplicidade(
  tenantId: number,
  nome: string,
  parentId: number | null | undefined,
  id?: number
) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM processos
       WHERE tenant_id = ?
         AND nome = ?
         AND ${parentId ? 'parent_id = ?' : 'parent_id IS NULL'}
         ${id ? 'AND id <> ?' : ''}
    `,
    [
      nome,
      ...(parentId ? [parentId] : []),
      ...(id ? [id] : [])
    ]
  );
  if (rows.length) {
    throw new AppError('Já existe um processo com esse nome neste nível', 400);
  }
}

export async function listarProcessosService(tenantId: number): Promise<Processo[]> {
  return tenantQuery<Processo>(
    tenantId,
    `
      SELECT *
        FROM processos
       WHERE tenant_id = ?
       ORDER BY parent_id ASC, nome ASC
    `
  );
}

export async function criarProcessoService(dados: Processo, tenantId: number): Promise<Processo> {
  await validarDuplicidade(tenantId, dados.nome, dados.parent_id ?? null);
  const result = await tenantExecute(
    tenantId,
    'INSERT INTO processos (tenant_id, nome, descricao, parent_id) VALUES (?, ?, ?, ?)',
    [dados.nome, dados.descricao ?? null, dados.parent_id ?? null]
  );
  const id = (result as any).insertId;
  return { ...dados, id };
}

export async function atualizarProcessoService(
  id: number,
  dados: Processo,
  tenantId: number
): Promise<Processo | null> {
  await validarDuplicidade(tenantId, dados.nome, dados.parent_id ?? null, id);
  const result = await tenantExecute(
    tenantId,
    'UPDATE processos SET tenant_id = ?, nome = ?, descricao = ?, parent_id = ? WHERE tenant_id = ? AND id = ?',
    [dados.nome, dados.descricao ?? null, dados.parent_id ?? null, tenantId, id]
  );
  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return { ...dados, id };
}

export async function deletarProcessoService(id: number, tenantId: number): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM processos WHERE tenant_id = ? AND id = ?',
    [id]
  );
  const { affectedRows } = result as any;
  return !!affectedRows;
}
