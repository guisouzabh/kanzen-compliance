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
  Table,
  Tag,
  Tabs,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type StatusSecao = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
type TipoInput = 'RICH_TEXT' | 'TEXT' | 'JSON';

interface DocumentoEmpresa {
  id: number;
  empresa_id: number;
  documento_regulatorio_id: number;
  documento_regulatorio_nome?: string;
  documento_regulatorio_sigla?: string | null;
}

interface DocumentoConteudo {
  id: number;
  documento_empresa_id: number;
  versao: number;
}

interface DocumentoModeloSecao {
  id: number;
  chave: string;
  titulo: string;
  descricao?: string | null;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: TipoInput;
  template_html?: string | null;
}

interface DocumentoConteudoSecao {
  id: number;
  documento_conteudo_id: number;
  modelo_secao_id: number;
  status: StatusSecao;
  conteudo_html?: string | null;
  dados_json?: string | null;
  chave?: string;
  titulo?: string;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: TipoInput;
}

type DocumentoConteudoSecaoFormValues = {
  documento_conteudo_id: number;
  modelo_secao_id: number;
  status?: StatusSecao;
  conteudo_html?: string | null;
  dados_json?: string | null;
};

const statusOptions = [
  { value: 'NAO_INICIADO', label: 'Não iniciado' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' }
];

const statusColor: Record<StatusSecao, string> = {
  NAO_INICIADO: 'default',
  EM_ANDAMENTO: 'blue',
  CONCLUIDO: 'green'
};

function DocumentosConteudoSecoes() {
  const { empresaSelecionada } = useEmpresaContext();
  const [documentosEmpresa, setDocumentosEmpresa] = useState<DocumentoEmpresa[]>([]);
  const [conteudos, setConteudos] = useState<DocumentoConteudo[]>([]);
  const [modeloSecoes, setModeloSecoes] = useState<DocumentoModeloSecao[]>([]);
  const [secoes, setSecoes] = useState<DocumentoConteudoSecao[]>([]);
  const [documentoEmpresaId, setDocumentoEmpresaId] = useState<number | null>(null);
  const [documentoConteudoId, setDocumentoConteudoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [htmlValue, setHtmlValue] = useState('');
  const [form] = Form.useForm<DocumentoConteudoSecaoFormValues>();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const documentosVisiveis = useMemo(() => {
    if (!empresaSelecionada) return documentosEmpresa;
    return documentosEmpresa.filter((doc) => doc.empresa_id === empresaSelecionada);
  }, [documentosEmpresa, empresaSelecionada]);

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarDocumentosEmpresa() {
    const response = await api.get('/documentos-empresa');
    const lista = response.data || [];
    setDocumentosEmpresa(lista);
    return lista as DocumentoEmpresa[];
  }

  async function carregarConteudos(docEmpresaId: number) {
    const response = await api.get(`/documentos-empresa/${docEmpresaId}/conteudos`);
    const lista = response.data || [];
    setConteudos(lista);
    return lista as DocumentoConteudo[];
  }

  async function carregarModeloSecoes(documentoRegulatorioId: number) {
    const response = await api.get(`/documentos-regulatorios/${documentoRegulatorioId}/modelo-secoes`);
    setModeloSecoes(response.data || []);
  }

  async function carregarSecoes(documentoConteudoIdAtual: number) {
    const response = await api.get(`/documento-conteudo/${documentoConteudoIdAtual}/secoes`);
    setSecoes(response.data || []);
  }

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const lista = await carregarDocumentosEmpresa();
      const primeiroId = lista[0]?.id ?? null;
      const novoDocumentoEmpresa = documentoEmpresaId ?? primeiroId;
      setDocumentoEmpresaId(novoDocumentoEmpresa);

      if (novoDocumentoEmpresa) {
        const conteudosLista = await carregarConteudos(novoDocumentoEmpresa);
        const primeiroConteudo = conteudosLista[0]?.id ?? null;
        setDocumentoConteudoId(primeiroConteudo);

        const docEmpresa = lista.find((doc) => doc.id === novoDocumentoEmpresa);
        if (docEmpresa?.documento_regulatorio_id) {
          await carregarModeloSecoes(docEmpresa.documento_regulatorio_id);
        } else {
          setModeloSecoes([]);
        }

        if (primeiroConteudo) {
          await carregarSecoes(primeiroConteudo);
        } else {
          setSecoes([]);
        }
      } else {
        setConteudos([]);
        setModeloSecoes([]);
        setSecoes([]);
      }

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
    if (!documentoEmpresaId) return;
    carregarConteudos(documentoEmpresaId).then((lista) => {
      const primeiro = lista[0]?.id ?? null;
      setDocumentoConteudoId(primeiro);
      if (primeiro) {
        carregarSecoes(primeiro);
      } else {
        setSecoes([]);
      }
    });

    const docEmpresa = documentosEmpresa.find((doc) => doc.id === documentoEmpresaId);
    if (docEmpresa?.documento_regulatorio_id) {
      carregarModeloSecoes(docEmpresa.documento_regulatorio_id);
    } else {
      setModeloSecoes([]);
    }
  }, [documentoEmpresaId, documentosEmpresa]);

  useEffect(() => {
    if (!documentoConteudoId) return;
    carregarSecoes(documentoConteudoId);
  }, [documentoConteudoId]);

  function aplicarComando(comando: string, valor?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(comando, false, valor);
    setHtmlFromEditor(editorRef.current.innerHTML);
  }

  function setHtmlFromEditor(value: string) {
    setHtmlValue(value);
    form.setFieldValue('conteudo_html', value);
  }

  function iniciarEdicao(secao: DocumentoConteudoSecao) {
    form.setFieldsValue({
      documento_conteudo_id: secao.documento_conteudo_id,
      modelo_secao_id: secao.modelo_secao_id,
      status: secao.status,
      conteudo_html: secao.conteudo_html ?? null,
      dados_json: secao.dados_json ?? null
    });
    setHtmlFromEditor(secao.conteudo_html ?? '');
    setEditandoId(secao.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setHtmlFromEditor('');
    setModalAberta(false);
  }

  async function handleSubmit(values: DocumentoConteudoSecaoFormValues) {
    if (!documentoConteudoId) return;
    setSalvando(true);
    try {
      const payload = {
        ...values,
        status: values.status ?? 'NAO_INICIADO',
        conteudo_html: htmlValue || values.conteudo_html || null,
        dados_json: values.dados_json || null
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/documento-conteudo-secao/${editandoId}`, payload);
        const atualizado: DocumentoConteudoSecao = response.data;
        setSecoes((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)));
        message.success('Seção atualizada');
      } else {
        const response = await api.post(
          `/documento-conteudo/${documentoConteudoId}/secoes`,
          payload
        );
        const criado: DocumentoConteudoSecao = response.data;
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
      await api.delete(`/documento-conteudo-secao/${id}`);
      setSecoes((prev) => prev.filter((s) => s.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Seção removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir seção');
    }
  }

  function handleModeloChange(modeloId: number) {
    const modelo = modeloSecoes.find((m) => m.id === modeloId);
    if (modelo?.template_html && !htmlValue) {
      setHtmlFromEditor(modelo.template_html);
    }
  }

  const documentoEmpresaSelecionado = documentosEmpresa.find((doc) => doc.id === documentoEmpresaId);
  const disableNovo = !documentoConteudoId || !modeloSecoes.length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Conteúdo por Seção
          </Typography.Title>
          <Typography.Text type="secondary">
            Preencha as seções do conteúdo do documento da empresa.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              if (documentoConteudoId) {
                form.setFieldValue('documento_conteudo_id', documentoConteudoId);
              }
              setModalAberta(true);
            }}
            disabled={disableNovo}
          >
            Nova seção
          </Button>
        </Space>
      </Flex>

      {!documentosVisiveis.length && !carregando ? (
        <Card>
          <Empty description="Cadastre documentos da empresa antes de criar seções" />
        </Card>
      ) : (
        <Card
          title="Seções do conteúdo"
          extra={
            <Space>
              <Select
                style={{ minWidth: 260 }}
                placeholder="Documento da empresa"
                value={documentoEmpresaId ?? undefined}
                onChange={(value) => setDocumentoEmpresaId(value)}
                options={documentosVisiveis.map((doc) => ({
                  value: doc.id,
                  label: doc.documento_regulatorio_sigla
                    ? `${doc.documento_regulatorio_nome} (${doc.documento_regulatorio_sigla})`
                    : doc.documento_regulatorio_nome
                }))}
              />
              <Select
                style={{ minWidth: 180 }}
                placeholder="Versão"
                value={documentoConteudoId ?? undefined}
                onChange={(value) => setDocumentoConteudoId(value)}
                options={conteudos.map((conteudo) => ({
                  value: conteudo.id,
                  label: `Versão ${conteudo.versao}`
                }))}
              />
            </Space>
          }
        >
          {carregando ? (
            <Skeleton active />
          ) : !documentoConteudoId ? (
            <Empty description="Selecione uma versão de conteúdo para visualizar as seções" />
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
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value: StatusSecao) => <Tag color={statusColor[value]}>{value}</Tag>
                },
                {
                  title: 'Obrigatória',
                  dataIndex: 'obrigatoria',
                  render: (value?: boolean) => (
                    <Tag color={value ? 'green' : 'default'}>{value ? 'Sim' : 'Não'}</Tag>
                  )
                },
                {
                  title: 'Tipo',
                  dataIndex: 'tipo_input',
                  render: (value: TipoInput) => <Tag color="blue">{value}</Tag>
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: DocumentoConteudoSecao) => (
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
        width={960}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: 'NAO_INICIADO' }}
        >
          <Form.Item name="documento_conteudo_id" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            label="Seção modelo"
            name="modelo_secao_id"
            rules={[{ required: true, message: 'Selecione a seção modelo' }]}
          >
            <Select
              placeholder="Selecione a seção"
              options={modeloSecoes.map((secao) => ({
                value: secao.id,
                label: `${secao.ordem ?? 1}. ${secao.titulo}`
              }))}
              onChange={handleModeloChange}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Selecione o status' }]}
              style={{ minWidth: 220, flex: 1 }}
            >
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item label="Documento regulatório" style={{ minWidth: 220, flex: 2 }}>
              <Input
                value={documentoEmpresaSelecionado?.documento_regulatorio_nome ?? ''}
                disabled
              />
            </Form.Item>
          </Space>

          <Form.Item name="conteudo_html">
            <Input.TextArea style={{ display: 'none' }} />
          </Form.Item>

          <Tabs
            items={[
              {
                key: 'editor',
                label: 'Editor',
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Space wrap>
                      <Button onClick={() => aplicarComando('bold')}>Negrito</Button>
                      <Button onClick={() => aplicarComando('italic')}>Itálico</Button>
                      <Button onClick={() => aplicarComando('underline')}>Sublinhado</Button>
                      <Button onClick={() => aplicarComando('insertUnorderedList')}>Lista</Button>
                      <Button onClick={() => aplicarComando('insertOrderedList')}>Numerada</Button>
                      <Button onClick={() => aplicarComando('formatBlock', 'h2')}>H2</Button>
                      <Button onClick={() => aplicarComando('formatBlock', 'h3')}>H3</Button>
                      <Button
                        onClick={() => {
                          const url = window.prompt('Informe a URL');
                          if (url) aplicarComando('createLink', url);
                        }}
                      >
                        Link
                      </Button>
                      <Button onClick={() => aplicarComando('removeFormat')}>Limpar</Button>
                    </Space>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(event) => setHtmlFromEditor((event.target as HTMLDivElement).innerHTML)}
                      style={{
                        minHeight: 240,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 12
                      }}
                      dangerouslySetInnerHTML={{ __html: htmlValue }}
                    />
                  </Space>
                )
              },
              {
                key: 'html',
                label: 'HTML',
                children: (
                  <Input.TextArea
                    rows={12}
                    value={htmlValue}
                    onChange={(event) => setHtmlFromEditor(event.target.value)}
                    placeholder="Digite o HTML aqui"
                  />
                )
              },
              {
                key: 'preview',
                label: 'Pré-visualização',
                children: (
                  <div
                    style={{
                      minHeight: 240,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      padding: 12,
                      background: '#fafafa'
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlValue || '<p>Sem conteúdo.</p>' }}
                  />
                )
              }
            ]}
          />

          <Form.Item label="Dados JSON" name="dados_json">
            <Input.TextArea rows={4} placeholder="JSON opcional para resposta estruturada" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default DocumentosConteudoSecoes;
