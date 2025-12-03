export interface Usuario {
  id?: number;
  nome: string;
  email: string;
  senha?: string;      // só na entrada
  senha_hash?: string; // vindo do banco
  tenant_id?: number;
}
