import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import api from '../services/api';

type TipoInput = 'RICH_TEXT' | 'TEXT' | 'JSON';

interface DocumentoModeloSecao {
  id: number;
  documento_regulatorio_id: number;
  chave: string;
  titulo: string;
  descricao?: string | null;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: TipoInput;
  ativo?: boolean;
}

interface DocumentoRegulatorio {
  id: number;
  nome: string;
}

type SecaoFormValues = {
  chave: string;
  titulo: string;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: TipoInput;
  ativo?: boolean;
};

const tipoInputOptions = [
  { value: 'RICH_TEXT', label: 'Rich text' },
  { value: 'TEXT', label: 'Texto' },
  { value: 'JSON', label: 'JSON' }
];

function ordenarSecoes(lista: DocumentoModeloSecao[]) {
  return [...lista].sort((a, b) => {
    const ordemA = a.ordem ?? Number.MAX_SAFE_INTEGER;
    const ordemB = b.ordem ?? Number.MAX_SAFE_INTEGER;
    if (ordemA !== ordemB) return ordemA - ordemB;
    return a.id - b.id;
  });
}

function DocumentoRegulatorioSecoesGrid() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const documentoId = Number(params.id);

  const [documento, setDocumento] = useState<DocumentoRegulatorio | null>(null);
  const [secoes, setSecoes] = useState<DocumentoModeloSecao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<SecaoFormValues>();

  const documentoNomeState = (location.state as { documentoNome?: string } | null)?.documentoNome;
  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarSecoes() {
    const response = await api.get(`/documentos-regulatorios/${documentoId}/modelo-secoes`);
    setSecoes(ordenarSecoes(response.data || []));
  }

  async function carregarDocumento() {
    const response = await api.get(`/documentos-regulatorios/${documentoId}`);
    setDocumento(response.data ?? null);
  }

  async function carregarDados(showMessage = false) {
    if (!documentoId || Number.isNaN(documentoId)) {
      message.error('Documento inválido');
      navigate('/documentos-regulatorios');
      return;
    }

    try {
      setCarregando(true);
      await Promise.all([carregarSecoes(), carregarDocumento()]);
      if (showMessage) message.success('Seções atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar seções');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [documentoId]);

  function iniciarEdicao(secao: DocumentoModeloSecao) {
    form.setFieldsValue({
      chave: secao.chave,
      titulo: secao.titulo,
      ordem: secao.ordem ?? 1,
      obrigatoria: secao.obrigatoria ?? true,
      tipo_input: secao.tipo_input ?? 'RICH_TEXT',
      ativo: secao.ativo ?? true
    });
    setEditandoId(secao.id);
  }

  function cancelarEdicao() {
    if (editandoId !== null && editandoId < 0) {
      setSecoes((prev) => prev.filter((s) => s.id !== editandoId));
    }
    setEditandoId(null);
    form.resetFields();
  }

  async function salvarEdicao(id: number) {
    try {
      const values = await form.validateFields();
      setSalvando(true);

      const secaoAtual = secoes.find((s) => s.id === id);
      if (!secaoAtual) return;

      const payload = {
        documento_regulatorio_id: secaoAtual.documento_regulatorio_id,
        chave: values.chave,
        titulo: values.titulo,
        descricao: secaoAtual.descricao ?? null,
        ordem: values.ordem ?? 1,
        obrigatoria: values.obrigatoria ?? true,
        tipo_input: values.tipo_input ?? 'RICH_TEXT',
        schema_json: null,
        template_html: null,
        ativo: values.ativo ?? true,
        links: []
      };

      if (id < 0) {
        const response = await api.post(`/documentos-regulatorios/${documentoId}/modelo-secoes`, payload);
        const criada: DocumentoModeloSecao = response.data;
        setSecoes((prev) => ordenarSecoes(prev.filter((s) => s.id !== id).concat(criada)));
        message.success('Seção criada');
      } else {
        const response = await api.put(`/documento-modelo-secao/${id}`, payload);
        const atualizado: DocumentoModeloSecao = response.data;
        setSecoes((prev) => ordenarSecoes(prev.map((s) => (s.id === id ? atualizado : s))));
        message.success('Seção atualizada');
      }
      cancelarEdicao();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.response?.data?.erro || 'Erro ao salvar seção');
    } finally {
      setSalvando(false);
    }
  }

  function novaSecao() {
    const proximaOrdem =
      secoes.reduce((max, secao) => Math.max(max, secao.ordem ?? 0), 0) + 1;
    const tempId = -Date.now();
    const nova: DocumentoModeloSecao = {
      id: tempId,
      documento_regulatorio_id: documentoId,
      chave: '',
      titulo: '',
      ordem: proximaOrdem,
      obrigatoria: true,
      tipo_input: 'RICH_TEXT',
      ativo: true
    };
    setSecoes((prev) => ordenarSecoes([...prev, nova]));
    setEditandoId(tempId);
    form.setFieldsValue({
      chave: '',
      titulo: '',
      ordem: proximaOrdem,
      obrigatoria: true,
      tipo_input: 'RICH_TEXT',
      ativo: true
    });
  }

  async function removerSecao(id: number) {
    try {
      await api.delete(`/documento-modelo-secao/${id}`);
      setSecoes((prev) => prev.filter((s) => s.id !== id));
      if (editandoId === id) cancelarEdicao();
      message.success('Seção removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir seção');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documentos-regulatorios')}>
          Voltar para Documentos Regulatórios
        </Button>
        <Typography.Text type="secondary">
          {documento?.nome || documentoNomeState || `Documento #${documentoId}`}
        </Typography.Text>
      </Flex>

      <Card
        title="Grid de seções (editável)"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={novaSecao}
              disabled={estaEditando}
            >
              Nova seção
            </Button>
          </Space>
        }
      >
        {carregando ? null : secoes.length === 0 ? (
          <Empty description="Nenhuma seção cadastrada para este documento" />
        ) : (
          <Form form={form} component={false}>
            <Table
              rowKey="id"
              dataSource={secoes}
              pagination={false}
              size="middle"
              onRow={(record) => ({
                onDoubleClick: () => {
                  if (!estaEditando || editandoId === record.id) {
                    iniciarEdicao(record);
                  }
                }
              })}
              columns={[
                {
                  title: 'Ordem',
                  dataIndex: 'ordem',
                  width: 100,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item name="ordem" style={{ margin: 0 }}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    ) : (
                      record.ordem ?? 1
                    )
                },
                {
                  title: 'Chave',
                  dataIndex: 'chave',
                  width: 180,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item
                        name="chave"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Informe a chave' }]}
                      >
                        <Input maxLength={80} />
                      </Form.Item>
                    ) : (
                      <Tag color="blue">{record.chave}</Tag>
                    )
                },
                {
                  title: 'Título',
                  dataIndex: 'titulo',
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item
                        name="titulo"
                        style={{ margin: 0 }}
                        rules={[{ required: true, message: 'Informe o título' }]}
                      >
                        <Input maxLength={255} />
                      </Form.Item>
                    ) : (
                      record.titulo
                    )
                },
                {
                  title: 'Tipo',
                  dataIndex: 'tipo_input',
                  width: 160,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item name="tipo_input" style={{ margin: 0 }}>
                        <Select options={tipoInputOptions} />
                      </Form.Item>
                    ) : (
                      <Tag>{record.tipo_input ?? 'RICH_TEXT'}</Tag>
                    )
                },
                {
                  title: 'Obrigatória',
                  dataIndex: 'obrigatoria',
                  width: 120,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item name="obrigatoria" valuePropName="checked" style={{ margin: 0 }}>
                        <Switch />
                      </Form.Item>
                    ) : (
                      <Tag color={record.obrigatoria ? 'green' : 'default'}>
                        {record.obrigatoria ? 'Sim' : 'Não'}
                      </Tag>
                    )
                },
                {
                  title: 'Ativo',
                  dataIndex: 'ativo',
                  width: 100,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Form.Item name="ativo" valuePropName="checked" style={{ margin: 0 }}>
                        <Switch />
                      </Form.Item>
                    ) : (
                      <Tag color={record.ativo ? 'green' : 'default'}>
                        {record.ativo ? 'Sim' : 'Não'}
                      </Tag>
                    )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 220,
                  render: (_: unknown, record: DocumentoModeloSecao) =>
                    editandoId === record.id ? (
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          icon={<SaveOutlined />}
                          loading={salvando}
                          onClick={() => salvarEdicao(record.id)}
                        >
                          Salvar
                        </Button>
                        <Button size="small" onClick={cancelarEdicao}>
                          Cancelar
                        </Button>
                      </Space>
                    ) : (
                      <Space>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          disabled={estaEditando}
                          onClick={() => iniciarEdicao(record)}
                        >
                          Editar
                        </Button>
                        <Popconfirm
                          title="Excluir seção"
                          description="Confirmar exclusão?"
                          okText="Sim"
                          cancelText="Não"
                          onConfirm={() => removerSecao(record.id)}
                          okButtonProps={{ danger: true }}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />} disabled={estaEditando}>
                            Excluir
                          </Button>
                        </Popconfirm>
                      </Space>
                    )
                }
              ]}
            />
          </Form>
        )}
      </Card>
    </Space>
  );
}

export default DocumentoRegulatorioSecoesGrid;
