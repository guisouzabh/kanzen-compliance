import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { SolicitacaoTitular } from '../types/SolicitacaoTitular';
import { AppError } from '../errors/AppError';

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

async function validarResponsavel(tenantId: number, responsavelId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [responsavelId]
  );
  if (!rows.length) {
    throw new AppError('Responsável inválido para este tenant', 400);
  }
}

function gerarProtocolo() {
  const agora = new Date();
  const data = agora.toISOString().slice(0, 10).replace(/-/g, '');
  const hora = agora.toTimeString().slice(0, 8).replace(/:/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DSR-${data}-${hora}-${rand}`;
}

export async function listarSolicitacoesTitularService(
  tenantId: number
): Promise<SolicitacaoTitular[]> {
  return tenantQuery<SolicitacaoTitular>(
    tenantId,
    `
      SELECT s.*, e.nome AS empresa_nome
        FROM solicitacoes_titular s
        JOIN empresas e ON e.id = s.empresa_id AND e.tenant_id = s.tenant_id
       WHERE s.tenant_id = ?
       ORDER BY s.created_at DESC
    `
  );
}

export async function obterSolicitacaoTitularPorIdService(
  id: number,
  tenantId: number
): Promise<SolicitacaoTitular | null> {
  const rows = await tenantQuery<SolicitacaoTitular>(
    tenantId,
    `
      SELECT s.*, e.nome AS empresa_nome
        FROM solicitacoes_titular s
        JOIN empresas e ON e.id = s.empresa_id AND e.tenant_id = s.tenant_id
       WHERE s.tenant_id = ? AND s.id = ?
    `,
    [id]
  );

  return rows[0] ?? null;
}

export async function criarSolicitacaoTitularService(
  dados: SolicitacaoTitular,
  tenantId: number
): Promise<SolicitacaoTitular> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const protocolo = gerarProtocolo();
  const tipoRelacao = dados.tipo_relacao ?? 'OUTRO';
  const canalResposta = dados.canal_resposta ?? 'EMAIL';
  const status = dados.status ?? 'ABERTO';

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO solicitacoes_titular (
        tenant_id,
        empresa_id,
        protocolo,
        canal_entrada,
        nome,
        cpf,
        data_nascimento,
        email,
        telefone,
        endereco,
        tipo_relacao,
        identificador_interno,
        periodo_relacao,
        tipo_solicitacao,
        descricao_pedido,
        categorias_dados,
        sistemas,
        canal_resposta,
        idioma,
        declaracao_veracidade,
        ciente_prazo,
        autorizacao_uso,
        status,
        responsavel_id,
        prazo_resposta
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      protocolo,
      dados.canal_entrada ?? null,
      dados.nome,
      dados.cpf ?? null,
      dados.data_nascimento ?? null,
      dados.email,
      dados.telefone ?? null,
      dados.endereco ?? null,
      tipoRelacao,
      dados.identificador_interno ?? null,
      dados.periodo_relacao ?? null,
      dados.tipo_solicitacao,
      dados.descricao_pedido,
      dados.categorias_dados ?? null,
      dados.sistemas ?? null,
      canalResposta,
      dados.idioma ?? null,
      dados.declaracao_veracidade ?? false,
      dados.ciente_prazo ?? false,
      dados.autorizacao_uso ?? false,
      status,
      dados.responsavel_id ?? null,
      dados.prazo_resposta ?? null
    ]
  );

  const id = (result as any).insertId;
  const criada = await obterSolicitacaoTitularPorIdService(id, tenantId);
  return (
    criada ?? {
      ...dados,
      id,
      protocolo,
      tipo_relacao: tipoRelacao,
      canal_resposta: canalResposta,
      status
    }
  );
}

export async function atualizarSolicitacaoTitularService(
  id: number,
  dados: SolicitacaoTitular,
  tenantId: number
): Promise<SolicitacaoTitular | null> {
  await validarEmpresa(tenantId, dados.empresa_id);
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const tipoRelacao = dados.tipo_relacao ?? 'OUTRO';
  const canalResposta = dados.canal_resposta ?? 'EMAIL';
  const status = dados.status ?? 'ABERTO';

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE solicitacoes_titular
         SET tenant_id = ?,
             empresa_id = ?,
             canal_entrada = ?,
             nome = ?,
             cpf = ?,
             data_nascimento = ?,
             email = ?,
             telefone = ?,
             endereco = ?,
             tipo_relacao = ?,
             identificador_interno = ?,
             periodo_relacao = ?,
             tipo_solicitacao = ?,
             descricao_pedido = ?,
             categorias_dados = ?,
             sistemas = ?,
             canal_resposta = ?,
             idioma = ?,
             declaracao_veracidade = ?,
             ciente_prazo = ?,
             autorizacao_uso = ?,
             status = ?,
             responsavel_id = ?,
             prazo_resposta = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.canal_entrada ?? null,
      dados.nome,
      dados.cpf ?? null,
      dados.data_nascimento ?? null,
      dados.email,
      dados.telefone ?? null,
      dados.endereco ?? null,
      tipoRelacao,
      dados.identificador_interno ?? null,
      dados.periodo_relacao ?? null,
      dados.tipo_solicitacao,
      dados.descricao_pedido,
      dados.categorias_dados ?? null,
      dados.sistemas ?? null,
      canalResposta,
      dados.idioma ?? null,
      dados.declaracao_veracidade ?? false,
      dados.ciente_prazo ?? false,
      dados.autorizacao_uso ?? false,
      status,
      dados.responsavel_id ?? null,
      dados.prazo_resposta ?? null,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterSolicitacaoTitularPorIdService(id, tenantId);
}

export async function deletarSolicitacaoTitularService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM solicitacoes_titular WHERE tenant_id = ? AND id = ?',
    [id]
  );
  const { affectedRows } = result as any;
  return !!affectedRows;
}
