import { z } from 'zod';

const nullableDate = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.coerce.date().nullable()
);

export const documentoEmpresaSchema = z.object({
  empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
  documento_regulatorio_id: z
    .number()
    .int()
    .positive({ message: 'Documento regulatorio é obrigatório' }),
  status: z
    .enum(['NAO_APLICAVEL', 'PENDENTE', 'EM_ELABORACAO', 'VIGENTE', 'VENCIDO'])
    .optional()
    .default('PENDENTE'),
  impacto: z
    .number()
    .int()
    .min(0, 'Impacto deve ser entre 0 e 5')
    .max(5, 'Impacto deve ser entre 0 e 5')
    .optional()
    .nullable(),
  data_emissao: nullableDate.optional(),
  data_validade: nullableDate.optional(),
  responsavel_area_id: z.number().int().positive().optional().nullable(),
  usuario_responsavel_id: z.number().int().positive().optional().nullable(),
  responsavel_tecnico: z.string().max(255, 'Responsavel tecnico muito longo').optional().nullable(),
  observacoes: z.string().optional().nullable()
});

export type DocumentoEmpresaInput = z.infer<typeof documentoEmpresaSchema>;
