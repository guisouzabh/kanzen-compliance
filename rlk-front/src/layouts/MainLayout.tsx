import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Select, Spin, Badge, Drawer, Grid, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  LogoutOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  EditOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import api from '../services/api';
import { buildMobileMenuItems, buildNavigationForRole, resolveNavigationState } from './navigationConfig';

const ROUTE_TITLE_OVERRIDES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/documentos-regulatorios\/\d+\/secoes$/, title: 'Secoes do Documento Regulatorio' },
  { pattern: /^\/meu-perfil$/, title: 'Meu Perfil' },
  { pattern: /^\/notificacoes$/, title: 'Notificacoes' }
];

function MainLayout() {
  const { Header, Content, Sider } = Layout;
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const navigate = useNavigate();
  const location = useLocation();
  const { empresas, empresaSelecionada, setEmpresaSelecionada, carregando } = useEmpresaContext();
  const [naoLidas, setNaoLidas] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('layout:sider-collapsed') === '1');
  const [nomePerfil, setNomePerfil] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  function getUsuarioIdFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.sub === 'number' ? payload.sub : Number(payload.sub);
    } catch {
      return null;
    }
  }

  function getUsuarioRoleFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.role === 'string' ? payload.role : null;
    } catch {
      return null;
    }
  }

  function getUsuarioNomeFromToken() {
    const token = localStorage.getItem('token');
    if (!token) return 'Usuario';
    const parts = token.split('.');
    if (parts.length < 2) return 'Usuario';
    try {
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.nome === 'string' && payload.nome.trim() ? payload.nome : 'Usuario';
    } catch {
      return 'Usuario';
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  useEffect(() => {
    let ativo = true;
    async function carregarNaoLidas() {
      const usuarioId = getUsuarioIdFromToken();
      if (!usuarioId) return;
      try {
        const response = await api.get('/inbox-notificacoes', {
          params: {
            usuario_id: usuarioId,
            status: 'NAO_LIDA'
          }
        });
        if (!ativo) return;
        const total = Array.isArray(response.data) ? response.data.length : 0;
        setNaoLidas(total);
      } catch {
        if (ativo) setNaoLidas(0);
      }
    }

    carregarNaoLidas();
    const intervalId = window.setInterval(carregarNaoLidas, 30000);

    return () => {
      ativo = false;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarMeuPerfil() {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const response = await api.get('/usuarios/me');
        if (!ativo) return;
        setNomePerfil(response.data?.nome ?? null);
        setFotoPerfil(response.data?.foto_url ?? null);
      } catch {
        if (!ativo) return;
        setNomePerfil(null);
        setFotoPerfil(null);
      }
    }

    carregarMeuPerfil();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('layout:sider-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const usuarioRole = getUsuarioRoleFromToken();
  const usuarioNome = nomePerfil || getUsuarioNomeFromToken();

  const navigationModules = useMemo(() => buildNavigationForRole(usuarioRole), [usuarioRole]);
  const navigationState = useMemo(
    () => resolveNavigationState(navigationModules, location.pathname),
    [navigationModules, location.pathname]
  );

  const sidebarItems = useMemo(() => buildMobileMenuItems(navigationModules), [navigationModules]);
  const rootMenuKeys = useMemo(() => navigationModules.map((module) => module.key), [navigationModules]);

  useEffect(() => {
    if (!navigationState.activeModule) return;
    if (collapsed && !isMobile) return;
    setOpenKeys([navigationState.activeModule.key]);
  }, [collapsed, isMobile, navigationState.activeModule]);

  const selectedMenuKeys = useMemo(() => {
    const activeItem = navigationState.activeItem;
    if (!activeItem) return [];

    if (!activeItem.hiddenInMenu) return [activeItem.path];

    const activeModule = navigationState.activeModule;
    if (!activeModule) return [];

    const fallback = activeModule.items.find(
      (item) => !item.hiddenInMenu && (activeItem.path === item.path || activeItem.path.startsWith(`${item.path}/`))
    );
    return fallback ? [fallback.path] : [];
  }, [navigationState.activeItem, navigationState.activeModule]);

  const currentPageTitle = useMemo(() => {
    const override = ROUTE_TITLE_OVERRIDES.find((item) => item.pattern.test(location.pathname));
    if (override) return override.title;
    if (navigationState.activeItem) return navigationState.activeItem.label;
    return 'Painel Administrativo';
  }, [location.pathname, navigationState.activeItem]);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  function handleMenuNavigation(key: string) {
    if (!key.startsWith('/')) return;
    navigate(key);
    if (isMobile) setMobileMenuOpen(false);
  }

  function handleMenuOpenChange(keys: string[]) {
    const latestOpened = keys.find((key) => !openKeys.includes(key));
    if (latestOpened && rootMenuKeys.includes(latestOpened)) {
      setOpenKeys([latestOpened]);
      return;
    }
    setOpenKeys(keys);
  }

  function handleUserMenuClick(key: string) {
    if (key === 'notificacoes') {
      navigate('/notificacoes');
      return;
    }
    if (key === 'editar-usuario') {
      navigate('/meu-perfil');
      return;
    }
    if (key === 'trocar-senha') {
      navigate('/meu-perfil', { state: { tab: 'senha' } });
      return;
    }
    if (key === 'sair') {
      handleLogout();
    }
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'usuario-label',
      label: <Typography.Text strong>{usuarioNome}</Typography.Text>,
      disabled: true
    },
    { type: 'divider' },
    { key: 'notificacoes', icon: <BellOutlined />, label: 'Ver notificacoes' },
    { key: 'editar-usuario', icon: <EditOutlined />, label: 'Editar usuario' },
    { key: 'trocar-senha', icon: <LockOutlined />, label: 'Trocar senha' },
    { type: 'divider' },
    { key: 'sair', icon: <LogoutOutlined />, label: 'Sair', danger: true }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          width={290}
          collapsed={collapsed}
          trigger={null}
          style={{
            background: '#0b5be1',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '8px 0 28px -24px rgba(0,0,0,0.55)'
          }}
        >
          <Link
            to="/dashboard"
            style={{
              height: 72,
              display: 'flex',
              alignItems: 'center',
              padding: collapsed ? '0 20px' : '0 18px',
              gap: 12,
              color: 'white'
            }}
          >
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', background: '#fff', flexShrink: 0 }}
            />
            {!collapsed && (
              <div style={{ lineHeight: 1.1 }}>
                <Typography.Text style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>LegalK</Typography.Text>
                <br />
                <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  Painel Administrativo
                </Typography.Text>
              </div>
            )}
          </Link>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedMenuKeys}
            openKeys={collapsed ? [] : openKeys}
            onOpenChange={(keys) => handleMenuOpenChange(keys as string[])}
            items={sidebarItems}
            onClick={({ key }) => handleMenuNavigation(String(key))}
            style={{ background: 'transparent', borderRight: 'none' }}
          />
        </Sider>
      )}

      <Drawer
        title={
          <Space>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', background: '#fff' }}
            />
            <span>LegalK</span>
          </Space>
        }
        placement="left"
        width={screens.sm ? 360 : 'calc(100vw - 24px)'}
        onClose={() => setMobileMenuOpen(false)}
        open={isMobile && mobileMenuOpen}
        bodyStyle={{ padding: 12 }}
      >
        <Menu
          mode="inline"
          selectedKeys={selectedMenuKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => handleMenuOpenChange(keys as string[])}
          items={sidebarItems}
          onClick={({ key }) => handleMenuNavigation(String(key))}
          style={{ borderRight: 'none' }}
        />
      </Drawer>

      <Layout>
        <Header
          style={{
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '8px 10px' : '0 16px',
            borderBottom: '1px solid #e5e7eb',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            height: isMobile ? 'auto' : 64,
            lineHeight: isMobile ? 1.2 : '64px'
          }}
        >
          {isMobile ? (
            <div style={{ width: '100%', display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Space align="center" size="small">
                  <Button type="text" icon={<MenuUnfoldOutlined />} onClick={() => setMobileMenuOpen(true)} />
                  <Typography.Text style={{ fontWeight: 600, fontSize: 16, color: '#1f2937' }}>{currentPageTitle}</Typography.Text>
                </Space>
                <Dropdown
                  menu={{ items: userMenuItems, onClick: ({ key }) => handleUserMenuClick(String(key)) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Badge count={naoLidas} size="small" offset={[-2, 2]}>
                    <Avatar
                      size={32}
                      icon={<UserOutlined />}
                      src={fotoPerfil ?? undefined}
                      style={{ backgroundColor: '#0b5be1', cursor: 'pointer' }}
                    />
                  </Badge>
                </Dropdown>
              </div>
              <Select
                loading={carregando}
                style={{ width: '100%' }}
                placeholder="Selecionar empresa"
                value={empresaSelecionada ?? undefined}
                onChange={(value) => setEmpresaSelecionada(Number(value))}
                options={empresas.map((empresa) => ({ label: empresa.nome, value: empresa.id }))}
                suffixIcon={carregando ? <Spin size="small" /> : undefined}
                disabled={!empresas.length}
              />
            </div>
          ) : (
            <>
              <Space align="center">
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed((value) => !value)}
                />
                <Typography.Text style={{ fontWeight: 600, fontSize: 20, color: '#1f2937' }}>{currentPageTitle}</Typography.Text>
              </Space>

              <Space size="middle" align="center">
                <div style={{ minWidth: 240 }}>
                  <Select
                    loading={carregando}
                    style={{ width: '100%' }}
                    placeholder="Selecionar empresa"
                    value={empresaSelecionada ?? undefined}
                    onChange={(value) => setEmpresaSelecionada(Number(value))}
                    options={empresas.map((empresa) => ({ label: empresa.nome, value: empresa.id }))}
                    suffixIcon={carregando ? <Spin size="small" /> : undefined}
                    disabled={!empresas.length}
                  />
                </div>

                <Dropdown
                  menu={{ items: userMenuItems, onClick: ({ key }) => handleUserMenuClick(String(key)) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Badge count={naoLidas} size="small" offset={[-2, 2]}>
                    <Avatar
                      size={36}
                      icon={<UserOutlined />}
                      src={fotoPerfil ?? undefined}
                      style={{ backgroundColor: '#0b5be1', cursor: 'pointer' }}
                    />
                  </Badge>
                </Dropdown>
              </Space>
            </>
          )}
        </Header>

        <Content style={{ padding: isMobile ? '10px' : '14px', background: '#f5f7fb' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default MainLayout;
