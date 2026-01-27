import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { CategoriaDadoPessoal } from '../types/CategoriaDadoPessoal';
import { AppError } from '../errors/AppError';

async function validarDuplicidade(tenantId: number, nome: string, id?: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM categorias_dados_pessoais
       WHERE tenant_id = ? AND nome = ?
         ${id ? 'AND id <> ?' : ''}
    `,
    id ? [nome, id] : [nome]
  );
  if (rows.length) {
    throw new AppError('Já existe uma categoria com esse nome', 400);
  }
}

export async function listarCategoriasDadoPessoalService(
  tenantId: number
): Promise<CategoriaDadoPessoal[]> {
  return tenantQuery<CategoriaDadoPessoal>(
    tenantId,
    `
      SELECT *
        FROM categorias_dados_pessoais
       WHERE tenant_id = ?
       ORDER BY nome ASC
    `
  );
}

export async function criarCategoriaDadoPessoalService(
  dados: CategoriaDadoPessoal,
  tenantId: number
): Promise<CategoriaDadoPessoal> {
  await validarDuplicidade(tenantId, dados.nome);

  const result = await tenantExecute(
    tenantId,
    'INSERT INTO categorias_dados_pessoais (tenant_id, nome) VALUES (?, ?)',
    [dados.nome]
  );

  const id = (result as any).insertId;
  return { ...dados, id };
}

export async function atualizarCategoriaDadoPessoalService(
  id: number,
  dados: CategoriaDadoPessoal,
  tenantId: number
): Promise<CategoriaDadoPessoal | null> {
  await validarDuplicidade(tenantId, dados.nome, id);

  const result = await tenantExecute(
    tenantId,
    'UPDATE categorias_dados_pessoais SET tenant_id = ?, nome = ? WHERE tenant_id = ? AND id = ?',
    [dados.nome, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return { ...dados, id };
}

export async function deletarCategoriaDadoPessoalService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM categorias_dados_pessoais WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
