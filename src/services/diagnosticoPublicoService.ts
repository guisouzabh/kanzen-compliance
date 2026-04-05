import { tenantQuery, tenantExecute } from '../db/tenantDb';
import { AppError } from '../errors/AppError';

const TENANT_ID = 4;
const MODELO_ID = 6;

type RespostaItem = {
  pergunta_id: number;
  opcao: number;
};

export type LeadInput = {
  nome?: string | null;
  email: string;
  celular?: string | null;
  empresa: string;
  ramo?: string | null;
  num_funcionarios?: string | null;
  cidade?: string | null;
  estado?: string | null;
};

type PerguntaPublica = {
  id: number;
  codigo: string;
  dominio: string;
  macro_dominio: string;
  pergunta: string;
  opcao_0: string;
  opcao_1: string;
  opcao_2: string;
  opcao_3: string;
  peso: number;
  ordem: number;
};

export async function listarPerguntasPublicoService(): Promise<PerguntaPublica[]> {
  return tenantQuery<PerguntaPublica>(
    TENANT_ID,
    `SELECT id, codigo, dominio, macro_dominio, pergunta,
            opcao_0, opcao_1, opcao_2, opcao_3, peso, ordem
       FROM diagnostico_perguntas
      WHERE tenant_id = ? AND modelo_id = ? AND ativo = 1
      ORDER BY ordem ASC, id ASC`,
    [MODELO_ID]
  );
}

export async function calcularResultadoPublicoService(
  respostas: RespostaItem[],
  lead: LeadInput
) {
  const perguntas = await listarPerguntasPublicoService();

  if (perguntas.length === 0) {
    throw new AppError('Modelo de diagnóstico não disponível', 404);
  }

  const perguntaMap = new Map<number, PerguntaPublica>();
  perguntas.forEach((p) => perguntaMap.set(p.id, p));

  const respostaMap = new Map<number, number>();
  for (const r of respostas) {
    if (!perguntaMap.has(r.pergunta_id)) {
      throw new AppError('Pergunta inválida', 400);
    }
    if (r.opcao < 0 || r.opcao > 3) {
      throw new AppError('Opção inválida', 400);
    }
    respostaMap.set(r.pergunta_id, r.opcao);
  }

  const faltantes = perguntas.filter((p) => !respostaMap.has(p.id));
  if (faltantes.length > 0) {
    const codigos = faltantes.map((p) => p.codigo).join(', ');
    throw new AppError(`Perguntas sem resposta: ${codigos}`, 400);
  }

  const dominioPeso = new Map<string, number>();
  const dominioPontos = new Map<string, number>();
  const macroPeso = new Map<string, number>();
  const macroPontos = new Map<string, number>();

  let totalPeso = 0;
  let totalPontos = 0;

  for (const p of perguntas) {
    const opcao = respostaMap.get(p.id) ?? 0;
    const peso = Number(p.peso) || 1;
    const valor = opcao;

    dominioPeso.set(p.dominio, (dominioPeso.get(p.dominio) ?? 0) + peso);
    dominioPontos.set(p.dominio, (dominioPontos.get(p.dominio) ?? 0) + valor * peso);

    const macro = p.macro_dominio || p.dominio;
    macroPeso.set(macro, (macroPeso.get(macro) ?? 0) + peso);
    macroPontos.set(macro, (macroPontos.get(macro) ?? 0) + valor * peso);

    totalPeso += peso;
    totalPontos += valor * peso;
  }

  const maxPontosGeral = totalPeso * 3;
  const nota_geral =
    maxPontosGeral > 0 ? Math.round((totalPontos / maxPontosGeral) * 1000) / 10 : 0;

  const resultados_dominio = Array.from(dominioPeso.entries())
    .map(([dominio, peso]) => {
      const pontos = dominioPontos.get(dominio) ?? 0;
      const max = peso * 3;
      const nota = max > 0 ? Math.round((pontos / max) * 1000) / 10 : 0;
      return { dominio, nota };
    })
    .sort((a, b) => a.dominio.localeCompare(b.dominio));

  const resultados_macro = Array.from(macroPeso.entries())
    .map(([macro_dominio, peso]) => {
      const pontos = macroPontos.get(macro_dominio) ?? 0;
      const max = peso * 3;
      const nota = max > 0 ? Math.round((pontos / max) * 1000) / 10 : 0;
      return { macro_dominio, nota };
    })
    .sort((a, b) => a.macro_dominio.localeCompare(b.macro_dominio));

  const resultado = { nota_geral, resultados_dominio, resultados_macro };

  await tenantExecute(
    TENANT_ID,
    `INSERT INTO diagnostico_leads
       (tenant_id, nome, email, celular, empresa, ramo, num_funcionarios, cidade, estado, nota_geral, resultado_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      lead.nome?.trim() || null,
      lead.email.trim(),
      lead.celular?.trim() || null,
      lead.empresa.trim(),
      lead.ramo?.trim() || null,
      lead.num_funcionarios?.trim() || null,
      lead.cidade?.trim() || null,
      lead.estado?.trim() || null,
      nota_geral,
      JSON.stringify(resultado)
    ]
  );

  return resultado;
}
