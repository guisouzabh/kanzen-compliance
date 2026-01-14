import { z } from 'zod';

export const classificacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório')
});

export type ClassificacaoInput = z.infer<typeof classificacaoSchema>;
