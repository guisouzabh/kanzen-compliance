import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { Classificacao } from '../types/Classificacao';

export async function listarClassificacoesService(tenantId: number): Promise<Classificacao[]> {
  return tenantQuery<Classificacao>(
    tenantId,
    'SELECT * FROM classificacoes WHERE tenant_id = ? ORDER BY id DESC'
  );
}

export async function criarClassificacaoService(
  dados: Classificacao,
  tenantId: number
): Promise<Classificacao> {
  const sql = `
    INSERT INTO classificacoes (tenant_id, nome)
    VALUES (?, ?)
  `;

  const result = await tenantExecute(tenantId, sql, [dados.nome]);

  return {
    id: (result as any).insertId,
    nome: dados.nome
  };
}
