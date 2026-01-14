import { z } from 'zod';

export const requisitoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  tipo: z.enum(['LEGAL', 'INTERNO', 'EXTERNO']),
  status: z.enum(['CONFORME', 'NAO_CONFORME', 'EM_ANALISE', 'SEM_ANALISE', 'EM_REANALISE']),
  origem: z.enum(['MUNICIPAL', 'ESTADUAL', 'FEDERAL']),
  requisito_base_id: z.number().int().positive({ message: 'Requisito base é obrigatório' }),
  modo: z.enum(['ATIVO', 'RASCUNHO']).default('RASCUNHO'),
  criticidade: z.number().int().min(0).max(4).default(3),
  prioridade: z.number().int().min(1).max(5).default(3),
  classificacao_id: z.number().int().positive({ message: 'Classificação é obrigatória' }),
  area_responsavel_id: z.number().int().positive({ message: 'Área responsável é obrigatória' }),
  usuario_responsavel_id: z.number().int().positive().optional().nullable(),
  outras_areas_ids: z.array(z.number().int().positive()).max(50).optional(),
  tags: z.array(z.string().min(1)).max(50).optional()
});

export const requisitoCheckinSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  data: z
    .coerce
    .date()
    .refine((d) => !Number.isNaN(d.getTime()), { message: 'Data inválida' }),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  status: z.enum(['CONFORME', 'NAO_CONFORME', 'EM_ANALISE', 'SEM_ANALISE', 'EM_REANALISE']),
  anexo: z.string().max(255, 'Anexo muito longo').optional().nullable()
});

export type RequisitoInput = z.infer<typeof requisitoSchema>;
export type RequisitoCheckinInput = z.infer<typeof requisitoCheckinSchema>;
