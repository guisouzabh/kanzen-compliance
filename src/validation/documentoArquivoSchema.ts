import { z } from 'zod';

const nullableDate = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.coerce.date().nullable()
);

const documentoArquivoStatusEnum = z.enum([
  'RASCUNHO',
  'APROVADO',
  'REJEITADO',
  'PUBLICADO',
  'ARQUIVADO'
]);

export const documentoArquivoSchema = z.object({
  tipo_arquivo: z.enum(['DOCUMENTO_PRINCIPAL', 'LAUDO', 'ANEXO', 'COMPROVANTE', 'OUTRO']),
  status: documentoArquivoStatusEnum.optional().default('RASCUNHO'),
  nome_arquivo: z.string().min(1, 'Nome do arquivo é obrigatório'),
  caminho_arquivo: z.string().min(1, 'Caminho do arquivo é obrigatório'),
  hash_arquivo: z.string().max(128, 'Hash muito longo').optional().nullable(),
  versao: z.string().max(50, 'Versao muito longa').optional().nullable(),
  motivo_rejeicao: z.string().max(1000, 'Motivo de rejeição muito longo').optional().nullable(),
  data_emissao: nullableDate.optional(),
  data_validade: nullableDate.optional()
});

export const documentoArquivoStatusSchema = z.object({
  status: documentoArquivoStatusEnum,
  motivo_rejeicao: z.string().max(1000, 'Motivo de rejeição muito longo').optional().nullable(),
  data_emissao: nullableDate.optional(),
  data_validade: nullableDate.optional()
});

export type DocumentoArquivoInput = z.infer<typeof documentoArquivoSchema>;
export type DocumentoArquivoStatusInput = z.infer<typeof documentoArquivoStatusSchema>;
