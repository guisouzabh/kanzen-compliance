export type PlanoTipo = 'ACOES' | 'TREINAMENTO' | 'AUDITORIA';

export type PlanoStatus = 'RASCUNHO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

export interface Plano {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  tipo: PlanoTipo;
  nome: string;
  descricao?: string | null;
  status?: PlanoStatus;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  created_at?: string;
  updated_at?: string;
}
