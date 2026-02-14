export interface DiagnosticoLgpdPergunta {
  id?: number;
  tenant_id?: number;
  modelo_id: number;
  codigo: string;
  dominio: string;
  pergunta: string;
  opcao_0: string;
  opcao_1: string;
  opcao_2: string;
  opcao_3: string;
  peso: number;
  ordem?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}
