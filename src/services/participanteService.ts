import crypto from 'crypto';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { TreinamentoParticipante } from '../types/Treinamento';
import { upsertColaboradorService } from './colaboradorService';

// ─── Participantes ────────────────────────────────────────────────────────────

export async function listarParticipantesService(
  turmaId: number,
  tenantId: number
): Promise<TreinamentoParticipante[]> {
  return tenantQuery<TreinamentoParticipante>(
    tenantId,
    `SELECT p.*, c.nome AS colaborador_nome, c.email AS colaborador_email,
            c.identificador AS colaborador_identificador,
            c.data_nascimento AS colaborador_data_nascimento,
            c.cargo AS colaborador_cargo
       FROM treinamento_participantes p
       JOIN colaboradores c ON c.id = p.colaborador_id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.turma_id = ?
      ORDER BY c.nome ASC`,
    [turmaId]
  );
}

export async function adicionarParticipanteService(
  turmaId: number,
  colaboradorId: number,
  tenantId: number
): Promise<TreinamentoParticipante> {
  // Verificar se colaborador pertence ao tenant
  const cols = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM colaboradores WHERE tenant_id = ? AND id = ?',
    [colaboradorId]
  );
  if (!cols.length) throw new AppError('Colaborador não encontrado', 404);

  try {
    await tenantExecute(
      tenantId,
      `INSERT INTO treinamento_participantes (tenant_id, turma_id, colaborador_id)
       VALUES (?, ?, ?)`,
      [turmaId, colaboradorId]
    );
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError('Colaborador já é participante desta turma', 409);
    }
    throw err;
  }

  const rows = await tenantQuery<TreinamentoParticipante>(
    tenantId,
    `SELECT p.*, c.nome AS colaborador_nome, c.email AS colaborador_email
       FROM treinamento_participantes p
       JOIN colaboradores c ON c.id = p.colaborador_id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.turma_id = ? AND p.colaborador_id = ?`,
    [turmaId, colaboradorId]
  );
  return rows[0];
}

export async function removerParticipanteService(
  id: number,
  turmaId: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM treinamento_participantes WHERE tenant_id = ? AND id = ? AND turma_id = ?',
    [id, turmaId]
  );
  return (result as any).affectedRows > 0;
}

// ─── Import CSV ───────────────────────────────────────────────────────────────

interface LinhaCsv {
  nome: string;
  email: string;
  identificador?: string | null;
  data_nascimento?: string | null;
  cargo?: string | null;
}

interface ResultadoImport {
  criados: number;
  atualizados: number;
  erros: Array<{ linha: number; email: string; erro: string }>;
}

export async function importarParticipantesService(
  turmaId: number,
  empresaId: number,
  participantes: LinhaCsv[],
  tenantId: number
): Promise<ResultadoImport> {
  const resultado: ResultadoImport = { criados: 0, atualizados: 0, erros: [] };

  for (let i = 0; i < participantes.length; i++) {
    const linha = participantes[i];
    try {
      const { id: colaboradorId, criado } = await upsertColaboradorService(
        tenantId,
        empresaId,
        linha
      );

      // Vincular como participante (ignorar duplicata)
      try {
        await tenantExecute(
          tenantId,
          `INSERT IGNORE INTO treinamento_participantes (tenant_id, turma_id, colaborador_id)
           VALUES (?, ?, ?)`,
          [turmaId, colaboradorId]
        );
      } catch (_) {
        // silencia duplicata
      }

      if (criado) resultado.criados++;
      else resultado.atualizados++;
    } catch (err: any) {
      resultado.erros.push({ linha: i + 1, email: linha.email, erro: err.message ?? 'Erro desconhecido' });
    }
  }

  return resultado;
}

// ─── Magic Links ──────────────────────────────────────────────────────────────

export async function enviarMagicLinksService(
  turmaId: number,
  tenantId: number,
  baseUrl: string,
  expiracaoHoras: number = 72
): Promise<number> {
  const participantes = await tenantQuery<{ id: number; colaborador_email: string; colaborador_nome: string }>(
    tenantId,
    `SELECT p.id, c.email AS colaborador_email, c.nome AS colaborador_nome
       FROM treinamento_participantes p
       JOIN colaboradores c ON c.id = p.colaborador_id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.turma_id = ? AND p.status IN ('PENDENTE','EM_ANDAMENTO')`,
    [turmaId]
  );

  const turmaInfo = await tenantQuery<{ tema: string; slug: string }>(
    tenantId,
    'SELECT tema, slug FROM turmas_treinamento WHERE tenant_id = ? AND id = ?',
    [turmaId]
  );
  if (!turmaInfo.length) throw new AppError('Turma não encontrada', 404);

  const expira = new Date();
  expira.setHours(expira.getHours() + expiracaoHoras);
  const expiraStr = expira.toISOString().slice(0, 19).replace('T', ' ');

  let enviados = 0;

  for (const p of participantes) {
    const token = crypto.randomBytes(32).toString('hex');

    await tenantExecute(
      tenantId,
      `UPDATE treinamento_participantes
          SET magic_token = ?, magic_token_expira_em = ?
        WHERE tenant_id = ? AND id = ?`,
      [token, expiraStr, p.id]
    );

    const link = `${baseUrl}/t/magic/${token}`;
    const corpoHtml = `
      <h2>Convite de Treinamento LGPD</h2>
      <p>Olá, <strong>${p.colaborador_nome}</strong>!</p>
      <p>Você foi convidado para participar do treinamento: <strong>${turmaInfo[0].tema}</strong>.</p>
      <p>Clique no botão abaixo para acessar diretamente:</p>
      <p><a href="${link}" style="background:#0b5be1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
        Acessar Treinamento
      </a></p>
      <p>Este link expira em ${expiracaoHoras} horas.</p>
    `;

    await tenantExecute(
      tenantId,
      `INSERT INTO email_queue
         (tenant_id, destinatario_email, destinatario_nome, assunto, corpo_html,
          tipo, referencia_tipo, referencia_id)
       VALUES (?, ?, ?, ?, ?, 'MAGIC_LINK', 'TURMA_TREINAMENTO', ?)`,
      [
        p.colaborador_email,
        p.colaborador_nome,
        `Acesse seu treinamento: ${turmaInfo[0].tema}`,
        corpoHtml,
        turmaId
      ]
    );

    enviados++;
  }

  return enviados;
}

// ─── Relatório ────────────────────────────────────────────────────────────────

export interface RelatorioParticipante {
  participante_id: number;
  colaborador_nome: string;
  colaborador_email: string;
  status: string;
  nota_final: number | null;
  tentativas_realizadas: number;
  concluido_em: string | null;
}

export async function relatorioTurmaService(
  turmaId: number,
  tenantId: number
): Promise<{ turma: any; participantes: RelatorioParticipante[]; stats: any }> {
  const turmas = await tenantQuery<any>(
    tenantId,
    `SELECT t.*, p.nome AS nome_plano, e.nome AS empresa_nome
       FROM turmas_treinamento t
       JOIN planos p ON p.id = t.plano_id
       JOIN empresas e ON e.id = t.empresa_id
      WHERE t.tenant_id = ? AND t.id = ?`,
    [turmaId]
  );
  if (!turmas.length) throw new AppError('Turma não encontrada', 404);

  const participantes = await tenantQuery<RelatorioParticipante>(
    tenantId,
    `SELECT p.id AS participante_id, c.nome AS colaborador_nome, c.email AS colaborador_email,
            p.status, p.nota_final, p.tentativas_realizadas, p.concluido_em
       FROM treinamento_participantes p
       JOIN colaboradores c ON c.id = p.colaborador_id AND c.tenant_id = p.tenant_id
      WHERE p.tenant_id = ? AND p.turma_id = ?
      ORDER BY c.nome ASC`,
    [turmaId]
  );

  const total = participantes.length;
  const aprovados   = participantes.filter((p) => p.status === 'APROVADO').length;
  const reprovados  = participantes.filter((p) => p.status === 'REPROVADO').length;
  const pendentes   = participantes.filter((p) => p.status === 'PENDENTE').length;
  const emAndamento = participantes.filter((p) => p.status === 'EM_ANDAMENTO').length;

  return {
    turma: turmas[0],
    participantes,
    stats: {
      total,
      aprovados,
      reprovados,
      pendentes,
      em_andamento: emAndamento,
      percentual_conclusao: total ? Math.round((aprovados / total) * 100) : 0
    }
  };
}
