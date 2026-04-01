export type AuditoriaItemTipo = 'INTERNA' | 'EXTERNA' | 'TERCEIRA_PARTE';

export type AuditoriaItemStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';

export type AuditoriaItemResultado = 'CONFORME' | 'NAO_CONFORME' | 'EM_ANALISE';

export interface AuditoriaItem {
  id?: number;
  tenant_id?: number;
  plano_id: number;
  empresa_id: number;
  descricao: string;
  tipo?: AuditoriaItemTipo;
  status?: AuditoriaItemStatus;
  resultado?: AuditoriaItemResultado | null;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  prazo?: string | null;
  requisito_id?: number | null;
  processo_id?: number | null;
  observacao?: string | null;
  created_at?: string;
  updated_at?: string;
}
