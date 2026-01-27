export type DocumentoArquivoTipo =
  | 'DOCUMENTO_PRINCIPAL'
  | 'LAUDO'
  | 'ANEXO'
  | 'COMPROVANTE'
  | 'OUTRO';

export interface DocumentoArquivo {
  id?: number;
  tenant_id?: number;
  documento_empresa_id: number;
  tipo_arquivo: DocumentoArquivoTipo;
  nome_arquivo: string;
  caminho_arquivo: string;
  hash_arquivo?: string | null;
  versao?: string | null;
  data_upload?: string;
}
