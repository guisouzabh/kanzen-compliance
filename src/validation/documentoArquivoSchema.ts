import { z } from 'zod';

export const documentoArquivoSchema = z.object({
  tipo_arquivo: z.enum(['DOCUMENTO_PRINCIPAL', 'LAUDO', 'ANEXO', 'COMPROVANTE', 'OUTRO']),
  nome_arquivo: z.string().min(1, 'Nome do arquivo é obrigatório'),
  caminho_arquivo: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  hash_arquivo: z.string().max(128, 'Hash muito longo').optional().nullable(),
  versao: z.string().max(50, 'Versao muito longa').optional().nullable()
});

export type DocumentoArquivoInput = z.infer<typeof documentoArquivoSchema>;
