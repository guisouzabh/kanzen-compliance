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
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ApartmentOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import api from '../services/api';

interface Empresa {
  id: number;
  nome: string;
}

interface Unidade {
  id: number;
  nome: string;
  descricao?: string | null;
  empresa_id: number;
  empresa_nome?: string;
}

type UnidadeFormValues = Omit<Unidade, 'id' | 'empresa_nome'>;

function Unidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarEmpresas() {
    const response = await api.get('/empresas');
    setEmpresas(response.data || []);
  }

  async function carregarUnidades(showMessage = false) {
    try {
      setCarregando(true);
      await carregarEmpresas();
      const response = await api.get('/unidades');
      setUnidades(response.data || []);
      if (showMessage) message.success('Unidades atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar unidades');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUnidades();
  }, []);

  function iniciarEdicao(unidade: Unidade) {
    form.setFieldsValue({
      nome: unidade.nome,
      descricao: unidade.descricao,
      empresa_id: unidade.empresa_id
    });
    setEditandoId(unidade.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: UnidadeFormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao ?? null,
        empresa_id: values.empresa_id
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/unidades/${editandoId}`, payload);
        const atualizada: Unidade = response.data;
        setUnidades((prev) =>
          prev.map((u) => (u.id === atualizada.id ? { ...u, ...atualizada } : u))
        );
        message.success('Unidade atualizada');
      } else {
        const response = await api.post('/unidades', payload);
        const nova: Unidade = response.data;
        setUnidades((prev) => [...prev, nova]);
        message.success('Unidade criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar unidade');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/unidades/${id}`);
      setUnidades((prev) => prev.filter((u) => u.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Unidade removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir unidade');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Unidades
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre unidades vinculadas a empresas do tenant.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarUnidades(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
            disabled={!empresas.length}
          >
            Nova unidade
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de criar unidades" />
        </Card>
      ) : (
        <Card title="Lista de unidades">
          {carregando ? (
            <Skeleton active />
          ) : unidades.length === 0 ? (
            <Empty description="Nenhuma unidade cadastrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={unidades}
              pagination={false}
              size="middle"
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: 'Nome', dataIndex: 'nome' },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: unknown, record: Unidade) => (
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
                  title: 'Descrição',
                  dataIndex: 'descricao',
                  render: (value?: string | null) =>
                    value ? (
                      <Typography.Text>{value}</Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">—</Typography.Text>
                    )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: Unidade) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir unidade"
                        description="Confirmar exclusão?"
                        okText="Sim"
                        cancelText="Não"
                        onConfirm={() => handleDelete(record.id)}
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          Excluir
                        </Button>
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
        title={
          <Space>
            <Tag color={estaEditando ? 'blue' : 'green'}>
              {estaEditando ? 'Edição' : 'Novo registro'}
            </Tag>
            <span>{estaEditando ? `Unidade #${editandoId}` : 'Cadastrar unidade'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar unidade'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome da unidade' }]}
          >
            <Input placeholder="Nome da unidade" />
          </Form.Item>

          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione a empresa"
              options={empresas.map((e) => ({ value: e.id, label: e.nome, icon: <ApartmentOutlined /> }))}
            />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ max: 500, message: 'Máximo de 500 caracteres' }]}
          >
            <Input.TextArea rows={3} placeholder="Descrição opcional da unidade" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Unidades;
