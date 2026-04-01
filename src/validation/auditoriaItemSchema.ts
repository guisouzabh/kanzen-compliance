import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const auditoriaItemSchema = z.object({
  empresa_id:     z.number().int().positive({ message: 'Empresa é obrigatória' }),
  descricao:      z.string().min(1, 'Descrição é obrigatória').max(500),
  tipo:           z.enum(['INTERNA', 'EXTERNA', 'TERCEIRA_PARTE']).optional().default('INTERNA'),
  status:         z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA']).optional().default('PENDENTE'),
  resultado:      z.enum(['CONFORME', 'NAO_CONFORME', 'EM_ANALISE']).optional().nullable(),
  responsavel_id: z.number().int().positive().optional().nullable(),
  prazo:          z.string().regex(dataRegex, 'Prazo inválido').optional().nullable(),
  requisito_id:   z.number().int().positive().optional().nullable(),
  processo_id:    z.number().int().positive().optional().nullable(),
  observacao:     z.string().max(5000).optional().nullable()
});

export type AuditoriaItemInput = z.infer<typeof auditoriaItemSchema>;
