export type TipoRequisito = 'LEGAL' | 'INTERNO' | 'EXTERNO';

export type StatusRequisito =
  | 'CONFORME'
  | 'NAO_CONFORME'
  | 'EM_ANALISE'
  | 'SEM_ANALISE'
  | 'EM_REANALISE';

export type ModoRequisito = 'ATIVO' | 'RASCUNHO';

export type OrigemRequisito = 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';

export type CriticidadeRequisito = 0 | 1 | 2 | 3 | 4;

export type PrioridadeRequisito = 1 | 2 | 3 | 4 | 5;

export interface Requisito {
  id?: number;
  titulo: string;
  descricao: string;
  tipo: TipoRequisito;
  status: StatusRequisito;
  origem: OrigemRequisito;
  requisito_base_id: number;
  modo: ModoRequisito;
  criticidade: CriticidadeRequisito;
  prioridade: PrioridadeRequisito;
  area_responsavel_id: number;
  area_responsavel_nome?: string;
  usuario_responsavel_id?: number | null;
  usuario_responsavel_nome?: string | null;
  classificacao_id: number;
  classificacao_nome?: string;
  outras_areas_ids?: number[];
  outras_areas_nomes?: string[];
  tags?: string[];
}

export interface RequisitoCheckin {
  id?: number;
  requisito_id: number;
  descricao: string;
  data: Date;
  responsavel: string;
  anexo?: string | null;
  status: StatusRequisito;
}

export interface RequisitoComCheckins extends Requisito {
  checkins: RequisitoCheckin[];
}
