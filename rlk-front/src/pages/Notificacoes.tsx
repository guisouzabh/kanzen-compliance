import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  BellOutlined,
  ReloadOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import api from '../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface Notificacao {
  id: number;
  usuario_id: number;
  usuario_nome?: string;
  titulo: string;
  corpo: string;
  tipo: 'ALERTA' | 'AVISO' | 'INFO';
  prioridade: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: 'NAO_LIDA' | 'LIDA' | 'ARQUIVADA';
  remetente: string;
  referencia_tipo?: string | null;
  referencia_id?: number | null;
  created_at?: string;
}

interface FiltrosForm {
  usuario_id?: number;
  status?: string;
  tipo?: string;
  prioridade?: string;
  remetente?: string;
  q?: string;
  periodo?: [any, any];
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [form] = Form.useForm<FiltrosForm>();

  const filtrosPadrao = useMemo(() => ({ status: 'NAO_LIDA' }), []);

  async function carregarUsuarios() {
    const response = await api.get('/usuarios');
    setUsuarios(response.data || []);
  }

  async function carregarNotificacoes(filtros?: FiltrosForm, showMessage = false) {
    try {
      setCarregando(true);
      const params: Record<string, string | number> = {};
      if (filtros?.usuario_id) params.usuario_id = filtros.usuario_id;
      if (filtros?.status) params.status = filtros.status;
      if (filtros?.tipo) params.tipo = filtros.tipo;
      if (filtros?.prioridade) params.prioridade = filtros.prioridade;
      if (filtros?.remetente) params.remetente = filtros.remetente;
      if (filtros?.q) params.q = filtros.q;
      if (filtros?.periodo?.[0]) {
        params.created_from = filtros.periodo[0].format('YYYY-MM-DD 00:00:00');
      }
      if (filtros?.periodo?.[1]) {
        params.created_to = filtros.periodo[1].format('YYYY-MM-DD 23:59:59');
      }

      const response = await api.get('/inbox-notificacoes', { params });
      setNotificacoes(response.data || []);
      if (showMessage) message.success('Notificações atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar notificações');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    form.setFieldsValue(filtrosPadrao);
    Promise.all([carregarUsuarios()]).finally(() => {
      carregarNotificacoes(filtrosPadrao);
    });
  }, [form, filtrosPadrao]);

  function handleBuscar() {
    const filtros = form.getFieldsValue();
    carregarNotificacoes(filtros, true);
  }

  function handleLimpar() {
    form.resetFields();
    form.setFieldsValue(filtrosPadrao);
    carregarNotificacoes(filtrosPadrao, true);
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Notificações
          </Typography.Title>
          <Typography.Text type="secondary">
            Consulte notificações enviadas aos usuários do tenant.
          </Typography.Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => carregarNotificacoes(form.getFieldsValue(), true)} />
      </Flex>

      <Card>
        <Form form={form} layout="vertical">
          <Flex gap={16} wrap>
            <Form.Item label="Usuário" name="usuario_id" style={{ minWidth: 240 }}>
              <Select
                allowClear
                placeholder="Todos"
                options={usuarios.map((u) => ({ value: u.id, label: u.nome }))}
              />
            </Form.Item>

            <Form.Item label="Status" name="status" style={{ minWidth: 200 }}>
              <Select
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'NAO_LIDA', label: 'Não lida' },
                  { value: 'LIDA', label: 'Lida' },
                  { value: 'ARQUIVADA', label: 'Arquivada' }
                ]}
              />
            </Form.Item>

            <Form.Item label="Tipo" name="tipo" style={{ minWidth: 200 }}>
              <Select
                allowClear
                placeholder="Todos"
                options={[
                  { value: 'ALERTA', label: 'Alerta' },
                  { value: 'AVISO', label: 'Aviso' },
                  { value: 'INFO', label: 'Info' }
                ]}
              />
            </Form.Item>

            <Form.Item label="Prioridade" name="prioridade" style={{ minWidth: 200 }}>
              <Select
                allowClear
                placeholder="Todas"
                options={[
                  { value: 'ALTA', label: 'Alta' },
                  { value: 'MEDIA', label: 'Média' },
                  { value: 'BAIXA', label: 'Baixa' }
                ]}
              />
            </Form.Item>

            <Form.Item label="Remetente" name="remetente" style={{ minWidth: 220 }}>
              <Input placeholder="Nome ou sistema" />
            </Form.Item>

            <Form.Item label="Busca" name="q" style={{ minWidth: 260 }}>
              <Input placeholder="Título ou conteúdo" />
            </Form.Item>

            <Form.Item label="Período" name="periodo" style={{ minWidth: 280 }}>
              <DatePicker.RangePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Flex>

          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleBuscar}>
              Filtrar
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleLimpar}>
              Limpar
            </Button>
          </Space>
        </Form>
      </Card>

      <Card title={<Space><BellOutlined /> Notificações</Space>}>
        {carregando ? (
          <Skeleton active />
        ) : notificacoes.length === 0 ? (
          <Empty description="Nenhuma notificação encontrada" />
        ) : (
          <Table
            rowKey="id"
            dataSource={notificacoes}
            pagination={{ pageSize: 10 }}
            size="middle"
            expandable={{
              expandedRowRender: (record) => (
                <Typography.Paragraph style={{ margin: 0 }}>{record.corpo}</Typography.Paragraph>
              )
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              {
                title: 'Data',
                dataIndex: 'created_at',
                render: (value?: string) => <Typography.Text>{formatDate(value)}</Typography.Text>
              },
              {
                title: 'Usuário',
                dataIndex: 'usuario_nome',
                render: (_: unknown, record: Notificacao) => (
                  <Typography.Text>{record.usuario_nome || `#${record.usuario_id}`}</Typography.Text>
                )
              },
              {
                title: 'Tipo',
                dataIndex: 'tipo',
                render: (value: Notificacao['tipo']) => (
                  <Tag color={value === 'ALERTA' ? 'red' : value === 'AVISO' ? 'gold' : 'blue'}>{value}</Tag>
                )
              },
              {
                title: 'Prioridade',
                dataIndex: 'prioridade',
                render: (value: Notificacao['prioridade']) => (
                  <Tag color={value === 'ALTA' ? 'red' : value === 'MEDIA' ? 'orange' : 'green'}>{value}</Tag>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (value: Notificacao['status']) => (
                  <Tag color={value === 'NAO_LIDA' ? 'purple' : value === 'LIDA' ? 'green' : 'default'}>
                    {value}
                  </Tag>
                )
              },
              { title: 'Título', dataIndex: 'titulo' },
              { title: 'Remetente', dataIndex: 'remetente' },
              {
                title: 'Referência',
                dataIndex: 'referencia',
                render: (_: unknown, record: Notificacao) =>
                  record.referencia_tipo ? (
                    <Typography.Text>
                      {record.referencia_tipo} #{record.referencia_id ?? '—'}
                    </Typography.Text>
                  ) : (
                    <Typography.Text type="secondary">—</Typography.Text>
                  )
              }
            ]}
          />
        )}
      </Card>
    </Space>
  );
}

export default Notificacoes;
