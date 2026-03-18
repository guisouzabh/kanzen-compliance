export type DocumentoArquivoTipo =
  | 'DOCUMENTO_PRINCIPAL'
  | 'LAUDO'
  | 'ANEXO'
  | 'COMPROVANTE'
  | 'OUTRO';

export type DocumentoArquivoStatus =
  | 'RASCUNHO'
  | 'APROVADO'
  | 'REJEITADO'
  | 'PUBLICADO'
  | 'ARQUIVADO';

export interface DocumentoArquivo {
  id?: number;
  tenant_id?: number;
  documento_empresa_id: number;
  tipo_arquivo: DocumentoArquivoTipo;
  status?: DocumentoArquivoStatus;
  nome_arquivo: string;
  caminho_arquivo: string;
  hash_arquivo?: string | null;
  versao?: string | null;
  motivo_rejeicao?: string | null;
  data_emissao?: Date | string | null;
  data_validade?: Date | string | null;
  aprovado_em?: string | null;
  rejeitado_em?: string | null;
  publicado_em?: string | null;
  arquivado_em?: string | null;
  data_upload?: string;
}
