import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';
import {
  listarPerguntasPublicoService,
  calcularResultadoPublicoService
} from '../services/diagnosticoPublicoService';

const calcularSchema = z.object({
  lead: z.object({
    nome: z.string().max(255).optional().nullable(),
    email: z.string().email('Email inválido'),
    celular: z.string().max(50).optional().nullable(),
    empresa: z.string().min(1, 'Empresa é obrigatória').max(255),
    ramo: z.string().max(255).optional().nullable(),
    num_funcionarios: z.string().max(50).optional().nullable(),
    cidade: z.string().max(255).optional().nullable(),
    estado: z.string().max(100).optional().nullable()
  }),
  respostas: z
    .array(
      z.object({
        pergunta_id: z.number().int().positive(),
        opcao: z.number().int().min(0).max(3)
      })
    )
    .min(1, 'Respostas são obrigatórias')
});

export async function listarPerguntasPublico(req: Request, res: Response) {
  const perguntas = await listarPerguntasPublicoService();
  return res.json(perguntas);
}

export async function calcularResultadoPublico(req: Request, res: Response) {
  const parseResult = calcularSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError('Dados inválidos', 400);
  }
  const { lead, respostas } = parseResult.data;
  const resultado = await calcularResultadoPublicoService(respostas, lead);
  return res.json(resultado);
}
