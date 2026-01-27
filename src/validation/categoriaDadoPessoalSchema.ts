import { z } from 'zod';

export const categoriaDadoPessoalSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo')
});

export type CategoriaDadoPessoalInput = z.infer<typeof categoriaDadoPessoalSchema>;
