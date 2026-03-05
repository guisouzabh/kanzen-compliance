export type ComiteStatus = 'ATIVO' | 'INATIVO';
export type ComitePapel = 'PRESIDENTE' | 'SECRETARIO' | 'MEMBRO';
export type ComiteTipo = 'COMITE' | 'DPO';

export interface Comite {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  nome: string;
  descricao?: string | null;
  status?: ComiteStatus;
  tipo?: ComiteTipo;
  total_membros?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ComiteMembro {
  id?: number;
  tenant_id?: number;
  comite_id: number;
  usuario_id: number;
  papel?: ComitePapel;
  ativo?: number;
  usuario_nome?: string;
  usuario_email?: string;
  usuario_role?: 'GESTOR' | 'COLABORADOR' | 'USUARIO_TAREFA';
  created_at?: string;
  updated_at?: string;
}
