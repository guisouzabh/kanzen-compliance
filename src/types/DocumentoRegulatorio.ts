export type DocumentoObrigatoriedade = 'OBRIGATORIO' | 'CONDICIONAL';
export type DocumentoPeriodicidade =
  | 'UNICO'
  | 'ANUAL'
  | 'BIENAL'
  | 'TRIENAL'
  | 'QUINQUENAL'
  | 'EVENTUAL';

export interface DocumentoRegulatorio {
  id?: number;
  tenant_id?: number;
  classificacao_id: number;
  classificacao_nome?: string;
  nome: string;
  sigla?: string | null;
  descricao: string;
  base_legal?: string | null;
  orgao_emissor?: string | null;
  obrigatoriedade: DocumentoObrigatoriedade;
  periodicidade: DocumentoPeriodicidade;
  exige_responsavel_tecnico?: boolean;
  exige_assinatura?: boolean;
  exige_validade?: boolean;
  ativo?: boolean;
  created_at?: string;
}
