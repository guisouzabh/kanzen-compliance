export type UserRole = 'GESTOR' | 'COLABORADOR' | 'USUARIO_TAREFA';

const ROLE_ALIAS: Record<string, UserRole> = {
  GESTOR: 'GESTOR',
  ADMIN: 'GESTOR',
  ADMIN_MESTRE: 'GESTOR',
  COLABORADOR: 'COLABORADOR',
  USUARIO_TAREFA: 'USUARIO_TAREFA'
};

export function normalizeUserRole(role: unknown): UserRole | undefined {
  if (typeof role !== 'string') return undefined;
  const normalized = role.trim().toUpperCase();
  return ROLE_ALIAS[normalized];
}
