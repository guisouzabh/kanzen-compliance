import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { Processo } from '../types/Processo';
import { AppError } from '../errors/AppError';

async function validarDuplicidade(tenantId: number, nome: string, id?: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM processos
       WHERE tenant_id = ? AND nome = ?
         ${id ? 'AND id <> ?' : ''}
    `,
    id ? [nome, id] : [nome]
  );
  if (rows.length) {
    throw new AppError('Já existe um processo com esse nome', 400);
  }
}

export async function listarProcessosService(tenantId: number): Promise<Processo[]> {
  return tenantQuery<Processo>(
    tenantId,
    `
      SELECT *
        FROM processos
       WHERE tenant_id = ?
       ORDER BY nome ASC
    `
  );
}

export async function criarProcessoService(dados: Processo, tenantId: number): Promise<Processo> {
  await validarDuplicidade(tenantId, dados.nome);
  const result = await tenantExecute(
    tenantId,
    'INSERT INTO processos (tenant_id, nome, descricao) VALUES (?, ?, ?)',
    [dados.nome, dados.descricao ?? null]
  );
  const id = (result as any).insertId;
  return { ...dados, id };
}

export async function atualizarProcessoService(
  id: number,
  dados: Processo,
  tenantId: number
): Promise<Processo | null> {
  await validarDuplicidade(tenantId, dados.nome, id);
  const result = await tenantExecute(
    tenantId,
    'UPDATE processos SET tenant_id = ?, nome = ?, descricao = ? WHERE tenant_id = ? AND id = ?',
    [dados.nome, dados.descricao ?? null, tenantId, id]
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
