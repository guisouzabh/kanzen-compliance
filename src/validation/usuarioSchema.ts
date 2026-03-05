import { z } from 'zod';

export const usuarioCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
  foto_url: z.string().url('URL da foto inválida').optional().nullable(),
  empresa_id: z.number().int().positive().optional().nullable(),
  area_id: z.number().int().positive().optional().nullable(),
  role: z.enum(['GESTOR', 'COLABORADOR', 'USUARIO_TAREFA']).optional().default('COLABORADOR')
});

export type UsuarioCreateInput = z.infer<typeof usuarioCreateSchema>;

export const usuarioUpdateMeSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  foto_url: z.string().url('URL da foto inválida').optional().nullable()
});

export type UsuarioUpdateMeInput = z.infer<typeof usuarioUpdateMeSchema>;

export const usuarioTrocaSenhaSchema = z.object({
  senha_atual: z.string().min(1, 'Senha atual é obrigatória'),
  nova_senha: z.string().min(6, 'Nova senha deve ter ao menos 6 caracteres')
});

export type UsuarioTrocaSenhaInput = z.infer<typeof usuarioTrocaSenhaSchema>;
