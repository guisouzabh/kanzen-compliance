export type PrivacyCaseTipo = 'EVENTO_INCIDENTE';

export type PrivacyCaseOrigem = 'INTERNO' | 'EXTERNO';

export type PrivacyCaseStatus =
  | 'ABERTO'
  | 'EM_TRIAGEM'
  | 'EM_ANALISE'
  | 'DECISAO_COMUNICACAO'
  | 'CONCLUIDO'
  | 'DESCARTADO';

export type PrivacyCaseSeveridade = 'ALTA' | 'MEDIA' | 'BAIXA';

export type PrivacyCaseDecisaoComunicacao = 'PENDENTE' | 'SIM' | 'NAO';

export type PrivacyCaseTimelineEvento =
  | 'CRIACAO'
  | 'ATUALIZACAO'
  | 'COMENTARIO'
  | 'MUDANCA_STATUS'
  | 'MUDANCA_SEVERIDADE'
  | 'DECISAO_COMUNICACAO'
  | 'ANEXO_ADICIONADO'
  | 'ANEXO_REMOVIDO';

export interface PrivacyCase {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  protocolo?: string;
  tipo_case?: PrivacyCaseTipo;
  origem: PrivacyCaseOrigem;
  titulo: string;
  descricao: string;
  status?: PrivacyCaseStatus;
  severidade?: PrivacyCaseSeveridade;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  prazo?: string | null;
  anonimo?: boolean | number;
  reportante_nome?: string | null;
  reportante_email?: string | null;
  reportante_canal?: string | null;
  aceita_contato?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface PrivacyCaseIncidentDetails {
  id?: number;
  tenant_id?: number;
  privacy_case_id: number;
  comite_id_decisao?: number | null;
  comite_nome_decisao?: string | null;
  dados_afetados?: string | null;
  titulares_afetados_estimado?: number | null;
  impacto_descricao?: string | null;
  medidas_contencao?: string | null;
  decisao_comunicar_anpd?: PrivacyCaseDecisaoComunicacao;
  decisao_comunicar_titulares?: PrivacyCaseDecisaoComunicacao;
  justificativa_decisao?: string | null;
  data_decisao?: string | null;
  decisao_por_usuario_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface PrivacyCaseComDetalhes extends PrivacyCase {
  detalhes_incidente?: PrivacyCaseIncidentDetails | null;
}

export interface PrivacyCaseTimelineItem {
  id?: number;
  tenant_id?: number;
  privacy_case_id: number;
  evento_tipo: PrivacyCaseTimelineEvento;
  descricao: string;
  metadata_json?: string | null;
  metadata?: Record<string, unknown> | null;
  criado_por_usuario_id?: number | null;
  criado_por_usuario_nome?: string | null;
  created_at?: string;
}

export interface PrivacyCaseAttachment {
  id?: number;
  tenant_id?: number;
  privacy_case_id: number;
  nome_arquivo: string;
  caminho_arquivo: string;
  tipo_mime?: string | null;
  tamanho_bytes: number;
  hash_arquivo?: string | null;
  enviado_por_usuario_id?: number | null;
  enviado_por_usuario_nome?: string | null;
  created_at?: string;
}

export interface PrivacyCaseDecisionApproval {
  id?: number;
  tenant_id?: number;
  privacy_case_id: number;
  comite_id: number;
  comite_nome?: string;
  usuario_id: number;
  usuario_nome?: string;
  aprovado: number | boolean;
  decisao_comunicar_anpd?: 'SIM' | 'NAO' | null;
  decisao_comunicar_titulares?: 'SIM' | 'NAO' | null;
  justificativa?: string | null;
  created_at?: string;
  updated_at?: string;
}
