export interface ConfiguracaoTreinamento {
  id?: number;
  tenant_id?: number;
  plano_id: number;
  quiz_habilitado?: number;
  nota_minima?: number | null;
  max_tentativas?: number | null;
  tipo_identificador?: string;
  label_identificador?: string;
  link_publico_habilitado?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TreinamentoMaterial {
  id?: number;
  tenant_id?: number;
  plano_id?: number;
  turma_id?: number;
  titulo: string;
  tipo: 'LINK' | 'PDF' | 'VIDEO';
  url: string;
  ordem?: number;
  ativo?: number;
  created_at?: string;
  origem?: 'PLANO' | 'TURMA';
}

export interface Alternativa {
  texto: string;
  correta: boolean;
}

export interface TreinamentoQuizPergunta {
  id?: number;
  tenant_id?: number;
  plano_id: number;
  pergunta: string;
  alternativas_json: string;
  alternativas?: Alternativa[];
  ordem?: number;
  ativo?: number;
  created_at?: string;
  updated_at?: string;
}

export type ParticipanteStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'APROVADO' | 'REPROVADO';

export interface TreinamentoParticipante {
  id?: number;
  tenant_id?: number;
  turma_id: number;
  colaborador_id: number;
  status?: ParticipanteStatus;
  nota_final?: number | null;
  tentativas_realizadas?: number;
  concluido_em?: string | null;
  magic_token?: string | null;
  magic_token_expira_em?: string | null;
  created_at?: string;
  updated_at?: string;
  colaborador_nome?: string;
  colaborador_email?: string;
  colaborador_identificador?: string;
  colaborador_data_nascimento?: string;
  colaborador_cargo?: string;
}

export interface TreinamentoExecucao {
  id?: number;
  tenant_id?: number;
  participante_id: number;
  tentativa_numero: number;
  nota?: number | null;
  total_perguntas: number;
  total_acertos?: number;
  status?: 'EM_ANDAMENTO' | 'FINALIZADA';
  iniciado_em: string;
  finalizado_em?: string | null;
  created_at?: string;
}

export interface TreinamentoResposta {
  id?: number;
  tenant_id?: number;
  execucao_id: number;
  pergunta_id: number;
  alternativa_index: number;
  correta: number;
  created_at?: string;
}
