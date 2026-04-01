import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const planoSchema = z.object({
  empresa_id:     z.number().int().positive({ message: 'Empresa é obrigatória' }),
  tipo:           z.enum(['ACOES', 'TREINAMENTO', 'AUDITORIA']),
  nome:           z.string().min(1, 'Nome é obrigatório').max(255),
  descricao:      z.string().max(5000).optional().nullable(),
  status:         z.enum(['RASCUNHO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']).optional().default('RASCUNHO'),
  responsavel_id: z.number().int().positive().optional().nullable(),
  data_inicio:    z.string().regex(dataRegex, 'data_inicio inválida').optional().nullable(),
  data_fim:       z.string().regex(dataRegex, 'data_fim inválida').optional().nullable()
});

export type PlanoInput = z.infer<typeof planoSchema>;
