export interface Processo {
  id?: number;
  tenant_id?: number;
  nome: string;
  descricao?: string | null;
  parent_id?: number | null;
  created_at?: string;
}
