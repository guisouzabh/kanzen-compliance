import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Popconfirm,
  Flex,
  Empty,
  Skeleton,
  Modal,
  Upload
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  matriz_ou_filial: 'MATRIZ' | 'FILIAL';
  razao_social: string;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logo_url?: string | null;
}

type EmpresaFormValues = Omit<Empresa, 'id'>;

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  async function carregarEmpresas(showMessage = false) {
    try {
      setCarregando(true);
      const response = await api.get('/empresas');
      setEmpresas(response.data);
      if (showMessage) message.success('Empresas atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar empresas');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  function iniciarEdicao(empresa: Empresa) {
    form.setFieldsValue({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      matriz_ou_filial: empresa.matriz_ou_filial,
      razao_social: empresa.razao_social,
      cep: empresa.cep ?? undefined,
      endereco: empresa.endereco ?? undefined,
      cidade: empresa.cidade ?? undefined,
      estado: empresa.estado ?? undefined,
      logo_url: empresa.logo_url ?? undefined
    });
    if (empresa.logo_url) {
      setLogoFileList([
        {
          uid: `logo-${empresa.id}`,
          name: 'Logomarca',
          status: 'done',
          url: empresa.logo_url
        }
      ]);
    } else {
      setLogoFileList([]);
    }
    setEditandoId(empresa.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setLogoFileList([]);
    setModalAberta(false);
  }

  async function handleSubmit(values: EmpresaFormValues) {
    setSalvando(true);
    try {
      const payload = {
        ...values,
        cep: values.cep || null,
        endereco: values.endereco || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
        logo_url: values.logo_url || null
      };
      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/empresas/${editandoId}`, payload);
        const atualizada: Empresa = response.data;
        setEmpresas(prev => prev.map(emp => (emp.id === atualizada.id ? atualizada : emp)));
        message.success('Empresa atualizada');
      } else {
        const response = await api.post('/empresas', payload);
        setEmpresas(prev => [...prev, response.data]);
        message.success('Empresa criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar empresa');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/empresas/${id}`);
      setEmpresas(prev => prev.filter(e => e.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Empresa removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir empresa');
    }
  }

  const uploadAction = `${api.defaults.baseURL ?? ''}/uploads/logos`;
  const token = localStorage.getItem('token');
  const uploadProps: UploadProps = {
    name: 'file',
    action: uploadAction,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    maxCount: 1,
    listType: 'picture',
    onChange(info) {
      const fileList = info.fileList.slice(-1);
      setLogoFileList(fileList);
      const file = fileList[0];
      if (file?.status === 'done') {
        const url = (file.response as any)?.url;
        if (url) {
          form.setFieldValue('logo_url', url);
        }
      }
      if (file?.status === 'removed') {
        form.setFieldValue('logo_url', null);
      }
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Empresas
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre e gerencie as empresas do tenant.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarEmpresas(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
          >
            Nova empresa
          </Button>
        </Space>
      </Flex>

      <Card title="Lista de empresas">
        {carregando ? (
          <Skeleton active />
        ) : empresas.length === 0 ? (
          <Empty description="Nenhuma empresa cadastrada" />
        ) : (
          <Table
            rowKey="id"
            dataSource={empresas}
            pagination={false}
            size="middle"
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Nome', dataIndex: 'nome' },
              { title: 'CNPJ', dataIndex: 'cnpj' },
              {
                title: 'Tipo',
                dataIndex: 'matriz_ou_filial',
                render: (value: Empresa['matriz_ou_filial']) => (
                  <Tag color={value === 'MATRIZ' ? 'blue' : 'volcano'}>
                    {value}
                  </Tag>
                ),
                width: 120
              },
              { title: 'Razão Social', dataIndex: 'razao_social' },
              {
                title: 'Ações',
                dataIndex: 'acoes',
                width: 160,
                render: (_: unknown, record: Empresa) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => iniciarEdicao(record)}
                    >
                      Editar
                    </Button>
                    <Popconfirm
                      title="Excluir empresa"
                      description="Confirmar exclusão?"
                      okText="Sim"
                      cancelText="Não"
                      onConfirm={() => handleDelete(record.id)}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
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

      <Modal
        title={
          <Space>
            <Tag color={estaEditando ? 'blue' : 'green'}>
              {estaEditando ? 'Edição' : 'Novo registro'}
            </Tag>
            <span>{estaEditando ? `Empresa #${editandoId}` : 'Cadastrar empresa'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar empresa'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ matriz_ou_filial: 'MATRIZ' }}
        >
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Nome fantasia" />
          </Form.Item>

          <Form.Item
            label="CNPJ"
            name="cnpj"
            rules={[{ required: true, message: 'Informe o CNPJ' }]}
          >
            <Input placeholder="00.000.000/0000-00" />
          </Form.Item>

          <Form.Item
            label="Matriz ou Filial"
            name="matriz_ou_filial"
            rules={[{ required: true, message: 'Selecione o tipo' }]}
          >
            <Select
              options={[
                { value: 'MATRIZ', label: 'Matriz' },
                { value: 'FILIAL', label: 'Filial' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Razão Social"
            name="razao_social"
            rules={[{ required: true, message: 'Informe a razão social' }]}
          >
            <Input placeholder="Razão social" />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="CEP" name="cep" style={{ minWidth: 160, flex: 1 }}>
              <Input placeholder="00000-000" maxLength={10} />
            </Form.Item>
            <Form.Item label="Estado" name="estado" style={{ minWidth: 120, flex: 1 }}>
              <Input placeholder="UF" maxLength={2} />
            </Form.Item>
            <Form.Item label="Cidade" name="cidade" style={{ minWidth: 200, flex: 2 }}>
              <Input placeholder="Cidade" maxLength={100} />
            </Form.Item>
          </Space>

          <Form.Item label="Endereço" name="endereco">
            <Input placeholder="Rua, número, complemento" maxLength={255} />
          </Form.Item>

          <Form.Item name="logo_url" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item label="Logomarca">
            <Upload {...uploadProps} fileList={logoFileList}>
              <Button icon={<UploadOutlined />}>Enviar logomarca</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Empresas;
