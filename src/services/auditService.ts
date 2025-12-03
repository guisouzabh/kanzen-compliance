// src/services/auditService.ts
export async function logChange(
  entidade: any,  
  acao: 'CREATE' | 'UPDATE' | 'DELETE' | 'INFO',
  dados: any
) {
  // aqui no futuro pode gravar em tabela de auditoria, fila, etc.
  console.log(`[AUDIT RLK][${entidade}][${acao}]`, dados);
}
