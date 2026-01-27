export type DocumentoConteudoSecaoStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export interface DocumentoConteudoSecao {
  id?: number;
  tenant_id?: number;
  documento_conteudo_id: number;
  modelo_secao_id: number;
  status?: DocumentoConteudoSecaoStatus;
  conteudo_html?: string | null;
  dados_json?: string | null;
  checksum?: string | null;
  atualizado_por_usuario_id?: number | null;
  atualizado_em?: string;
  created_at?: string;
  chave?: string;
  titulo?: string;
  descricao?: string | null;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: string;
}
