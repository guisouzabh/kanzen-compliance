import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import {
  ConfiguracaoTreinamento,
  TreinamentoMaterial,
  TreinamentoQuizPergunta,
  Alternativa
} from '../types/Treinamento';
import { validarPlanoDoTenant } from './planoService';
import {
  ConfiguracaoTreinamentoInput,
  TreinamentoMaterialInput,
  TreinamentoQuizPerguntaInput
} from '../validation/treinamentoSchema';

// ─── Configurações de Treinamento ────────────────────────────────────────────

export async function obterConfigService(
  planoId: number,
  tenantId: number
): Promise<ConfiguracaoTreinamento | null> {
  const rows = await tenantQuery<ConfiguracaoTreinamento>(
    tenantId,
    'SELECT * FROM configuracoes_treinamento WHERE tenant_id = ? AND plano_id = ?',
    [planoId]
  );
  return rows[0] ?? null;
}

export async function criarOuAtualizarConfigService(
  planoId: number,
  dados: ConfiguracaoTreinamentoInput,
  tenantId: number
): Promise<ConfiguracaoTreinamento> {
  await validarPlanoDoTenant(tenantId, planoId, 'TREINAMENTO');

  const existente = await obterConfigService(planoId, tenantId);

  if (existente) {
    await tenantExecute(
      tenantId,
      `UPDATE configuracoes_treinamento
          SET quiz_habilitado = ?, nota_minima = ?, max_tentativas = ?,
              tipo_identificador = ?, label_identificador = ?, link_publico_habilitado = ?
        WHERE tenant_id = ? AND plano_id = ?`,
      [
        dados.quiz_habilitado ?? existente.quiz_habilitado ?? 0,
        dados.nota_minima !== undefined ? dados.nota_minima : existente.nota_minima,
        dados.max_tentativas !== undefined ? dados.max_tentativas : existente.max_tentativas,
        dados.tipo_identificador ?? existente.tipo_identificador ?? 'CPF',
        dados.label_identificador ?? existente.label_identificador ?? 'CPF',
        dados.link_publico_habilitado ?? existente.link_publico_habilitado ?? 1,
        planoId
      ]
    );
  } else {
    await tenantExecute(
      tenantId,
      `INSERT INTO configuracoes_treinamento
         (tenant_id, plano_id, quiz_habilitado, nota_minima, max_tentativas,
          tipo_identificador, label_identificador, link_publico_habilitado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        planoId,
        dados.quiz_habilitado ?? 0,
        dados.nota_minima ?? null,
        dados.max_tentativas ?? null,
        dados.tipo_identificador ?? 'CPF',
        dados.label_identificador ?? 'CPF',
        dados.link_publico_habilitado ?? 1
      ]
    );
  }

  return (await obterConfigService(planoId, tenantId))!;
}

// ─── Materiais do Plano ──────────────────────────────────────────────────────

export async function listarMateriaisPlanoService(
  planoId: number,
  tenantId: number
): Promise<TreinamentoMaterial[]> {
  return tenantQuery<TreinamentoMaterial>(
    tenantId,
    `SELECT * FROM treinamento_materiais
      WHERE tenant_id = ? AND plano_id = ? AND ativo = 1
      ORDER BY ordem ASC, id ASC`,
    [planoId]
  );
}

export async function criarMaterialPlanoService(
  planoId: number,
  dados: TreinamentoMaterialInput,
  tenantId: number
): Promise<TreinamentoMaterial> {
  await validarPlanoDoTenant(tenantId, planoId, 'TREINAMENTO');

  const result = await tenantExecute(
    tenantId,
    `INSERT INTO treinamento_materiais (tenant_id, plano_id, titulo, tipo, url, ordem)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [planoId, dados.titulo, dados.tipo, dados.url, dados.ordem ?? 0]
  );

  const id = (result as any).insertId;
  const rows = await tenantQuery<TreinamentoMaterial>(
    tenantId,
    'SELECT * FROM treinamento_materiais WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return rows[0];
}

export async function atualizarMaterialPlanoService(
  id: number,
  planoId: number,
  dados: TreinamentoMaterialInput,
  tenantId: number
): Promise<TreinamentoMaterial | null> {
  const result = await tenantExecute(
    tenantId,
    `UPDATE treinamento_materiais
        SET titulo = ?, tipo = ?, url = ?, ordem = ?
      WHERE tenant_id = ? AND id = ? AND plano_id = ?`,
    [dados.titulo, dados.tipo, dados.url, dados.ordem ?? 0, id, planoId]
  );

  if (!(result as any).affectedRows) return null;

  const rows = await tenantQuery<TreinamentoMaterial>(
    tenantId,
    'SELECT * FROM treinamento_materiais WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return rows[0] ?? null;
}

export async function deletarMaterialPlanoService(
  id: number,
  planoId: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM treinamento_materiais WHERE tenant_id = ? AND id = ? AND plano_id = ?',
    [id, planoId]
  );
  return (result as any).affectedRows > 0;
}

// ─── Quiz Perguntas ──────────────────────────────────────────────────────────

function parseAlternativas(rows: TreinamentoQuizPergunta[]): TreinamentoQuizPergunta[] {
  return rows.map((p) => ({
    ...p,
    alternativas: JSON.parse(p.alternativas_json) as Alternativa[]
  }));
}

export async function listarPerguntasQuizService(
  planoId: number,
  tenantId: number
): Promise<TreinamentoQuizPergunta[]> {
  const rows = await tenantQuery<TreinamentoQuizPergunta>(
    tenantId,
    `SELECT * FROM treinamento_quiz_perguntas
      WHERE tenant_id = ? AND plano_id = ? AND ativo = 1
      ORDER BY ordem ASC, id ASC`,
    [planoId]
  );
  return parseAlternativas(rows);
}

export async function criarPerguntaQuizService(
  planoId: number,
  dados: TreinamentoQuizPerguntaInput,
  tenantId: number
): Promise<TreinamentoQuizPergunta> {
  await validarPlanoDoTenant(tenantId, planoId, 'TREINAMENTO');
  const alternativasJson = JSON.stringify(dados.alternativas);

  const result = await tenantExecute(
    tenantId,
    `INSERT INTO treinamento_quiz_perguntas (tenant_id, plano_id, pergunta, alternativas_json, ordem)
     VALUES (?, ?, ?, ?, ?)`,
    [planoId, dados.pergunta, alternativasJson, dados.ordem ?? 0]
  );

  const id = (result as any).insertId;
  const rows = await tenantQuery<TreinamentoQuizPergunta>(
    tenantId,
    'SELECT * FROM treinamento_quiz_perguntas WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return parseAlternativas(rows)[0];
}

export async function atualizarPerguntaQuizService(
  id: number,
  planoId: number,
  dados: TreinamentoQuizPerguntaInput,
  tenantId: number
): Promise<TreinamentoQuizPergunta | null> {
  const alternativasJson = JSON.stringify(dados.alternativas);

  const result = await tenantExecute(
    tenantId,
    `UPDATE treinamento_quiz_perguntas
        SET pergunta = ?, alternativas_json = ?, ordem = ?
      WHERE tenant_id = ? AND id = ? AND plano_id = ?`,
    [dados.pergunta, alternativasJson, dados.ordem ?? 0, id, planoId]
  );

  if (!(result as any).affectedRows) return null;

  const rows = await tenantQuery<TreinamentoQuizPergunta>(
    tenantId,
    'SELECT * FROM treinamento_quiz_perguntas WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return rows.length ? parseAlternativas(rows)[0] : null;
}

export async function deletarPerguntaQuizService(
  id: number,
  planoId: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM treinamento_quiz_perguntas WHERE tenant_id = ? AND id = ? AND plano_id = ?',
    [id, planoId]
  );
  return (result as any).affectedRows > 0;
}

// ─── Materiais da Turma ──────────────────────────────────────────────────────

export async function listarMateriaisTurmaService(
  turmaId: number,
  tenantId: number
): Promise<TreinamentoMaterial[]> {
  // Materiais do plano da turma
  const doPlano = await tenantQuery<TreinamentoMaterial>(
    tenantId,
    `SELECT tm.*, 'PLANO' AS origem
       FROM treinamento_materiais tm
       JOIN turmas_treinamento t ON t.plano_id = tm.plano_id AND t.tenant_id = tm.tenant_id
      WHERE tm.tenant_id = ? AND t.id = ? AND tm.ativo = 1
      ORDER BY tm.ordem ASC, tm.id ASC`,
    [turmaId]
  );

  // Materiais extras da turma
  const extras = await tenantQuery<TreinamentoMaterial>(
    tenantId,
    `SELECT *, 'TURMA' AS origem
       FROM treinamento_turma_materiais
      WHERE tenant_id = ? AND turma_id = ? AND ativo = 1
      ORDER BY ordem ASC, id ASC`,
    [turmaId]
  );

  return [...doPlano, ...extras];
}

export async function criarMaterialTurmaService(
  turmaId: number,
  dados: TreinamentoMaterialInput,
  tenantId: number
): Promise<TreinamentoMaterial> {
  const result = await tenantExecute(
    tenantId,
    `INSERT INTO treinamento_turma_materiais (tenant_id, turma_id, titulo, tipo, url, ordem)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [turmaId, dados.titulo, dados.tipo, dados.url, dados.ordem ?? 0]
  );

  const id = (result as any).insertId;
  const rows = await tenantQuery<TreinamentoMaterial>(
    tenantId,
    'SELECT * FROM treinamento_turma_materiais WHERE tenant_id = ? AND id = ?',
    [id]
  );
  return { ...rows[0], origem: 'TURMA' };
}

export async function deletarMaterialTurmaService(
  id: number,
  turmaId: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM treinamento_turma_materiais WHERE tenant_id = ? AND id = ? AND turma_id = ?',
    [id, turmaId]
  );
  return (result as any).affectedRows > 0;
}
