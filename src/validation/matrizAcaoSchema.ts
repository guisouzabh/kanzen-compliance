import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const matrizAcaoSchema = z
  .object({
    empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
    acao: z.string().min(1, 'Ação é obrigatória'),
    objetivo: z.string().max(2000, 'Objetivo muito longo').optional().nullable(),
    status: z
      .enum(['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'IMPEDIDA'])
      .optional()
      .default('PLANEJADA'),
    prioridade: z.number().int().min(1).max(5).default(3),
    esforco: z.number().int().min(1).max(5).default(3),
    prazo: z.string().regex(dataRegex, 'Prazo inválido').optional().nullable(),
    status_prazo: z
      .enum(['NAO_APLICAVEL', 'NO_PRAZO', 'ATRASADA'])
      .optional()
      .default('NO_PRAZO'),
    origem: z.string().max(2000, 'Origem muito longa').optional().nullable(),
    origem_typ: z.string().max(50, 'origem_typ muito longo').optional().nullable(),
    origem_id: z.number().int().positive().optional().nullable(),
    responsavel_id: z.number().int().positive().optional().nullable()
  })
  .refine((dados) => !dados.origem_id || !!dados.origem_typ, {
    message: 'origem_typ é obrigatório quando origem_id é informado',
    path: ['origem_typ']
  });

export type MatrizAcaoInput = z.infer<typeof matrizAcaoSchema>;
