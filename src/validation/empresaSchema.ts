import { z } from 'zod';

export const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ muito curto').max(18, 'CNPJ muito longo'),

  matriz_ou_filial: z.enum(['MATRIZ', 'FILIAL'])
    .refine((v) => v === 'MATRIZ' || v === 'FILIAL', {
      message: 'matriz_ou_filial deve ser MATRIZ ou FILIAL',
    }),

  razao_social: z.string().min(1, 'Razão social é obrigatória')
    .max(200, 'Razão social muito longa'),
  cep: z.string().max(10, 'CEP muito longo').optional().nullable(),
  endereco: z.string().max(255, 'Endereço muito longo').optional().nullable(),
  cidade: z.string().max(100, 'Cidade muito longa').optional().nullable(),
  estado: z.string().max(2, 'Estado muito longo').optional().nullable(),
  logo_url: z.string().max(500, 'URL muito longa').optional().nullable()
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
