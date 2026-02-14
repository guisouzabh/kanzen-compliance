export interface DiagnosticoLgpdResultadoDominio {
  id?: number;
  tenant_id?: number;
  execucao_id: number;
  dominio: string;
  nota?: number;
  total_peso?: number;
  max_pontos?: number;
  pontos?: number;
  created_at?: string;
  updated_at?: string;
}
