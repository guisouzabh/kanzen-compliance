import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoConteudoSecao } from '../types/DocumentoConteudoSecao';

async function validarDocumentoConteudo(tenantId: number, documentoConteudoId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM documento_conteudo WHERE tenant_id = ? AND id = ?',
    [documentoConteudoId]
  );
  if (!rows.length) {
    throw new AppError('Documento conteúdo inválido para este tenant', 400);
  }
}

async function obterDocumentoRegulatorioDoConteudo(
  tenantId: number,
  documentoConteudoId: number
): Promise<number | null> {
  const rows = await tenantQuery<{ documento_regulatorio_id: number }>(
    tenantId,
    `
      SELECT de.documento_regulatorio_id
        FROM documento_conteudo dc
        JOIN documentos_empresa de ON de.id = dc.documento_empresa_id AND de.tenant_id = dc.tenant_id
       WHERE dc.tenant_id = ? AND dc.id = ?
    `,
    [documentoConteudoId]
  );
  return rows[0]?.documento_regulatorio_id ?? null;
}

async function validarModeloSecao(
  tenantId: number,
  documentoConteudoId: number,
  modeloSecaoId: number
) {
  const rows = await tenantQuery<{ id: number; documento_regulatorio_id: number }>(
    tenantId,
    'SELECT id, documento_regulatorio_id FROM documento_modelo_secao WHERE tenant_id = ? AND id = ?',
    [modeloSecaoId]
  );
  if (!rows.length) {
    throw new AppError('Seção modelo inválida para este tenant', 400);
  }

  const documentoRegulatorioId = await obterDocumentoRegulatorioDoConteudo(
    tenantId,
    documentoConteudoId
  );
  if (!documentoRegulatorioId) {
    throw new AppError('Documento conteúdo inválido para este tenant', 400);
  }

  if (rows[0].documento_regulatorio_id !== documentoRegulatorioId) {
    throw new AppError('Seção modelo não pertence ao documento regulatório do conteúdo', 400);
  }
}

async function validarUsuario(tenantId: number, usuarioId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [usuarioId]
  );
  if (!rows.length) {
    throw new AppError('Usuário inválido para este tenant', 400);
  }
}

export async function listarDocumentoConteudoSecaoService(
  documentoConteudoId: number,
  tenantId: number
): Promise<DocumentoConteudoSecao[]> {
  await validarDocumentoConteudo(tenantId, documentoConteudoId);

  return tenantQuery<DocumentoConteudoSecao>(
    tenantId,
    `
      SELECT cs.*, ms.chave, ms.titulo, ms.descricao, ms.ordem, ms.obrigatoria, ms.tipo_input
        FROM documento_conteudo_secao cs
        JOIN documento_modelo_secao ms ON ms.id = cs.modelo_secao_id AND ms.tenant_id = cs.tenant_id
       WHERE cs.tenant_id = ? AND cs.documento_conteudo_id = ?
       ORDER BY ms.ordem ASC, cs.id ASC
    `,
    [documentoConteudoId]
  );
}

export async function criarDocumentoConteudoSecaoService(
  dados: DocumentoConteudoSecao,
  tenantId: number
): Promise<DocumentoConteudoSecao> {
  await validarDocumentoConteudo(tenantId, dados.documento_conteudo_id);
  await validarModeloSecao(tenantId, dados.documento_conteudo_id, dados.modelo_secao_id);
  if (dados.atualizado_por_usuario_id) {
    await validarUsuario(tenantId, dados.atualizado_por_usuario_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documento_conteudo_secao (
        tenant_id,
        documento_conteudo_id,
        modelo_secao_id,
        status,
        conteudo_html,
        dados_json,
        checksum,
        atualizado_por_usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.documento_conteudo_id,
      dados.modelo_secao_id,
      dados.status ?? 'NAO_INICIADO',
      dados.conteudo_html ?? null,
      dados.dados_json ?? null,
      dados.checksum ?? null,
      dados.atualizado_por_usuario_id ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterDocumentoConteudoSecaoPorIdService(id, tenantId);
  return criado ?? { ...dados, id };
}

export async function obterDocumentoConteudoSecaoPorIdService(
  id: number,
  tenantId: number
): Promise<DocumentoConteudoSecao | null> {
  const rows = await tenantQuery<DocumentoConteudoSecao>(
    tenantId,
    `
      SELECT cs.*, ms.chave, ms.titulo, ms.descricao, ms.ordem, ms.obrigatoria, ms.tipo_input
        FROM documento_conteudo_secao cs
        JOIN documento_modelo_secao ms ON ms.id = cs.modelo_secao_id AND ms.tenant_id = cs.tenant_id
       WHERE cs.tenant_id = ? AND cs.id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function atualizarDocumentoConteudoSecaoService(
  id: number,
  dados: DocumentoConteudoSecao,
  tenantId: number
): Promise<DocumentoConteudoSecao | null> {
  await validarDocumentoConteudo(tenantId, dados.documento_conteudo_id);
  await validarModeloSecao(tenantId, dados.documento_conteudo_id, dados.modelo_secao_id);
  if (dados.atualizado_por_usuario_id) {
    await validarUsuario(tenantId, dados.atualizado_por_usuario_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documento_conteudo_secao
         SET tenant_id = ?, documento_conteudo_id = ?, modelo_secao_id = ?, status = ?,
             conteudo_html = ?, dados_json = ?, checksum = ?, atualizado_por_usuario_id = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.documento_conteudo_id,
      dados.modelo_secao_id,
      dados.status ?? 'NAO_INICIADO',
      dados.conteudo_html ?? null,
      dados.dados_json ?? null,
      dados.checksum ?? null,
      dados.atualizado_por_usuario_id ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) {
    return obterDocumentoConteudoSecaoPorIdService(id, tenantId);
  }

  return obterDocumentoConteudoSecaoPorIdService(id, tenantId);
}

export async function deletarDocumentoConteudoSecaoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documento_conteudo_secao WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
