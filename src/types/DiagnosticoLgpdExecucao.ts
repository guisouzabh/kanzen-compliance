export interface DiagnosticoLgpdExecucao {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  modelo_id: number;
  modelo_nome?: string;
  modelo_descricao?: string | null;
  dm_escopo_id?: number;
  escopo_nome?: string | null;
  escopo_descricao?: string | null;
  status?: string;
  nota_geral?: number;
  total_peso?: number;
  max_pontos?: number;
  pontos?: number;
  criado_por_usuario_id?: number | null;
  atualizado_por_usuario_id?: number | null;
  created_at?: string;
  updated_at?: string;
}
