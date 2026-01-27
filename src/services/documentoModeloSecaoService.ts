import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoModeloSecao, DocumentoModeloSecaoLink } from '../types/DocumentoModeloSecao';

async function validarDocumentoRegulatorio(tenantId: number, documentoId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM documentos_regulatorios WHERE tenant_id = ? AND id = ?',
    [documentoId]
  );
  if (!rows.length) {
    throw new AppError('Documento regulatório inválido para este tenant', 400);
  }
}

async function listarLinksPorModelos(
  modeloIds: number[],
  tenantId: number
): Promise<DocumentoModeloSecaoLink[]> {
  if (!modeloIds.length) return [];
  return tenantQuery<DocumentoModeloSecaoLink>(
    tenantId,
    `
      SELECT *
        FROM documento_modelo_secao_links
       WHERE tenant_id = ? AND modelo_secao_id IN (${modeloIds.map(() => '?').join(',')})
       ORDER BY id ASC
    `,
    modeloIds
  );
}

async function substituirLinks(
  tenantId: number,
  modeloSecaoId: number,
  links: DocumentoModeloSecaoLink[]
) {
  await tenantExecute(
    tenantId,
    'DELETE FROM documento_modelo_secao_links WHERE tenant_id = ? AND modelo_secao_id = ?',
    [modeloSecaoId]
  );

  if (!links.length) return;

  for (const link of links) {
    await tenantExecute(
      tenantId,
      `
        INSERT INTO documento_modelo_secao_links (tenant_id, modelo_secao_id, titulo, url)
        VALUES (?, ?, ?, ?)
      `,
      [modeloSecaoId, link.titulo, link.url]
    );
  }
}

export async function listarDocumentoModeloSecaoPorDocumentoService(
  documentoRegulatorioId: number,
  tenantId: number
): Promise<DocumentoModeloSecao[]> {
  await validarDocumentoRegulatorio(tenantId, documentoRegulatorioId);

  const secoes = await tenantQuery<DocumentoModeloSecao>(
    tenantId,
    `
      SELECT ms.*, dr.nome AS documento_regulatorio_nome
        FROM documento_modelo_secao ms
        JOIN documentos_regulatorios dr ON dr.id = ms.documento_regulatorio_id AND dr.tenant_id = ms.tenant_id
       WHERE ms.tenant_id = ? AND ms.documento_regulatorio_id = ?
       ORDER BY ms.ordem ASC, ms.id ASC
    `,
    [documentoRegulatorioId]
  );
  const links = await listarLinksPorModelos(
    secoes.map((s) => s.id!).filter(Boolean),
    tenantId
  );
  return secoes.map((s) => ({
    ...s,
    links: links.filter((l) => l.modelo_secao_id === s.id)
  }));
}

export async function criarDocumentoModeloSecaoService(
  dados: DocumentoModeloSecao,
  tenantId: number
): Promise<DocumentoModeloSecao> {
  await validarDocumentoRegulatorio(tenantId, dados.documento_regulatorio_id);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documento_modelo_secao (
        tenant_id,
        documento_regulatorio_id,
        chave,
        titulo,
        descricao,
        ordem,
        obrigatoria,
        tipo_input,
        schema_json,
        template_html,
        ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.documento_regulatorio_id,
      dados.chave,
      dados.titulo,
      dados.descricao ?? null,
      dados.ordem ?? 1,
      dados.obrigatoria ?? true,
      dados.tipo_input ?? 'RICH_TEXT',
      dados.schema_json ?? null,
      dados.template_html ?? null,
      dados.ativo ?? true
    ]
  );

  const id = (result as any).insertId;
  if (dados.links?.length) {
    await substituirLinks(tenantId, id, dados.links);
  }
  const criado = await obterDocumentoModeloSecaoPorIdService(id, tenantId);
  return criado ?? { ...dados, id };
}

export async function obterDocumentoModeloSecaoPorIdService(
  id: number,
  tenantId: number
): Promise<DocumentoModeloSecao | null> {
  const rows = await tenantQuery<DocumentoModeloSecao>(
    tenantId,
    `
      SELECT ms.*, dr.nome AS documento_regulatorio_nome
        FROM documento_modelo_secao ms
        JOIN documentos_regulatorios dr ON dr.id = ms.documento_regulatorio_id AND dr.tenant_id = ms.tenant_id
       WHERE ms.tenant_id = ? AND ms.id = ?
    `,
    [id]
  );
  if (!rows.length) return null;
  const links = await listarLinksPorModelos([id], tenantId);
  return { ...rows[0], links };
}

export async function atualizarDocumentoModeloSecaoService(
  id: number,
  dados: DocumentoModeloSecao,
  tenantId: number
): Promise<DocumentoModeloSecao | null> {
  await validarDocumentoRegulatorio(tenantId, dados.documento_regulatorio_id);

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documento_modelo_secao
         SET tenant_id = ?, documento_regulatorio_id = ?, chave = ?, titulo = ?, descricao = ?,
             ordem = ?, obrigatoria = ?, tipo_input = ?, schema_json = ?, template_html = ?, ativo = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.documento_regulatorio_id,
      dados.chave,
      dados.titulo,
      dados.descricao ?? null,
      dados.ordem ?? 1,
      dados.obrigatoria ?? true,
      dados.tipo_input ?? 'RICH_TEXT',
      dados.schema_json ?? null,
      dados.template_html ?? null,
      dados.ativo ?? true,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (dados.links) {
    await substituirLinks(tenantId, id, dados.links);
  }
  if (!affectedRows) {
    return obterDocumentoModeloSecaoPorIdService(id, tenantId);
  }

  return obterDocumentoModeloSecaoPorIdService(id, tenantId);
}

export async function deletarDocumentoModeloSecaoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documento_modelo_secao WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
