export type DocumentoEmpresaStatus =
  | 'NAO_APLICAVEL'
  | 'PENDENTE'
  | 'EM_ELABORACAO'
  | 'VIGENTE'
  | 'VENCIDO';

export interface DocumentoEmpresa {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  documento_regulatorio_id: number;
  documento_regulatorio_nome?: string;
  documento_regulatorio_sigla?: string | null;
  impacto?: number | null;
  status?: DocumentoEmpresaStatus;
  data_emissao?: Date | string | null;
  data_validade?: Date | string | null;
  responsavel_area_id?: number | null;
  usuario_responsavel_id?: number | null;
  responsavel_tecnico?: string | null;
  observacoes?: string | null;
  created_at?: string;
}
