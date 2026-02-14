import { tenantExecute, tenantQuery } from '../db/tenantDb';
import { AppError } from '../errors/AppError';
import { DiagnosticoLgpdModelo } from '../types/DiagnosticoLgpdModelo';
import { DiagnosticoLgpdPergunta } from '../types/DiagnosticoLgpdPergunta';
import { DiagnosticoLgpdExecucao } from '../types/DiagnosticoLgpdExecucao';
import { DiagnosticoLgpdResultadoDominio } from '../types/DiagnosticoLgpdResultadoDominio';
import https from 'https';

type DiagnosticoRespostaItem = {
  pergunta_id: number;
  opcao: number;
  observacoes?: string | null;
};

async function validarEmpresa(tenantId: number, empresaId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM empresas WHERE tenant_id = ? AND id = ?',
    [empresaId]
  );
  if (!rows.length) throw new AppError('Empresa inválida para este tenant', 400);
}

async function validarModelo(tenantId: number, modeloId: number) {
  const rows = await tenantQuery<{ id: number }>(
    tenantId,
    'SELECT id FROM lgpd_diagnostico_modelos WHERE tenant_id = ? AND id = ?',
    [modeloId]
  );
  if (!rows.length) throw new AppError('Modelo inválido para este tenant', 400);
}

async function obterExecucaoPorId(tenantId: number, id: number) {
  const rows = await tenantQuery<DiagnosticoLgpdExecucao>(
    tenantId,
    `
      SELECT e.*, emp.nome AS empresa_nome, m.nome AS modelo_nome
        FROM lgpd_diagnostico_execucoes e
        JOIN empresas emp ON emp.id = e.empresa_id AND emp.tenant_id = e.tenant_id
        JOIN lgpd_diagnostico_modelos m ON m.id = e.modelo_id AND m.tenant_id = e.tenant_id
       WHERE e.tenant_id = ? AND e.id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function listarDiagnosticoModelosService(
  tenantId: number
): Promise<DiagnosticoLgpdModelo[]> {
  return tenantQuery<DiagnosticoLgpdModelo>(
    tenantId,
    `
      SELECT id, tenant_id, nome, versao, ativo, created_at, updated_at
        FROM lgpd_diagnostico_modelos
       WHERE tenant_id = ?
       ORDER BY id DESC
    `
  );
}

export async function obterDiagnosticoModeloPorIdService(
  id: number,
  tenantId: number
): Promise<DiagnosticoLgpdModelo | null> {
  const rows = await tenantQuery<DiagnosticoLgpdModelo>(
    tenantId,
    `
      SELECT id, tenant_id, nome, versao, ativo, created_at, updated_at
        FROM lgpd_diagnostico_modelos
       WHERE tenant_id = ? AND id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarDiagnosticoModeloService(
  dados: DiagnosticoLgpdModelo,
  tenantId: number
): Promise<DiagnosticoLgpdModelo> {
  const versao = dados.versao ?? 1;
  const ativo = dados.ativo ?? true;

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO lgpd_diagnostico_modelos (tenant_id, nome, versao, ativo)
      VALUES (?, ?, ?, ?)
    `,
    [dados.nome, versao, ativo ? 1 : 0]
  );

  const id = (result as any).insertId;
  const criado = await obterDiagnosticoModeloPorIdService(id, tenantId);
  return criado ?? { ...dados, id, versao, ativo };
}

export async function atualizarDiagnosticoModeloService(
  id: number,
  dados: DiagnosticoLgpdModelo,
  tenantId: number
): Promise<DiagnosticoLgpdModelo | null> {
  const versao = dados.versao ?? 1;
  const ativo = dados.ativo ?? true;

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE lgpd_diagnostico_modelos
         SET tenant_id = ?, nome = ?, versao = ?, ativo = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [dados.nome, versao, ativo ? 1 : 0, tenantId, id]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return obterDiagnosticoModeloPorIdService(id, tenantId);
}

export async function listarDiagnosticoPerguntasService(
  tenantId: number,
  modeloId: number
): Promise<DiagnosticoLgpdPergunta[]> {
  return tenantQuery<DiagnosticoLgpdPergunta>(
    tenantId,
    `
      SELECT id, tenant_id, modelo_id, codigo, dominio, pergunta,
             opcao_0, opcao_1, opcao_2, opcao_3, peso, ordem, ativo,
             created_at, updated_at
        FROM lgpd_diagnostico_perguntas
       WHERE tenant_id = ? AND modelo_id = ?
       ORDER BY ordem ASC, id ASC
    `,
    [modeloId]
  );
}

export async function obterDiagnosticoPerguntaPorIdService(
  id: number,
  tenantId: number
): Promise<DiagnosticoLgpdPergunta | null> {
  const rows = await tenantQuery<DiagnosticoLgpdPergunta>(
    tenantId,
    `
      SELECT id, tenant_id, modelo_id, codigo, dominio, pergunta,
             opcao_0, opcao_1, opcao_2, opcao_3, peso, ordem, ativo,
             created_at, updated_at
        FROM lgpd_diagnostico_perguntas
       WHERE tenant_id = ? AND id = ?
    `,
    [id]
  );
  return rows[0] ?? null;
}

export async function criarDiagnosticoPerguntaService(
  dados: DiagnosticoLgpdPergunta,
  tenantId: number
): Promise<DiagnosticoLgpdPergunta> {
  await validarModelo(tenantId, dados.modelo_id);

  const ativo = dados.ativo ?? true;
  const ordem = dados.ordem ?? 0;

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO lgpd_diagnostico_perguntas (
        tenant_id, modelo_id, codigo, dominio, pergunta,
        opcao_0, opcao_1, opcao_2, opcao_3, peso, ordem, ativo
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.modelo_id,
      dados.codigo,
      dados.dominio,
      dados.pergunta,
      dados.opcao_0,
      dados.opcao_1,
      dados.opcao_2,
      dados.opcao_3,
      dados.peso,
      ordem,
      ativo ? 1 : 0
    ]
  );

  const id = (result as any).insertId;
  const criada = await obterDiagnosticoPerguntaPorIdService(id, tenantId);
  return criada ?? { ...dados, id, ordem, ativo };
}

export async function atualizarDiagnosticoPerguntaService(
  id: number,
  dados: DiagnosticoLgpdPergunta,
  tenantId: number
): Promise<DiagnosticoLgpdPergunta | null> {
  await validarModelo(tenantId, dados.modelo_id);

  const ativo = dados.ativo ?? true;
  const ordem = dados.ordem ?? 0;

  const result = await tenantExecute(
    tenantId,
    `
      UPDATE lgpd_diagnostico_perguntas
         SET tenant_id = ?,
             modelo_id = ?,
             codigo = ?,
             dominio = ?,
             pergunta = ?,
             opcao_0 = ?,
             opcao_1 = ?,
             opcao_2 = ?,
             opcao_3 = ?,
             peso = ?,
             ordem = ?,
             ativo = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [
      dados.modelo_id,
      dados.codigo,
      dados.dominio,
      dados.pergunta,
      dados.opcao_0,
      dados.opcao_1,
      dados.opcao_2,
      dados.opcao_3,
      dados.peso,
      ordem,
      ativo ? 1 : 0,
      tenantId,
      id
    ]
  );

  const { affectedRows } = result as any;
  if (!affectedRows) return null;
  return obterDiagnosticoPerguntaPorIdService(id, tenantId);
}

export async function deletarDiagnosticoPerguntaService(
  id: number,
  tenantId: number
): Promise<boolean> {
  const result = await tenantExecute(
    tenantId,
    'DELETE FROM lgpd_diagnostico_perguntas WHERE tenant_id = ? AND id = ?',
    [id]
  );
  const { affectedRows } = result as any;
  return !!affectedRows;
}

export async function listarDiagnosticoExecucoesService(
  tenantId: number,
  empresaId?: number
): Promise<DiagnosticoLgpdExecucao[]> {
  const conditions: string[] = ['e.tenant_id = ?'];
  const params: Array<number> = [];
  if (empresaId) {
    conditions.push('e.empresa_id = ?');
    params.push(empresaId);
  }

  return tenantQuery<DiagnosticoLgpdExecucao>(
    tenantId,
    `
      SELECT e.*, emp.nome AS empresa_nome, m.nome AS modelo_nome
        FROM lgpd_diagnostico_execucoes e
        JOIN empresas emp ON emp.id = e.empresa_id AND emp.tenant_id = e.tenant_id
        JOIN lgpd_diagnostico_modelos m ON m.id = e.modelo_id AND m.tenant_id = e.tenant_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY e.created_at DESC
    `,
    params
  );
}

export async function obterDiagnosticoExecucaoPorIdService(
  id: number,
  tenantId: number
): Promise<DiagnosticoLgpdExecucao | null> {
  return obterExecucaoPorId(tenantId, id);
}

export async function criarDiagnosticoExecucaoService(
  dados: DiagnosticoLgpdExecucao,
  tenantId: number,
  usuarioId?: number
): Promise<DiagnosticoLgpdExecucao> {
  await validarEmpresa(tenantId, dados.empresa_id);
  await validarModelo(tenantId, dados.modelo_id);

  const status = dados.status ?? 'RASCUNHO';

  const result = await tenantExecute(
    tenantId,
    `
      INSERT INTO lgpd_diagnostico_execucoes (
        tenant_id, empresa_id, modelo_id, status,
        nota_geral, total_peso, max_pontos, pontos,
        criado_por_usuario_id, atualizado_por_usuario_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      dados.empresa_id,
      dados.modelo_id,
      status,
      dados.nota_geral ?? 0,
      dados.total_peso ?? 0,
      dados.max_pontos ?? 0,
      dados.pontos ?? 0,
      usuarioId ?? null,
      usuarioId ?? null
    ]
  );

  const id = (result as any).insertId;
  const criado = await obterExecucaoPorId(tenantId, id);
  return (
    criado ?? {
      ...dados,
      id,
      status,
      nota_geral: dados.nota_geral ?? 0,
      total_peso: dados.total_peso ?? 0,
      max_pontos: dados.max_pontos ?? 0,
      pontos: dados.pontos ?? 0,
      criado_por_usuario_id: usuarioId ?? null,
      atualizado_por_usuario_id: usuarioId ?? null
    }
  );
}

export async function salvarDiagnosticoRespostasService(
  execucaoId: number,
  respostas: DiagnosticoRespostaItem[],
  tenantId: number
): Promise<void> {
  const execucao = await obterExecucaoPorId(tenantId, execucaoId);
  if (!execucao) throw new AppError('Execução inválida', 404);
  if (execucao.status === 'FINALIZADO') {
    throw new AppError('Diagnóstico já finalizado', 400);
  }

  const ids = respostas.map((r) => r.pergunta_id);
  const placeholders = ids.map(() => '?').join(', ');

  const perguntas = await tenantQuery<{
    id: number;
    dominio: string;
    peso: number;
  }>(
    tenantId,
    `
      SELECT id, dominio, peso
        FROM lgpd_diagnostico_perguntas
       WHERE tenant_id = ?
         AND modelo_id = ?
         AND ativo = 1
         AND id IN (${placeholders})
    `,
    [execucao.modelo_id, ...ids]
  );

  if (perguntas.length !== ids.length) {
    throw new AppError('Algumas perguntas são inválidas para este diagnóstico', 400);
  }

  const mapaPerguntas = new Map<number, { dominio: string; peso: number }>();
  perguntas.forEach((p) => mapaPerguntas.set(p.id, { dominio: p.dominio, peso: p.peso }));

  for (const resposta of respostas) {
    if (resposta.opcao < 0 || resposta.opcao > 3) {
      throw new AppError('Opção inválida', 400);
    }
    const pergunta = mapaPerguntas.get(resposta.pergunta_id);
    if (!pergunta) throw new AppError('Pergunta inválida', 400);

    const valor = resposta.opcao;
    const observacoes = resposta.observacoes?.trim() || null;
    await tenantExecute(
      tenantId,
      `
        INSERT INTO lgpd_diagnostico_respostas (
          tenant_id, execucao_id, pergunta_id, dominio, opcao, valor, peso, observacoes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          dominio = VALUES(dominio),
          opcao = VALUES(opcao),
          valor = VALUES(valor),
          peso = VALUES(peso),
          observacoes = VALUES(observacoes)
      `,
      [
        execucaoId,
        resposta.pergunta_id,
        pergunta.dominio,
        resposta.opcao,
        valor,
        pergunta.peso,
        observacoes
      ]
    );
  }
}

export async function listarDiagnosticoRespostasService(
  execucaoId: number,
  tenantId: number
) {
  return tenantQuery(
    tenantId,
    `
      SELECT id, tenant_id, execucao_id, pergunta_id, dominio, opcao, valor, peso, observacoes,
             created_at, updated_at
        FROM lgpd_diagnostico_respostas
       WHERE tenant_id = ? AND execucao_id = ?
       ORDER BY pergunta_id ASC
    `,
    [execucaoId]
  );
}

export async function listarDiagnosticoResultadosDominioService(
  execucaoId: number,
  tenantId: number
): Promise<DiagnosticoLgpdResultadoDominio[]> {
  return tenantQuery<DiagnosticoLgpdResultadoDominio>(
    tenantId,
    `
      SELECT id, tenant_id, execucao_id, dominio, nota, total_peso, max_pontos, pontos,
             created_at, updated_at
        FROM lgpd_diagnostico_resultados_dominio
       WHERE tenant_id = ? AND execucao_id = ?
       ORDER BY dominio ASC
    `,
    [execucaoId]
  );
}

function extrairTextoRespostaOpenAI(data: any): string {
  if (data && typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  if (!data || !Array.isArray(data.output)) return '';
  let texto = '';
  for (const item of data.output) {
    if (item?.type !== 'message' || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        texto += content.text;
      }
    }
  }
  return texto.trim();
}

async function chamarOpenAIResponses(prompt: string, instructions: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AppError('OPENAI_API_KEY não configurada', 500);

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const maxOutputTokens = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 900);

  const payload = JSON.stringify({
    model,
    instructions,
    input: prompt,
    max_output_tokens: maxOutputTokens,
    temperature: 0.3,
    store: false
  });

  const response = await new Promise<any>((resolve, reject) => {
    const req = https.request(
      {
        method: 'POST',
        hostname: 'api.openai.com',
        path: '/v1/responses',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            return reject(new AppError(`OpenAI API erro (${res.statusCode})`, 502));
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new AppError('Resposta inválida da OpenAI API', 502));
          }
        });
      }
    );

    req.on('error', () => reject(new AppError('Falha ao conectar na OpenAI API', 502)));
    req.write(payload);
    req.end();
  });

  const texto = extrairTextoRespostaOpenAI(response);
  if (!texto) throw new AppError('OpenAI API retornou texto vazio', 502);
  return texto;
}

export async function gerarDiagnosticoTextoService(
  execucaoId: number,
  tenantId: number
): Promise<{ texto: string }> {
  const execucao = await obterExecucaoPorId(tenantId, execucaoId);
  if (!execucao) throw new AppError('Execução inválida', 404);
  if (execucao.status !== 'FINALIZADO') {
    throw new AppError('Diagnóstico precisa estar finalizado para análise', 400);
  }

  const resultados = await listarDiagnosticoResultadosDominioService(execucaoId, tenantId);

  const perguntas = await tenantQuery<{
    id: number;
    codigo: string;
    dominio: string;
    pergunta: string;
    opcao_0: string;
    opcao_1: string;
    opcao_2: string;
    opcao_3: string;
    peso: number;
    ordem: number;
    opcao: number | null;
    observacoes: string | null;
  }>(
    tenantId,
    `
      SELECT p.id, p.codigo, p.dominio, p.pergunta,
             p.opcao_0, p.opcao_1, p.opcao_2, p.opcao_3,
             p.peso, p.ordem,
             r.opcao, r.observacoes
        FROM (
          SELECT id, codigo, dominio, pergunta,
                 opcao_0, opcao_1, opcao_2, opcao_3,
                 peso, ordem, tenant_id
            FROM lgpd_diagnostico_perguntas
           WHERE tenant_id = ? AND modelo_id = ? AND ativo = 1
        ) p
        LEFT JOIN lgpd_diagnostico_respostas r
          ON r.pergunta_id = p.id
         AND r.execucao_id = ?
         AND r.tenant_id = p.tenant_id
       ORDER BY p.ordem ASC, p.id ASC
    `,
    [execucao.modelo_id, execucaoId]
  );

  const faltantes = perguntas.filter((p) => p.opcao === null || p.opcao === undefined);
  if (faltantes.length) {
    const codigos = faltantes.map((p) => p.codigo).join(', ');
    throw new AppError(`Diagnóstico incompleto. Perguntas sem resposta: ${codigos}`, 400);
  }

  const respostas = perguntas.map((p) => {
    const opcoes = [p.opcao_0, p.opcao_1, p.opcao_2, p.opcao_3];
    const opcaoIndex = p.opcao ?? 0;
    return {
      codigo: p.codigo,
      dominio: p.dominio,
      pergunta: p.pergunta,
      peso: p.peso,
      opcoes,
      resposta: {
        opcao: opcaoIndex,
        texto: opcoes[opcaoIndex] ?? null
      },
      observacoes: p.observacoes ?? null
    };
  });

  const payload = {
    empresa: {
      id: execucao.empresa_id,
      nome: execucao.empresa_nome ?? null
    },
    modelo: {
      id: execucao.modelo_id,
      nome: execucao.modelo_nome ?? null
    },
    execucao: {
      id: execucao.id,
      nota_geral: execucao.nota_geral ?? 0
    },
    resultados_dominio: resultados.map((r) => ({
      dominio: r.dominio,
      nota: r.nota ?? 0
    })),
    respostas
  };

  const instructions =
    'Voce e um consultor especialista em LGPD. ' +
    'Gere um diagnostico textual em portugues com cerca de 600 palavras (entre 520 e 680). ' +
    'Use paragrafos curtos e linguagem clara. ' +
    'Inclua: nivel de maturidade (Inicial, Gerenciado, Definido, Qualidade ou Otimizacao), ' +
    'pontos fortes, pontos fracos e prioridades de melhoria. ' +
    'Baseie-se estritamente nos dados fornecidos (perguntas, opcoes marcadas e observacoes). ' +
    'Nao invente fatos ou evidencias. Evite listas longas.';

  const prompt = `Analise os dados abaixo (JSON):\n${JSON.stringify(payload, null, 2)}`;
  const texto = await chamarOpenAIResponses(prompt, instructions);
  return { texto };
}

export async function finalizarDiagnosticoExecucaoService(
  execucaoId: number,
  tenantId: number,
  usuarioId?: number
): Promise<{ execucao: DiagnosticoLgpdExecucao; resultados: DiagnosticoLgpdResultadoDominio[] }> {
  const execucao = await obterExecucaoPorId(tenantId, execucaoId);
  if (!execucao) throw new AppError('Execução inválida', 404);
  if (execucao.status === 'FINALIZADO') {
    throw new AppError('Diagnóstico já finalizado', 400);
  }

  const dominiosPeso = await tenantQuery<{ dominio: string; total_peso: number }>(
    tenantId,
    `
      SELECT dominio, SUM(peso) AS total_peso
        FROM lgpd_diagnostico_perguntas
       WHERE tenant_id = ? AND modelo_id = ? AND ativo = 1
       GROUP BY dominio
    `,
    [execucao.modelo_id]
  );

  const pontosPorDominio = await tenantQuery<{ dominio: string; pontos: number }>(
    tenantId,
    `
      SELECT dominio, SUM(valor * peso) AS pontos
        FROM lgpd_diagnostico_respostas
       WHERE tenant_id = ? AND execucao_id = ?
       GROUP BY dominio
    `,
    [execucaoId]
  );

  const mapaPontos = new Map<string, number>();
  pontosPorDominio.forEach((p) => mapaPontos.set(p.dominio, Number(p.pontos) || 0));

  let totalPesoGeral = 0;
  let totalPontosGeral = 0;
  const resultados: DiagnosticoLgpdResultadoDominio[] = [];

  for (const item of dominiosPeso) {
    const totalPeso = Number(item.total_peso) || 0;
    const pontos = mapaPontos.get(item.dominio) ?? 0;
    const maxPontos = totalPeso * 3;
    const nota = maxPontos > 0 ? (pontos / maxPontos) * 100 : 0;

    totalPesoGeral += totalPeso;
    totalPontosGeral += pontos;

    resultados.push({
      execucao_id: execucaoId,
      dominio: item.dominio,
      total_peso: totalPeso,
      max_pontos: maxPontos,
      pontos,
      nota
    });
  }

  const maxPontosGeral = totalPesoGeral * 3;
  const notaGeral = maxPontosGeral > 0 ? (totalPontosGeral / maxPontosGeral) * 100 : 0;

  await tenantExecute(
    tenantId,
    `
      UPDATE lgpd_diagnostico_execucoes
         SET tenant_id = ?,
             status = 'FINALIZADO',
             nota_geral = ?,
             total_peso = ?,
             max_pontos = ?,
             pontos = ?,
             atualizado_por_usuario_id = ?
       WHERE tenant_id = ? AND id = ?
    `,
    [notaGeral, totalPesoGeral, maxPontosGeral, totalPontosGeral, usuarioId ?? null, tenantId, execucaoId]
  );

  for (const res of resultados) {
    await tenantExecute(
      tenantId,
      `
        INSERT INTO lgpd_diagnostico_resultados_dominio (
          tenant_id, execucao_id, dominio, nota, total_peso, max_pontos, pontos
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nota = VALUES(nota),
          total_peso = VALUES(total_peso),
          max_pontos = VALUES(max_pontos),
          pontos = VALUES(pontos)
      `,
      [
        execucaoId,
        res.dominio,
        res.nota ?? 0,
        res.total_peso ?? 0,
        res.max_pontos ?? 0,
        res.pontos ?? 0
      ]
    );
  }

  const execucaoAtualizada = await obterExecucaoPorId(tenantId, execucaoId);
  return {
    execucao: execucaoAtualizada ?? { ...execucao, status: 'FINALIZADO', nota_geral: notaGeral },
    resultados
  };
}
