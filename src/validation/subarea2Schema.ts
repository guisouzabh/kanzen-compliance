import { z } from 'zod';

export const subarea2Schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  subarea_id: z.number().int().positive({ message: 'Subárea é obrigatória' }),
  descricao: z.string().max(500, 'Descrição muito longa').optional().nullable()
});

export type SubArea2Input = z.infer<typeof subarea2Schema>;
