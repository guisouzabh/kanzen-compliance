export interface Unidade {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  nome: string;
  descricao?: string | null;
  created_at?: string;
  empresa_nome?: string;
}
