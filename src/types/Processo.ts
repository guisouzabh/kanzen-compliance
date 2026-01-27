export interface Processo {
  id?: number;
  tenant_id?: number;
  nome: string;
  descricao?: string | null;
  created_at?: string;
}
