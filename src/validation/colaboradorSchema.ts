import { z } from 'zod';

const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

export const colaboradorSchema = z.object({
  empresa_id:      z.number().int().positive({ message: 'Empresa é obrigatória' }),
  usuario_id:      z.number().int().positive().optional().nullable(),
  nome:            z.string().min(1, 'Nome é obrigatório').max(255),
  email:           z.string().email('E-mail inválido'),
  cpf:             z.string().max(20).optional().nullable(),
  data_nascimento: z.string().regex(dataRegex, 'data_nascimento inválida (YYYY-MM-DD)').optional().nullable(),
  identificador:   z.string().max(100).optional().nullable(),
  cargo:           z.string().max(150).optional().nullable(),
  ativo:           z.number().int().min(0).max(1).optional()
});

export type ColaboradorInput = z.infer<typeof colaboradorSchema>;
