import { z } from 'zod';

export const documentoConteudoSecaoSchema = z.object({
  documento_conteudo_id: z.number().int().positive({ message: 'Documento conteúdo é obrigatório' }),
  modelo_secao_id: z.number().int().positive({ message: 'Seção modelo é obrigatória' }),
  status: z.enum(['NAO_INICIADO', 'EM_ANDAMENTO', 'CONCLUIDO']).optional().default('NAO_INICIADO'),
  conteudo_html: z.string().optional().nullable(),
  dados_json: z.string().optional().nullable(),
  checksum: z.string().max(64, 'Checksum muito longo').optional().nullable(),
  atualizado_por_usuario_id: z.number().int().positive().optional().nullable()
});

export type DocumentoConteudoSecaoInput = z.infer<typeof documentoConteudoSecaoSchema>;
