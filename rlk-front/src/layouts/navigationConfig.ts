import type { MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export interface NavigationItem {
  key: string;
  label: string;
  path: string;
  roles?: string[];
  hiddenInMenu?: boolean;
}

export interface NavigationModule {
  key: string;
  label: string;
  roles?: string[];
  items: NavigationItem[];
}

const NAVIGATION_MODULES: NavigationModule[] = [
  {
    key: 'minha-empresa',
    label: 'Minha Empresa',
    items: [
      { key: 'empresa-dados', label: 'Dados da Empresa', path: '/empresas' },
      { key: 'empresa-usuarios', label: 'Usuarios da Empresa', path: '/usuarios' },
      { key: 'empresa-hierarquia', label: 'Hierarquia', path: '/hierarquia' },
      { key: 'empresa-colaboradores', label: 'Colaboradores', path: '/colaboradores' }
    ]
  },
  {
    key: 'governanca',
    label: 'Governanca',
    items: [
      { key: 'governanca-documentos-empresa', label: 'Documentos da Empresa', path: '/documentos-empresa' },
      { key: 'governanca-comite', label: 'Comite', path: '/comites' },
      { key: 'governanca-dpo', label: 'DPO', path: '/dpo' }
    ]
  },
  {
    key: 'inventario-dados',
    label: 'Inventario de Dados',
    items: [
      { key: 'inventario-lista', label: 'Inventario', path: '/inventario-dados' },
      { key: 'inventario-base-legais', label: 'Base Legais', path: '/base-legais' },
      { key: 'inventario-categorias', label: 'Categorias de Dados', path: '/categorias-dados' },
      { key: 'inventario-processos', label: 'Processos', path: '/processos' },
      { key: 'inventario-mapa', label: 'Mapa LGPD', path: '/lgpd-mapa' }
    ]
  },
  {
    key: 'acoes',
    label: 'Acoes',
    items: [
      { key: 'acoes-matriz', label: 'Matriz de Acoes', path: '/matriz-acoes' },
      { key: 'acoes-kanban', label: 'Kanban', path: '/matriz-acoes-kanban' }
    ]
  },
  {
    key: 'requisitos-legais',
    label: 'Requisitos Legais',
    items: [
      { key: 'requisitos-lista', label: 'Requisitos', path: '/requisitos' },
      { key: 'requisitos-novo', label: 'Novo Requisito', path: '/requisitos/novo', hiddenInMenu: true }
    ]
  },
  {
    key: 'riscos',
    label: 'Riscos',
    items: [{ key: 'riscos-avaliacao', label: 'Avaliação de Risco LGPD', path: '/riscos' }]
  },
  {
    key: 'capacitacao',
    label: 'Capacitacao',
    items: [
      { key: 'capacitacao-programas', label: 'Programas de Treinamento', path: '/capacitacao' },
      { key: 'capacitacao-detalhe', label: 'Detalhe Treinamento', path: '/capacitacao/:id', hiddenInMenu: true },
      { key: 'capacitacao-turma', label: 'Detalhe Turma', path: '/capacitacao/turmas/:turmaId', hiddenInMenu: true }
    ]
  },
  {
    key: 'auditoria',
    label: 'Auditoria',
    items: [{ key: 'auditoria-plano', label: 'Plano e Achados', path: '/auditoria' }]
  },
  {
    key: 'relatorios',
    label: 'Relatorios',
    items: [
      { key: 'relatorios-executivo', label: 'Dashboard Executivo', path: '/dashboard' },
      { key: 'relatorios-operacionais', label: 'Relatorios Operacionais', path: '/relatorios-operacionais' }
    ]
  },
  {
    key: 'medidas-protecao',
    label: 'Medidas de Protecao',
    items: [
      { key: 'medidas-diagnostico', label: 'Diagnostico LGPD', path: '/diagnostico-lgpd' },
      { key: 'medidas-status', label: 'Status LGPD', path: '/empresa-dados-status' },
      { key: 'medidas-painel', label: 'Maturidade e Sancoes', path: '/painel-maturidade-sancoes' }
    ]
  },
  {
    key: 'direitos-titulares',
    label: 'Direitos dos Titulares de Dados',
    items: [{ key: 'titular-solicitacoes', label: 'Solicitacoes', path: '/solicitacoes-titular' }]
  },
  {
    key: 'mestre',
    label: 'Mestre',
    roles: ['ADMIN_MESTRE'],
    items: [
      {
        key: 'mestre-documentos-regulatorios',
        label: 'Cadastro de Documentos Regulatorios',
        path: '/documentos-regulatorios',
        roles: ['ADMIN_MESTRE']
      },
      {
        key: 'mestre-admin',
        label: 'Administracao Mestre',
        path: '/mestre',
        roles: ['ADMIN_MESTRE']
      },
      {
        key: 'mestre-auditoria',
        label: 'Auditoria da Plataforma',
        path: '/mestre/auditoria-plataforma',
        roles: ['ADMIN_MESTRE']
      }
    ]
  }
];

function isRoleAllowed(allowedRoles: string[] | undefined, role: string | null): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!role) return false;
  return allowedRoles.includes(role);
}

export function buildNavigationForRole(role: string | null): NavigationModule[] {
  return NAVIGATION_MODULES
    .filter((module) => isRoleAllowed(module.roles, role))
    .map((module) => ({
      ...module,
      items: module.items.filter((item) => isRoleAllowed(item.roles, role))
    }))
    .filter((module) => module.items.length > 0);
}

function isItemActive(pathname: string, itemPath: string): boolean {
  if (pathname === itemPath) return true;
  return pathname.startsWith(`${itemPath}/`);
}

export function resolveNavigationState(modules: NavigationModule[], pathname: string): {
  activeModule: NavigationModule | null;
  activeItem: NavigationItem | null;
} {
  let activeModule: NavigationModule | null = null;
  let activeItem: NavigationItem | null = null;

  for (const module of modules) {
    for (const item of module.items) {
      if (!isItemActive(pathname, item.path)) continue;

      if (!activeItem || item.path.length > activeItem.path.length) {
        activeItem = item;
        activeModule = module;
      }
    }
  }

  return { activeModule, activeItem };
}

export function getDefaultModulePath(module: NavigationModule | null): string | null {
  if (!module) return null;
  const firstVisible = module.items.find((item) => !item.hiddenInMenu);
  return (firstVisible ?? module.items[0])?.path ?? null;
}

export function buildTopLevelMenuItems(modules: NavigationModule[]): MenuItem[] {
  return modules.map((module) => ({
    key: module.key,
    label: module.label
  }));
}

export function buildSecondLevelMenuItems(module: NavigationModule | null): MenuItem[] {
  if (!module) return [];
  return module.items
    .filter((item) => !item.hiddenInMenu)
    .map((item) => ({
      key: item.path,
      label: item.label
    }));
}

export function buildMobileMenuItems(modules: NavigationModule[]): MenuItem[] {
  return modules.map((module) => ({
    key: module.key,
    label: module.label,
    children: module.items
      .filter((item) => !item.hiddenInMenu)
      .map((item) => ({ key: item.path, label: item.label }))
  }));
}
