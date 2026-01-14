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

interface Area {
  id: number;
  nome: string;
  unidade_id: number;
  unidade_nome?: string;
  empresa_id: number;
  empresa_nome?: string;
}

interface SubArea {
  id: number;
  nome: string;
  descricao?: string | null;
  area_id: number;
  area_nome?: string;
  unidade_id?: number;
  unidade_nome?: string;
  empresa_id?: number;
  empresa_nome?: string;
}

type SubAreaFormValues = Omit<SubArea, 'id' | 'area_nome' | 'unidade_nome' | 'empresa_nome'>;

function Subareas() {
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarAreas() {
    const response = await api.get('/areas');
    setAreas(response.data || []);
  }

  async function carregarSubAreas(showMessage = false) {
    try {
      setCarregando(true);
      await carregarAreas();
      const response = await api.get('/subareas');
      setSubareas(response.data || []);
      if (showMessage) message.success('Subáreas atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar subáreas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarSubAreas();
  }, []);

  function iniciarEdicao(subarea: SubArea) {
    form.setFieldsValue({
      nome: subarea.nome,
      descricao: subarea.descricao,
      area_id: subarea.area_id
    });
    setEditandoId(subarea.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: SubAreaFormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao ?? null,
        area_id: values.area_id
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/subareas/${editandoId}`, payload);
        const atualizada: SubArea = response.data;
        setSubareas((prev) =>
          prev.map((s) => (s.id === atualizada.id ? { ...s, ...atualizada } : s))
        );
        message.success('Subárea atualizada');
      } else {
        const response = await api.post('/subareas', payload);
        const nova: SubArea = response.data;
        setSubareas((prev) => [...prev, nova]);
        message.success('Subárea criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar subárea');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/subareas/${id}`);
      setSubareas((prev) => prev.filter((s) => s.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Subárea removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir subárea');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Subáreas
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre subáreas vinculadas às áreas do tenant.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarSubAreas(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
            disabled={!areas.length}
          >
            Nova subárea
          </Button>
        </Space>
      </Flex>

      {!areas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma área antes de criar subáreas" />
        </Card>
      ) : (
        <Card title="Lista de subáreas">
          {carregando ? (
            <Skeleton active />
          ) : subareas.length === 0 ? (
            <Empty description="Nenhuma subárea cadastrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={subareas}
              pagination={false}
              size="middle"
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: 'Nome', dataIndex: 'nome' },
                {
                  title: 'Área',
                  dataIndex: 'area_nome',
                  render: (_: unknown, record: SubArea) => (
                    <Space>
                      <Tag color="geekblue">
                        {record.area_nome ||
                          areas.find((a) => a.id === record.area_id)?.nome ||
                          'Área'}
                      </Tag>
                      <Typography.Text type="secondary">#{record.area_id}</Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Unidade',
                  dataIndex: 'unidade_nome',
                  render: (_: unknown, record: SubArea) => (
                    <Space>
                      <Tag color="purple">{record.unidade_nome || 'Unidade'}</Tag>
                      {record.unidade_id ? (
                        <Typography.Text type="secondary">#{record.unidade_id}</Typography.Text>
                      ) : null}
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: unknown, record: SubArea) => (
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
                  render: (_: unknown, record: SubArea) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir subárea"
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
            <span>{estaEditando ? `Subárea #${editandoId}` : 'Cadastrar subárea'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar subárea'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome da subárea' }]}
          >
            <Input placeholder="Nome da subárea" />
          </Form.Item>

          <Form.Item
            label="Área"
            name="area_id"
            rules={[{ required: true, message: 'Selecione a área' }]}
          >
            <Select
              placeholder="Selecione a área"
              options={areas.map((a) => ({
                value: a.id,
                label: a.nome,
                icon: <ClusterOutlined />
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ max: 500, message: 'Máximo de 500 caracteres' }]}
          >
            <Input.TextArea rows={3} placeholder="Descrição opcional da subárea" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Subareas;
