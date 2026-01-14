import { z } from 'zod';

export const requisitoTarefaSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  responsavel_id: z.number().int().positive().optional().nullable(),
  status: z.enum(['ABERTO', 'FECHADO']).optional()
});

export type RequisitoTarefaInput = z.infer<typeof requisitoTarefaSchema>;
