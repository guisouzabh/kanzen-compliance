import { z } from 'zod';

export const documentoRegulatorioSchema = z.object({
  classificacao_id: z.number().int().positive({ message: 'Classificação é obrigatória' }),
  nome: z.string().min(1, 'Nome é obrigatório'),
  sigla: z.string().max(50, 'Sigla muito longa').optional().nullable(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  base_legal: z.string().max(255, 'Base legal muito longa').optional().nullable(),
  orgao_emissor: z.string().max(255, 'Órgão emissor muito longo').optional().nullable(),
  obrigatoriedade: z.enum(['OBRIGATORIO', 'CONDICIONAL']),
  periodicidade: z.enum(['UNICO', 'ANUAL', 'BIENAL', 'TRIENAL', 'QUINQUENAL', 'EVENTUAL']),
  exige_responsavel_tecnico: z.boolean().optional().default(false),
  exige_assinatura: z.boolean().optional().default(false),
  exige_validade: z.boolean().optional().default(true),
  ativo: z.boolean().optional().default(true)
});

export type DocumentoRegulatorioInput = z.infer<typeof documentoRegulatorioSchema>;
