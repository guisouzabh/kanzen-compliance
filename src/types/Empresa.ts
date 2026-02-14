export type TipoMatrizOuFilial = 'MATRIZ' | 'FILIAL';

export interface Empresa {
  id?: number; // no insert ainda não existe
  nome: string;
  cnpj: string;
  matriz_ou_filial: TipoMatrizOuFilial;
  razao_social: string;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logo_url?: string | null;
  parametro_maturidade?: number;
  termometro_sancoes_id?: number;
}
