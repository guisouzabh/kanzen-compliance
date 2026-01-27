export type DocumentoModeloSecaoTipo = 'RICH_TEXT' | 'TEXT' | 'JSON';

export interface DocumentoModeloSecao {
  id?: number;
  tenant_id?: number;
  documento_regulatorio_id: number;
  chave: string;
  titulo: string;
  descricao?: string | null;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: DocumentoModeloSecaoTipo;
  schema_json?: string | null;
  template_html?: string | null;
  ativo?: boolean;
  created_at?: string;
  documento_regulatorio_nome?: string;
  links?: DocumentoModeloSecaoLink[];
}

export interface DocumentoModeloSecaoLink {
  id?: number;
  tenant_id?: number;
  modelo_secao_id?: number;
  titulo: string;
  url: string;
  created_at?: string;
}
