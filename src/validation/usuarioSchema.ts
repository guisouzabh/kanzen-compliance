import { z } from 'zod';

export const usuarioCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  empresa_id: z.number().int().positive().optional().nullable(),
  area_id: z.number().int().positive().optional().nullable()
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
