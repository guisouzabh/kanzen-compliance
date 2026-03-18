import { z } from 'zod';

const cnaeSecundarioSchema = z.object({
  codigo: z.string().min(1, 'Código CNAE é obrigatório'),
  descricao: z.string().min(1, 'Descrição CNAE é obrigatória')
});

export const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cnpj: z.string().min(14, 'CNPJ muito curto').max(18, 'CNPJ muito longo'),

  matriz_ou_filial: z.enum(['MATRIZ', 'FILIAL'])
    .refine((v) => v === 'MATRIZ' || v === 'FILIAL', {
      message: 'matriz_ou_filial deve ser MATRIZ ou FILIAL',
    }),

  razao_social: z.string().min(1, 'Razão social é obrigatória')
    .max(200, 'Razão social muito longa'),
  ramo_atuacao: z.string().max(255, 'Ramo de atuação muito longo').optional().nullable(),
  cnae_principal_codigo: z.string().max(10, 'CNAE principal inválido').optional().nullable(),
  cnae_principal_descricao: z.string().max(255, 'Descrição CNAE principal muito longa').optional().nullable(),
  cnaes_secundarios: z
    .array(cnaeSecundarioSchema)
    .max(3, 'Máximo de 3 CNAEs secundários')
    .optional()
    .default([]),
  cep: z.string().max(10, 'CEP muito longo').optional().nullable(),
  endereco: z.string().max(255, 'Endereço muito longo').optional().nullable(),
  cidade: z.string().max(100, 'Cidade muito longa').optional().nullable(),
  estado: z.string().max(2, 'Estado muito longo').optional().nullable(),
  logo_url: z.string().max(500, 'URL muito longa').optional().nullable(),
  parametro_maturidade: z.number().int().min(0).max(4).optional().default(0),
  termometro_sancoes_id: z.number().int().min(0).max(6).optional().default(0)
}).superRefine((data, ctx) => {
  const codigos = (data.cnaes_secundarios ?? []).map((item) => item.codigo.trim());
  const codigosUnicos = new Set(codigos);

  if (codigosUnicos.size !== codigos.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Não repita CNAE nos secundários',
      path: ['cnaes_secundarios']
    });
  }

  if (data.cnae_principal_codigo) {
    const principal = data.cnae_principal_codigo.trim();
    if (codigos.includes(principal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CNAE principal não pode ser repetido nos secundários',
        path: ['cnaes_secundarios']
      });
    }
  }
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
