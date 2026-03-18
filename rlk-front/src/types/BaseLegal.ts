export type BaseLegalStatus = 'ATIVA' | 'INATIVA';

export interface DmBaseLegalItem {
  id: number;
  codigo: string;
  nome: string;
  ativo: number;
  created_at?: string;
  updated_at?: string;
}

export interface BaseLegalEmpresaItem {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  base_legal_id: number;
  base_legal_codigo?: string;
  base_legal_nome?: string;
  status: BaseLegalStatus;
  fundamento_juridico_empresa?: string | null;
  data_inicio_vigencia?: string | null;
  data_termino_vigencia?: string | null;
  deleted: number;
  created_at?: string;
  updated_at?: string;
}
