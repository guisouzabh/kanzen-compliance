import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Card,
  Dropdown,
  Table,
  Tag,
  Typography,
  Space,
  Button,
  Flex,
  Skeleton,
  Empty,
  Tooltip,
  Modal,
  Form,
  Input,
  DatePicker,
  Segmented,
  Select,
  Upload,
  Timeline,
  message
} from 'antd';
import {
  ReloadOutlined,
  FileSearchOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  LinkOutlined,
  EditOutlined,
  OrderedListOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import type { MenuProps } from 'antd';
import RequisitosMapa from '../components/RequisitosMapa';

interface Requisito {
  id: number;
  titulo: string;
  descricao: string;
  tipo: 'LEGAL' | 'INTERNO' | 'EXTERNO';
  status: 'CONFORME' | 'NAO_CONFORME' | 'EM_ANALISE' | 'SEM_ANALISE' | 'EM_REANALISE';
  origem: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  criticidade: 0 | 1 | 2 | 3 | 4;
  prioridade: 1 | 2 | 3 | 4 | 5;
  area_responsavel_id: number;
  area_responsavel_nome?: string;
  usuario_responsavel_id?: number | null;
  usuario_responsavel_nome?: string | null;
  outras_areas_ids?: number[];
  outras_areas_nomes?: string[];
  tags?: string[];
  classificacao_id: number;
  classificacao_nome?: string;
  created_at?: string;
  updated_at?: string;
}

interface AreaMapa {
  id: number;
  nome: string;
  latitude?: number | null;
  longitude?: number | null;
  empresa_nome?: string;
}

interface Checkin {
  id: number;
  descricao: string;
  data: string | Date;
  responsavel: string;
  anexo?: string | null;
  status: Requisito['status'];
}

interface Tarefa {
  id: number;
  titulo: string;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  status: 'ABERTO' | 'FECHADO';
}

const statusColor: Record<Requisito['status'], string> = {
  CONFORME: 'green',
  NAO_CONFORME: 'red',
  EM_ANALISE: 'blue',
  SEM_ANALISE: 'gold',
  EM_REANALISE: 'purple'
};

const origemOptions = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'FEDERAL', label: 'Federal' }
];

const statusOptions = [
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'NAO_CONFORME', label: 'Não conforme' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'SEM_ANALISE', label: 'Sem análise' },
  { value: 'EM_REANALISE', label: 'Em re-análise' }
];

const criticidadeOptions = [
  { value: 0, label: 'Urgente' },
  { value: 1, label: 'Muito alta' },
  { value: 2, label: 'Alta' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'Baixa' }
];

const prioridadeOptions = [1, 2, 3, 4, 5].map((value) => ({
  value,
  label: String(value)
}));

function Requisitos() {
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberta, setModalAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [requisitoSelecionado, setRequisitoSelecionado] = useState<Requisito | null>(null);
  const [filtroTags, setFiltroTags] = useState<string[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<Requisito['status'][]>([]);
  const [filtroAreaResponsavel, setFiltroAreaResponsavel] = useState<number[]>([]);
  const [filtroUsuarioResponsavel, setFiltroUsuarioResponsavel] = useState<number[]>([]);
  const [filtroClassificacao, setFiltroClassificacao] = useState<number[]>([]);
  const [filtroDataAtualizacao, setFiltroDataAtualizacao] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filtroOrigem, setFiltroOrigem] = useState<Requisito['origem'][]>([]);
  const [filtroCriticidade, setFiltroCriticidade] = useState<Requisito['criticidade'][]>([]);
  const [filtroPrioridade, setFiltroPrioridade] = useState<Requisito['prioridade'][]>([]);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [carregandoCheckins, setCarregandoCheckins] = useState(false);
  const [areas, setAreas] = useState<AreaMapa[]>([]);
  const [usuarios, setUsuarios] = useState<{ id: number; nome: string }[]>([]);
  const [classificacoes, setClassificacoes] = useState<{ id: number; nome: string }[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novaTarefaTitulo, setNovaTarefaTitulo] = useState('');
  const [novaTarefaResponsavel, setNovaTarefaResponsavel] = useState<number | null>(null);
  const [modalEdicaoAberta, setModalEdicaoAberta] = useState(false);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [form] = Form.useForm();
  const [formEdicao] = Form.useForm();
  const location = useLocation();

  async function carregarRequisitos(showMessage = false) {
    try {
      setCarregando(true);
      const response = await api.get('/requisitos');
      setRequisitos(response.data);
      if (showMessage) {
        message.success('Requisitos atualizados');
      }
    } catch (err) {
      console.error('Erro ao carregar requisitos', err);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarAuxiliares() {
    try {
      const [areasResp, usuariosResp, classificacoesResp] = await Promise.all([
        api.get('/areas'),
        api.get('/usuarios'),
        api.get('/classificacoes')
      ]);
      setAreas(areasResp.data || []);
      setUsuarios(usuariosResp.data || []);
      setClassificacoes(classificacoesResp.data || []);
    } catch (err) {
      // silencioso para não quebrar UI
      console.error('Erro ao carregar áreas/usuarios', err);
    }
  }

  useEffect(() => {
    carregarRequisitos();
    carregarAuxiliares();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const parseList = (key: string) =>
      params.get(key)
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) || [];

    const statusList = parseList('status').filter((s): s is Requisito['status'] =>
      ['CONFORME', 'NAO_CONFORME', 'EM_ANALISE', 'SEM_ANALISE', 'EM_REANALISE'].includes(s)
    );
    const tagsList = parseList('tags');
    const areaList = parseList('area')
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0);
    const usuarioList = parseList('usuario')
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0);
    const classificacaoList = parseList('classificacao')
      .map((id) => Number(id))
      .filter((n) => Number.isInteger(n) && n > 0);
    const dataInicio = params.get('atualizacao_de');
    const dataFim = params.get('atualizacao_ate');
    const origemList = parseList('origem').filter((o): o is Requisito['origem'] =>
      ['MUNICIPAL', 'ESTADUAL', 'FEDERAL'].includes(o)
    );

    setFiltroStatus(statusList);
    setFiltroTags(tagsList);
    setFiltroAreaResponsavel(areaList);
    setFiltroUsuarioResponsavel(usuarioList);
    setFiltroClassificacao(classificacaoList);
    if (dataInicio || dataFim) {
      setFiltroDataAtualizacao([dataInicio ? dayjs(dataInicio) : null, dataFim ? dayjs(dataFim) : null]);
    }
    setFiltroOrigem(origemList);
  }, [location.search]);

  const tagsDisponiveis = useMemo(() => {
    const set = new Set<string>();
    requisitos.forEach((r) => (r.tags || []).forEach((t) => set.add(t)));
    return Array.from(set);
  }, [requisitos]);
  const areasOptions = useMemo(() => areas.map((a) => ({ value: a.id, label: a.nome })), [areas]);
  const usuariosOptions = useMemo(
    () => usuarios.map((u) => ({ value: u.id, label: u.nome })),
    [usuarios]
  );
  const classificacaoOptions = useMemo(
    () => classificacoes.map((c) => ({ value: c.id, label: c.nome })),
    [classificacoes]
  );
  const classificacaoPadraoId = useMemo(
    () => classificacoes.find((c) => c.nome.toLowerCase() === 'premios e apostas')?.id ?? null,
    [classificacoes]
  );

  const formatosAceitos = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpeg', '.jpg', '.png'];

  const resetarAnexo = () => {
    setFileList([]);
    form.setFieldsValue({ anexo: null });
  };

  const validarArquivo = (file: RcFile) => {
    const nome = file.name.toLowerCase();
    const tipoValido = formatosAceitos.some((ext) => nome.endsWith(ext));
    if (!tipoValido) {
      message.error('Formato não permitido. Envie pdf, doc, docx, xls, xlsx, jpeg ou png.');
      return Upload.LIST_IGNORE;
    }

    const tamanhoOk = file.size / 1024 / 1024 <= 10;
    if (!tamanhoOk) {
      message.error('O arquivo deve ter no máximo 10MB.');
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  const enviarAnexo: UploadProps['customRequest'] = async (options) => {
    const { file, onError, onSuccess } = options;
    const arquivo = file as RcFile;

    const validacao = validarArquivo(arquivo);
    if (validacao === Upload.LIST_IGNORE) {
      return;
    }

    const formData = new FormData();
    formData.append('file', arquivo);

    try {
      setUploadingAnexo(true);
      const response = await api.post('/uploads/checkins', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { url } = response.data || {};
      form.setFieldsValue({ anexo: url });
      setFileList([
        {
          uid: arquivo.uid,
          name: arquivo.name,
          status: 'done',
          url
        }
      ]);
      message.success('Anexo enviado com sucesso');
      onSuccess?.(response.data, arquivo);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao enviar o anexo');
      onError?.(err as any);
    } finally {
      setUploadingAnexo(false);
    }
  };

  const requisitosFiltrados = useMemo(() => {
    return requisitos.filter((r) => {
      const passaTags =
        !filtroTags.length ||
        (r.tags || []).some((tag) => filtroTags.includes(tag));
      const passaStatus =
        !filtroStatus.length || filtroStatus.includes(r.status);
      const passaArea =
        !filtroAreaResponsavel.length || filtroAreaResponsavel.includes(r.area_responsavel_id);
      const passaUsuario =
        !filtroUsuarioResponsavel.length ||
        (r.usuario_responsavel_id && filtroUsuarioResponsavel.includes(r.usuario_responsavel_id));
      const passaClassificacao =
        !filtroClassificacao.length || filtroClassificacao.includes(r.classificacao_id);
      const dataRef = r.updated_at || r.created_at;
      const passaData =
        !filtroDataAtualizacao ||
        ((!filtroDataAtualizacao[0] || (dataRef && dayjs(dataRef).isSameOrAfter(filtroDataAtualizacao[0], 'day'))) &&
          (!filtroDataAtualizacao[1] || (dataRef && dayjs(dataRef).isSameOrBefore(filtroDataAtualizacao[1], 'day'))));
      const passaOrigem =
        !filtroOrigem.length || filtroOrigem.includes(r.origem);
      const passaCriticidade =
        !filtroCriticidade.length || filtroCriticidade.includes(r.criticidade);
      const passaPrioridade =
        !filtroPrioridade.length || filtroPrioridade.includes(r.prioridade);
      return (
        passaTags &&
        passaStatus &&
        passaArea &&
        passaUsuario &&
        passaClassificacao &&
        passaData &&
        passaOrigem &&
        passaCriticidade &&
        passaPrioridade
      );
    });
  }, [
    requisitos,
    filtroTags,
    filtroStatus,
    filtroAreaResponsavel,
    filtroUsuarioResponsavel,
    filtroClassificacao,
    filtroDataAtualizacao,
    filtroOrigem,
    filtroCriticidade,
    filtroPrioridade
  ]);

  function abrirModalCheckin(requisito: Requisito) {
    setRequisitoSelecionado(requisito);
    resetarAnexo();
    form.setFieldsValue({
      status: requisito.status,
      data: dayjs(),
      responsavel: requisito.usuario_responsavel_nome || '',
      descricao: '',
      anexo: null
    });
    carregarCheckins(requisito.id);
    carregarTarefas(requisito.id);
    setModalAberta(true);
  }

  function fecharModal() {
    setModalAberta(false);
    setRequisitoSelecionado(null);
    form.resetFields();
    resetarAnexo();
    setCheckins([]);
    setTarefas([]);
    setNovaTarefaTitulo('');
    setNovaTarefaResponsavel(null);
  }

  function abrirModalEdicao(requisito: Requisito) {
    setRequisitoSelecionado(requisito);
    formEdicao.setFieldsValue({
      classificacao_id: requisito.classificacao_id || classificacaoPadraoId || undefined,
      area_responsavel_id: requisito.area_responsavel_id,
      usuario_responsavel_id: requisito.usuario_responsavel_id || null,
      criticidade: requisito.criticidade,
      prioridade: requisito.prioridade,
      outras_areas_ids: requisito.outras_areas_ids || [],
      tags: requisito.tags || []
    });
    setModalEdicaoAberta(true);
  }

  function fecharModalEdicao() {
    setModalEdicaoAberta(false);
    setRequisitoSelecionado(null);
    formEdicao.resetFields();
  }

  async function carregarCheckins(requisitoId: number) {
    setCarregandoCheckins(true);
    try {
      const response = await api.get(`/requisitos/${requisitoId}/checkins`);
      setCheckins(response.data || []);
    } catch (err) {
      message.error('Erro ao carregar histórico de check-ins');
    } finally {
      setCarregandoCheckins(false);
    }
  }

  async function carregarTarefas(requisitoId: number) {
    try {
      const response = await api.get(`/requisitos/${requisitoId}/tarefas`);
      setTarefas(response.data || []);
    } catch (err) {
      message.error('Erro ao carregar tarefas');
    }
  }

  async function criarTarefa() {
    if (!requisitoSelecionado) return;
    if (!novaTarefaTitulo.trim()) {
      message.warning('Informe o título da tarefa');
      return;
    }
    try {
      const response = await api.post(`/requisitos/${requisitoSelecionado.id}/tarefas`, {
        titulo: novaTarefaTitulo,
        responsavel_id: novaTarefaResponsavel || null
      });
      setTarefas((prev) => [response.data, ...prev]);
      setNovaTarefaTitulo('');
      setNovaTarefaResponsavel(null);
      message.success('Tarefa adicionada');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao adicionar tarefa');
    }
  }

  async function atualizarStatusTarefa(tarefa: Tarefa) {
    if (!requisitoSelecionado) return;
    const novoStatus = tarefa.status === 'ABERTO' ? 'FECHADO' : 'ABERTO';
    try {
      const response = await api.put(
        `/requisitos/${requisitoSelecionado.id}/tarefas/${tarefa.id}`,
        { status: novoStatus }
      );
      setTarefas((prev) => prev.map((t) => (t.id === tarefa.id ? response.data : t)));
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao atualizar tarefa');
    }
  }

  async function salvarCheckin(values: any) {
    if (!requisitoSelecionado) return;
    setSalvando(true);
    try {
      await api.post(`/requisitos/${requisitoSelecionado.id}/checkins`, {
        descricao: values.descricao,
        responsavel: values.responsavel,
        status: values.status,
        anexo: values.anexo || null,
        data: values.data?.toDate?.() ?? new Date()
      });
      message.success('Check-in registrado');
      fecharModal();
      carregarRequisitos();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao registrar check-in');
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(values: {
    classificacao_id?: number | null;
    area_responsavel_id: number;
    usuario_responsavel_id?: number | null;
    criticidade?: Requisito['criticidade'];
    prioridade?: Requisito['prioridade'];
    outras_areas_ids?: number[];
    tags?: string[];
  }) {
    if (!requisitoSelecionado) return;
    setSalvando(true);
    try {
      const payload = {
        ...requisitoSelecionado,
        classificacao_id:
          values.classificacao_id ??
          requisitoSelecionado.classificacao_id ??
          classificacaoPadraoId,
        area_responsavel_id: values.area_responsavel_id,
        usuario_responsavel_id: values.usuario_responsavel_id || null,
        criticidade: values.criticidade ?? requisitoSelecionado.criticidade ?? 3,
        prioridade: values.prioridade ?? requisitoSelecionado.prioridade ?? 3,
        outras_areas_ids: values.outras_areas_ids || [],
        tags: values.tags || []
      };
      await api.put(`/requisitos/${requisitoSelecionado.id}`, payload);
      message.success('Requisito atualizado');
      fecharModalEdicao();
      carregarRequisitos();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao atualizar requisito');
    } finally {
      setSalvando(false);
    }
  }

  const handleAcaoRequisito = (acao: string, requisito: Requisito) => {
    switch (acao) {
      case 'checkin':
        abrirModalCheckin(requisito);
        break;
      case 'tarefas':
        abrirModalCheckin(requisito);
        break;
      case 'editar':
        abrirModalEdicao(requisito);
        break;
      default:
        break;
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Requisitos
          </Typography.Title>
          <Typography.Text type="secondary">
            Lista de requisitos legais, internos e externos com status e origem.
          </Typography.Text>
        </div>
        <Space>
          <Segmented
            value={visualizacao}
            onChange={(value) => setVisualizacao(value as 'lista' | 'mapa')}
            options={[
              { label: 'Lista', value: 'lista' },
              { label: 'Mapa', value: 'mapa' }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => carregarRequisitos(true)} />
        </Space>
      </Flex>

      <Card>
        <Flex gap={16} wrap="wrap">
          <Form layout="vertical" style={{ width: '100%' }}>
            <Flex gap={16} wrap="wrap">
              <Form.Item label="Tags" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por tags"
                  options={tagsDisponiveis.map((tag) => ({ value: tag, label: tag }))}
                  value={filtroTags}
                  onChange={setFiltroTags}
                />
              </Form.Item>

              <Form.Item label="Status" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por status"
                  options={statusOptions}
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                />
              </Form.Item>

              <Form.Item label="Classificação" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por classificação"
                  options={classificacaoOptions}
                  value={filtroClassificacao}
                  onChange={setFiltroClassificacao}
                />
              </Form.Item>

              <Form.Item label="Área responsável" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por área"
                  options={areasOptions}
                  value={filtroAreaResponsavel}
                  onChange={setFiltroAreaResponsavel}
                />
              </Form.Item>

              <Form.Item label="Usuário responsável" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por usuário"
                  options={usuariosOptions}
                  value={filtroUsuarioResponsavel}
                  onChange={setFiltroUsuarioResponsavel}
                />
              </Form.Item>

              <Form.Item label="Origem" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por origem"
                  options={origemOptions}
                  value={filtroOrigem}
                  onChange={setFiltroOrigem}
                />
              </Form.Item>

              <Form.Item label="Criticidade" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por criticidade"
                  options={criticidadeOptions}
                  value={filtroCriticidade}
                  onChange={setFiltroCriticidade}
                />
              </Form.Item>

              <Form.Item label="Prioridade" style={{ minWidth: 220, flex: 1 }}>
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Filtrar por prioridade"
                  options={prioridadeOptions}
                  value={filtroPrioridade}
                  onChange={setFiltroPrioridade}
                />
              </Form.Item>

              <Form.Item label="Atualização" style={{ minWidth: 260, flex: 1 }}>
                <DatePicker.RangePicker
                  style={{ width: '100%' }}
                  value={filtroDataAtualizacao || undefined}
                  onChange={(dates) => setFiltroDataAtualizacao(dates || null)}
                  format="YYYY-MM-DD"
                />
              </Form.Item>
            </Flex>
          </Form>
        </Flex>
      </Card>

      {visualizacao === 'mapa' ? (
        <Card title="Mapa de requisitos por área">
          {carregando ? (
            <Skeleton active />
          ) : requisitosFiltrados.length === 0 ? (
            <Empty description="Nenhum requisito para exibir no mapa" />
          ) : (
            <RequisitosMapa requisitos={requisitosFiltrados} areas={areas} />
          )}
        </Card>
      ) : (
        <Card title="Requisitos cadastrados">
          {carregando ? (
            <Skeleton active />
          ) : requisitos.length === 0 ? (
            <Empty description="Nenhum requisito cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={requisitosFiltrados}
              pagination={{ pageSize: 8 }}
              size="middle"
              columns={[
                {
                  title: 'Título',
                  dataIndex: 'titulo',
                  render: (text: string, record) => (
                    <Tooltip title={record.descricao} placement="topLeft">
                      <Space>
                        <FileSearchOutlined style={{ color: '#0b5be1' }} />
                        <div>
                          <Typography.Text style={{ fontWeight: 600 }} ellipsis>
                            {text}
                          </Typography.Text>
                          <br />
                          <Space size={[4, 4]} wrap>
                            {(record.tags || []).map((tag) => (
                              <Tag key={tag} color="blue">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </Space>
                    </Tooltip>
                  )
                },
                {
                  title: 'Classificação',
                  dataIndex: 'classificacao',
                  width: 200,
                  render: (_: any, record: Requisito) => (
                    <Space size={[6, 6]} wrap>
                      <Tag color="geekblue">{record.classificacao_nome || 'Premios e Apostas'}</Tag>
                      <Tag>{record.tipo}</Tag>
                      <Tag color="gold">{record.origem}</Tag>
                    </Space>
                  )
                },
                {
                  title: 'Área responsável',
                  dataIndex: 'area_responsavel_nome',
                  render: (_: any, record: Requisito) => (
                    <Tag color="blue">{record.area_responsavel_nome || record.area_responsavel_id}</Tag>
                  ),
                  width: 200
                },
                {
                  title: 'Outras áreas envolvidas',
                  dataIndex: 'outras_areas_nomes',
                  render: (outras?: string[], record?: Requisito) => {
                    const nomes = outras?.length ? outras : record?.outras_areas_ids?.map(String);
                    return nomes && nomes.length ? (
                      <Space size={[6, 6]} wrap>
                        {nomes.map((area) => (
                          <Tag key={area} color="purple">
                            {area}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <Typography.Text type="secondary">—</Typography.Text>
                    );
                  },
                  width: 220
                },
                {
                  title: 'Usuário responsável',
                  dataIndex: 'usuario_responsavel_nome',
                  render: (value: string | null | undefined) =>
                    value ? <Typography.Text>{value}</Typography.Text> : <Typography.Text type="secondary">—</Typography.Text>,
                  width: 220
                },
                {
                  title: 'Última atualização',
                  dataIndex: 'updated_at',
                  width: 180,
                  render: (_: any, record: Requisito) => {
                    const dataRef = record.updated_at || record.created_at;
                    return dataRef ? (
                      <Typography.Text>{dayjs(dataRef).format('DD/MM/YYYY HH:mm')}</Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">—</Typography.Text>
                    );
                  }
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  width: 140,
                  render: (value: Requisito['status']) => (
                    <Tag color={statusColor[value]}>{value.replace('_', ' ')}</Tag>
                  )
                },
                {
                  title: 'Criticidade',
                  dataIndex: 'criticidade',
                  width: 140,
                  render: (value: Requisito['criticidade']) => {
                    const label = criticidadeOptions.find((c) => c.value === value)?.label ?? value;
                    const color = value <= 1 ? 'red' : value === 2 ? 'orange' : value === 3 ? 'blue' : 'green';
                    return <Tag color={color}>{label}</Tag>;
                  }
                },
                {
                  title: 'Prioridade',
                  dataIndex: 'prioridade',
                  width: 120,
                  render: (value: Requisito['prioridade']) => <Tag color="geekblue">P{value}</Tag>
                },
                {
                  title: 'Ação',
                  dataIndex: 'acoes',
                  width: 170,
                  render: (_: any, record: Requisito) => {
                    const itensMenu: MenuProps['items'] = [
                      {
                        key: 'checkin',
                        label: 'Registrar check-in',
                        icon: <CheckCircleOutlined />
                      },
                      {
                        key: 'tarefas',
                        label: 'Ver tarefas',
                        icon: <OrderedListOutlined />
                      },
                      {
                        key: 'editar',
                        label: 'Editar requisito',
                        icon: <EditOutlined />
                      }
                    ];

                    return (
                      <Dropdown.Button
                        size="small"
                        type="primary"
                        menu={{
                          items: itensMenu,
                          onClick: ({ key }) => handleAcaoRequisito(key, record)
                        }}
                        icon={<OrderedListOutlined />}
                        onClick={() => handleAcaoRequisito('checkin', record)}
                      >
                        Ações
                      </Dropdown.Button>
                    );
                  }
                }
              ]}
            />
          )}
        </Card>
      )}

      <Modal
        title={`Check-in - ${requisitoSelecionado?.titulo || ''}`}
        open={modalAberta}
        onCancel={fecharModal}
        onOk={() => form.submit()}
        okText="Registrar"
        confirmLoading={salvando}
        okButtonProps={{ disabled: uploadingAnexo }}
        destroyOnClose
      >
        <Flex align="start" gap={24} wrap>
          <div style={{ flex: 1, minWidth: 320 }}>
            <Form
              layout="vertical"
              form={form}
              onFinish={salvarCheckin}
              initialValues={{
                status: 'EM_ANALISE',
                data: dayjs(),
                anexo: null
              }}
            >
              <Form.Item
                label="Status após check-in"
                name="status"
                rules={[{ required: true, message: 'Selecione o status' }]}
              >
                <Select options={statusOptions} />
              </Form.Item>

              <Form.Item
                label="Data"
                name="data"
                rules={[{ required: true, message: 'Informe a data' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>

              <Form.Item
                label="Responsável"
                name="responsavel"
                rules={[{ required: true, message: 'Informe o responsável' }]}
              >
                <Input placeholder="Nome do responsável" />
              </Form.Item>

              <Form.Item
                label="Descrição"
                name="descricao"
                rules={[{ required: true, message: 'Informe a descrição do check-in' }]}
              >
                <Input.TextArea rows={4} placeholder="Notas, evidências, próximos passos..." />
              </Form.Item>

              <Form.Item label="Anexo">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Upload
                    accept={formatosAceitos.join(',')}
                    customRequest={enviarAnexo}
                    fileList={fileList}
                    maxCount={1}
                    multiple={false}
                    onRemove={() => {
                      resetarAnexo();
                      return true;
                    }}
                    beforeUpload={validarArquivo}
                    showUploadList={{ showRemoveIcon: true }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingAnexo}>
                      Selecionar arquivo
                    </Button>
                  </Upload>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Tipos permitidos: pdf, doc, docx, xls, xlsx, jpeg ou png. Tamanho máximo: 10MB.
                  </Typography.Text>
                </Space>
              </Form.Item>

              <Form.Item
                name="anexo"
                hidden
                rules={[{ max: 255, message: 'Máximo de 255 caracteres' }]}
              >
                <Input />
              </Form.Item>
            </Form>
          </div>

          <div style={{ flex: 1, minWidth: 320 }}>
            <Typography.Title level={5}>Histórico de check-ins</Typography.Title>
            {carregandoCheckins ? (
              <Skeleton active />
            ) : checkins.length === 0 ? (
              <Empty description="Nenhum check-in registrado" />
            ) : (
              <Timeline
                mode="left"
                items={checkins.map((item) => {
                  const dataFormatada = item.data ? dayjs(item.data).format('DD/MM/YYYY') : '—';
                  return {
                    key: item.id,
                    label: dataFormatada,
                    children: (
                      <div>
                        <Space align="start" style={{ marginBottom: 8 }}>
                          <Typography.Text strong>{item.responsavel}</Typography.Text>
                          <Tag color={statusColor[item.status]}>{item.status.replace('_', ' ')}</Tag>
                          {item.anexo ? (
                            <a href={item.anexo} target="_blank" rel="noreferrer">
                              <Space size={4}>
                                <LinkOutlined />
                                <Typography.Text>Anexo</Typography.Text>
                              </Space>
                            </a>
                          ) : null}
                        </Space>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>
                          {item.descricao}
                        </Typography.Paragraph>
                      </div>
                    )
                  };
                })}
              />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 320 }}>
            <Typography.Title level={5}>Tarefas</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="Título da tarefa"
                  value={novaTarefaTitulo}
                  onChange={(e) => setNovaTarefaTitulo(e.target.value)}
                />
                <Select
                  allowClear
                  placeholder="Responsável"
                  style={{ width: 200 }}
                  options={usuariosOptions}
                  value={novaTarefaResponsavel ?? undefined}
                  onChange={(v) => setNovaTarefaResponsavel(v ?? null)}
                />
                <Button type="primary" onClick={criarTarefa}>
                  Adicionar
                </Button>
              </Space.Compact>

              {tarefas.length === 0 ? (
                <Empty description="Nenhuma tarefa" />
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {tarefas.map((tarefa) => (
                    <Card
                      key={tarefa.id}
                      size="small"
                      style={{ background: tarefa.status === 'FECHADO' ? '#f6ffed' : undefined }}
                      title={tarefa.titulo}
                      extra={
                        <Tag
                          color={tarefa.status === 'FECHADO' ? 'green' : 'orange'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => atualizarStatusTarefa(tarefa)}
                        >
                          {tarefa.status}
                        </Tag>
                      }
                    >
                      <Typography.Text type="secondary">
                        {tarefa.responsavel_nome || 'Sem responsável'}
                      </Typography.Text>
                    </Card>
                  ))}
                </Space>
              )}
            </Space>
          </div>
        </Flex>
      </Modal>

      <Modal
        title={`Editar requisito - ${requisitoSelecionado?.titulo || ''}`}
        open={modalEdicaoAberta}
        onCancel={fecharModalEdicao}
        onOk={() => formEdicao.submit()}
        okText="Salvar alterações"
        confirmLoading={salvando}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={formEdicao}
          onFinish={salvarEdicao}
        >
          <Form.Item
            label="Classificação"
            name="classificacao_id"
            rules={[{ required: true, message: 'Selecione a classificação' }]}
          >
            <Select
              placeholder="Selecione a classificação"
              options={classificacaoOptions}
            />
          </Form.Item>

          <Form.Item
            label="Área responsável"
            name="area_responsavel_id"
            rules={[{ required: true, message: 'Selecione a área responsável' }]}
          >
            <Select
              placeholder="Selecione a área"
              options={areasOptions}
            />
          </Form.Item>

          <Form.Item label="Usuário responsável" name="usuario_responsavel_id">
            <Select
              allowClear
              placeholder="Opcional"
              options={usuariosOptions}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Criticidade"
              name="criticidade"
              rules={[{ required: true, message: 'Selecione a criticidade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={criticidadeOptions} />
            </Form.Item>

            <Form.Item
              label="Prioridade"
              name="prioridade"
              rules={[{ required: true, message: 'Selecione a prioridade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={prioridadeOptions} />
            </Form.Item>
          </Space>

          <Form.Item label="Outras áreas envolvidas" name="outras_areas_ids">
            <Select
              mode="multiple"
              allowClear
              placeholder="Selecione as áreas envolvidas"
              options={areasOptions}
            />
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              allowClear
              placeholder="Adicione tags"
              options={tagsDisponiveis.map((tag) => ({ value: tag, label: tag }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Requisitos;
