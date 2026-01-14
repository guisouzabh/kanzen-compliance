import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
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
  UserAddOutlined,
  MailOutlined,
  ApartmentOutlined,
  ClusterOutlined
} from '@ant-design/icons';
import api from '../services/api';

interface Empresa {
  id: number;
  nome: string;
}

interface Area {
  id: number;
  nome: string;
  empresa_id: number;
  empresa_nome?: string;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  empresa_id?: number | null;
  area_id?: number | null;
}

interface UsuarioFormValues {
  nome: string;
  email: string;
  senha: string;
  empresa_id?: number | null;
  area_id?: number | null;
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [form] = Form.useForm<UsuarioFormValues>();

  const areasFiltradas = useMemo(() => {
    const empresaId = form.getFieldValue('empresa_id');
    if (!empresaId) return areas;
    return areas.filter((a) => a.empresa_id === empresaId);
  }, [areas, form]);

  async function carregarEmpresasEAreas() {
    const [empresasResp, areasResp] = await Promise.all([
      api.get('/empresas'),
      api.get('/areas')
    ]);
    setEmpresas(empresasResp.data || []);
    setAreas(areasResp.data || []);
  }

  async function carregarUsuarios(showMessage = false) {
    try {
      setCarregando(true);
      await carregarEmpresasEAreas();
      const response = await api.get('/usuarios');
      setUsuarios(response.data || []);
      if (showMessage) message.success('Usuários atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar usuários');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function abrirModal() {
    form.resetFields();
    setModalAberta(true);
  }

  function fecharModal() {
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: UsuarioFormValues) {
    setSalvando(true);
    try {
      await api.post('/usuarios', {
        ...values,
        empresa_id: values.empresa_id || null,
        area_id: values.area_id || null
      });
      message.success('Usuário criado');
      fecharModal();
      carregarUsuarios();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao criar usuário');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Usuários
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre usuários do tenant e vincule opcionalmente a uma empresa ou área.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarUsuarios(true)} />
          <Button type="primary" icon={<UserAddOutlined />} onClick={abrirModal}>
            Novo usuário
          </Button>
        </Space>
      </Flex>

      <Card title="Lista de usuários">
        {carregando ? (
          <Skeleton active />
        ) : usuarios.length === 0 ? (
          <Empty description="Nenhum usuário cadastrado" />
        ) : (
          <Table
            rowKey="id"
            dataSource={usuarios}
            pagination={false}
            size="middle"
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Nome', dataIndex: 'nome' },
              { title: 'Email', dataIndex: 'email' },
              {
                title: 'Empresa',
                dataIndex: 'empresa_id',
                render: (value: number | null | undefined) => {
                  if (!value) return <Typography.Text type="secondary">—</Typography.Text>;
                  const empresa = empresas.find((e) => e.id === value);
                  return (
                    <Space>
                      <Tag color="blue">{empresa?.nome || 'Empresa'}</Tag>
                      <Typography.Text type="secondary">#{value}</Typography.Text>
                    </Space>
                  );
                }
              },
              {
                title: 'Área',
                dataIndex: 'area_id',
                render: (value: number | null | undefined) => {
                  if (!value) return <Typography.Text type="secondary">—</Typography.Text>;
                  const area = areas.find((a) => a.id === value);
                  return (
                    <Space>
                      <Tag color="purple">{area?.nome || 'Área'}</Tag>
                      <Typography.Text type="secondary">#{value}</Typography.Text>
                    </Space>
                  );
                }
              }
            ]}
          />
        )}
      </Card>

      <Modal
        title={
          <Space>
            <Tag color="green">Novo</Tag>
            <span>Cadastrar usuário</span>
          </Space>
        }
        open={modalAberta}
        onCancel={fecharModal}
        okText="Salvar usuário"
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Nome do usuário" prefix={<UserAddOutlined />} />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, type: 'email', message: 'Informe um email válido' }]}
          >
            <Input placeholder="usuario@empresa.com" prefix={<MailOutlined />} />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="senha"
            rules={[{ required: true, min: 6, message: 'Senha mínima de 6 caracteres' }]}
          >
            <Input.Password placeholder="Senha" />
          </Form.Item>

          <Form.Item label="Empresa" name="empresa_id">
            <Select
              allowClear
              placeholder="Opcional"
              onChange={() => {
                // limpa área se empresa mudar para evitar inconsistência
                form.setFieldValue('area_id', undefined);
              }}
              options={empresas.map((e) => ({ value: e.id, label: e.nome, icon: <ApartmentOutlined /> }))}
            />
          </Form.Item>

          <Form.Item label="Área" name="area_id">
            <Select
              allowClear
              placeholder="Opcional"
              options={areasFiltradas.map((a) => ({
                value: a.id,
                label: a.nome,
                icon: <ClusterOutlined />
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Usuarios;
