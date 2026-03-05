export interface DiagnosticoLgpdResposta {
  id?: number;
  tenant_id?: number;
  execucao_id: number;
  pergunta_id: number;
  dominio?: string;
  macro_dominio?: string;
  opcao: number;
  valor?: number;
  peso?: number;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}
