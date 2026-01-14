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
  ClusterOutlined
} from '@ant-design/icons';
import api from '../services/api';

interface SubArea {
  id: number;
  nome: string;
  area_id?: number;
  area_nome?: string;
  unidade_id?: number;
  unidade_nome?: string;
  empresa_id?: number;
  empresa_nome?: string;
}

interface SubArea2 {
  id: number;
  nome: string;
  descricao?: string | null;
  subarea_id: number;
  subarea_nome?: string;
  area_id?: number;
  area_nome?: string;
  unidade_id?: number;
  unidade_nome?: string;
  empresa_id?: number;
  empresa_nome?: string;
}

type SubArea2FormValues = Omit<SubArea2, 'id' | 'subarea_nome' | 'area_nome' | 'unidade_nome' | 'empresa_nome'>;

function Subarea2() {
  const [subareas2, setSubareas2] = useState<SubArea2[]>([]);
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarSubareas() {
    const response = await api.get('/subareas');
    setSubareas(response.data || []);
  }

  async function carregarSubareas2(showMessage = false) {
    try {
      setCarregando(true);
      await carregarSubareas();
      const response = await api.get('/subareas2');
      setSubareas2(response.data || []);
      if (showMessage) message.success('Subáreas 2 atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar subáreas 2');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSubareas2();
  }, []);

  function iniciarEdicao(subarea: SubArea2) {
    form.setFieldsValue({
      nome: subarea.nome,
      descricao: subarea.descricao,
      subarea_id: subarea.subarea_id
    });
    setEditandoId(subarea.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: SubArea2FormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao ?? null,
        subarea_id: values.subarea_id
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/subareas2/${editandoId}`, payload);
        const atualizada: SubArea2 = response.data;
        setSubareas2((prev) =>
          prev.map((s) => (s.id === atualizada.id ? { ...s, ...atualizada } : s))
        );
        message.success('Subárea 2 atualizada');
      } else {
        const response = await api.post('/subareas2', payload);
        const nova: SubArea2 = response.data;
        setSubareas2((prev) => [...prev, nova]);
        message.success('Subárea 2 criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar subárea 2');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/subareas2/${id}`);
      setSubareas2((prev) => prev.filter((s) => s.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Subárea 2 removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir subárea 2');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            SubÁrea 2
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre o quinto nível hierárquico (SubÁrea 2).
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarSubareas2(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
            disabled={!subareas.length}
          >
            Nova SubÁrea 2
          </Button>
        </Space>
      </Flex>

      {!subareas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma subárea antes de criar SubÁrea 2" />
        </Card>
      ) : (
        <Card title="Lista de SubÁrea 2">
          {carregando ? (
            <Skeleton active />
          ) : subareas2.length === 0 ? (
            <Empty description="Nenhum registro cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={subareas2}
              pagination={false}
              size="middle"
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: 'Nome', dataIndex: 'nome' },
                {
                  title: 'Subárea',
                  dataIndex: 'subarea_nome',
                  render: (_: unknown, record: SubArea2) => (
                    <Space>
                      <Tag color="geekblue">
                        {record.subarea_nome ||
                          subareas.find((s) => s.id === record.subarea_id)?.nome ||
                          'Subárea'}
                      </Tag>
                      <Typography.Text type="secondary">#{record.subarea_id}</Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Área',
                  dataIndex: 'area_nome',
                  render: (_: unknown, record: SubArea2) => (
                    <Space>
                      <Tag color="purple">{record.area_nome || 'Área'}</Tag>
                      {record.area_id ? (
                        <Typography.Text type="secondary">#{record.area_id}</Typography.Text>
                      ) : null}
                    </Space>
                  )
                },
                {
                  title: 'Unidade',
                  dataIndex: 'unidade_nome',
                  render: (_: unknown, record: SubArea2) => (
                    <Space>
                      <Tag color="gold">{record.unidade_nome || 'Unidade'}</Tag>
                      {record.unidade_id ? (
                        <Typography.Text type="secondary">#{record.unidade_id}</Typography.Text>
                      ) : null}
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: unknown, record: SubArea2) => (
                    <Space>
                      <Tag color="blue">{record.empresa_nome || 'Empresa'}</Tag>
                      {record.empresa_id ? (
                        <Typography.Text type="secondary">#{record.empresa_id}</Typography.Text>
                      ) : null}
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
                  render: (_: unknown, record: SubArea2) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir SubÁrea 2"
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
            <span>{estaEditando ? `SubÁrea 2 #${editandoId}` : 'Cadastrar SubÁrea 2'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar SubÁrea 2'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Nome da SubÁrea 2" />
          </Form.Item>

          <Form.Item
            label="Subárea"
            name="subarea_id"
            rules={[{ required: true, message: 'Selecione a subárea' }]}
          >
            <Select
              placeholder="Selecione a subárea"
              options={subareas.map((s) => ({
                value: s.id,
                label: s.nome,
                icon: <ClusterOutlined />
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ max: 500, message: 'Máximo de 500 caracteres' }]}
          >
            <Input.TextArea rows={3} placeholder="Descrição opcional" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Subarea2;
