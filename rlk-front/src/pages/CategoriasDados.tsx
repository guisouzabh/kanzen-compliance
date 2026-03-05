import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { PlusOutlined, ReloadOutlined, SaveOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';

interface Categoria {
  id: number;
  nome: string;
  created_at?: string;
}

type CategoriaFormValues = {
  nome: string;
};

function CategoriasDados() {
  const [lista, setLista] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<CategoriaFormValues>();
  const estaEditando = editandoId !== null;

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const resp = await api.get('/categorias-dados-pessoais');
      setLista(resp.data || []);
      if (showMessage) message.success('Categorias atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar categorias');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function iniciarEdicao(cat: Categoria) {
    form.setFieldsValue({ nome: cat.nome });
    setEditandoId(cat.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: CategoriaFormValues) {
    setSalvando(true);
    try {
      const payload = { nome: values.nome.trim() };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/categorias-dados-pessoais/${editandoId}`, payload);
        const atualizado: Categoria = resp.data;
        setLista((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
        message.success('Categoria atualizada');
      } else {
        const resp = await api.post('/categorias-dados-pessoais', payload);
        const criada: Categoria = resp.data;
        setLista((prev) => [...prev, criada]);
        message.success('Categoria criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar categoria');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/categorias-dados-pessoais/${id}`);
      setLista((prev) => prev.filter((c) => c.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Categoria removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir categoria (verifique uso no inventário)');
    }
  }

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (value: string | undefined) =>
        value ? <Tag>{new Date(value).toLocaleDateString('pt-BR')}</Tag> : '-',
      width: 140
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 150,
      render: (_: any, item: Categoria) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => iniciarEdicao(item)} />
          <Popconfirm
            title="Excluir categoria?"
            okText="Sim"
            cancelText="Não"
            onConfirm={() => handleDelete(item.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
          >
            Nova categoria
          </Button>
        </Space>
      </Flex>

      <Card>
        {lista.length === 0 && !carregando ? (
          <Empty description="Nenhuma categoria cadastrada" />
        ) : (
          <Table
            rowKey="id"
            dataSource={lista}
            columns={colunas}
            loading={carregando}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title={estaEditando ? 'Editar categoria' : 'Nova categoria'}
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
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Ex: Nome e Iniciais, Identificação oficial" maxLength={255} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default CategoriasDados;
