import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
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
  EyeOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

interface PlanoAcao {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  tipo: 'ACOES' | 'TREINAMENTO' | 'AUDITORIA';
  nome: string;
  descricao?: string | null;
  status?: 'RASCUNHO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
}

interface Usuario {
  id: number;
  nome: string;
  email?: string;
}

type PlanoFormValues = {
  empresa_id?: number;
  nome: string;
  descricao?: string | null;
  status?: PlanoAcao['status'];
  responsavel_id?: number | null;
  data_inicio?: Dayjs | null;
  data_fim?: Dayjs | null;
};

const statusOpcoes = [
  { value: 'RASCUNHO', label: 'Rascunho', color: 'default' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', color: 'blue' },
  { value: 'CONCLUIDO', label: 'Concluído', color: 'green' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'red' }
];

const statusMap = new Map(statusOpcoes.map((item) => [item.value, item]));

function PlanosAcoes() {
  const navigate = useNavigate();
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [lista, setLista] = useState<PlanoAcao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<string | undefined>();
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<PlanoFormValues>();

  const estaEditando = editandoId !== null;

  const listaFiltrada = useMemo(() => {
    if (!buscaAplicada.trim()) return lista;
    const q = buscaAplicada.trim().toLowerCase();
    return lista.filter((item) => {
      const nome = (item.nome || '').toLowerCase();
      const descricao = (item.descricao || '').toLowerCase();
      return nome.includes(q) || descricao.includes(q);
    });
  }, [lista, buscaAplicada]);

  function erroApi(err: unknown, fallback: string): string {
    const maybe = err as { response?: { data?: { erro?: string } } };
    return maybe.response?.data?.erro || fallback;
  }

  const carregarDados = useCallback(async (showMessage = false) => {
    try {
      setCarregando(true);
      const params: Record<string, string | number> = { tipo: 'ACOES' };
      if (empresaSelecionada) params.empresa_id = empresaSelecionada;
      if (filtroStatus) params.status = filtroStatus;
      if (buscaAplicada.trim()) params.q = buscaAplicada.trim();

      const [planosResp, usuariosResp] = await Promise.allSettled([
        api.get('/planos', { params }),
        api.get('/usuarios')
      ]);

      if (planosResp.status === 'fulfilled') {
        setLista(planosResp.value.data || []);
      } else {
        setLista([]);
      }

      if (usuariosResp.status === 'fulfilled') {
        setUsuarios(usuariosResp.value.data || []);
      } else {
        setUsuarios([]);
      }

      if (showMessage) message.success('Planos atualizados');
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao carregar planos de ações'));
    } finally {
      setCarregando(false);
    }
  }, [empresaSelecionada, filtroStatus, buscaAplicada]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function prepararNovo() {
    setEditandoId(null);
    form.resetFields();
    form.setFieldsValue({
      empresa_id: empresaSelecionada ?? undefined,
      status: 'RASCUNHO'
    });
    setModalAberta(true);
  }

  function iniciarEdicao(item: PlanoAcao) {
    setEditandoId(item.id);
    form.setFieldsValue({
      empresa_id: item.empresa_id,
      nome: item.nome,
      descricao: item.descricao ?? undefined,
      status: item.status ?? 'RASCUNHO',
      responsavel_id: item.responsavel_id ?? null,
      data_inicio: item.data_inicio ? dayjs(item.data_inicio) : null,
      data_fim: item.data_fim ? dayjs(item.data_fim) : null
    });
    setModalAberta(true);
  }

  function fecharModal() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: PlanoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        empresa_id: values.empresa_id,
        tipo: 'ACOES',
        nome: values.nome.trim(),
        descricao: values.descricao?.trim() || null,
        status: values.status || 'RASCUNHO',
        responsavel_id: values.responsavel_id ?? null,
        data_inicio: values.data_inicio ? values.data_inicio.format('YYYY-MM-DD') : null,
        data_fim: values.data_fim ? values.data_fim.format('YYYY-MM-DD') : null
      };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/planos/${editandoId}`, payload);
        const atualizado: PlanoAcao = resp.data;
        setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        message.success('Plano atualizado');
      } else {
        const resp = await api.post('/planos', payload);
        const criado: PlanoAcao = resp.data;
        setLista((prev) => [criado, ...prev]);
        message.success('Plano criado');
      }

      fecharModal();
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao salvar plano'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/planos/${id}`);
      setLista((prev) => prev.filter((item) => item.id !== id));
      message.success('Plano removido');
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao excluir plano'));
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Planos de Ações
          </Typography.Title>
          <Typography.Text type="secondary">
            Gerencie programas de execução com ações vinculadas.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={prepararNovo} disabled={!empresas.length}>
            Novo plano
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de criar planos de ações" />
        </Card>
      ) : (
        <Card title="Planos cadastrados">
          <Space wrap style={{ marginBottom: 16 }}>
            <Typography.Text type="secondary">Status:</Typography.Text>
            <Select
              allowClear
              placeholder="Todos"
              value={filtroStatus}
              onChange={(value) => setFiltroStatus(value)}
              style={{ minWidth: 180 }}
              options={statusOpcoes.map((item) => ({ value: item.value, label: item.label }))}
            />
            <Input.Search
              allowClear
              placeholder="Buscar por nome ou descrição"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              onSearch={(value) => setBuscaAplicada(value)}
              style={{ minWidth: 320 }}
            />
            <Button
              onClick={() => {
                setFiltroStatus(undefined);
                setBusca('');
                setBuscaAplicada('');
              }}
            >
              Limpar filtros
            </Button>
          </Space>

          {listaFiltrada.length === 0 && !carregando ? (
            <Empty description="Nenhum plano de ações encontrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={listaFiltrada}
              loading={carregando}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Plano',
                  dataIndex: 'nome',
                  render: (_: string, record: PlanoAcao) => (
                    <Space direction="vertical" size={0} style={{ width: '100%' }}>
                      <Typography.Text strong>{record.nome}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {record.descricao || 'Sem descrição'}
                      </Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (value?: string) => value || '-'
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value?: PlanoAcao['status']) => {
                    const info = value ? statusMap.get(value) : undefined;
                    return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                  }
                },
                {
                  title: 'Responsável',
                  dataIndex: 'responsavel_nome',
                  render: (value?: string | null) => value || '-'
                },
                {
                  title: 'Período',
                  key: 'periodo',
                  render: (_: unknown, record: PlanoAcao) => {
                    const inicio = record.data_inicio ? dayjs(record.data_inicio).format('DD/MM/YYYY') : '-';
                    const fim = record.data_fim ? dayjs(record.data_fim).format('DD/MM/YYYY') : '-';
                    return `${inicio} até ${fim}`;
                  }
                },
                {
                  title: 'Ações',
                  key: 'acoes',
                  width: 180,
                  render: (_: unknown, record: PlanoAcao) => (
                    <Space>
                      <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/planos-acoes/${record.id}`)} />
                      <Button icon={<EditOutlined />} size="small" onClick={() => iniciarEdicao(record)} />
                      <Popconfirm
                        title="Excluir plano?"
                        description="A exclusão só é permitida se não houver ações vinculadas."
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
        title={estaEditando ? 'Editar plano de ações' : 'Novo plano de ações'}
        open={modalAberta}
        onCancel={fecharModal}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
        width={840}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione a empresa"
              options={empresas.map((empresa) => ({ value: empresa.id, label: empresa.nome }))}
            />
          </Form.Item>

          <Form.Item
            label="Nome do plano"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome do plano' }]}
          >
            <Input maxLength={255} placeholder="Ex: Plano de adequação LGPD - 2026" />
          </Form.Item>

          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={3} maxLength={5000} placeholder="Escopo e objetivo do plano" />
          </Form.Item>

          <Form.Item label="Status" name="status">
            <Select options={statusOpcoes.map((item) => ({ value: item.value, label: item.label }))} />
          </Form.Item>

          <Form.Item label="Responsável" name="responsavel_id">
            <Select
              allowClear
              placeholder="Selecione (opcional)"
              options={usuarios.map((usuario) => ({
                value: usuario.id,
                label: usuario.email ? `${usuario.nome} (${usuario.email})` : usuario.nome
              }))}
            />
          </Form.Item>

          <Form.Item label="Data de início" name="data_inicio">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Data de fim" name="data_fim">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default PlanosAcoes;
