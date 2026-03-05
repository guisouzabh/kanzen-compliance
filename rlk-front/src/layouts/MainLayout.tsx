import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Select, Spin, Badge, Drawer, Grid, Dropdown, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, BellOutlined, MenuUnfoldOutlined, UserOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import api from '../services/api';
import {
  buildMobileMenuItems,
  buildNavigationForRole,
  buildSecondLevelMenuItems,
  buildTopLevelMenuItems,
  getDefaultModulePath,
  resolveNavigationState
} from './navigationConfig';

const ROUTE_TITLE_OVERRIDES: Array<{ pattern: RegExp; title: string }> = [
  { pattern: /^\/meu-perfil$/, title: 'Meu Perfil' },
  { pattern: /^\/notificacoes$/, title: 'Notificacoes' }
];

function MainLayout() {
  const { Content } = Layout;
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.lg;
  const navigate = useNavigate();
  const location = useLocation();
  const { empresas, empresaSelecionada, setEmpresaSelecionada, carregando } = useEmpresaContext();
  const [naoLidas, setNaoLidas] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openKeys, setOpenKeys] = useState<string[]>([]);
  const [forcedModuleKey, setForcedModuleKey] = useState<string | null>(null);
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

  const usuarioRole = getUsuarioRoleFromToken();
  const usuarioNome = nomePerfil || getUsuarioNomeFromToken();

  const navigationModules = useMemo(() => buildNavigationForRole(usuarioRole), [usuarioRole]);
  const navigationState = useMemo(
    () => resolveNavigationState(navigationModules, location.pathname),
    [navigationModules, location.pathname]
  );

  useEffect(() => {
    setForcedModuleKey(null);
  }, [location.pathname]);

  const currentModule = useMemo(() => {
    if (forcedModuleKey) {
      const forced = navigationModules.find((module) => module.key === forcedModuleKey);
      if (forced) return forced;
    }
    if (navigationState.activeModule) return navigationState.activeModule;
    return navigationModules[0] ?? null;
  }, [forcedModuleKey, navigationModules, navigationState.activeModule]);

  useEffect(() => {
    if (!currentModule) return;
    setOpenKeys([currentModule.key]);
  }, [currentModule]);

  const topLevelMenuItems = useMemo(() => buildTopLevelMenuItems(navigationModules), [navigationModules]);
  const secondLevelMenuItems = useMemo(() => buildSecondLevelMenuItems(currentModule), [currentModule]);
  const mobileMenuItems = useMemo(() => buildMobileMenuItems(navigationModules), [navigationModules]);

  const selectedTopKeys = currentModule ? [currentModule.key] : [];
  const selectedSecondKeys =
    navigationState.activeItem && !navigationState.activeItem.hiddenInMenu ? [navigationState.activeItem.path] : [];

  const currentPageTitle = useMemo(() => {
    const override = ROUTE_TITLE_OVERRIDES.find((item) => item.pattern.test(location.pathname));
    if (override) return override.title;
    if (navigationState.activeItem) return navigationState.activeItem.label;
    return 'Painel Administrativo';
  }, [location.pathname, navigationState.activeItem]);

  useEffect(() => {
    if (!isMobile) setMobileMenuOpen(false);
  }, [isMobile]);

  function handleTopLevelNavigation(key: string) {
    const module = navigationModules.find((item) => item.key === key);
    if (!module) return;

    setForcedModuleKey(module.key);

    const alreadyInsideModule = module.items.some((item) => {
      if (location.pathname === item.path) return true;
      return location.pathname.startsWith(`${item.path}/`);
    });

    if (!alreadyInsideModule) {
      const defaultPath = getDefaultModulePath(module);
      if (defaultPath) navigate(defaultPath);
    }
  }

  function handleSecondLevelNavigation(key: string) {
    if (!key.startsWith('/')) return;
    navigate(key);
  }

  function handleMobileNavigation(key: string) {
    if (!key.startsWith('/')) return;
    navigate(key);
    setMobileMenuOpen(false);
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
          selectedKeys={selectedSecondKeys}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          items={mobileMenuItems}
          onClick={({ key }) => handleMobileNavigation(String(key))}
          style={{ borderRight: 'none' }}
        />
      </Drawer>

      <Layout>
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '10px 10px' : '10px 16px',
              gap: 12
            }}
          >
            <Space align="center" size="small">
              {isMobile && <Button type="text" icon={<MenuUnfoldOutlined />} onClick={() => setMobileMenuOpen(true)} />}
              <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <img
                  src="/logo.png"
                  alt="Logo"
                  style={{ width: 34, height: 34, borderRadius: 10, objectFit: 'cover', background: '#fff' }}
                />
                {!isMobile && (
                  <Typography.Text style={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>LegalK</Typography.Text>
                )}
              </Link>
              <Typography.Text style={{ fontWeight: 600, fontSize: isMobile ? 15 : 18, color: '#1f2937' }}>
                {currentPageTitle}
              </Typography.Text>
            </Space>

            <Space size={isMobile ? 'small' : 'middle'} align="center">
              {!isMobile && (
                <div style={{ minWidth: 260 }}>
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
              )}

              <Dropdown
                menu={{ items: userMenuItems, onClick: ({ key }) => handleUserMenuClick(String(key)) }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Badge count={naoLidas} size="small" offset={[-2, 2]}>
                  <Avatar
                    size={isMobile ? 32 : 36}
                    icon={<UserOutlined />}
                    src={fotoPerfil ?? undefined}
                    style={{ backgroundColor: '#0b5be1', cursor: 'pointer' }}
                  />
                </Badge>
              </Dropdown>
            </Space>
          </div>

          {isMobile && (
            <div style={{ padding: '0 10px 10px 10px' }}>
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
          )}

          {!isMobile && (
            <>
              <Menu
                mode="horizontal"
                selectedKeys={selectedTopKeys}
                items={topLevelMenuItems}
                onClick={({ key }) => handleTopLevelNavigation(String(key))}
                style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', paddingInline: 8 }}
              />
              <Menu
                mode="horizontal"
                selectedKeys={selectedSecondKeys}
                items={secondLevelMenuItems}
                onClick={({ key }) => handleSecondLevelNavigation(String(key))}
                style={{ borderBottom: 'none', paddingInline: 8 }}
              />
            </>
          )}
        </div>

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
