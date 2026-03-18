import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const baseLegalEmpresaSchema = z
  .object({
    empresa_id: z.number().int().positive({ message: 'Empresa é obrigatória' }),
    base_legal_id: z.number().int().positive({ message: 'Base legal é obrigatória' }),
    status: z.enum(['ATIVA', 'INATIVA']).default('ATIVA'),
    fundamento_juridico_empresa: z.string().trim().optional().nullable(),
    data_inicio_vigencia: z
      .string()
      .regex(dataRegex, 'Data de início inválida')
      .optional()
      .nullable(),
    data_termino_vigencia: z
      .string()
      .regex(dataRegex, 'Data de término inválida')
      .optional()
      .nullable()
  })
  .superRefine((valores, ctx) => {
    if (
      valores.data_inicio_vigencia &&
      valores.data_termino_vigencia &&
      valores.data_termino_vigencia < valores.data_inicio_vigencia
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data de término deve ser maior ou igual à data de início',
        path: ['data_termino_vigencia']
      });
    }
  });

export type BaseLegalEmpresaInput = z.infer<typeof baseLegalEmpresaSchema>;
