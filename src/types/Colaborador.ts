export interface Colaborador {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  usuario_id?: number | null;
  nome: string;
  email: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  identificador?: string | null;
  cargo?: string | null;
  ativo?: number;
  created_at?: string;
  updated_at?: string;
  empresa_nome?: string;
}
