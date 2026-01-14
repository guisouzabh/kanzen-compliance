export interface SubArea {
  id?: number;
  tenant_id?: number;
  area_id: number;
  nome: string;
  descricao?: string | null;
  created_at?: string;
  area_nome?: string;
  unidade_id?: number;
  unidade_nome?: string;
  empresa_id?: number;
  empresa_nome?: string;
}
