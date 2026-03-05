export interface DiagnosticoLgpdModelo {
  id?: number;
  tenant_id?: number;
  nome: string;
  descricao?: string | null;
  dm_escopo_id?: number;
  escopo_nome?: string | null;
  versao?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}
