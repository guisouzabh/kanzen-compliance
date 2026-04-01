import { pool } from '../config/db';
import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { TreinamentoParticipante, TreinamentoQuizPergunta, Alternativa } from '../types/Treinamento';

// ─── Buscar info da turma (tela de identificação) ────────────────────────────

export async function obterInfoTurmaPublicaService(slug: string) {
  const [rows]: any = await pool.query(
    `SELECT t.id, t.tema, t.slug, t.prazo_conclusao, t.status,
            e.nome AS empresa_nome, ct.link_publico_habilitado,
            ct.tipo_identificador, ct.label_identificador
       FROM turmas_treinamento t
       JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE t.slug = ?`,
    [slug]
  );

  if (!rows.length) throw new AppError('Turma não encontrada', 404);
  const turma = rows[0];

  if (!turma.link_publico_habilitado) {
    throw new AppError('Acesso público desabilitado para esta turma', 403);
  }

  return {
    tema:               turma.tema,
    empresa_nome:       turma.empresa_nome,
    prazo_conclusao:    turma.prazo_conclusao,
    label_identificador: turma.label_identificador ?? 'CPF'
  };
}

// ─── Identificar participante (login público) ─────────────────────────────────

export async function identificarParticipanteService(
  slug: string,
  identificador: string,
  dataNascimento: string
) {
  const [turmaRows]: any = await pool.query(
    `SELECT t.id AS turma_id, t.plano_id, t.tenant_id, t.tema, t.prazo_conclusao,
            e.nome AS empresa_nome,
            ct.quiz_habilitado, ct.nota_minima, ct.max_tentativas,
            ct.label_identificador, ct.link_publico_habilitado
       FROM turmas_treinamento t
       JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE t.slug = ?`,
    [slug]
  );

  if (!turmaRows.length) throw new AppError('Turma não encontrada', 404);
  const turma = turmaRows[0];

  if (!turma.link_publico_habilitado) {
    throw new AppError('Acesso público desabilitado', 403);
  }

  const tenantId = turma.tenant_id;

  // Encontrar colaborador pelo identificador + data_nascimento
  const colaboradores = await tenantQuery<{ id: number }>(
    tenantId,
    `SELECT c.id
       FROM colaboradores c
      WHERE c.tenant_id = ? AND (c.identificador = ? OR c.cpf = ?)
        AND c.data_nascimento = ? AND c.ativo = 1`,
    [identificador, identificador, dataNascimento]
  );

  if (!colaboradores.length) {
    throw new AppError('Dados não encontrados', 401);
  }

  const colaboradorId = colaboradores[0].id;

  // Buscar participante na turma
  const participantes = await tenantQuery<TreinamentoParticipante>(
    tenantId,
    `SELECT p.* FROM treinamento_participantes p
      WHERE p.tenant_id = ? AND p.turma_id = ? AND p.colaborador_id = ?`,
    [turma.turma_id, colaboradorId]
  );

  if (!participantes.length) {
    throw new AppError('Dados não encontrados', 401);
  }

  const participante = participantes[0];

  return montarRespostaPublica(tenantId, turma, participante);
}

// ─── Acesso por magic link ───────────────────────────────────────────────────

export async function obterParticipantePorMagicTokenService(token: string) {
  const [rows]: any = await pool.query(
    `SELECT p.*, t.plano_id, t.tenant_id, t.tema, t.prazo_conclusao,
            e.nome AS empresa_nome,
            ct.quiz_habilitado, ct.nota_minima, ct.max_tentativas, ct.label_identificador
       FROM treinamento_participantes p
       JOIN turmas_treinamento t ON t.id = p.turma_id
       JOIN empresas e ON e.id = t.empresa_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE p.magic_token = ?`,
    [token]
  );

  if (!rows.length) throw new AppError('Link inválido ou expirado', 401);

  const row = rows[0];
  const agora = new Date();
  if (row.magic_token_expira_em && new Date(row.magic_token_expira_em) < agora) {
    throw new AppError('Link expirado', 401);
  }

  const tenantId = row.tenant_id;
  const turma = {
    turma_id: row.turma_id,
    plano_id: row.plano_id,
    tema: row.tema,
    prazo_conclusao: row.prazo_conclusao,
    empresa_nome: row.empresa_nome,
    quiz_habilitado: row.quiz_habilitado,
    nota_minima: row.nota_minima,
    max_tentativas: row.max_tentativas,
    label_identificador: row.label_identificador
  };
  const participante: TreinamentoParticipante = {
    id: row.id,
    tenant_id: row.tenant_id,
    turma_id: row.turma_id,
    colaborador_id: row.colaborador_id,
    status: row.status,
    nota_final: row.nota_final,
    tentativas_realizadas: row.tentativas_realizadas,
    concluido_em: row.concluido_em,
    magic_token: row.magic_token
  };

  return montarRespostaPublica(tenantId, turma, participante);
}

// ─── Helper: monta payload retornado ao participante ─────────────────────────

async function montarRespostaPublica(tenantId: number, turma: any, participante: TreinamentoParticipante) {
  // Materiais do plano + extras da turma
  const materiaisPlano = await tenantQuery<any>(
    tenantId,
    `SELECT tm.titulo, tm.tipo, tm.url, tm.ordem, 'PLANO' AS origem
       FROM treinamento_materiais tm
      WHERE tm.tenant_id = ? AND tm.plano_id = ? AND tm.ativo = 1
      ORDER BY tm.ordem ASC`,
    [turma.plano_id]
  );

  const materiaisExtras = await tenantQuery<any>(
    tenantId,
    `SELECT titulo, tipo, url, ordem, 'TURMA' AS origem
       FROM treinamento_turma_materiais
      WHERE tenant_id = ? AND turma_id = ? AND ativo = 1
      ORDER BY ordem ASC`,
    [turma.turma_id]
  );

  const materiais = [...materiaisPlano, ...materiaisExtras];

  // Quiz (se habilitado e participante ainda pode tentar)
  let perguntas: TreinamentoQuizPergunta[] = [];
  const quizHabilitado = turma.quiz_habilitado;
  const podeTentar =
    quizHabilitado &&
    participante.status !== 'APROVADO' &&
    participante.status !== 'REPROVADO' &&
    (turma.max_tentativas === null ||
      turma.max_tentativas === undefined ||
      (participante.tentativas_realizadas ?? 0) < turma.max_tentativas);

  if (podeTentar) {
    const rows = await tenantQuery<TreinamentoQuizPergunta>(
      tenantId,
      `SELECT id, pergunta, alternativas_json, ordem
         FROM treinamento_quiz_perguntas
        WHERE tenant_id = ? AND plano_id = ? AND ativo = 1
        ORDER BY ordem ASC`,
      [turma.plano_id]
    );
    perguntas = rows.map((r) => ({
      ...r,
      alternativas: (JSON.parse(r.alternativas_json) as Alternativa[]).map((a, i) => ({
        index: i,
        texto: a.texto
        // NÃO expõe `correta` ao participante
      })) as any
    }));
  }

  return {
    participante_id: participante.id!,
    status:          participante.status,
    nota_final:      participante.nota_final,
    tentativas_realizadas: participante.tentativas_realizadas,
    concluido_em:    participante.concluido_em,
    turma: {
      tema:            turma.tema,
      empresa_nome:    turma.empresa_nome,
      prazo_conclusao: turma.prazo_conclusao,
      quiz_habilitado: quizHabilitado,
      nota_minima:     turma.nota_minima,
      max_tentativas:  turma.max_tentativas
    },
    materiais,
    perguntas,
    pode_tentar: podeTentar
  };
}

// ─── Confirmar conclusão (sem quiz) ──────────────────────────────────────────

export async function confirmarConclusaoSemQuizService(participanteId: number) {
  const [rows]: any = await pool.query(
    `SELECT p.tenant_id, p.status, t.plano_id,
            ct.quiz_habilitado
       FROM treinamento_participantes p
       JOIN turmas_treinamento t ON t.id = p.turma_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE p.id = ?`,
    [participanteId]
  );

  if (!rows.length) throw new AppError('Participante não encontrado', 404);
  const row = rows[0];

  if (row.quiz_habilitado) {
    throw new AppError('Esta turma exige quiz para conclusão', 400);
  }
  if (row.status === 'APROVADO') {
    throw new AppError('Treinamento já concluído', 400);
  }

  const tenantId = row.tenant_id;
  await tenantExecute(
    tenantId,
    `UPDATE treinamento_participantes
        SET status = 'APROVADO', concluido_em = NOW()
      WHERE tenant_id = ? AND id = ?`,
    [participanteId]
  );

  return { mensagem: 'Conclusão registrada com sucesso' };
}

// ─── Quiz: iniciar tentativa ─────────────────────────────────────────────────

export async function iniciarQuizService(participanteId: number) {
  const [rows]: any = await pool.query(
    `SELECT p.tenant_id, p.status, p.tentativas_realizadas,
            t.plano_id, ct.max_tentativas, ct.nota_minima, ct.quiz_habilitado
       FROM treinamento_participantes p
       JOIN turmas_treinamento t ON t.id = p.turma_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE p.id = ?`,
    [participanteId]
  );

  if (!rows.length) throw new AppError('Participante não encontrado', 404);
  const row = rows[0];
  const tenantId = row.tenant_id;

  if (!row.quiz_habilitado) throw new AppError('Quiz não habilitado nesta turma', 400);
  if (row.status === 'APROVADO') throw new AppError('Participante já aprovado', 400);
  if (row.status === 'REPROVADO') throw new AppError('Número máximo de tentativas atingido', 400);

  if (row.max_tentativas !== null && row.tentativas_realizadas >= row.max_tentativas) {
    throw new AppError('Número máximo de tentativas atingido', 400);
  }

  // Verificar se há execução em andamento
  const emAndamento = await tenantQuery<{ id: number }>(
    tenantId,
    `SELECT id FROM treinamento_execucoes
      WHERE tenant_id = ? AND participante_id = ? AND status = 'EM_ANDAMENTO'`,
    [participanteId]
  );
  if (emAndamento.length) {
    throw new AppError('Já existe uma tentativa em andamento', 409);
  }

  const perguntas = await tenantQuery<{ id: number; pergunta: string; alternativas_json: string; ordem: number }>(
    tenantId,
    `SELECT id, pergunta, alternativas_json, ordem
       FROM treinamento_quiz_perguntas
      WHERE tenant_id = ? AND plano_id = ? AND ativo = 1
      ORDER BY ordem ASC`,
    [row.plano_id]
  );

  if (!perguntas.length) throw new AppError('Nenhuma pergunta cadastrada no quiz', 400);

  const proximaTentativa = row.tentativas_realizadas + 1;

  const result = await tenantExecute(
    tenantId,
    `INSERT INTO treinamento_execucoes
       (tenant_id, participante_id, tentativa_numero, total_perguntas, iniciado_em)
     VALUES (?, ?, ?, ?, NOW())`,
    [participanteId, proximaTentativa, perguntas.length]
  );

  const execucaoId = (result as any).insertId;

  // Atualizar status do participante para EM_ANDAMENTO
  await tenantExecute(
    tenantId,
    `UPDATE treinamento_participantes SET status = 'EM_ANDAMENTO' WHERE tenant_id = ? AND id = ?`,
    [participanteId]
  );

  return {
    execucao_id: execucaoId,
    tentativa_numero: proximaTentativa,
    perguntas: perguntas.map((p) => ({
      id: p.id,
      pergunta: p.pergunta,
      ordem: p.ordem,
      alternativas: (JSON.parse(p.alternativas_json) as Alternativa[]).map((a, i) => ({
        index: i,
        texto: a.texto
      }))
    }))
  };
}

// ─── Quiz: finalizar e calcular nota ─────────────────────────────────────────

export async function finalizarQuizService(
  execucaoId: number,
  respostas: Array<{ pergunta_id: number; alternativa_index: number }>
) {
  const [execRows]: any = await pool.query(
    `SELECT e.*, p.tenant_id, p.id AS part_id, p.status AS part_status,
            t.plano_id, ct.nota_minima, ct.max_tentativas
       FROM treinamento_execucoes e
       JOIN treinamento_participantes p ON p.id = e.participante_id
       JOIN turmas_treinamento t ON t.id = p.turma_id
       LEFT JOIN configuracoes_treinamento ct ON ct.plano_id = t.plano_id AND ct.tenant_id = t.tenant_id
      WHERE e.id = ?`,
    [execucaoId]
  );

  if (!execRows.length) throw new AppError('Execução não encontrada', 404);
  const exec = execRows[0];
  const tenantId = exec.tenant_id;

  if (exec.status === 'FINALIZADA') throw new AppError('Tentativa já finalizada', 400);

  // Buscar gabarito
  const perguntas = await tenantQuery<{ id: number; alternativas_json: string }>(
    tenantId,
    `SELECT id, alternativas_json
       FROM treinamento_quiz_perguntas
      WHERE tenant_id = ? AND plano_id = ? AND ativo = 1`,
    [exec.plano_id]
  );

  const gabarito = new Map<number, number>();
  for (const p of perguntas) {
    const alts: Alternativa[] = JSON.parse(p.alternativas_json);
    const corretaIdx = alts.findIndex((a) => a.correta);
    gabarito.set(p.id, corretaIdx);
  }

  let acertos = 0;

  // Inserir respostas
  for (const r of respostas) {
    const corretaIdx = gabarito.get(r.pergunta_id);
    if (corretaIdx === undefined) continue;

    const correta = r.alternativa_index === corretaIdx ? 1 : 0;
    if (correta) acertos++;

    try {
      await tenantExecute(
        tenantId,
        `INSERT IGNORE INTO treinamento_respostas
           (tenant_id, execucao_id, pergunta_id, alternativa_index, correta)
         VALUES (?, ?, ?, ?, ?)`,
        [execucaoId, r.pergunta_id, r.alternativa_index, correta]
      );
    } catch (_) {
      // silencia duplicata
    }
  }

  const totalPerguntas = exec.total_perguntas || perguntas.length;
  const nota = totalPerguntas > 0 ? (acertos / totalPerguntas) * 10 : 0;
  const notaFinal = Math.round(nota * 100) / 100;

  // Atualizar execução
  await tenantExecute(
    tenantId,
    `UPDATE treinamento_execucoes
        SET status = 'FINALIZADA', nota = ?, total_acertos = ?, finalizado_em = NOW()
      WHERE tenant_id = ? AND id = ?`,
    [notaFinal, acertos, execucaoId]
  );

  // Determinar novo status do participante
  const notaMinima = exec.nota_minima;
  const maxTentativas = exec.max_tentativas;
  const aprovado = notaMinima === null || notaMinima === undefined ? true : notaFinal >= notaMinima;

  const novasTentativas = exec.tentativa_numero;

  let novoStatus: string;
  let concluido = false;

  if (aprovado) {
    novoStatus = 'APROVADO';
    concluido = true;
  } else if (maxTentativas !== null && maxTentativas !== undefined && novasTentativas >= maxTentativas) {
    novoStatus = 'REPROVADO';
    concluido = true;
  } else {
    novoStatus = 'EM_ANDAMENTO';
  }

  const updatePart = concluido
    ? `UPDATE treinamento_participantes
          SET status = ?, nota_final = ?, tentativas_realizadas = ?, concluido_em = NOW()
        WHERE tenant_id = ? AND id = ?`
    : `UPDATE treinamento_participantes
          SET status = ?, nota_final = ?, tentativas_realizadas = ?
        WHERE tenant_id = ? AND id = ?`;

  await tenantExecute(
    tenantId,
    updatePart,
    [novoStatus, notaFinal, novasTentativas, exec.part_id]
  );

  return {
    nota:          notaFinal,
    acertos,
    total_perguntas: totalPerguntas,
    status:         novoStatus,
    aprovado,
    pode_refazer:   !concluido
  };
}
