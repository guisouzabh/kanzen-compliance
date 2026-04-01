import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import {
  obterInfoTurmaPublicaService,
  identificarParticipanteService,
  obterParticipantePorMagicTokenService,
  confirmarConclusaoSemQuizService,
  iniciarQuizService,
  finalizarQuizService
} from '../services/treinamentoPublicoService';
import {
  identificarParticipanteSchema,
  finalizarQuizSchema
} from '../validation/treinamentoSchema';

export async function obterInfoTurmaPublica(req: Request, res: Response) {
  const slug = req.params.slug as string;
  return res.json(await obterInfoTurmaPublicaService(slug));
}

export async function identificarParticipante(req: Request, res: Response) {
  const slug = req.params.slug as string;
  const parse = identificarParticipanteSchema.safeParse(req.body);
  if (!parse.success) {
    throw new AppError('Dados inválidos', 400);
  }
  const resultado = await identificarParticipanteService(
    slug,
    parse.data.identificador,
    parse.data.data_nascimento
  );
  return res.json(resultado);
}

export async function acessarViaMagicLink(req: Request, res: Response) {
  const token = req.params.token as string;
  return res.json(await obterParticipantePorMagicTokenService(token));
}

export async function confirmarConclusao(req: Request, res: Response) {
  const parse = z.object({ participante_id: z.number().int().positive() }).safeParse(req.body);
  if (!parse.success) throw new AppError('participante_id inválido', 400);
  return res.json(await confirmarConclusaoSemQuizService(parse.data.participante_id));
}

export async function iniciarQuiz(req: Request, res: Response) {
  const parse = z.object({ participante_id: z.number().int().positive() }).safeParse(req.body);
  if (!parse.success) throw new AppError('participante_id inválido', 400);
  return res.json(await iniciarQuizService(parse.data.participante_id));
}

export async function finalizarQuiz(req: Request, res: Response) {
  const parse = finalizarQuizSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ erro: 'Dados inválidos', detalhes: parse.error.issues });
  return res.json(await finalizarQuizService(parse.data.execucao_id, parse.data.respostas));
}
