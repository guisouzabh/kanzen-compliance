export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

export interface AvaliacaoRisco {
  id: number;
  tenant_id: number;
  inventario_id: number;
  probabilidade: number;
  impacto: number;
  nivel_risco: NivelRisco;
  justificativa: string;
  medidas_mitigatorias: string;
  responsavel_risco: string;
  avaliado_por_usuario_id: number | null;
  versao: number;
  created_at: string;
  updated_at: string;
}

export interface HistoricoAvaliacaoRisco {
  id: number;
  tenant_id: number;
  avaliacao_risco_id: number;
  probabilidade_anterior: number;
  impacto_anterior: number;
  nivel_risco_anterior: NivelRisco;
  justificativa_anterior: string;
  medidas_mitigatorias_anterior: string;
  responsavel_anterior: string;
  alterado_por_usuario_id: number | null;
  motivo_alteracao: string | null;
  created_at: string;
}
