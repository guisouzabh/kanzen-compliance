import { useEffect, useMemo, useRef, useState } from 'react';
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
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../services/api';

interface DocumentoRegulatorio {
  id: number;
  nome: string;
}

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
  schema_json?: string | null;
  template_html?: string | null;
  ativo?: boolean;
  links?: { titulo: string; url: string }[];
}

type DocumentoModeloFormValues = Omit<DocumentoModeloSecao, 'id'>;

const tipoInputOptions = [
  { value: 'RICH_TEXT', label: 'Rich text' },
  { value: 'TEXT', label: 'Texto' },
  { value: 'JSON', label: 'JSON' }
];

function DocumentosModeloSecoes() {
  const [documentos, setDocumentos] = useState<DocumentoRegulatorio[]>([]);
  const [secoes, setSecoes] = useState<DocumentoModeloSecao[]>([]);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<DocumentoModeloFormValues>();
  const templateEditorRef = useRef<HTMLDivElement | null>(null);
  const [templateHtmlValue, setTemplateHtmlValue] = useState('');
  const [links, setLinks] = useState<{ titulo: string; url: string }[]>([]);

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarDocumentos() {
    const response = await api.get('/documentos-regulatorios');
    const lista = response.data || [];
    setDocumentos(lista);
    return lista as DocumentoRegulatorio[];
  }

  async function carregarSecoes(documentoId: number) {
    const response = await api.get(`/documentos-regulatorios/${documentoId}/modelo-secoes`);
    setSecoes(response.data || []);
  }

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const lista = await carregarDocumentos();
      const primeiroId = lista[0]?.id ?? null;
      const novoSelecionado = documentoSelecionado ?? primeiroId;
      if (novoSelecionado) {
        await carregarSecoes(novoSelecionado);
      } else {
        setSecoes([]);
      }
      setDocumentoSelecionado(novoSelecionado);
      if (showMessage) message.success('Seções atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar seções');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (documentoSelecionado) {
      carregarSecoes(documentoSelecionado);
    }
  }, [documentoSelecionado]);

  useEffect(() => {
    if (modalAberta && templateEditorRef.current) {
      templateEditorRef.current.innerHTML = templateHtmlValue || '';
    }
  }, [modalAberta, templateHtmlValue]);

  function iniciarEdicao(secao: DocumentoModeloSecao) {
    form.setFieldsValue({
      documento_regulatorio_id: secao.documento_regulatorio_id,
      chave: secao.chave,
      titulo: secao.titulo,
      descricao: secao.descricao ?? null,
      ordem: secao.ordem ?? 1,
      obrigatoria: secao.obrigatoria ?? true,
      tipo_input: secao.tipo_input ?? 'RICH_TEXT',
      schema_json: secao.schema_json ?? null,
      template_html: secao.template_html ?? null,
      ativo: secao.ativo ?? true
    });
    setTemplateHtmlValue(secao.template_html ?? '');
    setLinks(secao.links || []);
    if (templateEditorRef.current) {
      templateEditorRef.current.innerHTML = secao.template_html ?? '';
    }
    setEditandoId(secao.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setTemplateHtmlValue('');
    setLinks([]);
    if (templateEditorRef.current) {
      templateEditorRef.current.innerHTML = '';
    }
    setModalAberta(false);
  }

  async function handleSubmit(values: DocumentoModeloFormValues) {
    if (!documentoSelecionado) return;
    setSalvando(true);
    try {
      const payload = {
        ...values,
        descricao: values.descricao || null,
        schema_json: values.schema_json || null,
        template_html: templateHtmlValue || null,
        obrigatoria: values.obrigatoria ?? true,
        tipo_input: values.tipo_input ?? 'RICH_TEXT',
        ativo: values.ativo ?? true,
        ordem: values.ordem ?? 1,
        links
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/documento-modelo-secao/${editandoId}`, payload);
        const atualizado: DocumentoModeloSecao = response.data;
        setSecoes((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)));
        message.success('Seção atualizada');
      } else {
        const response = await api.post(
          `/documentos-regulatorios/${documentoSelecionado}/modelo-secoes`,
          payload
        );
        const criado: DocumentoModeloSecao = response.data;
        setSecoes((prev) => [...prev, criado]);
        message.success('Seção criada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar seção');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/documento-modelo-secao/${id}`);
      setSecoes((prev) => prev.filter((s) => s.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Seção removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir seção');
    }
  }

  function setTemplateHtmlFromEditor(value: string) {
    setTemplateHtmlValue(value);
    form.setFieldValue('template_html', value);
  }

  function aplicarComando(comando: string, valor?: string) {
    if (!templateEditorRef.current) return;
    templateEditorRef.current.focus();
    document.execCommand(comando, false, valor);
    setTemplateHtmlFromEditor(templateEditorRef.current.innerHTML);
  }

  const disableNovo = !documentos.length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Modelo de Seções
          </Typography.Title>
          <Typography.Text type="secondary">
            Defina seções base para cada documento regulatório.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              if (documentoSelecionado) {
                form.setFieldValue('documento_regulatorio_id', documentoSelecionado);
              }
              setModalAberta(true);
            }}
            disabled={disableNovo}
          >
            Nova seção
          </Button>
        </Space>
      </Flex>

      {disableNovo && !carregando ? (
        <Card>
          <Empty description="Cadastre documentos regulatórios antes de criar seções" />
        </Card>
      ) : (
        <Card
          title="Seções do documento"
          extra={
            <Select
              style={{ minWidth: 280 }}
              placeholder="Selecione o documento"
              value={documentoSelecionado ?? undefined}
              onChange={(value) => setDocumentoSelecionado(value)}
              options={documentos.map((doc) => ({ value: doc.id, label: doc.nome }))}
            />
          }
        >
          {carregando ? (
            <Skeleton active />
          ) : !documentoSelecionado ? (
            <Empty description="Selecione um documento para visualizar as seções" />
          ) : secoes.length === 0 ? (
            <Empty description="Nenhuma seção cadastrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={secoes}
              pagination={{ pageSize: 10, showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}` }}
              size="middle"
              columns={[
                { title: 'Ordem', dataIndex: 'ordem', width: 90 },
                { title: 'Título', dataIndex: 'titulo' },
                { title: 'Chave', dataIndex: 'chave', width: 160 },
                {
                  title: 'Tipo',
                  dataIndex: 'tipo_input',
                  render: (value: TipoInput) => <Tag color="blue">{value}</Tag>
                },
                {
                  title: 'Obrigatória',
                  dataIndex: 'obrigatoria',
                  render: (value?: boolean) => (
                    <Tag color={value ? 'green' : 'default'}>{value ? 'Sim' : 'Não'}</Tag>
                  )
                },
                {
                  title: 'Ativa',
                  dataIndex: 'ativo',
                  render: (value?: boolean) => (
                    <Tag color={value ? 'green' : 'default'}>{value ? 'Ativa' : 'Inativa'}</Tag>
                  )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: DocumentoModeloSecao) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir seção"
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
            <span>{estaEditando ? `Seção #${editandoId}` : 'Cadastrar seção'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar seção'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
        width={720}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ tipo_input: 'RICH_TEXT', obrigatoria: true, ativo: true, ordem: 1 }}
        >
          <Form.Item
            label="Documento regulatório"
            name="documento_regulatorio_id"
            rules={[{ required: true, message: 'Selecione o documento' }]}
          >
            <Select
              placeholder="Selecione o documento"
              options={documentos.map((doc) => ({ value: doc.id, label: doc.nome }))}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Chave"
              name="chave"
              rules={[{ required: true, message: 'Informe a chave' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Input placeholder="ex: controlador" maxLength={80} />
            </Form.Item>
            <Form.Item
              label="Ordem"
              name="ordem"
              rules={[{ required: true, message: 'Informe a ordem' }]}
              style={{ minWidth: 120 }}
            >
              <Input type="number" min={1} />
            </Form.Item>
          </Space>

          <Form.Item
            label="Título"
            name="titulo"
            rules={[{ required: true, message: 'Informe o título' }]}
          >
            <Input placeholder="Título da seção" maxLength={255} />
          </Form.Item>

          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={3} placeholder="Instruções para o usuário" />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Tipo de input"
              name="tipo_input"
              rules={[{ required: true, message: 'Selecione o tipo' }]}
              style={{ minWidth: 220 }}
            >
              <Select options={tipoInputOptions} />
            </Form.Item>
            <Form.Item label="Obrigatória" name="obrigatoria" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Ativa" name="ativo" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          <Form.Item label="Schema JSON" name="schema_json">
            <Input.TextArea rows={4} placeholder="JSON opcional do wizard" />
          </Form.Item>

          <Form.Item label="Template HTML" name="template_html">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Button size="small" onClick={() => aplicarComando('bold')}>Negrito</Button>
                <Button size="small" onClick={() => aplicarComando('italic')}>Itálico</Button>
                <Button size="small" onClick={() => aplicarComando('insertUnorderedList')}>Lista</Button>
                <Button size="small" onClick={() => aplicarComando('insertOrderedList')}>Lista num</Button>
                <Button size="small" onClick={() => aplicarComando('formatBlock', 'H3')}>H3</Button>
                <Button size="small" onClick={() => aplicarComando('formatBlock', 'P')}>Parágrafo</Button>
              </Space>
              <div
                ref={templateEditorRef}
                contentEditable
                onInput={(e) => setTemplateHtmlFromEditor((e.target as HTMLDivElement).innerHTML)}
                style={{
                  minHeight: 180,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: 12,
                  background: '#fff'
                }}
                suppressContentEditableWarning
              />
            </Space>
          </Form.Item>

          <Form.Item label="Links úteis">
            <Space direction="vertical" style={{ width: '100%', gap: 12 }}>
              {links.map((link, idx) => (
                <Flex key={idx} gap={8} align="center" wrap>
                  <Input
                    placeholder="Título"
                    value={link.titulo}
                    onChange={(e) => {
                      const novo = [...links];
                      novo[idx] = { ...novo[idx], titulo: e.target.value };
                      setLinks(novo);
                    }}
                    style={{ minWidth: 200 }}
                  />
                  <Input
                    placeholder="Endereço (URL)"
                    value={link.url}
                    onChange={(e) => {
                      const novo = [...links];
                      novo[idx] = { ...novo[idx], url: e.target.value };
                      setLinks(novo);
                    }}
                    style={{ minWidth: 260 }}
                  />
                  <Button danger size="small" onClick={() => setLinks(links.filter((_, i) => i !== idx))}>
                    Remover
                  </Button>
                </Flex>
              ))}
              <Button size="small" type="dashed" onClick={() => setLinks([...links, { titulo: '', url: '' }])}>
                Adicionar link
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default DocumentosModeloSecoes;
