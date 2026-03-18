export type BaseLegalEmpresaStatus = 'ATIVA' | 'INATIVA';

export interface BaseLegalEmpresa {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  base_legal_id: number;
  status: BaseLegalEmpresaStatus;
  fundamento_juridico_empresa?: string | null;
  data_inicio_vigencia?: string | null;
  data_termino_vigencia?: string | null;
  deleted?: number;
  created_at?: string;
  updated_at?: string;
  base_legal_codigo?: string;
  base_legal_nome?: string;
  empresa_nome?: string;
}
