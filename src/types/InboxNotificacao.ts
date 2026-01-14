export type InboxTipo = 'ALERTA' | 'AVISO' | 'INFO';
export type InboxPrioridade = 'ALTA' | 'MEDIA' | 'BAIXA';
export type InboxStatus = 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA';

export interface InboxNotificacao {
  id?: number;
  tenant_id: number;
  usuario_id: number;
  usuario_nome?: string;
  titulo: string;
  corpo: string;
  tipo: InboxTipo;
  prioridade: InboxPrioridade;
  status: InboxStatus;
  remetente: string;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  data_entrega_email?: string | null;
  data_entrega_sms?: string | null;
  data_entrega_whatsapp?: string | null;
  lido_em?: string | null;
  arquivado_em?: string | null;
  created_at?: string;
  updated_at?: string;
}
