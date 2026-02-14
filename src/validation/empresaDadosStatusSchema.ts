import { z } from 'zod';

export const empresaDadosStatusSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  status_lgpd_id: z.number().int().min(0).max(7),
  percentual: z.number().min(0).max(100),
  descricao_sistema: z.string().optional().nullable(),
  comentarios: z.string().optional().nullable(),
  versao: z.number().int().positive().optional().default(1)
});

export type EmpresaDadosStatusInput = z.infer<typeof empresaDadosStatusSchema>;
