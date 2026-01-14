import { z } from 'zod';

export const subareaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  area_id: z.number().int().positive({ message: 'Área é obrigatória' }),
  descricao: z.string().max(500, 'Descrição muito longa').optional().nullable()
});

export type SubAreaInput = z.infer<typeof subareaSchema>;
