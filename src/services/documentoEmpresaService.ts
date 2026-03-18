import { pool } from '../config/db';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DocumentoArquivo, DocumentoArquivoStatus } from '../types/DocumentoArquivo';
import { DocumentoEmpresa } from '../types/DocumentoEmpresa';

type DocumentoArquivoComContexto = DocumentoArquivo & {
  empresa_id: number;
  empresa_nome: string;
  documento_regulatorio_id: number;
  documento_regulatorio_nome: string;
  documento_regulatorio_sigla: string | null;
};

const STATUS_NAO_PUBLICADOS_ATIVOS: DocumentoArquivoStatus[] = ['RASCUNHO', 'APROVADO', 'REJEITADO'];

const TRANSICOES_PERMITIDAS: Record<DocumentoArquivoStatus, DocumentoArquivoStatus[]> = {
  RASCUNHO: ['APROVADO', 'REJEITADO'],
  APROVADO: ['RASCUNHO', 'REJEITADO'],
  REJEITADO: ['RASCUNHO', 'APROVADO'],
  PUBLICADO: ['ARQUIVADO'],
  ARQUIVADO: ['RASCUNHO', 'APROVADO']
};

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
    'SELECT id FROM areas WHERE tenant_id = ? AND id = ? AND ativo = 1',
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

function validarTransicaoStatus(atual: DocumentoArquivoStatus, novo: DocumentoArquivoStatus) {
  if (atual === novo) return;
  const permitidas = TRANSICOES_PERMITIDAS[atual] ?? [];
  if (!permitidas.includes(novo)) {
    throw new AppError(`Transição de status inválida: ${atual} -> ${novo}`, 400);
  }
}

function queryArquivosComContexto(whereClause: string, orderByClause: string) {
  return `
    SELECT da.*,
           de.empresa_id,
           e.nome AS empresa_nome,
           de.documento_regulatorio_id,
           dr.nome AS documento_regulatorio_nome,
           dr.sigla AS documento_regulatorio_sigla
      FROM documentos_arquivos da
      JOIN documentos_empresa de ON de.id = da.documento_empresa_id AND de.tenant_id = da.tenant_id
      JOIN empresas e ON e.id = de.empresa_id AND e.tenant_id = de.tenant_id
      JOIN documentos_regulatorios dr
        ON dr.id = de.documento_regulatorio_id
       AND dr.tenant_id = de.tenant_id
     WHERE da.tenant_id = ? ${whereClause}
     ${orderByClause}
  `;
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
       ORDER BY
         CASE status
           WHEN 'PUBLICADO' THEN 1
           WHEN 'APROVADO' THEN 2
           WHEN 'RASCUNHO' THEN 3
           WHEN 'REJEITADO' THEN 4
           WHEN 'ARQUIVADO' THEN 5
           ELSE 9
         END,
         id DESC
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

  if (dados.status === 'PUBLICADO') {
    throw new AppError(
      'Não é permitido criar arquivo já publicado. Use o endpoint de publicação.',
      400
    );
  }

  const status = dados.status ?? 'RASCUNHO';
  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO documentos_arquivos (
        tenant_id,
        documento_empresa_id,
        tipo_arquivo,
        status,
        nome_arquivo,
        caminho_arquivo,
        hash_arquivo,
        versao,
        motivo_rejeicao,
        data_emissao,
        data_validade,
        aprovado_em,
        rejeitado_em,
        arquivado_em
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      documentoEmpresaId,
      dados.tipo_arquivo,
      status,
      dados.nome_arquivo,
      dados.caminho_arquivo,
      dados.hash_arquivo ?? null,
      dados.versao ?? null,
      dados.motivo_rejeicao ?? null,
      dados.data_emissao ?? null,
      dados.data_validade ?? null,
      status === 'APROVADO' ? new Date() : null,
      status === 'REJEITADO' ? new Date() : null,
      status === 'ARQUIVADO' ? new Date() : null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterDocumentoArquivoPorIdService(documentoEmpresaId, id, tenantId);
  return criado ?? { ...dados, id, documento_empresa_id: documentoEmpresaId, status };
}

export async function atualizarStatusDocumentoArquivoService(
  documentoEmpresaId: number,
  arquivoId: number,
  payload: {
    status: DocumentoArquivoStatus;
    motivo_rejeicao?: string | null;
    data_emissao?: Date | string | null;
    data_validade?: Date | string | null;
  },
  tenantId: number
): Promise<DocumentoArquivo> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  if (payload.status === 'PUBLICADO') {
    throw new AppError(
      'Não é permitido marcar como PUBLICADO diretamente. Use o endpoint de publicação.',
      400
    );
  }

  const atual = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!atual) {
    throw new AppError('Arquivo não encontrado', 404);
  }

  const statusAtual = atual.status ?? 'RASCUNHO';
  validarTransicaoStatus(statusAtual, payload.status);

  if (payload.status === 'REJEITADO' && !payload.motivo_rejeicao?.trim()) {
    throw new AppError('Motivo de rejeição é obrigatório ao rejeitar o documento', 400);
  }

  await tenantExecute(
    tenantId,
    `
      UPDATE documentos_arquivos
         SET tenant_id = ?,
             status = ?,
             motivo_rejeicao = ?,
             data_emissao = ?,
             data_validade = ?,
             aprovado_em = CASE WHEN ? = 'APROVADO' THEN NOW() ELSE aprovado_em END,
             rejeitado_em = CASE WHEN ? = 'REJEITADO' THEN NOW() ELSE rejeitado_em END,
             arquivado_em = CASE WHEN ? = 'ARQUIVADO' THEN NOW() ELSE arquivado_em END
       WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?
    `,
    [
      payload.status,
      payload.status === 'REJEITADO' ? payload.motivo_rejeicao ?? null : null,
      payload.data_emissao ?? atual.data_emissao ?? null,
      payload.data_validade ?? atual.data_validade ?? null,
      payload.status,
      payload.status,
      payload.status,
      tenantId,
      documentoEmpresaId,
      arquivoId
    ]
  );

  const atualizado = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!atualizado) {
    throw new AppError('Arquivo não encontrado após atualização', 404);
  }

  return atualizado;
}

export async function publicarDocumentoArquivoService(
  documentoEmpresaId: number,
  arquivoId: number,
  tenantId: number
): Promise<DocumentoArquivo> {
  await validarDocumentoEmpresa(tenantId, documentoEmpresaId);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query<any[]>(
      `
        SELECT id, status
          FROM documentos_arquivos
         WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?
         FOR UPDATE
      `,
      [tenantId, documentoEmpresaId, arquivoId]
    );
    const alvo = rows[0] as { id: number; status: DocumentoArquivoStatus } | undefined;

    if (!alvo) {
      throw new AppError('Arquivo não encontrado', 404);
    }

    if (alvo.status !== 'APROVADO' && alvo.status !== 'PUBLICADO') {
      throw new AppError('Somente arquivos APROVADOS podem ser publicados', 400);
    }

    if (alvo.status === 'PUBLICADO') {
      await conn.commit();
      const jaPublicado = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
      if (!jaPublicado) {
        throw new AppError('Arquivo não encontrado após publicação', 404);
      }
      return jaPublicado;
    }

    await conn.query(
      `
        UPDATE documentos_arquivos
           SET status = 'ARQUIVADO',
               arquivado_em = NOW()
         WHERE tenant_id = ?
           AND documento_empresa_id = ?
           AND status = 'PUBLICADO'
           AND id <> ?
      `,
      [tenantId, documentoEmpresaId, arquivoId]
    );

    await conn.query(
      `
        UPDATE documentos_arquivos
           SET status = 'PUBLICADO',
               publicado_em = NOW(),
               motivo_rejeicao = NULL
         WHERE tenant_id = ? AND documento_empresa_id = ? AND id = ?
      `,
      [tenantId, documentoEmpresaId, arquivoId]
    );

    await conn.commit();
  } catch (err: any) {
    await conn.rollback();
    if (err?.code === 'ER_DUP_ENTRY') {
      throw new AppError('Já existe um arquivo publicado para este documento', 409);
    }
    throw err;
  } finally {
    conn.release();
  }

  const publicado = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (!publicado) {
    throw new AppError('Arquivo não encontrado após publicação', 404);
  }

  return publicado;
}

export async function deletarDocumentoArquivoService(
  documentoEmpresaId: number,
  arquivoId: number,
  tenantId: number
): Promise<boolean> {
  const atual = await obterDocumentoArquivoPorIdService(documentoEmpresaId, arquivoId, tenantId);
  if (atual?.status === 'PUBLICADO') {
    throw new AppError('Não é permitido excluir um arquivo publicado. Arquive antes.', 400);
  }

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

export async function listarDocumentosPublicadosVencidosService(
  tenantId: number
): Promise<DocumentoArquivoComContexto[]> {
  return tenantQuery<DocumentoArquivoComContexto>(
    tenantId,
    queryArquivosComContexto(
      "AND da.status = 'PUBLICADO' AND da.data_validade IS NOT NULL AND da.data_validade < CURDATE()",
      'ORDER BY da.data_validade ASC, da.id DESC'
    )
  );
}

export async function listarDocumentosPublicadosVencendo30DiasService(
  tenantId: number
): Promise<DocumentoArquivoComContexto[]> {
  return tenantQuery<DocumentoArquivoComContexto>(
    tenantId,
    queryArquivosComContexto(
      "AND da.status = 'PUBLICADO' AND da.data_validade IS NOT NULL AND da.data_validade BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)",
      'ORDER BY da.data_validade ASC, da.id DESC'
    )
  );
}

export async function listarDocumentosNaoPublicadosAtivosService(
  tenantId: number
): Promise<DocumentoArquivoComContexto[]> {
  return tenantQuery<DocumentoArquivoComContexto>(
    tenantId,
    queryArquivosComContexto(
      `AND da.status IN (${STATUS_NAO_PUBLICADOS_ATIVOS.map(() => '?').join(',')})`,
      'ORDER BY da.id DESC'
    ),
    STATUS_NAO_PUBLICADOS_ATIVOS
  );
}

export async function listarHistoricoArquivadoService(
  tenantId: number
): Promise<DocumentoArquivoComContexto[]> {
  return tenantQuery<DocumentoArquivoComContexto>(
    tenantId,
    queryArquivosComContexto("AND da.status = 'ARQUIVADO'", 'ORDER BY da.arquivado_em DESC, da.id DESC')
  );
}
