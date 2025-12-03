import { z } from 'zod';

export const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ muito curto').max(18, 'CNPJ muito longo'),

  matriz_ou_filial: z.enum(['MATRIZ', 'FILIAL'])
    .refine((v) => v === 'MATRIZ' || v === 'FILIAL', {
      message: 'matriz_ou_filial deve ser MATRIZ ou FILIAL',
    }),

  razao_social: z.string().min(1, 'Razão social é obrigatória')
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
