export type TipoMatrizOuFilial = 'MATRIZ' | 'FILIAL';

export interface CnaeSecundario {
  codigo: string;
  descricao: string;
}

export interface Empresa {
  id?: number; // no insert ainda não existe
  nome: string;
  cnpj: string;
  matriz_ou_filial: TipoMatrizOuFilial;
  razao_social: string;
  ramo_atuacao?: string | null;
  cnae_principal_codigo?: string | null;
  cnae_principal_descricao?: string | null;
  cnaes_secundarios?: CnaeSecundario[];
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logo_url?: string | null;
  parametro_maturidade?: number;
  termometro_sancoes_id?: number;
}
