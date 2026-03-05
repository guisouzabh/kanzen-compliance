export type MatrizAcaoStatus = 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'IMPEDIDA';

export type MatrizAcaoStatusPrazo = 'NAO_APLICAVEL' | 'NO_PRAZO' | 'ATRASADA';

export type MatrizAcaoPrioridade = 1 | 2 | 3 | 4 | 5;

export type MatrizAcaoEsforco = 1 | 2 | 3 | 4 | 5;

export interface MatrizAcao {
  id?: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  acao: string;
  objetivo?: string | null;
  status?: MatrizAcaoStatus;
  prioridade?: MatrizAcaoPrioridade;
  esforco?: MatrizAcaoEsforco;
  prazo?: Date | string | null;
  status_prazo?: MatrizAcaoStatusPrazo;
  origem?: string | null;
  origem_typ?: string | null;
  origem_id?: number | null;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}
