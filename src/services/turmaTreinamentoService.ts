import crypto from 'crypto';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { pool } from '../config/db';
import { AppError } from '../errors/AppError';
import { TurmaTreinamento } from '../types/TurmaTreinamento';
import { validarPlanoDoTenant } from './planoService';

function gerarSlug(): string {
  return crypto.randomBytes(6).toString('hex'); // 12 chars hex
}

async function validarResponsavel(tenantId: number, responsavelId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM usuarios WHERE tenant_id = ? AND id = ?',
    [responsavelId]
  );
  if (!rows.length) throw new AppError('Responsável inválido para este tenant', 400);
}

export async function listarTurmasService(
  tenantId: number,
  planoId: number
): Promise<TurmaTreinamento[]> {
  return tenantQuery<TurmaTreinamento>(
    tenantId,
    `
      SELECT t.*, u.nome AS responsavel_nome
        FROM turmas_treinamento t
        LEFT JOIN usuarios u ON u.id = t.responsavel_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.plano_id = ?
       ORDER BY t.id ASC
    `,
    [planoId]
  );
}

export async function obterTurmaPorIdService(
  id: number,
  tenantId: number,
  planoId: number
): Promise<TurmaTreinamento | null> {
  const rows = await tenantQuery<TurmaTreinamento>(
    tenantId,
    `
      SELECT t.*, u.nome AS responsavel_nome
        FROM turmas_treinamento t
        LEFT JOIN usuarios u ON u.id = t.responsavel_id AND u.tenant_id = t.tenant_id
       WHERE t.tenant_id = ? AND t.plano_id = ? AND t.id = ?
    `,
    [planoId, id]
  );
  return rows[0] ?? null;
}

export async function criarTurmaService(
  dados: TurmaTreinamento,
  tenantId: number,
  planoId: number
): Promise<TurmaTreinamento> {
  await validarPlanoDoTenant(tenantId, planoId, 'TREINAMENTO');
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const slug = gerarSlug();

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO turmas_treinamento
        (tenant_id, plano_id, empresa_id, tema, instrutor, modalidade, data_inicio, data_fim,
         carga_horaria, local_realizacao, status, slug, prazo_conclusao, created_by_usuario_id, responsavel_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      planoId,
      dados.empresa_id,
      dados.tema,
      dados.instrutor ?? null,
      dados.modalidade ?? 'PRESENCIAL',
      dados.data_inicio ?? null,
      dados.data_fim ?? null,
      dados.carga_horaria ?? null,
      dados.local_realizacao ?? null,
      dados.status ?? 'AGENDADA',
      slug,
      dados.prazo_conclusao ?? null,
      dados.created_by_usuario_id ?? null,
      dados.responsavel_id ?? null
    ]
  );

  const id = (result as any).insertId;
  const criada = await obterTurmaPorIdService(id, tenantId, planoId);
  return criada!;
}

export async function atualizarTurmaService(
  id: number,
  dados: TurmaTreinamento,
  tenantId: number,
  planoId: number
): Promise<TurmaTreinamento | null> {
  await validarPlanoDoTenant(tenantId, planoId, 'TREINAMENTO');
  if (dados.responsavel_id) {
    await validarResponsavel(tenantId, dados.responsavel_id);
  }

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE turmas_treinamento
         SET tenant_id        = ?,
             empresa_id       = ?,
             tema             = ?,
             instrutor        = ?,
             modalidade       = ?,
             data_inicio      = ?,
             data_fim         = ?,
             carga_horaria    = ?,
             local_realizacao = ?,
             status           = ?,
             prazo_conclusao  = ?,
             responsavel_id   = ?
       WHERE tenant_id = ? AND plano_id = ? AND id = ?
    `,
    [
      dados.empresa_id,
      dados.tema,
      dados.instrutor ?? null,
      dados.modalidade ?? 'PRESENCIAL',
      dados.data_inicio ?? null,
      dados.data_fim ?? null,
      dados.carga_horaria ?? null,
      dados.local_realizacao ?? null,
      dados.status ?? 'AGENDADA',
      dados.prazo_conclusao ?? null,
      dados.responsavel_id ?? null,
      tenantId,
      planoId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;

  return obterTurmaPorIdService(id, tenantId, planoId);
}

export async function deletarTurmaService(
  id: number,
  tenantId: number,
  planoId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM turmas_treinamento WHERE tenant_id = ? AND plano_id = ? AND id = ?',
    [planoId, id]
  );
  return (result as any).affectedRows > 0;
}

export async function clonarTurmaService(
  turmaId: number,
  tenantId: number,
  opcoes: { tema?: string; prazo_conclusao?: string | null } = {}
): Promise<TurmaTreinamento> {
  const rows = await tenantQuery<TurmaTreinamento>(
    tenantId,
    'SELECT * FROM turmas_treinamento WHERE tenant_id = ? AND id = ?',
    [turmaId]
  );
  if (!rows.length) throw new AppError('Turma não encontrada', 404);

  const original = rows[0];
  const novoSlug = gerarSlug();
  const novoTema = opcoes.tema ?? `${original.tema} (cópia)`;

  // Clonar turma
  const result = await tenantExecute(
    tenantId,
    `INSERT INTO turmas_treinamento
       (tenant_id, plano_id, empresa_id, tema, instrutor, modalidade, data_inicio, data_fim,
        carga_horaria, local_realizacao, status, slug, prazo_conclusao, responsavel_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AGENDADA', ?, ?, ?)`,
    [
      original.plano_id,
      original.empresa_id,
      novoTema,
      original.instrutor ?? null,
      original.modalidade ?? 'PRESENCIAL',
      original.data_inicio ?? null,
      original.data_fim ?? null,
      original.carga_horaria ?? null,
      original.local_realizacao ?? null,
      novoSlug,
      opcoes.prazo_conclusao !== undefined ? opcoes.prazo_conclusao : (original.prazo_conclusao ?? null),
      original.responsavel_id ?? null
    ]
  );

  const novaId = (result as any).insertId;

  // Copiar materiais extras (pool.query direto: INSERT...SELECT com múltiplos ? no SELECT e WHERE)
  await pool.query(
    `INSERT INTO treinamento_turma_materiais (tenant_id, turma_id, titulo, tipo, url, ordem)
     SELECT tenant_id, ?, titulo, tipo, url, ordem
       FROM treinamento_turma_materiais
      WHERE tenant_id = ? AND turma_id = ? AND ativo = 1`,
    [novaId, tenantId, turmaId]
  );

  // Copiar participantes com status resetado para PENDENTE
  await pool.query(
    `INSERT INTO treinamento_participantes (tenant_id, turma_id, colaborador_id, status)
     SELECT tenant_id, ?, colaborador_id, 'PENDENTE'
       FROM treinamento_participantes
      WHERE tenant_id = ? AND turma_id = ?`,
    [novaId, tenantId, turmaId]
  );

  const nova = await obterTurmaPorIdService(novaId, tenantId, original.plano_id);
  return nova!;
}
