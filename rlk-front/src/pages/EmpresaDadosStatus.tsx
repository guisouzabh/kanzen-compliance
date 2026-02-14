import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
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
  DeleteOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

interface StatusLgpd {
  id: number;
  nome: string;
}

interface EmpresaDadosStatusItem {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  status_lgpd_id: number;
  status_lgpd_nome?: string;
  percentual: number;
  descricao_sistema?: string | null;
  comentarios?: string | null;
  versao?: number;
  created_at?: string;
  updated_at?: string;
}

type EmpresaDadosStatusFormValues = {
  empresa_id?: number;
  status_lgpd_id: number;
  percentual: number;
  descricao_sistema?: string | null;
  comentarios?: string | null;
  versao?: number;
};

function EmpresaDadosStatus() {
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [lista, setLista] = useState<EmpresaDadosStatusItem[]>([]);
  const [statusLgpd, setStatusLgpd] = useState<StatusLgpd[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<EmpresaDadosStatusFormValues>();
  const estaEditando = editandoId !== null;

  const listaFiltrada = useMemo(() => {
    if (!empresaSelecionada) return lista;
    return lista.filter((item) => item.empresa_id === empresaSelecionada);
  }, [lista, empresaSelecionada]);

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const [statusResp, listaResp] = await Promise.all([
        api.get('/status-lgpd'),
        api.get('/empresa-dados-status', {
          params: empresaSelecionada ? { empresa_id: empresaSelecionada } : undefined
        })
      ]);
      setStatusLgpd(statusResp.data || []);
      setLista(listaResp.data || []);
      if (showMessage) message.success('Status LGPD atualizado');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    carregarDados();
  }, [empresaSelecionada]);

  function iniciarEdicao(item: EmpresaDadosStatusItem) {
    form.setFieldsValue({
      empresa_id: item.empresa_id,
      status_lgpd_id: item.status_lgpd_id,
      percentual: item.percentual,
      descricao_sistema: item.descricao_sistema ?? undefined,
      comentarios: item.comentarios ?? undefined,
      versao: item.versao ?? 1
    });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function prepararNovo() {
    setEditandoId(null);
    form.resetFields();
    form.setFieldsValue({
      empresa_id: empresaSelecionada ?? undefined,
      percentual: 0,
      versao: 1
    });
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: EmpresaDadosStatusFormValues) {
    setSalvando(true);
    try {
      const payload = {
        empresa_id: values.empresa_id,
        status_lgpd_id: values.status_lgpd_id,
        percentual: Number(values.percentual),
        descricao_sistema: values.descricao_sistema?.trim() || null,
        comentarios: values.comentarios?.trim() || null,
        versao: values.versao ?? 1
      };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/empresa-dados-status/${editandoId}`, payload);
        const atualizado: EmpresaDadosStatusItem = resp.data;
        setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        message.success('Status atualizado');
      } else {
        const resp = await api.post('/empresa-dados-status', payload);
        const criado: EmpresaDadosStatusItem = resp.data;
        setLista((prev) => [criado, ...prev]);
        message.success('Status registrado');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar status');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/empresa-dados-status/${id}`);
      setLista((prev) => prev.filter((item) => item.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Status removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir status');
    }
  }

  const colunas = [
    {
      title: 'Empresa',
      dataIndex: 'empresa_nome',
      render: (_: unknown, record: EmpresaDadosStatusItem) => (
        <Space>
          <Tag color="blue">
            {record.empresa_nome ||
              empresas.find((e) => e.id === record.empresa_id)?.nome ||
              'Empresa'}
          </Tag>
          <Typography.Text type="secondary">#{record.empresa_id}</Typography.Text>
        </Space>
      )
    },
    {
      title: 'Status LGPD',
      dataIndex: 'status_lgpd_nome',
      render: (_: unknown, record: EmpresaDadosStatusItem) => (
        <Typography.Text strong>
          {record.status_lgpd_nome ||
            statusLgpd.find((s) => s.id === record.status_lgpd_id)?.nome ||
            'Status'}
        </Typography.Text>
      )
    },
    {
      title: 'Percentual',
      dataIndex: 'percentual',
      width: 140,
      render: (value: number) => <Tag color="geekblue">{Number(value).toFixed(2)}%</Tag>
    },
    {
      title: 'Versão',
      dataIndex: 'versao',
      width: 90,
      render: (value?: number) => value ?? 1
    },
    {
      title: 'Atualizado em',
      dataIndex: 'updated_at',
      width: 140,
      render: (value?: string) =>
        value ? <Tag>{new Date(value).toLocaleDateString('pt-BR')}</Tag> : '-'
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 140,
      render: (_: unknown, record: EmpresaDadosStatusItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)} />
          <Popconfirm
            title="Excluir status?"
            okText="Sim"
            cancelText="Não"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Status LGPD
          </Typography.Title>
          <Typography.Text type="secondary">
            Acompanhe o andamento de fiscalização por empresa e área de status.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={prepararNovo}>
            Novo status
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de criar status" />
        </Card>
      ) : (
        <Card title="Status cadastrados">
          {listaFiltrada.length === 0 && !carregando ? (
            <Empty description="Nenhum status registrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={listaFiltrada}
              columns={colunas}
              loading={carregando}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>
      )}

      <Modal
        title={estaEditando ? 'Editar status' : 'Novo status'}
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione"
              options={empresas.map((empresa) => ({ value: empresa.id, label: empresa.nome }))}
            />
          </Form.Item>

          <Form.Item
            label="Tipo do status"
            name="status_lgpd_id"
            rules={[{ required: true, message: 'Selecione o status' }]}
          >
            <Select
              placeholder="Selecione"
              options={statusLgpd.map((status) => ({ value: status.id, label: status.nome }))}
            />
          </Form.Item>

          <Form.Item
            label="Percentual"
            name="percentual"
            rules={[{ required: true, message: 'Informe o percentual' }]}
          >
            <Input type="number" min={0} max={100} step={0.01} />
          </Form.Item>

          <Form.Item label="Descrição do sistema" name="descricao_sistema">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Comentários" name="comentarios">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Versão" name="versao">
            <Input type="number" min={1} step={1} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default EmpresaDadosStatus;
