import { z } from 'zod';

export const dmBaseLegalSchema = z.object({
  codigo: z.string().trim().min(1, 'Código é obrigatório').max(50, 'Código muito longo'),
  nome: z.string().trim().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  ativo: z.boolean().optional()
});

export type DmBaseLegalInput = z.infer<typeof dmBaseLegalSchema>;
