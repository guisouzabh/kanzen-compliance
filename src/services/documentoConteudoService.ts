import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoConteudo } from '../types/DocumentoConteudo';

async function validarDocumentoEmpresa(tenantId: number, documentoEmpresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM documentos_empresa WHERE tenant_id = ? AND id = ?',
    [documentoEmpresaId]
  );
  if (!rows.length) {
    throw new AppError('Documento da empresa inválido para este tenant', 400);
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

async function obterProximaVersao(
  tenantId: number,
  documentoEmpresaId: number
): Promise<number> {
  const rows = await tenantQuery<{ maxVersao: number | null }>(
    tenantId,
    `
      SELECT MAX(versao) AS maxVersao
        FROM documento_conteudo
       WHERE tenant_id = ? AND documento_empresa_id = ?
    `,
    [documentoEmpresaId]
  );

  const maxVersao = rows[0]?.maxVersao ?? 0;
  return maxVersao + 1;
}

export async function listarDocumentoConteudoPorDocumentoEmpresaService(
  documentoEmpresaId: number,
  tenantId: number
): Promise<DocumentoConteudo[]> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  return tenantQuery<DocumentoConteudo>(
    tenantId,
    `
      SELECT dc.*,
             u1.nome AS criado_por_usuario_nome,
             u2.nome AS revisado_por_usuario_nome,
             u3.nome AS aprovado_por_usuario_nome
        FROM documento_conteudo dc
        LEFT JOIN usuarios u1 ON u1.id = dc.criado_por_usuario_id AND u1.tenant_id = dc.tenant_id
        LEFT JOIN usuarios u2 ON u2.id = dc.revisado_por_usuario_id AND u2.tenant_id = dc.tenant_id
        LEFT JOIN usuarios u3 ON u3.id = dc.aprovado_por_usuario_id AND u3.tenant_id = dc.tenant_id
       WHERE dc.tenant_id = ? AND dc.documento_empresa_id = ?
       ORDER BY dc.versao DESC
    `,
    [documentoEmpresaId]
  );
}

export async function criarDocumentoConteudoService(
  dados: DocumentoConteudo,
  tenantId: number
): Promise<DocumentoConteudo> {
  await validarDocumentoEmpresa(tenantId, dados.documento_empresa_id);
  if (dados.criado_por_usuario_id) {
    await validarUsuario(tenantId, dados.criado_por_usuario_id);
  }
  if (dados.revisado_por_usuario_id) {
    await validarUsuario(tenantId, dados.revisado_por_usuario_id);
  }
  if (dados.aprovado_por_usuario_id) {
    await validarUsuario(tenantId, dados.aprovado_por_usuario_id);
  }

  const versao = dados.versao ?? (await obterProximaVersao(tenantId, dados.documento_empresa_id));

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documento_conteudo (
        tenant_id,
        documento_empresa_id,
        versao,
        status,
        titulo_versao,
        html,
        json_data,
        criado_por_usuario_id,
        revisado_por_usuario_id,
        aprovado_por_usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.documento_empresa_id,
      versao,
      dados.status ?? 'RASCUNHO',
      dados.titulo_versao ?? null,
      dados.html,
      dados.json_data ?? null,
      dados.criado_por_usuario_id ?? null,
      dados.revisado_por_usuario_id ?? null,
      dados.aprovado_por_usuario_id ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterDocumentoConteudoPorIdService(id, tenantId);
  return criado ?? { ...dados, id, versao };
}

export async function obterDocumentoConteudoPorIdService(
  id: number,
  tenantId: number
): Promise<DocumentoConteudo | null> {
  const rows = await tenantQuery<DocumentoConteudo>(
    tenantId,
    `
      SELECT dc.*,
             u1.nome AS criado_por_usuario_nome,
             u2.nome AS revisado_por_usuario_nome,
             u3.nome AS aprovado_por_usuario_nome
        FROM documento_conteudo dc
        LEFT JOIN usuarios u1 ON u1.id = dc.criado_por_usuario_id AND u1.tenant_id = dc.tenant_id
        LEFT JOIN usuarios u2 ON u2.id = dc.revisado_por_usuario_id AND u2.tenant_id = dc.tenant_id
        LEFT JOIN usuarios u3 ON u3.id = dc.aprovado_por_usuario_id AND u3.tenant_id = dc.tenant_id
       WHERE dc.tenant_id = ? AND dc.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarDocumentoConteudoService(
  id: number,
  dados: DocumentoConteudo,
  tenantId: number
): Promise<DocumentoConteudo | null> {
  await validarDocumentoEmpresa(tenantId, dados.documento_empresa_id);
  if (dados.criado_por_usuario_id) {
    await validarUsuario(tenantId, dados.criado_por_usuario_id);
  }
  if (dados.revisado_por_usuario_id) {
    await validarUsuario(tenantId, dados.revisado_por_usuario_id);
  }
  if (dados.aprovado_por_usuario_id) {
    await validarUsuario(tenantId, dados.aprovado_por_usuario_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documento_conteudo
         SET tenant_id = ?, documento_empresa_id = ?, versao = ?, status = ?, titulo_versao = ?,
             html = ?, json_data = ?, criado_por_usuario_id = ?, revisado_por_usuario_id = ?,
             aprovado_por_usuario_id = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.documento_empresa_id,
      dados.versao ?? 1,
      dados.status ?? 'RASCUNHO',
      dados.titulo_versao ?? null,
      dados.html,
      dados.json_data ?? null,
      dados.criado_por_usuario_id ?? null,
      dados.revisado_por_usuario_id ?? null,
      dados.aprovado_por_usuario_id ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) {
    return obterDocumentoConteudoPorIdService(id, tenantId);
  }

  return obterDocumentoConteudoPorIdService(id, tenantId);
}

export async function deletarDocumentoConteudoService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documento_conteudo WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
