import { z } from 'zod';

export const documentoConteudoSchema = z.object({
  documento_empresa_id: z.number().int().positive({ message: 'Documento da empresa é obrigatório' }),
  versao: z.number().int().positive().optional(),
  status: z.enum(['RASCUNHO', 'EM_REVISAO', 'APROVADO', 'PUBLICADO']).optional().default('RASCUNHO'),
  titulo_versao: z.string().max(255, 'Título muito longo').optional().nullable(),
  html: z.string().min(1, 'Conteúdo HTML é obrigatório'),
  json_data: z.string().optional().nullable(),
  criado_por_usuario_id: z.number().int().positive().optional().nullable(),
  revisado_por_usuario_id: z.number().int().positive().optional().nullable(),
  aprovado_por_usuario_id: z.number().int().positive().optional().nullable()
});

export type DocumentoConteudoInput = z.infer<typeof documentoConteudoSchema>;
