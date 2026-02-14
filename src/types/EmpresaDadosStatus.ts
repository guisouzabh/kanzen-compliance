export interface EmpresaDadosStatus {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  status_lgpd_id: number;
  status_lgpd_nome?: string;
  percentual: number;
  descricao_sistema?: string | null;
  comentarios?: string | null;
  versao?: number;
  criado_por_usuario_id?: number | null;
  atualizado_por_usuario_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
