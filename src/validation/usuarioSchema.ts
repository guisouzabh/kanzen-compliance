import { z } from 'zod';

export const usuarioCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  empresa_id: z.number().int().positive().optional().nullable(),
  area_id: z.number().int().positive().optional().nullable(),
  role: z.enum(['GESTOR', 'COLABORADOR', 'USUARIO_TAREFA']).optional().default('COLABORADOR')
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;
