import { DragEvent, useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Select,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import { AppstoreOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

interface MatrizAcao {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  acao: string;
  objetivo?: string | null;
  status?: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'IMPEDIDA';
  prioridade?: number;
  esforco?: number;
  prazo?: string | null;
  status_prazo?: 'NAO_APLICAVEL' | 'NO_PRAZO' | 'ATRASADA';
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  tags?: string[];
}

interface Usuario {
  id: number;
  nome: string;
  email?: string;
}

const opcoesStatus = [
  { value: 'PLANEJADA', label: 'Planejada', color: 'default' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', color: 'blue' },
  { value: 'CONCLUIDA', label: 'Concluida', color: 'green' },
  { value: 'IMPEDIDA', label: 'Impedida', color: 'red' }
] as const;

const opcoesStatusPrazo = [
  { value: 'NAO_APLICAVEL', label: 'Nao aplicavel', color: 'default' },
  { value: 'NO_PRAZO', label: 'No prazo', color: 'green' },
  { value: 'ATRASADA', label: 'Atrasada', color: 'red' }
] as const;

const opcoesNiveis = [
  { value: 1, label: '1 - Muito baixo' },
  { value: 2, label: '2 - Baixo' },
  { value: 3, label: '3 - Medio' },
  { value: 4, label: '4 - Alto' },
  { value: 5, label: '5 - Muito alto' }
];

const statusOrder: Array<MatrizAcao['status']> = ['PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'IMPEDIDA'];
const mapaStatus = new Map(opcoesStatus.map((item) => [item.value, item]));
const mapaStatusPrazo = new Map(opcoesStatusPrazo.map((item) => [item.value, item]));
const SEM_FILTRO = '__SEM_FILTRO__';

function MatrizAcoesKanban() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [lista, setLista] = useState<MatrizAcao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroStatusPrazo, setFiltroStatusPrazo] = useState<string | undefined>(
    () => queryParams.get('status_prazo') || undefined
  );
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>(
    () => queryParams.get('status') || undefined
  );
  const [filtroPrioridade, setFiltroPrioridade] = useState<number | undefined>(() => {
    const value = queryParams.get('prioridade');
    return value ? Number(value) : undefined;
  });
  const [filtroResponsavel, setFiltroResponsavel] = useState<number | undefined>(() => {
    const value = queryParams.get('responsavel_id');
    return value ? Number(value) : undefined;
  });
  const [filtroPrazoFaixa, setFiltroPrazoFaixa] = useState<string | undefined>(
    () => queryParams.get('prazo_faixa') || undefined
  );
  const [filtroTags, setFiltroTags] = useState<string[]>(() => queryParams.getAll('tag'));
  const [carregando, setCarregando] = useState(true);
  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<string | null>(null);
  const [movendoId, setMovendoId] = useState<number | null>(null);

  const listaPorEmpresa = useMemo(() => {
    if (!empresaSelecionada) return [];
    return lista;
  }, [lista, empresaSelecionada]);

  const listaFiltrada = useMemo(() => {
    if (!filtroTags.length) return listaPorEmpresa;
    return listaPorEmpresa.filter((item) =>
      filtroTags.every((tag) => (item.tags || []).includes(tag))
    );
  }, [listaPorEmpresa, filtroTags]);

  const tagsDisponiveis = useMemo(() => {
    const set = new Set<string>();
    listaPorEmpresa.forEach((item) => (item.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [listaPorEmpresa]);

  useEffect(() => {
    if (!filtroTags.length) return;
    setFiltroTags((prev) => prev.filter((tag) => tagsDisponiveis.includes(tag)));
  }, [tagsDisponiveis, filtroTags.length]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroStatusPrazo) params.set('status_prazo', filtroStatusPrazo);
    if (filtroStatus) params.set('status', filtroStatus);
    if (typeof filtroPrioridade === 'number') params.set('prioridade', String(filtroPrioridade));
    if (typeof filtroResponsavel === 'number') params.set('responsavel_id', String(filtroResponsavel));
    if (filtroPrazoFaixa) params.set('prazo_faixa', filtroPrazoFaixa);
    filtroTags.forEach((tag) => params.append('tag', tag));

    const nextSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : ''
        },
        { replace: true }
      );
    }
  }, [
    filtroStatusPrazo,
    filtroStatus,
    filtroPrioridade,
    filtroResponsavel,
    filtroPrazoFaixa,
    filtroTags,
    navigate,
    location.pathname,
    location.search
  ]);

  const colunas = useMemo(() => {
    const grouped: Record<string, MatrizAcao[]> = {
      PLANEJADA: [],
      EM_ANDAMENTO: [],
      CONCLUIDA: [],
      IMPEDIDA: []
    };

    listaFiltrada.forEach((item) => {
      const key = item.status || 'PLANEJADA';
      grouped[key] = grouped[key] || [];
      grouped[key].push(item);
    });

    return grouped;
  }, [listaFiltrada]);

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const params: Record<string, string | number> = {};
      if (empresaSelecionada) params.empresa_id = empresaSelecionada;
      if (filtroStatusPrazo) params.status_prazo = filtroStatusPrazo;
      if (filtroStatus) params.status = filtroStatus;
      if (typeof filtroPrioridade === 'number') params.prioridade = filtroPrioridade;
      if (typeof filtroResponsavel === 'number') params.responsavel_id = filtroResponsavel;
      if (filtroPrazoFaixa) params.prazo_faixa = filtroPrazoFaixa;

      const [acoesResp, usuariosResp] = await Promise.allSettled([
        api.get('/matriz-acoes', { params }),
        api.get('/usuarios')
      ]);

      if (acoesResp.status === 'fulfilled') {
        setLista(acoesResp.value.data || []);
      } else {
        setLista([]);
      }

      if (usuariosResp.status === 'fulfilled') {
        setUsuarios(usuariosResp.value.data || []);
      } else {
        setUsuarios([]);
      }

      if (showMessage) message.success('Kanban atualizado');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar Kanban');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [empresaSelecionada, filtroStatusPrazo, filtroStatus, filtroPrioridade, filtroResponsavel, filtroPrazoFaixa]);

  function handleDragStart(event: DragEvent<HTMLDivElement>, id: number) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(id));
    setArrastandoId(id);
  }

  function handleDragEnd() {
    setArrastandoId(null);
    setColunaAlvo(null);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, status: string) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setColunaAlvo(status);
  }

  async function moverAcaoParaStatus(statusDestino: string, acaoIdRaw: string) {
    const acaoId = Number(acaoIdRaw);
    if (Number.isNaN(acaoId)) return;

    const item = lista.find((acao) => acao.id === acaoId);
    if (!item) return;

    const statusAtual = item.status || 'PLANEJADA';
    if (statusAtual === statusDestino) return;

    setMovendoId(acaoId);
    try {
      const payload = {
        empresa_id: item.empresa_id,
        acao: item.acao,
        objetivo: item.objetivo ?? null,
        status: statusDestino,
        prioridade: item.prioridade ?? 3,
        esforco: item.esforco ?? 3,
        prazo: item.prazo ?? null,
        status_prazo: item.status_prazo ?? 'NO_PRAZO',
        origem: item.origem ?? null,
        origem_typ: item.origem_typ ?? null,
        origem_id: item.origem_id ?? null,
        responsavel_id: item.responsavel_id ?? null,
        tags: item.tags || []
      };

      const resp = await api.put(`/matriz-acoes/${acaoId}`, payload);
      const atualizado: MatrizAcao = resp.data;
      setLista((prev) => prev.map((acao) => (acao.id === atualizado.id ? atualizado : acao)));
      message.success('Status atualizado');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao mover ação');
    } finally {
      setMovendoId(null);
      setArrastandoId(null);
      setColunaAlvo(null);
    }
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>, status: string) {
    event.preventDefault();
    const acaoId = event.dataTransfer.getData('text/plain') || (arrastandoId ? String(arrastandoId) : '');
    await moverAcaoParaStatus(status, acaoId);
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Matriz de Acoes - Kanban
          </Typography.Title>
          <Typography.Text type="secondary">
            Visualizacao por status para acompanhar o fluxo das acoes.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            icon={<TableOutlined />}
            onClick={() =>
              navigate({
                pathname: '/matriz-acoes',
                search: location.search
              })
            }
          >
            Ver lista
          </Button>
          <Button type="primary" icon={<AppstoreOutlined />} disabled>
            Kanban
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de visualizar o Kanban" />
        </Card>
      ) : (
        <Card title="Filtros">
          <Space wrap>
            <Typography.Text type="secondary">Status do prazo:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroStatusPrazo}
              onChange={(value) => setFiltroStatusPrazo(value === SEM_FILTRO ? undefined : value)}
              style={{ minWidth: 170 }}
              options={[
                { value: SEM_FILTRO, label: ' ' },
                ...opcoesStatusPrazo.map((item) => ({ value: item.value, label: item.label }))
              ]}
            />
            <Typography.Text type="secondary">Status:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroStatus}
              onChange={(value) => setFiltroStatus(value === SEM_FILTRO ? undefined : value)}
              style={{ minWidth: 160 }}
              options={[
                { value: SEM_FILTRO, label: ' ' },
                ...opcoesStatus.map((item) => ({ value: item.value, label: item.label }))
              ]}
            />
            <Typography.Text type="secondary">Prioridade:</Typography.Text>
            <Select
              allowClear
              placeholder="Todas"
              value={filtroPrioridade}
              onChange={(value) => setFiltroPrioridade(value === SEM_FILTRO ? undefined : value)}
              style={{ minWidth: 170 }}
              options={[{ value: SEM_FILTRO, label: ' ' }, ...opcoesNiveis]}
            />
            <Typography.Text type="secondary">Responsavel:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroResponsavel}
              onChange={(value) => setFiltroResponsavel(value === SEM_FILTRO ? undefined : value)}
              style={{ minWidth: 260 }}
              options={[
                { value: SEM_FILTRO, label: ' ' },
                ...usuarios.map((u) => ({
                  value: u.id,
                  label: u.email ? `${u.nome} (${u.email})` : u.nome
                }))
              ]}
            />
            <Typography.Text type="secondary">Prazo:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroPrazoFaixa}
              onChange={(value) => setFiltroPrazoFaixa(value === SEM_FILTRO ? undefined : value)}
              style={{ minWidth: 220 }}
              options={[
                { value: SEM_FILTRO, label: ' ' },
                { value: 'HOJE', label: 'Hoje' },
                { value: 'PROXIMOS_7_DIAS', label: 'Proximos 7 dias' },
                { value: 'PROXIMOS_30_DIAS', label: 'Proximos 30 dias' },
                { value: 'PROXIMOS_90_DIAS', label: 'Proximos 90 dias' },
                { value: 'PROXIMOS_6_MESES', label: 'Proximos 6 meses' },
                { value: 'MAIOR_QUE_6_MESES', label: 'Maior que 6 meses' }
              ]}
            />
            <Typography.Text type="secondary">Tags:</Typography.Text>
            <Select
              mode="multiple"
              allowClear
              placeholder="Selecione uma ou mais tags"
              value={filtroTags}
              onChange={(value) => setFiltroTags(value)}
              style={{ minWidth: 320 }}
              options={tagsDisponiveis.map((tag) => ({ value: tag, label: tag }))}
            />
            <Button
              onClick={() => {
                setFiltroStatusPrazo(undefined);
                setFiltroStatus(undefined);
                setFiltroPrioridade(undefined);
                setFiltroResponsavel(undefined);
                setFiltroPrazoFaixa(undefined);
                setFiltroTags([]);
              }}
            >
              Limpar filtros
            </Button>
          </Space>
        </Card>
      )}

      {empresaSelecionada ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(280px, 1fr))',
            gap: 16,
            alignItems: 'start',
            overflowX: 'auto',
            paddingBottom: 8
          }}
        >
          {statusOrder.map((status) => {
            const info = mapaStatus.get(status || 'PLANEJADA');
            const itens = colunas[status || 'PLANEJADA'] || [];
            return (
              <Card
                key={status}
                size="small"
                style={{
                  borderColor: colunaAlvo === status ? '#0b5be1' : undefined,
                  boxShadow: colunaAlvo === status ? '0 0 0 2px rgba(11,91,225,0.15)' : undefined
                }}
                title={
                  <Flex align="center" justify="space-between">
                    <Tag color={info?.color || 'default'} style={{ marginRight: 0 }}>
                      {info?.label || status}
                    </Tag>
                    <Badge count={itens.length} showZero />
                  </Flex>
                }
                bodyStyle={{ padding: 12 }}
                onDragOver={(event) => handleDragOver(event, status || 'PLANEJADA')}
                onDrop={(event) => handleDrop(event, status || 'PLANEJADA')}
              >
                {itens.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sem acoes" />
                ) : (
                  <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    {itens.map((item) => {
                      const prazoInfo = item.status_prazo ? mapaStatusPrazo.get(item.status_prazo) : null;
                      return (
                        <Card key={item.id} size="small" style={{ borderRadius: 10 }}>
                          <div
                            draggable={movendoId !== item.id}
                            onDragStart={(event) => handleDragStart(event, item.id)}
                            onDragEnd={handleDragEnd}
                            style={{
                              cursor: movendoId === item.id ? 'progress' : 'grab',
                              opacity: arrastandoId === item.id ? 0.6 : 1
                            }}
                          >
                            <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            <Typography.Text strong>{item.acao}</Typography.Text>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                              {item.objetivo || 'Sem objetivo informado'}
                            </Typography.Text>
                            <Space wrap>
                              <Tag>Prioridade: {item.prioridade ?? '-'}</Tag>
                              <Tag>Esforco: {item.esforco ?? '-'}</Tag>
                              <Tag color={prazoInfo?.color || 'default'}>
                                {prazoInfo?.label || item.status_prazo || 'Sem status prazo'}
                              </Tag>
                            </Space>
                            <Typography.Text style={{ fontSize: 12 }}>
                              Prazo: {item.prazo ? dayjs(item.prazo).format('DD/MM/YYYY') : '-'}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 12 }}>
                              Responsavel: {item.responsavel_nome || (item.responsavel_id ? `#${item.responsavel_id}` : '-')}
                            </Typography.Text>
                            {item.tags && item.tags.length > 0 ? (
                              <Space wrap>
                                {item.tags.map((tag) => (
                                  <Tag key={`${item.id}-${tag}`}>{tag}</Tag>
                                ))}
                              </Space>
                            ) : null}
                            </Space>
                          </div>
                        </Card>
                      );
                    })}
                  </Space>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Empty description="Selecione uma empresa para visualizar o Kanban" />
        </Card>
      )}
    </Space>
  );
}

export default MatrizAcoesKanban;
