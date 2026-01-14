import { useEffect, useState } from 'react';
import { Button, Card, List, Skeleton, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import ClassificacaoDonutChart from '../components/dashboard/ClassificacaoDonutChart';
import EvolucaoConcluidosAreaChart from '../components/dashboard/EvolucaoConcluidosAreaChart';
import MaturidadeRadarChart from '../components/dashboard/MaturidadeRadarChart';
import NormasTreemap from '../components/dashboard/NormasTreemap';
import RequisitosPorAreaChart from '../components/dashboard/RequisitosPorAreaChart';
import RevisaoPorAreaBarChart from '../components/dashboard/RevisaoPorAreaBarChart';
import RiscoHeatmap from '../components/dashboard/RiscoHeatmap';
import StatusRequisitosStacked from '../components/dashboard/StatusRequisitosStacked';
import {
  classificacaoDistribuicaoData,
  evolucaoConcluidosData,
  indicadoresResumo,
  maturidadePorAreaData,
  normasTreemapData,
  requisitosPorAreaData,
  revisaoPorAreaData,
  riscoHeatmapData,
  statusStackedData
} from '../mocks/requisitosDashboard';
import api from '../services/api';
import './Dashboard.css';

type DashboardData = {
  requisitosPorArea: typeof requisitosPorAreaData;
  statusStacked: typeof statusStackedData;
  evolucaoConcluidos: typeof evolucaoConcluidosData;
  classificacoes: typeof classificacaoDistribuicaoData;
  maturidadePorArea: typeof maturidadePorAreaData;
  normas: typeof normasTreemapData;
  riscoHeatmap: typeof riscoHeatmapData;
  revisaoPorArea: typeof revisaoPorAreaData;
};

type Notificacao = {
  id: number;
  usuario_id: number;
  titulo: string;
  corpo: string;
  tipo: 'ALERTA' | 'AVISO' | 'INFO';
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA';
  remetente: string;
  created_at?: string;
};

const dashboardMocks: DashboardData = {
  requisitosPorArea: requisitosPorAreaData,
  statusStacked: statusStackedData,
  evolucaoConcluidos: evolucaoConcluidosData,
  classificacoes: classificacaoDistribuicaoData,
  maturidadePorArea: maturidadePorAreaData,
  normas: normasTreemapData,
  riscoHeatmap: riscoHeatmapData,
  revisaoPorArea: revisaoPorAreaData
};

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

function Dashboard() {
  const [dados, setDados] = useState<DashboardData>(dashboardMocks);
  const [carregando, setCarregando] = useState(true);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregandoInbox, setCarregandoInbox] = useState(true);

  useEffect(() => {
    // Quando houver endpoint, troque os mocks pela resposta da API e alimente o estado `dados`.
    // Exemplo:
    // const response = await api.get('/requisitos/dashboard');
    // setDados(transformarResposta(response.data));
    setDados(dashboardMocks);
    setCarregando(false);
  }, []);

  useEffect(() => {
    async function carregarInbox() {
      try {
        setCarregandoInbox(true);
        const usuarioId = getUsuarioIdFromToken();
        if (!usuarioId) {
          setNotificacoes([]);
          return;
        }
        const response = await api.get('/inbox-notificacoes', {
          params: { usuario_id: usuarioId }
        });
        const lista = (response.data || []) as Notificacao[];
        setNotificacoes(lista.slice(0, 5));
      } finally {
        setCarregandoInbox(false);
      }
    }
    carregarInbox();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Dashboard de Requisitos
        </Typography.Title>
        <Typography.Text type="secondary">
          Visão visual dos requisitos legais por área, status, classificação e risco.
        </Typography.Text>
      </div>

      <div className="indicadores-grid">
        {indicadoresResumo.map((indicador) => (
          <Card key={indicador.titulo} className="dashboard-card">
            <Typography.Text type="secondary">{indicador.titulo}</Typography.Text>
            <Typography.Title level={3} style={{ margin: '4px 0' }}>
              {indicador.valor}
            </Typography.Title>
            <Typography.Text type="secondary">{indicador.detalhe}</Typography.Text>
          </Card>
        ))}
      </div>

      <div className="dashboard-grid">
        <Card title="Requisitos por Área Responsável" className="dashboard-card">
          {carregando ? <Skeleton active /> : <RequisitosPorAreaChart data={dados.requisitosPorArea} />}
        </Card>
        <Card title="Status dos Requisitos" className="dashboard-card">
          {carregando ? <Skeleton active /> : <StatusRequisitosStacked data={dados.statusStacked} />}
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Evolução de Requisitos Concluídos por mês" className="dashboard-card">
          {carregando ? <Skeleton active /> : <EvolucaoConcluidosAreaChart data={dados.evolucaoConcluidos} />}
        </Card>
        <Card title="Distribuição por Classificação" className="dashboard-card">
          {carregando ? <Skeleton active /> : <ClassificacaoDonutChart data={dados.classificacoes} />}
        </Card>
      </div>

      <div className="dashboard-grid full-width">
        <Card title="Maturidade por Área" className="dashboard-card">
          {carregando ? <Skeleton active /> : <MaturidadeRadarChart data={dados.maturidadePorArea} />}
        </Card>
      </div>

      <div className="dashboard-grid full-width">
        <Card
          title="Últimas notificações"
          className="dashboard-card"
          extra={
            <Button type="link">
              <Link to="/notificacoes">Ver todas</Link>
            </Button>
          }
        >
          {carregandoInbox ? (
            <Skeleton active />
          ) : notificacoes.length === 0 ? (
            <Typography.Text type="secondary">Nenhuma notificação recente.</Typography.Text>
          ) : (
            <List
              dataSource={notificacoes}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space align="center" wrap>
                      <Tag color={item.tipo === 'ALERTA' ? 'red' : item.tipo === 'AVISO' ? 'gold' : 'blue'}>
                        {item.tipo}
                      </Tag>
                      <Tag color={item.prioridade === 'ALTA' ? 'red' : item.prioridade === 'MEDIA' ? 'orange' : 'green'}>
                        {item.prioridade}
                      </Tag>
                      <Tag color={item.status === 'NAO_LIDA' ? 'purple' : item.status === 'LIDA' ? 'green' : 'default'}>
                        {item.status}
                      </Tag>
                      <Typography.Text type="secondary">{item.remetente}</Typography.Text>
                    </Space>
                    <Typography.Text strong>{item.titulo}</Typography.Text>
                    <Typography.Text type="secondary">{item.corpo}</Typography.Text>
                  </Space>
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card title="Normas e Certificações (Treemap)" className="dashboard-card">
          {carregando ? <Skeleton active /> : <NormasTreemap data={dados.normas} />}
        </Card>
        <Card title="Risco (Probabilidade x Severidade)" className="dashboard-card">
          {carregando ? <Skeleton active /> : <RiscoHeatmap data={dados.riscoHeatmap} />}
        </Card>
      </div>

      <div className="dashboard-grid full-width">
        <Card title="Dias desde última revisão por área" className="dashboard-card">
          {carregando ? <Skeleton active /> : <RevisaoPorAreaBarChart data={dados.revisaoPorArea} />}
        </Card>
      </div>
    </Space>
  );
}

export default Dashboard;
