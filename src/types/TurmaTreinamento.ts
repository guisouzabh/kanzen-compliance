export type TurmaModalidade = 'PRESENCIAL' | 'ONLINE' | 'HIBRIDO';

export type TurmaStatus = 'AGENDADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';

export interface TurmaTreinamento {
  id?: number;
  tenant_id?: number;
  plano_id: number;
  empresa_id: number;
  tema: string;
  instrutor?: string | null;
  modalidade?: TurmaModalidade;
  data_inicio?: string | null;
  data_fim?: string | null;
  carga_horaria?: number | null;
  local_realizacao?: string | null;
  status?: TurmaStatus;
  slug?: string | null;
  prazo_conclusao?: string | null;
  created_by_usuario_id?: number | null;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  created_at?: string;
  updated_at?: string;
}
