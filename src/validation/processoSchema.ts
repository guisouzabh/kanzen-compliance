import { z } from 'zod';

export const processoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  descricao: z.string().optional().nullable(),
  parent_id: z.number().int().positive().optional().nullable()
});

export type ProcessoInput = z.infer<typeof processoSchema>;
