import { z } from 'zod';

export const inventarioDadoSchema = z.object({
  categoria_id: z.number().int().positive({ message: 'Categoria é obrigatória' }),
  dado_tratado: z.string().min(1, 'Dado pessoal é obrigatório'),
  dados_sensiveis: z.boolean().optional().default(false),
  dados_menor: z.boolean().optional().default(false),
  tempo_armazenamento: z.string().optional().nullable(),
  local_armazenamento: z.string().optional().nullable(),
  processo_id: z.number().int().positive().optional().nullable()
});

export type InventarioDadoInput = z.infer<typeof inventarioDadoSchema>;
