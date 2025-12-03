export type TipoMatrizOuFilial = 'MATRIZ' | 'FILIAL';

export interface Empresa {
  id?: number; // no insert ainda não existe
  nome: string;
  cnpj: string;
  matriz_ou_filial: TipoMatrizOuFilial;
  razao_social: string;
}
