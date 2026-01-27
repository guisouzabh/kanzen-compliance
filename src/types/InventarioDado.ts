export interface InventarioDado {
  id?: number;
  tenant_id?: number;
  categoria_id: number;
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
