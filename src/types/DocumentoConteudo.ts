export type DocumentoConteudoStatus = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO';

export interface DocumentoConteudo {
  id?: number;
  tenant_id?: number;
  documento_empresa_id: number;
  versao?: number;
  status?: DocumentoConteudoStatus;
  titulo_versao?: string | null;
  html: string;
  json_data?: string | null;
  criado_por_usuario_id?: number | null;
  revisado_por_usuario_id?: number | null;
  aprovado_por_usuario_id?: number | null;
  criado_em?: string;
  atualizado_em?: string;
  criado_por_usuario_nome?: string | null;
  revisado_por_usuario_nome?: string | null;
  aprovado_por_usuario_nome?: string | null;
}
