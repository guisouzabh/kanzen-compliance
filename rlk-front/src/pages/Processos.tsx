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
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type { ProcessoLista } from '../types/Inventario';

type ProcessoFormValues = {
  nome: string;
  descricao?: string | null;
  parent_id?: number | null;
};

function buildTree(items: ProcessoLista[]): ProcessoLista[] {
  const map = new Map<number, ProcessoLista>();
  items.forEach((item) => map.set(item.id, { ...item, children: [] }));

  const roots: ProcessoLista[] = [];
  map.forEach((item) => {
    if (item.parent_id) {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children!.push(item);
      } else {
        roots.push(item);
      }
    } else {
      roots.push(item);
    }
  });

  map.forEach((item) => {
    if (!item.children || item.children.length === 0) {
      delete item.children;
    }
  });

  return roots;
}

function Processos() {
  const [lista, setLista] = useState<ProcessoLista[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [deletandoId, setDeletandoId] = useState<number | null>(null);
  const [form] = Form.useForm<ProcessoFormValues>();
  const estaEditando = editandoId !== null;

  const processosRaiz = lista.filter((p) => !p.parent_id);
  const treeData = buildTree(lista);

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

  function abrirNovo(parentId?: number) {
    form.resetFields();
    if (parentId !== undefined) {
      form.setFieldValue('parent_id', parentId);
    }
    setEditandoId(null);
    setModalAberta(true);
  }

  function abrirEdicao(item: ProcessoLista) {
    form.setFieldsValue({
      nome: item.nome,
      descricao: item.descricao ?? undefined,
      parent_id: item.parent_id ?? null
    });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function fecharModal() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: ProcessoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        nome: values.nome.trim(),
        descricao: values.descricao || null,
        parent_id: values.parent_id ?? null
      };
      if (estaEditando) {
        await api.put(`/processos/${editandoId}`, payload);
        message.success('Processo atualizado');
      } else {
        await api.post('/processos', payload);
        message.success('Processo criado');
      }
      fecharModal();
      carregarDados();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar processo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    setDeletandoId(id);
    try {
      await api.delete(`/processos/${id}`);
      if (editandoId === id) fecharModal();
      message.success('Processo removido');
      carregarDados();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir processo');
    } finally {
      setDeletandoId(null);
    }
  }

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      render: (text: string, item: ProcessoLista) => (
        <Flex align="center" gap={8}>
          <Typography.Text strong={!item.parent_id}>{text}</Typography.Text>
          {item.descricao && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {item.descricao}
            </Typography.Text>
          )}
        </Flex>
      )
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      width: 130,
      render: (value: string | undefined) =>
        value ? <Tag>{new Date(value).toLocaleDateString('pt-BR')}</Tag> : '-'
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 160,
      render: (_: any, item: ProcessoLista) => {
        const temFilhos = lista.some((f) => f.parent_id === item.id);
        return (
          <Space size={4}>
            {!item.parent_id && (
              <Tooltip title="Adicionar sub-processo">
                <Button
                  size="small"
                  icon={<ApartmentOutlined />}
                  onClick={() => abrirNovo(item.id)}
                />
              </Tooltip>
            )}
            <Tooltip title="Editar">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => abrirEdicao(item)}
              />
            </Tooltip>
            <Popconfirm
              title={
                temFilhos
                  ? 'Este processo possui sub-processos. Ao excluir, eles ficarão sem vínculo. Confirma?'
                  : 'Excluir processo?'
              }
              okText="Sim"
              cancelText="Não"
              onConfirm={() => handleDelete(item.id)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={deletandoId === item.id}
              />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrirNovo()}>
            Novo processo
          </Button>
        </Space>
      </Flex>

      <Card>
        <Spin spinning={carregando}>
          {!carregando && lista.length === 0 ? (
            <Empty description="Nenhum processo cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={treeData}
              columns={colunas}
              pagination={false}
              expandable={{ defaultExpandAllRows: true }}
              indentSize={24}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title={
          estaEditando
            ? 'Editar processo'
            : form.getFieldValue('parent_id')
            ? 'Novo sub-processo'
            : 'Novo processo'
        }
        open={modalAberta}
        onCancel={fecharModal}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Processo pai" name="parent_id">
            <Select
              allowClear
              placeholder="Nenhum (processo raiz)"
              options={processosRaiz.map((p) => ({ value: p.id, label: p.nome }))}
            />
          </Form.Item>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
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
