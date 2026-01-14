export interface RequisitoTarefa {
  id?: number;
  requisito_id: number;
  titulo: string;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  status: 'ABERTO' | 'FECHADO';
  created_at?: Date | string;
}
