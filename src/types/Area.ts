export interface Area {
  id?: number;
  tenant_id?: number;
  empresa_id?: number;
  unidade_id: number;
  nome: string;
  descricao?: string | null;
  empresa_nome?: string;
  unidade_nome?: string;
  latitude?: number | null;
  longitude?: number | null;
}
