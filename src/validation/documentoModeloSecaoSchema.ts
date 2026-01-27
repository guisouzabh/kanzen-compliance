import { z } from 'zod';

export const documentoModeloSecaoSchema = z.object({
  documento_regulatorio_id: z.number().int().positive({ message: 'Documento regulatório é obrigatório' }),
  chave: z.string().min(1, 'Chave é obrigatória').max(80, 'Chave muito longa'),
  titulo: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  descricao: z.string().optional().nullable(),
  ordem: z.number().int().min(1).default(1),
  obrigatoria: z.boolean().optional().default(true),
  tipo_input: z.enum(['RICH_TEXT', 'TEXT', 'JSON']).optional().default('RICH_TEXT'),
  schema_json: z.string().optional().nullable(),
  template_html: z.string().optional().nullable(),
  links: z
    .array(
      z.object({
        titulo: z.string().min(1, 'Título do link é obrigatório'),
        url: z.string().url('URL inválida')
      })
    )
    .optional()
    .default([]),
  ativo: z.boolean().optional().default(true)
});

export type DocumentoModeloSecaoInput = z.infer<typeof documentoModeloSecaoSchema>;
