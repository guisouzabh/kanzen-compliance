import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  TableOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import { useLocation, useNavigate } from 'react-router-dom';

interface MatrizAcao {
  id: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  acao: string;
  objetivo?: string | null;
  status?: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'IMPEDIDA';
  prioridade?: number;
  esforco?: number;
  prazo?: string | null;
  status_prazo?: 'NAO_APLICAVEL' | 'NO_PRAZO' | 'ATRASADA';
  origem?: string | null;
  origem_typ?: string | null;
  origem_id?: number | null;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  tags?: string[];
  created_at?: string;
}

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  empresa_id?: number | null;
}

type MatrizFormValues = {
  empresa_id?: number;
  acao: string;
  objetivo?: string | null;
  status?: MatrizAcao['status'];
  prioridade?: number;
  esforco?: number;
  prazo?: Dayjs | null;
  status_prazo?: MatrizAcao['status_prazo'];
  origem?: string | null;
  origem_typ?: string | null;
  origem_id?: number | null;
  responsavel_id?: number | null;
  tags?: string[];
};

const opcoesStatus = [
  { value: 'PLANEJADA', label: 'Planejada', color: 'default' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', color: 'blue' },
  { value: 'CONCLUIDA', label: 'Concluída', color: 'green' },
  { value: 'IMPEDIDA', label: 'Impedida', color: 'red' }
];

const opcoesStatusPrazo = [
  { value: 'NAO_APLICAVEL', label: 'Não aplicável', color: 'default' },
  { value: 'NO_PRAZO', label: 'No prazo', color: 'green' },
  { value: 'ATRASADA', label: 'Atrasada', color: 'red' }
];

const opcoesNiveis = [
  { value: 1, label: '1 - Muito baixo' },
  { value: 2, label: '2 - Baixo' },
  { value: 3, label: '3 - Médio' },
  { value: 4, label: '4 - Alto' },
  { value: 5, label: '5 - Muito alto' }
];

const mapaStatus = new Map(opcoesStatus.map((item) => [item.value, item]));
const mapaStatusPrazo = new Map(opcoesStatusPrazo.map((item) => [item.value, item]));
const SEM_FILTRO = '__SEM_FILTRO__';

function MatrizAcoes() {
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
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtroTags, setFiltroTags] = useState<string[]>(() => queryParams.getAll('tag'));
  const [tagInputValue, setTagInputValue] = useState('');
  const [form] = Form.useForm<MatrizFormValues>();
  const estaEditando = editandoId !== null;

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
  }, [tagsDisponiveis]);

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
        message.error(
          usuariosResp.reason?.response?.data?.erro || 'Erro ao carregar usuários'
        );
      }
      if (showMessage) message.success('Ações atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar ações');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [empresaSelecionada, filtroStatusPrazo, filtroStatus, filtroPrioridade, filtroResponsavel, filtroPrazoFaixa]);

  function iniciarEdicao(item: MatrizAcao) {
    setTagInputValue('');
    form.setFieldsValue({
      empresa_id: item.empresa_id,
      acao: item.acao,
      objetivo: item.objetivo ?? undefined,
      status: item.status ?? 'PLANEJADA',
      prioridade: item.prioridade ?? 3,
      esforco: item.esforco ?? 3,
      prazo: item.prazo ? dayjs(item.prazo) : null,
      status_prazo: item.status_prazo ?? 'NO_PRAZO',
      origem: item.origem ?? undefined,
      origem_typ: item.origem_typ ?? undefined,
      origem_id: item.origem_id ?? null,
      responsavel_id: item.responsavel_id ?? null,
      tags: item.tags ?? []
    });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function prepararNovo() {
    setEditandoId(null);
    setTagInputValue('');
    form.resetFields();
    form.setFieldsValue({
      empresa_id: empresaSelecionada ?? undefined,
      status: 'PLANEJADA',
      prioridade: 3,
      esforco: 3,
      tags: []
    });
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setTagInputValue('');
    setModalAberta(false);
  }


  async function handleSubmit(values: MatrizFormValues) {
    setSalvando(true);
    try {
      const payload: Record<string, unknown> = {
        empresa_id: values.empresa_id,
        acao: values.acao.trim(),
        objetivo: values.objetivo?.trim() || null,
        status: values.status || 'PLANEJADA',
        prioridade: values.prioridade ?? 3,
        esforco: values.esforco ?? 3,
        prazo: values.prazo ? values.prazo.format('YYYY-MM-DD') : null,
        origem: values.origem?.trim() || null,
        origem_typ: values.origem_typ?.trim() || null,
        origem_id: values.origem_id ?? null,
        responsavel_id: values.responsavel_id ?? null,
        tags: values.tags || []
      };

      if (estaEditando) {
        payload.status_prazo = values.status_prazo || 'NO_PRAZO';
      }

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/matriz-acoes/${editandoId}`, payload);
        const atualizado: MatrizAcao = resp.data;
        setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        message.success('Ação atualizada');
      } else {
        const resp = await api.post('/matriz-acoes', payload);
        const criado: MatrizAcao = resp.data;
        setLista((prev) => [criado, ...prev]);
        message.success('Ação criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar ação');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/matriz-acoes/${id}`);
      setLista((prev) => prev.filter((item) => item.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Ação removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir ação');
    }
  }


  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Matriz de Ações
          </Typography.Title>
          <Typography.Text type="secondary">
            Organize ações de adequação com prioridade, esforço e origem.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            icon={<AppstoreOutlined />}
            onClick={() =>
              navigate({
                pathname: '/matriz-acoes-kanban',
                search: location.search
              })
            }
          >
            Ver kanban
          </Button>
          <Button type="primary" icon={<TableOutlined />} disabled>
            Lista
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={prepararNovo} disabled={!empresas.length}>
            Nova ação
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de criar ações" />
        </Card>
      ) : (
        <Card title="Ações registradas">
          <Space wrap style={{ marginBottom: 16 }}>
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
              onChange={(value) =>
                setFiltroPrioridade(value === SEM_FILTRO ? undefined : value)
              }
              style={{ minWidth: 170 }}
              options={[{ value: SEM_FILTRO, label: ' ' }, ...opcoesNiveis]}
            />
            <Typography.Text type="secondary">Responsável:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroResponsavel}
              onChange={(value) =>
                setFiltroResponsavel(value === SEM_FILTRO ? undefined : value)
              }
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
                { value: 'PROXIMOS_7_DIAS', label: 'Próximos 7 dias' },
                { value: 'PROXIMOS_30_DIAS', label: 'Próximos 30 dias' },
                { value: 'PROXIMOS_90_DIAS', label: 'Próximos 90 dias' },
                { value: 'PROXIMOS_6_MESES', label: 'Próximos 6 meses' },
                { value: 'MAIOR_QUE_6_MESES', label: 'Maior que 6 meses' }
              ]}
            />
            <Typography.Text type="secondary">Filtrar por tags:</Typography.Text>
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
          {listaFiltrada.length === 0 && !carregando ? (
            <Empty description="Nenhuma ação registrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={listaFiltrada}
              loading={carregando}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Ação',
                  dataIndex: 'acao',
                  width: 360,
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.acao || '').localeCompare(b.acao || ''),
                  render: (_: string, record: MatrizAcao) => (
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Typography.Text>{record.acao}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {record.objetivo || 'Sem objetivo informado'}
                      </Typography.Text>
                      {record.tags && record.tags.length ? (
                        <Space wrap size={[4, 4]}>
                          {record.tags.map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                          Sem tags
                        </Typography.Text>
                      )}
                    </Space>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.status || '').localeCompare(b.status || ''),
                  render: (value?: MatrizAcao['status']) => {
                    const info = value ? mapaStatus.get(value) : undefined;
                    return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                  }
                },
                {
                  title: 'Prioridade',
                  dataIndex: 'prioridade',
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.prioridade ?? 0) - (b.prioridade ?? 0),
                  render: (value?: number) => <Tag>{value ?? '-'}</Tag>
                },
                {
                  title: 'Esforço',
                  dataIndex: 'esforco',
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.esforco ?? 0) - (b.esforco ?? 0),
                  render: (value?: number) => <Tag>{value ?? '-'}</Tag>
                },
                {
                  title: 'Prazo',
                  dataIndex: 'prazo',
                  sorter: (a: MatrizAcao, b: MatrizAcao) => {
                    const da = a.prazo ? dayjs(a.prazo).valueOf() : 0;
                    const db = b.prazo ? dayjs(b.prazo).valueOf() : 0;
                    return da - db;
                  },
                  render: (value?: string | null) =>
                    value ? <Tag>{dayjs(value).format('DD/MM/YYYY')}</Tag> : '-'
                },
                {
                  title: 'Status do prazo',
                  dataIndex: 'status_prazo',
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.status_prazo || '').localeCompare(b.status_prazo || ''),
                  render: (value?: MatrizAcao['status_prazo']) => {
                    const info = value ? mapaStatusPrazo.get(value) : undefined;
                    return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                  }
                },
                {
                  title: 'Responsável',
                  dataIndex: 'responsavel_nome',
                  sorter: (a: MatrizAcao, b: MatrizAcao) =>
                    (a.responsavel_nome || '').localeCompare(b.responsavel_nome || ''),
                  render: (_: unknown, record: MatrizAcao) =>
                    record.responsavel_nome ? (
                      <Tag color="purple">{record.responsavel_nome}</Tag>
                    ) : record.responsavel_id ? (
                      <Tag color="purple">#{record.responsavel_id}</Tag>
                    ) : (
                      '-'
                    )
                },
                {
                  title: 'Ações',
                  key: 'acoes',
                  width: 120,
                  render: (_: unknown, record: MatrizAcao) => (
                    <Space>
                      <Button icon={<EditOutlined />} size="small" onClick={() => iniciarEdicao(record)} />
                      <Popconfirm
                        title="Excluir ação?"
                        okText="Sim"
                        cancelText="Não"
                        onConfirm={() => handleDelete(record.id)}
                      >
                        <Button icon={<DeleteOutlined />} size="small" danger />
                      </Popconfirm>
                    </Space>
                  )
                }
              ]}
            />
          )}
        </Card>
      )}

      <Modal
        title={estaEditando ? 'Editar ação' : 'Nova ação'}
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
        width={920}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider orientation="left">Dados principais</Divider>
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione a empresa"
              options={empresas.map((empresa) => ({
                value: empresa.id,
                label: empresa.nome
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Ação"
            name="acao"
            rules={[{ required: true, message: 'Informe a ação' }]}
          >
            <Input placeholder="Ex: Mapear dados pessoais tratados" maxLength={255} />
          </Form.Item>
          <Form.Item label="Objetivo" name="objetivo">
            <Input.TextArea rows={3} placeholder="Por que essa ação é necessária?" maxLength={2000} />
          </Form.Item>
          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Adicione tags"
              options={tagsDisponiveis.map((tag) => ({ value: tag, label: tag }))}
              tokenSeparators={[',', ';']}
              searchValue={tagInputValue}
              onSearch={(value) => setTagInputValue(value)}
              onBlur={() => {
                const novaTag = tagInputValue.trim();
                if (!novaTag) return;
                const atuais = form.getFieldValue('tags') || [];
                if (!atuais.includes(novaTag)) {
                  form.setFieldValue('tags', [...atuais, novaTag]);
                }
                setTagInputValue('');
              }}
            />
          </Form.Item>

          <Divider orientation="left">Planejamento</Divider>
          <Form.Item label="Status" name="status">
            <Select placeholder="Selecione" options={opcoesStatus.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>
          <Form.Item label="Prioridade" name="prioridade">
            <Select placeholder="Selecione" options={opcoesNiveis} />
          </Form.Item>
          <Form.Item label="Esforço" name="esforco">
            <Select placeholder="Selecione" options={opcoesNiveis} />
          </Form.Item>
          <Form.Item label="Prazo" name="prazo">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          {estaEditando && (
            <Form.Item label="Status do prazo" name="status_prazo">
              <Select
                placeholder="Selecione"
                options={opcoesStatusPrazo.map(({ value, label }) => ({ value, label }))}
              />
            </Form.Item>
          )}

          <Divider orientation="left">Origem</Divider>
          <Form.Item label="Origem" name="origem">
            <Input.TextArea rows={2} placeholder="Ex: auditoria interna, diagnóstico, checklist" maxLength={2000} />
          </Form.Item>
          <Form.Item
            label="Tipo de origem"
            name="origem_typ"
            dependencies={['origem_id']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const origemId = getFieldValue('origem_id');
                  if (!origemId || (value && String(value).trim().length > 0)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Informe o tipo de origem quando houver ID'));
                }
              })
            ]}
          >
            <Input placeholder="Ex: DIAGNOSTICO, REQUISITO, PROCESSO" maxLength={50} />
          </Form.Item>
          <Form.Item label="Origem ID" name="origem_id">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="ID de referência" />
          </Form.Item>

          <Divider orientation="left">Responsável</Divider>
          <Form.Item label="Responsável" name="responsavel_id">
            <Select
              placeholder="Selecione (opcional)"
              allowClear
              options={usuarios.map((u) => ({
                value: u.id,
                label: u.email ? `${u.nome} (${u.email})` : u.nome
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>

    </Space>
  );
}

export default MatrizAcoes;
