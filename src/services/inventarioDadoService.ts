import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { InventarioDado } from '../types/InventarioDado';
import { CategoriaDadoPessoal } from '../types/CategoriaDadoPessoal';
import { Processo } from '../types/Processo';
import { AppError } from '../errors/AppError';

async function validarDuplicidade(
  tenantId: number,
  categoria: string,
  dadoTratado: string,
  id?: number
) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    `
      SELECT id
        FROM inventario_dados
       WHERE tenant_id = ? AND categoria = ? AND dado_tratado = ?
         ${id ? 'AND id <> ?' : ''}
    `,
    id ? [categoria, dadoTratado, id] : [categoria, dadoTratado]
  );
  if (rows.length) {
    throw new AppError('Item já cadastrado com mesma categoria e dado pessoal', 400);
  }
}

export async function listarInventarioService(tenantId: number): Promise<InventarioDado[]> {
  return tenantQuery<InventarioDado>(
    tenantId,
    `
      SELECT id, tenant_id, categoria_id, categoria, dado_tratado,
             dados_sensiveis, dados_menor, tempo_armazenamento, local_armazenamento, processo_id,
             quantidade_existente, quantidade_inserida_mes, quantidade_tratada_mes, principal_agente,
             created_at
        FROM inventario_dados
       WHERE tenant_id = ?
       ORDER BY id DESC
    `
  );
}

export async function criarInventarioService(
  dados: InventarioDado,
  tenantId: number
): Promise<InventarioDado> {
  const catRows = await tenantQuery<CategoriaDadoPessoal>(
    tenantId,
    'SELECT nome FROM categorias_dados_pessoais WHERE tenant_id = ? AND id = ?',
    [dados.categoria_id]
  );
  if (!catRows.length) {
    throw new AppError('Categoria inválida para este tenant', 400);
  }
  if (dados.processo_id) {
    const procRows = await tenantQuery<Processo>(
      tenantId,
      'SELECT id FROM processos WHERE tenant_id = ? AND id = ?',
      [dados.processo_id]
    );
    if (!procRows.length) throw new AppError('Processo inválido para este tenant', 400);
  }
  await validarDuplicidade(tenantId, catRows[0].nome, dados.dado_tratado);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO inventario_dados (
        tenant_id, categoria_id, categoria, dado_tratado,
        dados_sensiveis, dados_menor, tempo_armazenamento, local_armazenamento, processo_id,
        quantidade_existente, quantidade_inserida_mes, quantidade_tratada_mes, principal_agente
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.categoria_id,
      catRows[0].nome,
      dados.dado_tratado,
      dados.dados_sensiveis ?? false,
      dados.dados_menor ?? false,
      dados.tempo_armazenamento ?? null,
      dados.local_armazenamento ?? null,
      dados.processo_id ?? null,
      dados.quantidade_existente ?? null,
      dados.quantidade_inserida_mes ?? null,
      dados.quantidade_tratada_mes ?? null,
      dados.principal_agente ?? null
    ]
  );

  const id = (result as any).insertId;
  return { ...dados, id, categoria: catRows[0].nome };
}

export async function atualizarInventarioService(
  id: number,
  dados: InventarioDado,
  tenantId: number
): Promise<InventarioDado | null> {
  const catRows = await tenantQuery<CategoriaDadoPessoal>(
    tenantId,
    'SELECT nome FROM categorias_dados_pessoais WHERE tenant_id = ? AND id = ?',
    [dados.categoria_id]
  );
  if (!catRows.length) {
    throw new AppError('Categoria inválida para este tenant', 400);
  }
  if (dados.processo_id) {
    const procRows = await tenantQuery<Processo>(
      tenantId,
      'SELECT id FROM processos WHERE tenant_id = ? AND id = ?',
      [dados.processo_id]
    );
    if (!procRows.length) throw new AppError('Processo inválido para este tenant', 400);
  }
  await validarDuplicidade(tenantId, catRows[0].nome, dados.dado_tratado, id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE inventario_dados
         SET tenant_id = ?, categoria_id = ?, categoria = ?, dado_tratado = ?,
             dados_sensiveis = ?, dados_menor = ?, tempo_armazenamento = ?, local_armazenamento = ?,
             processo_id = ?, quantidade_existente = ?, quantidade_inserida_mes = ?,
             quantidade_tratada_mes = ?, principal_agente = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.categoria_id,
      catRows[0].nome,
      dados.dado_tratado,
      dados.dados_sensiveis ?? false,
      dados.dados_menor ?? false,
      dados.tempo_armazenamento ?? null,
      dados.local_armazenamento ?? null,
      dados.processo_id ?? null,
      dados.quantidade_existente ?? null,
      dados.quantidade_inserida_mes ?? null,
      dados.quantidade_tratada_mes ?? null,
      dados.principal_agente ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return { ...dados, id, categoria: catRows[0].nome };
}

export async function deletarInventarioService(id: number, tenantId: number): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM inventario_dados WHERE tenant_id = ? AND id = ?',
    [id]
  );
  const { affectedRows } = result as any;
  return !!affectedRows;
}
