import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { AppError } from '../errors/AppError';
import { tenantQuery } from '../db/tenantDb';
import {
  planoSchema
} from '../validation/planoSchema';
import {
  turmaTreinamentoSchema
} from '../validation/turmaTreinamentoSchema';
import {
  configuracaoTreinamentoSchema,
  treinamentoMaterialSchema,
  treinamentoQuizPerguntaSchema,
  clonarTurmaSchema
} from '../validation/treinamentoSchema';

import {
  listarPlanosService,
  obterPlanoPorIdService,
  criarPlanoService,
  atualizarPlanoService,
  deletarPlanoService
} from '../services/planoService';
import {
  obterConfigService,
  criarOuAtualizarConfigService,
  listarMateriaisPlanoService,
  criarMaterialPlanoService,
  atualizarMaterialPlanoService,
  deletarMaterialPlanoService,
  listarPerguntasQuizService,
  criarPerguntaQuizService,
  atualizarPerguntaQuizService,
  deletarPerguntaQuizService,
  listarMateriaisTurmaService,
  criarMaterialTurmaService,
  deletarMaterialTurmaService
} from '../services/treinamentoLgpdService';
import {
  listarTurmasService,
  obterTurmaPorIdService,
  criarTurmaService,
  atualizarTurmaService,
  deletarTurmaService,
  clonarTurmaService
} from '../services/turmaTreinamentoService';
import {
  listarParticipantesService,
  adicionarParticipanteService,
  removerParticipanteService,
  importarParticipantesService,
  enviarMagicLinksService,
  relatorioTurmaService
} from '../services/participanteService';
import {
  participanteSchema,
  importarParticipantesSchema
} from '../validation/treinamentoSchema';

function toNumber(v: unknown): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

// ─── Planos de Treinamento ───────────────────────────────────────────────────

export async function listarTreinamentos(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const dados = await listarPlanosService(tenantId, {
    tipo:          'TREINAMENTO',
    empresaId:     toNumber(req.query.empresa_id),
    status:        req.query.status ? String(req.query.status) : undefined,
    responsavelId: toNumber(req.query.responsavel_id),
    q:             req.query.q ? String(req.query.q) : undefined
  });
  return res.json(dados);
}

export async function obterTreinamento(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const plano = await obterPlanoPorIdService(id, tenantId);
  if (!plano || plano.tipo !== 'TREINAMENTO') throw new AppError('Treinamento não encontrado', 404);
  const config  = await obterConfigService(id, tenantId);
  const turmas  = await listarTurmasService(tenantId, id);
  return res.json({ ...plano, config, turmas });
}

export async function criarTreinamento(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const body = { ...req.body, tipo: 'TREINAMENTO' };
  const parse = planoSchema.safeParse(body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const plano = await criarPlanoService(parse.data as any, tenantId);

  // Criar config padrão
  await criarOuAtualizarConfigService(plano.id!, {}, tenantId);

  const config = await obterConfigService(plano.id!, tenantId);
  return res.status(201).json({ ...plano, config });
}

export async function atualizarTreinamento(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const body = { ...req.body, tipo: 'TREINAMENTO' };
  const parse = planoSchema.safeParse(body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const atualizado = await atualizarPlanoService(id, parse.data as any, tenantId);
  if (!atualizado) throw new AppError('Treinamento não encontrado', 404);
  return res.json(atualizado);
}

export async function deletarTreinamento(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const id = Number(req.params.id);
  if (Number.isNaN(id)) throw new AppError('ID inválido', 400);
  const ok = await deletarPlanoService(id, tenantId);
  if (!ok) throw new AppError('Treinamento não encontrado', 404);
  return res.status(204).send();
}

// ─── Configuração LGPD do plano ───────────────────────────────────────────────

export async function obterConfig(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  const config = await obterConfigService(planoId, tenantId);
  if (!config) throw new AppError('Configuração não encontrada', 404);
  return res.json(config);
}

export async function salvarConfig(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  const parse = configuracaoTreinamentoSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const config = await criarOuAtualizarConfigService(planoId, parse.data, tenantId);
  return res.json(config);
}

// ─── Materiais do plano ───────────────────────────────────────────────────────

export async function listarMateriaisPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  return res.json(await listarMateriaisPlanoService(planoId, tenantId));
}

export async function criarMaterialPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  const parse = treinamentoMaterialSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const novo = await criarMaterialPlanoService(planoId, parse.data, tenantId);
  return res.status(201).json(novo);
}

export async function atualizarMaterialPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId    = Number(req.params.id);
  const materialId = Number(req.params.materialId);
  if (Number.isNaN(planoId) || Number.isNaN(materialId)) throw new AppError('ID inválido', 400);
  const parse = treinamentoMaterialSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const atualizado = await atualizarMaterialPlanoService(materialId, planoId, parse.data, tenantId);
  if (!atualizado) throw new AppError('Material não encontrado', 404);
  return res.json(atualizado);
}

export async function deletarMaterialPlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId    = Number(req.params.id);
  const materialId = Number(req.params.materialId);
  if (Number.isNaN(planoId) || Number.isNaN(materialId)) throw new AppError('ID inválido', 400);
  const ok = await deletarMaterialPlanoService(materialId, planoId, tenantId);
  if (!ok) throw new AppError('Material não encontrado', 404);
  return res.status(204).send();
}

// ─── Quiz Perguntas ───────────────────────────────────────────────────────────

export async function listarPerguntasQuiz(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  return res.json(await listarPerguntasQuizService(planoId, tenantId));
}

export async function criarPerguntaQuiz(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  const parse = treinamentoQuizPerguntaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const nova = await criarPerguntaQuizService(planoId, parse.data, tenantId);
  return res.status(201).json(nova);
}

export async function atualizarPerguntaQuiz(req: AuthRequest, res: Response) {
  const tenantId   = req.usuario!.tenantId;
  const planoId    = Number(req.params.id);
  const perguntaId = Number(req.params.perguntaId);
  if (Number.isNaN(planoId) || Number.isNaN(perguntaId)) throw new AppError('ID inválido', 400);
  const parse = treinamentoQuizPerguntaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const atualizada = await atualizarPerguntaQuizService(perguntaId, planoId, parse.data, tenantId);
  if (!atualizada) throw new AppError('Pergunta não encontrada', 404);
  return res.json(atualizada);
}

export async function deletarPerguntaQuiz(req: AuthRequest, res: Response) {
  const tenantId   = req.usuario!.tenantId;
  const planoId    = Number(req.params.id);
  const perguntaId = Number(req.params.perguntaId);
  if (Number.isNaN(planoId) || Number.isNaN(perguntaId)) throw new AppError('ID inválido', 400);
  const ok = await deletarPerguntaQuizService(perguntaId, planoId, tenantId);
  if (!ok) throw new AppError('Pergunta não encontrada', 404);
  return res.status(204).send();
}

// ─── Turmas do plano ─────────────────────────────────────────────────────────

export async function listarTurmasDePlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  return res.json(await listarTurmasService(tenantId, planoId));
}

export async function criarTurmaDePlano(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const planoId = Number(req.params.id);
  if (Number.isNaN(planoId)) throw new AppError('ID inválido', 400);
  const parse = turmaTreinamentoSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const dados = { ...parse.data, created_by_usuario_id: req.usuario!.id ?? null };
  const nova = await criarTurmaService(dados as any, tenantId, planoId);
  return res.status(201).json(nova);
}

// ─── Turma (operações diretas) ────────────────────────────────────────────────

export async function obterTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);

  const turma = await obterTurmaSemPlanoIdService(turmaId, tenantId);
  if (!turma) throw new AppError('Turma não encontrada', 404);

  const stats = await relatorioTurmaService(turmaId, tenantId);
  return res.json({ ...turma, stats: stats.stats });
}

async function obterTurmaSemPlanoIdService(turmaId: number, tenantId: number) {
  const rows = await tenantQuery<any>(
    tenantId,
    `SELECT t.*, u.nome AS responsavel_nome, p.nome AS nome_plano
       FROM turmas_treinamento t
       LEFT JOIN usuarios u ON u.id = t.responsavel_id AND u.tenant_id = t.tenant_id
       LEFT JOIN planos p ON p.id = t.plano_id
      WHERE t.tenant_id = ? AND t.id = ?`,
    [turmaId]
  );
  return rows[0] ?? null;
}

export async function atualizarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const turma = await obterTurmaSemPlanoIdService(turmaId, tenantId);
  if (!turma) throw new AppError('Turma não encontrada', 404);
  const parse = turmaTreinamentoSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const atualizada = await atualizarTurmaService(turmaId, parse.data as any, tenantId, turma.plano_id);
  if (!atualizada) throw new AppError('Turma não encontrada', 404);
  return res.json(atualizada);
}

export async function deletarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const turma = await obterTurmaSemPlanoIdService(turmaId, tenantId);
  if (!turma) throw new AppError('Turma não encontrada', 404);
  const ok = await deletarTurmaService(turmaId, tenantId, turma.plano_id);
  if (!ok) throw new AppError('Turma não encontrada', 404);
  return res.status(204).send();
}

export async function clonarTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const parse = clonarTurmaSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const nova = await clonarTurmaService(turmaId, tenantId, parse.data);
  return res.status(201).json(nova);
}

// ─── Participantes ────────────────────────────────────────────────────────────

export async function listarParticipantes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  return res.json(await listarParticipantesService(turmaId, tenantId));
}

export async function adicionarParticipante(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const parse = participanteSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const novo = await adicionarParticipanteService(turmaId, parse.data.colaborador_id, tenantId);
  return res.status(201).json(novo);
}

export async function importarParticipantes(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const parse = importarParticipantesSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const resultado = await importarParticipantesService(turmaId, parse.data.empresa_id, parse.data.participantes, tenantId);
  return res.json(resultado);
}

export async function removerParticipante(req: AuthRequest, res: Response) {
  const tenantId      = req.usuario!.tenantId;
  const turmaId       = Number(req.params.turmaId);
  const participanteId = Number(req.params.participanteId);
  if (Number.isNaN(turmaId) || Number.isNaN(participanteId)) throw new AppError('ID inválido', 400);
  const ok = await removerParticipanteService(participanteId, turmaId, tenantId);
  if (!ok) throw new AppError('Participante não encontrado', 404);
  return res.status(204).send();
}

export async function enviarMagicLinks(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const baseUrl = process.env.FRONTEND_URL ?? 'https://app.vanttagem.com.br';
  const total = await enviarMagicLinksService(turmaId, tenantId, baseUrl);
  return res.json({ enfileirados: total });
}

// ─── Materiais extras da turma ────────────────────────────────────────────────

export async function listarMateriaisTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  return res.json(await listarMateriaisTurmaService(turmaId, tenantId));
}

export async function criarMaterialTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  const parse = treinamentoMaterialSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  const novo = await criarMaterialTurmaService(turmaId, parse.data, tenantId);
  return res.status(201).json(novo);
}

export async function deletarMaterialTurma(req: AuthRequest, res: Response) {
  const tenantId   = req.usuario!.tenantId;
  const turmaId    = Number(req.params.turmaId);
  const materialId = Number(req.params.materialId);
  if (Number.isNaN(turmaId) || Number.isNaN(materialId)) throw new AppError('ID inválido', 400);
  const ok = await deletarMaterialTurmaService(materialId, turmaId, tenantId);
  if (!ok) throw new AppError('Material não encontrado', 404);
  return res.status(204).send();
}

// ─── Relatório ────────────────────────────────────────────────────────────────

export async function relatorioDaTurma(req: AuthRequest, res: Response) {
  const tenantId = req.usuario!.tenantId;
  const turmaId = Number(req.params.turmaId);
  if (Number.isNaN(turmaId)) throw new AppError('ID inválido', 400);
  return res.json(await relatorioTurmaService(turmaId, tenantId));
}
