import type { ReactNode } from 'react';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  AuditOutlined,
  BellOutlined,
  ClusterOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined
} from '@ant-design/icons';

type MenuItem = Required<MenuProps>['items'][number];

type Visibility = 'ALL' | 'GESTOR_ONLY';

interface MenuNode {
  key: string;
  label: string;
  icon?: ReactNode;
  visibility?: Visibility;
  children?: MenuNode[];
}

const MENU_TREE: MenuNode[] = [
  {
    key: 'gestor',
    icon: <FileTextOutlined />,
    label: 'Gestor',
    children: [
      { key: '/documentos-regulatorios', icon: <FileTextOutlined />, label: 'Documentos Regulatórios' }
    ]
  },
  { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/requisitos', icon: <AuditOutlined />, label: 'Requisitos' },
  {
    key: 'atividades',
    icon: <AuditOutlined />,
    label: 'Atividades',
    children: [
      { key: '/matriz-acoes', icon: <FileTextOutlined />, label: 'Matriz de Ações' },
      { key: '/matriz-acoes-kanban', icon: <FileTextOutlined />, label: 'Matriz de Ações (Kanban)' }
    ]
  },
  {
    key: 'documentos',
    icon: <FileTextOutlined />,
    label: 'Documentos',
    children: [
      { key: '/documentos-empresa', icon: <FileTextOutlined />, label: 'Documentos da Empresa' }
    ]
  },
  {
    key: 'dados-pessoais',
    icon: <FileTextOutlined />,
    label: 'Dados Pessoais',
    children: [
      { key: '/lgpd-mapa', icon: <FileTextOutlined />, label: 'Mapa LGPD' },
      { key: '/inventario-dados', icon: <FileTextOutlined />, label: 'Inventário de Dados' },
      { key: '/categorias-dados', icon: <FileTextOutlined />, label: 'Categorias de Dados' },
      { key: '/processos', icon: <FileTextOutlined />, label: 'Processos' },
      { key: '/empresa-dados-status', icon: <FileTextOutlined />, label: 'Status LGPD' },
      { key: '/diagnostico-lgpd', icon: <FileTextOutlined />, label: 'Diagnóstico LGPD' },
      { key: '/solicitacoes-titular', icon: <FileTextOutlined />, label: 'Direitos do Titular' },
      { key: '/painel-maturidade-sancoes', icon: <FileTextOutlined />, label: 'Painel Maturidade e Sanções' }
    ]
  },
  {
    key: 'hierarquia',
    icon: <ClusterOutlined />,
    label: 'Hierarquia',
    visibility: 'GESTOR_ONLY',
    children: [
      { key: '/empresas', icon: <ApartmentOutlined />, label: 'Cadastro de Empresas' },
      { key: '/hierarquia', icon: <ClusterOutlined />, label: 'Hierarquia' }
    ]
  },
  { key: '/notificacoes', icon: <BellOutlined />, label: 'Notificações' },
  {
    key: 'config',
    icon: <SettingOutlined />,
    label: 'Configurações',
    visibility: 'GESTOR_ONLY',
    children: [
      { key: '/usuarios', icon: <UserOutlined />, label: 'Usuários' }
    ]
  }
];

function canViewNode(node: MenuNode, role: string | null): boolean {
  if (node.visibility === 'GESTOR_ONLY') {
    return !role || role === 'GESTOR';
  }
  return true;
}

function toAntdItems(nodes: MenuNode[], role: string | null): MenuItem[] {
  return nodes
    .filter((node) => canViewNode(node, role))
    .map((node) => {
      const children = node.children ? toAntdItems(node.children, role) : undefined;
      return {
        key: node.key,
        icon: node.icon,
        label: node.label,
        children: children && children.length ? children : undefined
      };
    });
}

export function buildSidebarMenuItems(role: string | null): MenuItem[] {
  return toAntdItems(MENU_TREE, role);
}
