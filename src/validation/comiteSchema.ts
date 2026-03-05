import { z } from 'zod';

export const comiteSchema = z.object({
  empresa_id: z.number().int().positive('Empresa é obrigatória'),
  nome: z.string().min(1, 'Nome é obrigatório').max(150, 'Nome muito longo'),
  descricao: z.string().max(2000, 'Descrição muito longa').optional().nullable(),
  status: z.enum(['ATIVO', 'INATIVO']).optional().default('ATIVO'),
  tipo: z.enum(['COMITE', 'DPO']).optional().default('COMITE')
});

export const comiteMembroCreateSchema = z.object({
  usuario_id: z.number().int().positive('Usuário é obrigatório'),
  papel: z.enum(['PRESIDENTE', 'SECRETARIO', 'MEMBRO']).optional().default('MEMBRO')
});

export type ComiteInput = z.infer<typeof comiteSchema>;
export type ComiteMembroCreateInput = z.infer<typeof comiteMembroCreateSchema>;
