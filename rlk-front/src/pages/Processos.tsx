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
import type { ProcessoLista } from '../types/Inventario';

type ProcessoFormValues = {
  nome: string;
  descricao?: string | null;
};

function Processos() {
  const [lista, setLista] = useState<ProcessoLista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<ProcessoFormValues>();
  const estaEditando = editandoId !== null;

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const resp = await api.get('/processos');
      setLista(resp.data || []);
      if (showMessage) message.success('Processos atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar processos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function iniciarEdicao(item: ProcessoLista) {
    form.setFieldsValue({ nome: item.nome });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: ProcessoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao || null
      };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/processos/${editandoId}`, payload);
        const atualizado: ProcessoLista = resp.data;
        setLista((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
        message.success('Processo atualizado');
      } else {
        const resp = await api.post('/processos', payload);
        const criado: ProcessoLista = resp.data;
        setLista((prev) => [...prev, criado]);
        message.success('Processo criado');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar processo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/processos/${id}`);
      setLista((prev) => prev.filter((p) => p.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Processo removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir processo');
    }
  }

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      width: 140,
      render: (value: string | undefined) =>
        value ? <Tag>{new Date(value).toLocaleDateString('pt-BR')}</Tag> : '-'
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 160,
      render: (_: any, item: ProcessoLista) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => iniciarEdicao(item)} />
          <Popconfirm
            title="Excluir processo?"
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
            Novo processo
          </Button>
        </Space>
      </Flex>

      <Card>
        {lista.length === 0 && !carregando ? (
          <Empty description="Nenhum processo cadastrado" />
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
        title={estaEditando ? 'Editar processo' : 'Novo processo'}
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input placeholder="Ex: Onboarding de clientes" maxLength={255} />
          </Form.Item>
          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={3} placeholder="Etapas, área responsável, observações" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Processos;
