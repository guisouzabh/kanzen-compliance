import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
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
  empresa_id: number;
  empresa_nome?: string;
}

interface Area {
  id: number;
  nome: string;
  descricao?: string | null;
  empresa_id: number;
  empresa_nome?: string;
  unidade_id: number;
  unidade_nome?: string;
  latitude?: number | null;
  longitude?: number | null;
}

type AreaFormValues = Omit<Area, 'id' | 'empresa_nome' | 'unidade_nome'>;

function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);
  const unidadesFiltradas = useMemo(() => {
    const empresaId = form.getFieldValue('empresa_id');
    if (!empresaId) return unidades;
    return unidades.filter((u) => u.empresa_id === empresaId);
  }, [unidades, form]);

  async function carregarEmpresas() {
    const response = await api.get('/empresas');
    setEmpresas(response.data || []);
  }

  async function carregarUnidades() {
    const response = await api.get('/unidades');
    setUnidades(response.data || []);
  }

  async function carregarAreas(showMessage = false) {
    try {
      setCarregando(true);
      await Promise.all([carregarEmpresas(), carregarUnidades()]);
      const response = await api.get('/areas');
      setAreas(response.data || []);
      if (showMessage) message.success('Áreas atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar áreas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAreas();
  }, []);

  function iniciarEdicao(area: Area) {
    form.setFieldsValue({
      nome: area.nome,
      descricao: area.descricao,
      empresa_id: area.empresa_id,
      unidade_id: area.unidade_id,
      latitude: area.latitude,
      longitude: area.longitude
    });
    setEditandoId(area.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: AreaFormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome,
        descricao: values.descricao ?? null,
        unidade_id: values.unidade_id,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null
      };

      const unidadeSelecionada = unidades.find((u) => u.id === values.unidade_id);
      const empresaId = unidadeSelecionada?.empresa_id ?? values.empresa_id;

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/areas/${editandoId}`, payload);
        const atualizada: Area = response.data;
        setAreas((prev) =>
          prev.map((a) =>
            a.id === atualizada.id
              ? {
                  ...a,
                  ...atualizada,
                  unidade_id: values.unidade_id,
                  empresa_id: empresaId,
                  unidade_nome: unidadeSelecionada?.nome ?? atualizada.unidade_nome,
                  empresa_nome: empresaId
                    ? empresas.find((e) => e.id === empresaId)?.nome ?? atualizada.empresa_nome
                    : atualizada.empresa_nome
                }
              : a
          )
        );
        message.success('Área atualizada');
      } else {
        const response = await api.post('/areas', payload);
        const nova: Area = response.data;
        setAreas((prev) => [
          ...prev,
          {
            ...nova,
            unidade_id: values.unidade_id,
            empresa_id: empresaId,
            unidade_nome: unidadeSelecionada?.nome ?? nova.unidade_nome,
            empresa_nome: empresaId
              ? empresas.find((e) => e.id === empresaId)?.nome ?? nova.empresa_nome
              : nova.empresa_nome
          }
        ]);
        message.success('Área criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar área');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/areas/${id}`);
      setAreas((prev) => prev.filter((a) => a.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Área removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir área');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Áreas
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre áreas vinculadas a unidades do tenant.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarAreas(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
            disabled={!unidades.length}
          >
            Nova área
          </Button>
        </Space>
      </Flex>

      {!unidades.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma unidade antes de criar áreas" />
        </Card>
      ) : (
        <Card title="Lista de áreas">
          {carregando ? (
            <Skeleton active />
          ) : areas.length === 0 ? (
            <Empty description="Nenhuma área cadastrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={areas}
              pagination={false}
              size="middle"
              columns={[
                { title: 'ID', dataIndex: 'id', width: 80 },
                { title: 'Nome', dataIndex: 'nome' },
                {
                  title: 'Unidade',
                  dataIndex: 'unidade_nome',
                  render: (_: unknown, record: Area) => (
                    <Space>
                      <Tag color="geekblue">
                        {record.unidade_nome ||
                          unidades.find((u) => u.id === record.unidade_id)?.nome ||
                          'Unidade'}
                      </Tag>
                      <Typography.Text type="secondary">#{record.unidade_id}</Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: unknown, record: Area) => (
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
                  title: 'Coordenadas',
                  dataIndex: 'coordenadas',
                  render: (_: unknown, record: Area) =>
                    record.latitude != null && record.longitude != null ? (
                      <Typography.Text>
                        {record.latitude}, {record.longitude}
                      </Typography.Text>
                    ) : (
                      <Typography.Text type="secondary">Não informado</Typography.Text>
                    )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: Area) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir área"
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
            <span>{estaEditando ? `Área #${editandoId}` : 'Cadastrar área'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar área'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome da área' }]}
          >
            <Input placeholder="Nome da área" />
          </Form.Item>

          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione a empresa"
              onChange={() => form.setFieldValue('unidade_id', undefined)}
              options={empresas.map((e) => ({ value: e.id, label: e.nome, icon: <ApartmentOutlined /> }))}
            />
          </Form.Item>

          <Form.Item
            label="Unidade"
            name="unidade_id"
            rules={[{ required: true, message: 'Selecione a unidade' }]}
          >
            <Select
              placeholder="Selecione a unidade"
              options={unidadesFiltradas.map((u) => ({
                value: u.id,
                label: u.nome,
                icon: <ClusterOutlined />
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ max: 500, message: 'Máximo de 500 caracteres' }]}
          >
            <Input.TextArea rows={3} placeholder="Descrição opcional da área" />
          </Form.Item>

          <Form.Item
            label="Latitude"
            name="latitude"
            rules={[
              { required: true, message: 'Informe a latitude' },
              { type: 'number', min: -90, max: 90, message: 'Latitude deve estar entre -90 e 90' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="-23.550520" step={0.000001} />
          </Form.Item>

          <Form.Item
            label="Longitude"
            name="longitude"
            rules={[
              { required: true, message: 'Informe a longitude' },
              { type: 'number', min: -180, max: 180, message: 'Longitude deve estar entre -180 e 180' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="-46.633308" step={0.000001} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Areas;
