import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Select, Spin, Badge } from 'antd';
import {
  ApartmentOutlined,
  LogoutOutlined,
  AuditOutlined,
  DashboardOutlined,
  SettingOutlined,
  ClusterOutlined,
  UserOutlined,
  DeploymentUnitOutlined,
  NodeIndexOutlined,
  BellOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import api from '../services/api';

function MainLayout() {
  const { Header, Content } = Layout;
  const navigate = useNavigate();
  const location = useLocation();
  const { empresas, empresaSelecionada, setEmpresaSelecionada, carregando } = useEmpresaContext();
  const [naoLidas, setNaoLidas] = useState(0);

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

  const usuarioRole = getUsuarioRoleFromToken();
  const podeGerenciarConfig = !usuarioRole || usuarioRole === 'GESTOR';
  const podeGerenciarHierarquia = !usuarioRole || usuarioRole === 'GESTOR';

  const menuItems = [
     {
      key: 'gestor',
      icon: <FileTextOutlined />,
      label: 'Gestor',
      children: [
        {
          key: '/documentos-regulatorios',
          icon: <FileTextOutlined />,
          label: <Link to="/documentos-regulatorios">Documentos Regulatórios</Link>
        },
        {
          key: '/documentos-modelo-secoes',
          icon: <FileTextOutlined />,
          label: <Link to="/documentos-modelo-secoes">Modelo de Seções</Link>
        }
      ]
    },
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>
    },
    {
      key: '/requisitos',
      icon: <AuditOutlined />,
      label: <Link to="/requisitos">Requisitos</Link>
    },
    {
      key: 'atividades',
      icon: <AuditOutlined />,
      label: 'Atividades',
      children: [
        {
          key: '/matriz-acoes',
          icon: <FileTextOutlined />,
          label: <Link to="/matriz-acoes">Matriz de Ações</Link>
        }
      ]
    },
    {
      key: 'documentos',
      icon: <FileTextOutlined />,
      label: 'Documentos',
      children: [
        {
          key: '/documentos-empresa',
          icon: <FileTextOutlined />,
          label: <Link to="/documentos-empresa">Documentos da Empresa</Link>
        },
        {
          key: '/documento-conteudo',
          icon: <FileTextOutlined />,
          label: <Link to="/documento-conteudo">Documento Conteúdo</Link>
        },
        {
          key: '/documentos-conteudo-secoes',
          icon: <FileTextOutlined />,
          label: <Link to="/documentos-conteudo-secoes">Conteúdo por Seção</Link>
        },
        {
          key: '/assistente-secoes',
          icon: <FileTextOutlined />,
          label: <Link to="/assistente-secoes">Assistente de Seções</Link>
        }
      ]
    },
    {
      key: 'dados-pessoais',
      icon: <FileTextOutlined />,
      label: 'Dados Pessoais',
      children: [
        {
          key: '/lgpd-mapa',
          icon: <FileTextOutlined />,
          label: <Link to="/lgpd-mapa">Mapa LGPD</Link>
        },
        {
          key: '/inventario-dados',
          icon: <FileTextOutlined />,
          label: <Link to="/inventario-dados">Inventário de Dados</Link>
        },
        {
          key: '/categorias-dados',
          icon: <FileTextOutlined />,
          label: <Link to="/categorias-dados">Categorias de Dados</Link>
        },
        {
          key: '/processos',
          icon: <FileTextOutlined />,
          label: <Link to="/processos">Processos</Link>
        },
        {
          key: '/empresa-dados-status',
          icon: <FileTextOutlined />,
          label: <Link to="/empresa-dados-status">Status LGPD</Link>
        },
        {
          key: '/diagnostico-lgpd',
          icon: <FileTextOutlined />,
          label: <Link to="/diagnostico-lgpd">Diagnóstico LGPD</Link>
        },
        {
          key: '/solicitacoes-titular',
          icon: <FileTextOutlined />,
          label: <Link to="/solicitacoes-titular">Direitos do Titular</Link>
        },
        {
          key: '/painel-maturidade-sancoes',
          icon: <FileTextOutlined />,
          label: <Link to="/painel-maturidade-sancoes">Painel Maturidade e Sanções</Link>
        }
      ]
    },
    podeGerenciarHierarquia
      ? {
          key: 'hierarquia',
          icon: <ClusterOutlined />,
          label: 'Hierarquia',
          children: [
            {
              key: '/areas',
              icon: <ClusterOutlined />,
              label: <Link to="/areas">Áreas</Link>
            },
            {
              key: '/subareas',
              icon: <NodeIndexOutlined />,
              label: <Link to="/subareas">Subáreas</Link>
            },
            {
              key: '/subareas2',
              icon: <NodeIndexOutlined />,
              label: <Link to="/subareas2">Subárea 2</Link>
            },
            {
              key: '/hierarquia',
              icon: <ClusterOutlined />,
              label: <Link to="/hierarquia">Hierarquia</Link>
            }
          ]
        }
      : null,
    {
      key: '/notificacoes',
      icon: <BellOutlined />,
      label: <Link to="/notificacoes">Notificações</Link>
    },
    podeGerenciarConfig
      ? {
          key: 'config',
          icon: <SettingOutlined />,
          label: 'Configurações',
          children: [
            {
              key: '/empresas',
              icon: <ApartmentOutlined />,
              label: <Link to="/empresas">Empresas</Link>
            },
            {
              key: '/unidades',
              icon: <DeploymentUnitOutlined />,
              label: <Link to="/unidades">Unidades</Link>
            },
            {
              key: '/usuarios',
              icon: <UserOutlined />,
              label: <Link to="/usuarios">Usuários</Link>
            }
          ]
        }
      : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#0b5be1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          boxShadow: '0 6px 18px -12px rgba(0,0,0,0.35)'
        }}
      >
        <Space size="large" align="center">
          <Link to="/empresas" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
            <img
              src="/logo.png"
              alt="Logo"
              style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', background: '#fff' }}
            />
            <div style={{ lineHeight: 1.1 }}>
              <Typography.Text style={{ color: 'white', fontSize: 18, fontWeight: 700 }}>
                LegalK
              </Typography.Text>
              <br />
              <Typography.Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Painel Administrativo
              </Typography.Text>
            </div>
          </Link>

          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            style={{ background: 'transparent' }}
            items={menuItems}
          />
        </Space>

        <Space size="middle" align="center">
          <Link to="/notificacoes">
            <Badge count={naoLidas} size="small" offset={[-2, 2]}>
              <Button icon={<BellOutlined />} ghost>
                Notificações
              </Button>
            </Badge>
          </Link>
          <div style={{ minWidth: 220 }}>
            <Select
              loading={carregando}
              style={{ width: '100%' }}
              placeholder="Selecionar empresa"
              value={empresaSelecionada ?? 'all'}
              onChange={(value) => setEmpresaSelecionada(value === 'all' ? null : Number(value))}
              options={[
                { label: 'Todas', value: 'all' },
                ...empresas.map((e) => ({ label: e.nome, value: e.id }))
              ]}
              suffixIcon={carregando ? <Spin size="small" /> : undefined}
            />
          </div>

          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            ghost
          >
            Sair
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '8px 8px', background: '#f5f7fb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}

export default MainLayout;
