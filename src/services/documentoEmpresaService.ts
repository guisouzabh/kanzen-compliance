import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoEmpresa } from '../types/DocumentoEmpresa';
import { DocumentoArquivo } from '../types/DocumentoArquivo';
import { DocumentoRegulatorio } from '../types/DocumentoRegulatorio';

async function validarEmpresa(tenantId: number, empresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );
  if (!rows.length) {
    throw new AppError('Empresa inválida para este tenant', 400);
  }
}

async function validarDocumentoRegulatorio(tenantId: number, documentoId: number) {
  const rows = await tenantQuery<{ id: number; impacto: number | null }>(
    tenantId,
    'SELECT id, impacto FROM documentos_regulatorios WHERE tenant_id = ? AND id = ?',
    [documentoId]
  );
  if (!rows.length) {
    throw new AppError('Documento regulatorio inválido para este tenant', 400);
  }
  return rows[0].impacto ?? null;
}

async function validarArea(tenantId: number, areaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM areas WHERE tenant_id = ? AND id = ?',
    [areaId]
  );
  if (!rows.length) {
    throw new AppError('Área inválida para este tenant', 400);
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

export async function listarDocumentosEmpresaService(
  tenantId: number
): Promise<DocumentoEmpresa[]> {
  return tenantQuery<DocumentoEmpresa>(
    tenantId,
    `
      SELECT de.*, e.nome AS empresa_nome, dr.nome AS documento_regulatorio_nome, dr.sigla AS documento_regulatorio_sigla
        FROM documentos_empresa de
        JOIN empresas e ON e.id = de.empresa_id AND e.tenant_id = de.tenant_id
        JOIN documentos_regulatorios dr ON dr.id = de.documento_regulatorio_id AND dr.tenant_id = de.tenant_id
       WHERE de.tenant_id = ?
       ORDER BY de.id DESC
    `
  );
}

export async function criarDocumentoEmpresaService(
  dados: DocumentoEmpresa,
  tenantId: number
): Promise<DocumentoEmpresa> {
  await validarEmpresa(tenantId, dados.empresa_id);
  const impactoPadrao = await validarDocumentoRegulatorio(tenantId, dados.documento_regulatorio_id);
  if (dados.responsavel_area_id) {
    await validarArea(tenantId, dados.responsavel_area_id);
  }
  if (dados.usuario_responsavel_id) {
    await validarUsuario(tenantId, dados.usuario_responsavel_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documentos_empresa (
        tenant_id,
        empresa_id,
        documento_regulatorio_id,
        impacto,
        status,
        data_emissao,
        data_validade,
        responsavel_area_id,
        usuario_responsavel_id,
        responsavel_tecnico,
        observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      dados.documento_regulatorio_id,
      dados.impacto ?? impactoPadrao ?? null,
      dados.status ?? 'PENDENTE',
      dados.data_emissao ?? null,
      dados.data_validade ?? null,
      dados.responsavel_area_id ?? null,
      dados.usuario_responsavel_id ?? null,
      dados.responsavel_tecnico ?? null,
      dados.observacoes ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterDocumentoEmpresaPorIdService(id, tenantId);
  return criado ?? { ...dados, id };
}

export async function obterDocumentoEmpresaPorIdService(
  id: number,
  tenantId: number
): Promise<DocumentoEmpresa | null> {
  const rows = await tenantQuery<DocumentoEmpresa>(
    tenantId,
    `
      SELECT de.*, e.nome AS empresa_nome, dr.nome AS documento_regulatorio_nome, dr.sigla AS documento_regulatorio_sigla
        FROM documentos_empresa de
        JOIN empresas e ON e.id = de.empresa_id AND e.tenant_id = de.tenant_id
        JOIN documentos_regulatorios dr ON dr.id = de.documento_regulatorio_id AND dr.tenant_id = de.tenant_id
       WHERE de.tenant_id = ? AND de.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function atualizarDocumentoEmpresaService(
  id: number,
  dados: DocumentoEmpresa,
  tenantId: number
): Promise<DocumentoEmpresa | null> {
  await validarEmpresa(tenantId, dados.empresa_id);
  const impactoPadrao = await validarDocumentoRegulatorio(tenantId, dados.documento_regulatorio_id);
  if (dados.responsavel_area_id) {
    await validarArea(tenantId, dados.responsavel_area_id);
  }
  if (dados.usuario_responsavel_id) {
    await validarUsuario(tenantId, dados.usuario_responsavel_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documentos_empresa
         SET tenant_id = ?, empresa_id = ?, documento_regulatorio_id = ?, impacto = ?, status = ?, data_emissao = ?, data_validade = ?,
             responsavel_area_id = ?, usuario_responsavel_id = ?, responsavel_tecnico = ?, observacoes = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.documento_regulatorio_id,
      dados.impacto ?? impactoPadrao ?? null,
      dados.status ?? 'PENDENTE',
      dados.data_emissao ?? null,
      dados.data_validade ?? null,
      dados.responsavel_area_id ?? null,
      dados.usuario_responsavel_id ?? null,
      dados.responsavel_tecnico ?? null,
      dados.observacoes ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterDocumentoEmpresaPorIdService(id, tenantId);
}

export async function deletarDocumentoEmpresaService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documentos_empresa WHERE tenant_id = ? AND id = ?',
    [id]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}

export async function listarDocumentosArquivosService(
  documentoEmpresaId: number,
  tenantId: number
): Promise<DocumentoArquivo[]> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  return tenantQuery<DocumentoArquivo>(
    tenantId,
    `
      SELECT *
        FROM documentos_arquivos
       WHERE tenant_id = ? AND documento_empresa_id = ?
       ORDER BY id DESC
    `,
    [documentoEmpresaId]
  );
}

export async function criarDocumentoArquivoService(
  documentoEmpresaId: number,
  dados: DocumentoArquivo,
  tenantId: number
): Promise<DocumentoArquivo> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documentos_arquivos (
        tenant_id,
        documento_empresa_id,
        tipo_arquivo,
        nome_arquivo,
        caminho_arquivo,
        hash_arquivo,
        versao
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      documentoEmpresaId,
      dados.tipo_arquivo,
      dados.nome_arquivo,
      dados.caminho_arquivo,
      dados.hash_arquivo ?? null,
      dados.versao ?? null
    ]
  );

  const id = (result as any).insertId;
  return { ...dados, id, documento_empresa_id: documentoEmpresaId };
}

export async function deletarDocumentoArquivoService(
  documentoEmpresaId: number,
  arquivoId: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM documentos_arquivos WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?',
    [documentoEmpresaId, arquivoId]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}

export async function obterDocumentoArquivoPorIdService(
  documentoEmpresaId: number,
  arquivoId: number,
  tenantId: number
): Promise<DocumentoArquivo | null> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  const rows = await tenantQuery<DocumentoArquivo>(
    tenantId,
    `
      SELECT *
        FROM documentos_arquivos
       WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?
       LIMIT 1
    `,
    [documentoEmpresaId, arquivoId]
  );

  return rows[0] ?? null;
}

export async function atualizarHashDocumentoArquivoService(
  documentoEmpresaId: number,
  arquivoId: number,
  hashArquivo: string | null,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    `
      UPDATE documentos_arquivos
         SET tenant_id = ?, hash_arquivo = ?
       WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?
    `,
    [hashArquivo, tenantId, documentoEmpresaId, arquivoId]
  );

  const { affectedRows } = result as any;
  return !!affectedRows;
}
