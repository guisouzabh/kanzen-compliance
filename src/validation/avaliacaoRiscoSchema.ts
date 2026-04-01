import { z } from 'zod';

export const avaliacaoRiscoSchema = z.object({
  inventario_id: z.number().int().positive(),
  probabilidade: z.number().int().min(0).max(4),
  impacto: z.number().int().min(0).max(4),
  justificativa: z.string().min(1),
  medidas_mitigatorias: z.string().min(1),
  responsavel_risco: z.string().min(1).max(255),
  motivo_alteracao: z.string().max(500).optional().nullable()
});

export type AvaliacaoRiscoInput = z.infer<typeof avaliacaoRiscoSchema>;
