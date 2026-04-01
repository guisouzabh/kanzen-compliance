export interface CategoriaDado {
  id: number;
  nome: string;
}

export interface InventarioDado {
  id?: number;
  categoria_id?: number;
  categoria?: string;
  dado_tratado: string;
  dados_sensiveis?: boolean;
  dados_menor?: boolean;
  tempo_armazenamento?: string | null;
  local_armazenamento?: string | null;
  processo_id?: number | null;
  created_at?: string;
  _tempId?: string;
  _status?: 'novo' | 'alterado' | 'salvo';
  _loading?: boolean;
}

export interface ProcessoLista {
  id: number;
  nome: string;
  descricao?: string | null;
  parent_id?: number | null;
  created_at?: string;
  children?: ProcessoLista[];
}
