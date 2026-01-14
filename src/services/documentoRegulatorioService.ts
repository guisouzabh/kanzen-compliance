import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoRegulatorio } from '../types/DocumentoRegulatorio';

async function validarClassificacao(tenantId: number, classificacaoId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM classificacoes WHERE tenant_id = ? AND id = ?',
    [classificacaoId]
  );
  if (!rows.length) {
    throw new AppError('Classificação inválida para este tenant', 400);
  }
}

export async function listarDocumentosRegulatoriosService(
  tenantId: number
): Promise<DocumentoRegulatorio[]> {
  return tenantQuery<DocumentoRegulatorio>(
    tenantId,
    `
      SELECT d.*, c.nome AS classificacao_nome
        FROM documentos_regulatorios d
        JOIN classificacoes c ON c.id = d.classificacao_id AND c.tenant_id = d.tenant_id
       WHERE d.tenant_id = ?
       ORDER BY d.id DESC
    `
  );
}

export async function criarDocumentoRegulatorioService(
  dados: DocumentoRegulatorio,
  tenantId: number
): Promise<DocumentoRegulatorio> {
  await validarClassificacao(tenantId, dados.classificacao_id);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documentos_regulatorios (
        tenant_id,
        classificacao_id,
        nome,
        sigla,
        descricao,
        base_legal,
        orgao_emissor,
        obrigatoriedade,
        periodicidade,
        exige_responsavel_tecnico,
        exige_assinatura,
        exige_validade,
        ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.classificacao_id,
      dados.nome,
      dados.sigla ?? null,
      dados.descricao,
      dados.base_legal ?? null,
      dados.orgao_emissor ?? null,
      dados.obrigatoriedade,
      dados.periodicidade,
      dados.exige_responsavel_tecnico ?? false,
      dados.exige_assinatura ?? false,
      dados.exige_validade ?? true,
      dados.ativo ?? true
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterDocumentoRegulatorioPorIdService(id, tenantId);
  return criado ?? { ...dados, id };
}

export async function obterDocumentoRegulatorioPorIdService(
  id: number,
  tenantId: number
): Promise<DocumentoRegulatorio | null> {
  const rows = await tenantQuery<DocumentoRegulatorio>(
    tenantId,
    `
      SELECT d.*, c.nome AS classificacao_nome
        FROM documentos_regulatorios d
        JOIN classificacoes c ON c.id = d.classificacao_id AND c.tenant_id = d.tenant_id
       WHERE d.tenant_id = ? AND d.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarDocumentoRegulatorioService(
  id: number,
  dados: DocumentoRegulatorio,
  tenantId: number
): Promise<DocumentoRegulatorio | null> {
  await validarClassificacao(tenantId, dados.classificacao_id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documentos_regulatorios
         SET classificacao_id = ?, nome = ?, sigla = ?, descricao = ?, base_legal = ?, orgao_emissor = ?,
             obrigatoriedade = ?, periodicidade = ?, exige_responsavel_tecnico = ?, exige_assinatura = ?,
             exige_validade = ?, ativo = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.classificacao_id,
      dados.nome,
      dados.sigla ?? null,
      dados.descricao,
      dados.base_legal ?? null,
      dados.orgao_emissor ?? null,
      dados.obrigatoriedade,
      dados.periodicidade,
      dados.exige_responsavel_tecnico ?? false,
      dados.exige_assinatura ?? false,
      dados.exige_validade ?? true,
      dados.ativo ?? true,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterDocumentoRegulatorioPorIdService(id, tenantId);
}

export async function deletarDocumentoRegulatorioService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documentos_regulatorios WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
