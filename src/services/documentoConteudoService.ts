import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoConteudo } from '../types/DocumentoConteudo';
import HTMLtoDOCX from 'html-to-docx';

type DocumentoConteudoExport = {
  id: number;
  versao: number;
  titulo_versao: string | null;
  html: string;
  documento_regulatorio_nome: string;
  documento_regulatorio_sigla: string | null;
  empresa_nome: string | null;
  empresa_razao_social: string | null;
  empresa_cnpj: string | null;
  empresa_endereco: string | null;
  empresa_cidade: string | null;
  empresa_estado: string | null;
  empresa_cep: string | null;
};

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

function montarHtmlExportacao(dados: DocumentoConteudoExport): string {
  const enderecoLinha = [dados.empresa_endereco, dados.empresa_cidade]
    .filter(Boolean)
    .join(' - ');
  const estadoLinha = dados.empresa_estado ? `/${dados.empresa_estado}` : '';
  const cepLinha = dados.empresa_cep ? `CEP: ${dados.empresa_cep}` : '';
  const tituloDocumento = dados.titulo_versao
    ? `${dados.documento_regulatorio_nome} - ${dados.titulo_versao}`
    : `${dados.documento_regulatorio_nome} - v${dados.versao}`;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(tituloDocumento)}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; }
          .header { margin-bottom: 18px; }
          .empresa-titulo { font-size: 14pt; font-weight: bold; margin: 0 0 4px 0; }
          .empresa-sub { margin: 2px 0; color: #444444; }
          .documento-titulo { margin: 18px 0 10px; font-size: 16pt; font-weight: bold; }
          .documento-meta { margin-bottom: 16px; color: #444444; }
          table { width: 100%; border-collapse: collapse; }
          table, th, td { border: 1px solid #d9d9d9; }
          th, td { padding: 6px; text-align: left; }
          img { max-width: 100%; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="empresa-titulo">${escapeHtml(dados.empresa_nome || 'Empresa')}</p>
          ${dados.empresa_razao_social ? `<p class="empresa-sub">Razão Social: ${escapeHtml(dados.empresa_razao_social)}</p>` : ''}
          ${dados.empresa_cnpj ? `<p class="empresa-sub">CNPJ: ${escapeHtml(dados.empresa_cnpj)}</p>` : ''}
          ${enderecoLinha ? `<p class="empresa-sub">${escapeHtml(`${enderecoLinha}${estadoLinha}`)}</p>` : ''}
          ${cepLinha ? `<p class="empresa-sub">${escapeHtml(cepLinha)}</p>` : ''}
        </div>
        <div class="documento-titulo">${escapeHtml(dados.documento_regulatorio_nome)}</div>
        <div class="documento-meta">
          ${dados.documento_regulatorio_sigla ? `Sigla: ${escapeHtml(dados.documento_regulatorio_sigla)} | ` : ''}Versão: ${dados.versao}
          ${dados.titulo_versao ? ` | Título: ${escapeHtml(dados.titulo_versao)}` : ''}
        </div>
        ${dados.html}
      </body>
    </html>
  `;
}

export async function exportarDocumentoConteudoDocxService(
  id: number,
  tenantId: number
): Promise<{ buffer: Buffer; fileName: string }> {
  const rows = await tenantQuery<DocumentoConteudoExport>(
    tenantId,
    `
      SELECT dc.id,
             dc.versao,
             dc.titulo_versao,
             dc.html,
             dr.nome AS documento_regulatorio_nome,
             dr.sigla AS documento_regulatorio_sigla,
             e.nome AS empresa_nome,
             e.razao_social AS empresa_razao_social,
             e.cnpj AS empresa_cnpj,
             e.endereco AS empresa_endereco,
             e.cidade AS empresa_cidade,
             e.estado AS empresa_estado,
             e.cep AS empresa_cep
        FROM documento_conteudo dc
        JOIN documentos_empresa de ON de.id = dc.documento_empresa_id AND de.tenant_id = dc.tenant_id
        JOIN documentos_regulatorios dr ON dr.id = de.documento_regulatorio_id AND dr.tenant_id = de.tenant_id
        JOIN empresas e ON e.id = de.empresa_id AND e.tenant_id = de.tenant_id
       WHERE dc.tenant_id = ? AND dc.id = ?
    `,
    [id]
  );

  const dados = rows[0];
  if (!dados) {
    throw new AppError('Conteúdo não encontrado', 404);
  }

  const html = montarHtmlExportacao(dados);
  const buffer = (await HTMLtoDOCX(html, null, {
    table: { row: { cantSplit: true } }
  })) as Buffer;

  const nomeBase = sanitizeFileName(dados.documento_regulatorio_nome) || 'documento';
  const fileName = `${nomeBase}_v${dados.versao}.docx`;
  return { buffer, fileName };
}
