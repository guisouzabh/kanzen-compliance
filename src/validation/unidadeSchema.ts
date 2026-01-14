import { z } from 'zod';

export const unidadeSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  descricao: z.string().max(500, 'Descrição muito longa').optional().nullable()
});

export type UnidadeInput = z.infer<typeof unidadeSchema>;
