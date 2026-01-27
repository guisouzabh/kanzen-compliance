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
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type ConteudoStatus = 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO';

interface DocumentoEmpresa {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  documento_regulatorio_nome?: string;
  documento_regulatorio_sigla?: string | null;
}

interface DocumentoConteudo {
  id: number;
  documento_empresa_id: number;
  versao: number;
  status: ConteudoStatus;
  titulo_versao?: string | null;
  html: string;
  criado_em?: string;
  atualizado_em?: string;
}

type DocumentoConteudoFormValues = {
  documento_empresa_id: number;
  versao?: number;
  status?: ConteudoStatus;
  titulo_versao?: string | null;
  html: string;
};

const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'EM_REVISAO', label: 'Em revisão' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'PUBLICADO', label: 'Publicado' }
];

const statusColor: Record<ConteudoStatus, string> = {
  RASCUNHO: 'default',
  EM_REVISAO: 'blue',
  APROVADO: 'green',
  PUBLICADO: 'gold'
};

function DocumentoConteudo() {
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [documentosEmpresa, setDocumentosEmpresa] = useState<DocumentoEmpresa[]>([]);
  const [conteudos, setConteudos] = useState<DocumentoConteudo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [documentoSelecionado, setDocumentoSelecionado] = useState<number | null>(null);
  const [htmlValue, setHtmlValue] = useState('');
  const [form] = Form.useForm<DocumentoConteudoFormValues>();
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

  async function carregarConteudos(id: number) {
    const response = await api.get(`/documentos-empresa/${id}/conteudos`);
    setConteudos(response.data || []);
  }

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const lista = await carregarDocumentosEmpresa();
      const primeiroId = lista[0]?.id ?? null;
      const novoSelecionado = documentoSelecionado ?? primeiroId;
      if (novoSelecionado) {
        await carregarConteudos(novoSelecionado);
      } else {
        setConteudos([]);
      }
      setDocumentoSelecionado(novoSelecionado);
      if (showMessage) message.success('Conteúdos atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar conteúdos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!empresaSelecionada) return;
    const primeiroDaEmpresa = documentosVisiveis[0]?.id ?? null;
    if (primeiroDaEmpresa && documentoSelecionado !== primeiroDaEmpresa) {
      setDocumentoSelecionado(primeiroDaEmpresa);
    }
  }, [empresaSelecionada, documentosVisiveis, documentoSelecionado]);

  useEffect(() => {
    if (!documentoSelecionado) return;
    carregarConteudos(documentoSelecionado);
  }, [documentoSelecionado]);

  function aplicarComando(comando: string, valor?: string) {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(comando, false, valor);
    setHtmlValue(editorRef.current.innerHTML);
    form.setFieldValue('html', editorRef.current.innerHTML);
  }

  function setHtmlFromEditor(value: string) {
    setHtmlValue(value);
    form.setFieldValue('html', value);
  }

  function iniciarEdicao(conteudo: DocumentoConteudo) {
    form.setFieldsValue({
      documento_empresa_id: conteudo.documento_empresa_id,
      versao: conteudo.versao,
      status: conteudo.status,
      titulo_versao: conteudo.titulo_versao ?? null,
      html: conteudo.html
    });
    setHtmlFromEditor(conteudo.html);
    setEditandoId(conteudo.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setHtmlFromEditor('');
    setModalAberta(false);
  }

  async function handleSubmit(values: DocumentoConteudoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        ...values,
        status: values.status ?? 'RASCUNHO',
        titulo_versao: values.titulo_versao || null,
        html: htmlValue || values.html
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/documento-conteudo/${editandoId}`, payload);
        const atualizado: DocumentoConteudo = response.data;
        setConteudos((prev) => prev.map((d) => (d.id === atualizado.id ? atualizado : d)));
        message.success('Conteúdo atualizado');
      } else {
        const response = await api.post(
          `/documentos-empresa/${values.documento_empresa_id}/conteudos`,
          payload
        );
        const criado: DocumentoConteudo = response.data;
        setConteudos((prev) => [criado, ...prev]);
        message.success('Conteúdo criado');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar conteúdo');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/documento-conteudo/${id}`);
      setConteudos((prev) => prev.filter((d) => d.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Conteúdo removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir conteúdo');
    }
  }

  function handleExportPdf(conteudo: DocumentoConteudo) {
    const titulo = conteudo.titulo_versao || `Documento ${conteudo.versao}`;
    const janela = window.open('', '_blank');
    if (!janela) {
      message.error('Não foi possível abrir a janela de impressão');
      return;
    }

    const documentoEmpresa = documentosEmpresa.find((doc) => doc.id === conteudo.documento_empresa_id);
    const empresa = empresas.find((item) => item.id === documentoEmpresa?.empresa_id);
    const enderecoLinha = [
      empresa?.endereco,
      empresa?.cidade ? `${empresa.cidade}${empresa?.estado ? `/${empresa.estado}` : ''}` : null
    ]
      .filter(Boolean)
      .join(' - ');
    const cepLinha = empresa?.cep ? `CEP: ${empresa.cep}` : '';

    janela.document.write(`
      <html>
        <head>
          <title>${titulo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            .header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
            .logo { width: 96px; height: 96px; border-radius: 8px; object-fit: contain; border: 1px solid #e5e7eb; }
            .empresa-titulo { font-size: 18px; font-weight: 700; margin: 0; }
            .empresa-sub { margin: 2px 0; font-size: 12px; color: #4b5563; }
            .divider { border: 0; border-top: 1px solid #e5e7eb; margin: 12px 0 20px; }
            h1, h2, h3 { margin-top: 24px; }
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid #d9d9d9; }
            th, td { padding: 8px; text-align: left; }
            img { max-width: 100%; }
            @page { margin: 24mm; }
          </style>
        </head>
        <body>
          <div class="header">
            ${empresa?.logo_url ? `<img class="logo" src="${empresa.logo_url}" alt="Logo" />` : ''}
            <div>
              <p class="empresa-titulo">${empresa?.nome || 'Empresa'}</p>
              ${empresa?.razao_social ? `<p class="empresa-sub">Razão Social: ${empresa.razao_social}</p>` : ''}
              ${empresa?.cnpj ? `<p class="empresa-sub">CNPJ: ${empresa.cnpj}</p>` : ''}
              ${enderecoLinha ? `<p class="empresa-sub">${enderecoLinha}</p>` : ''}
              ${cepLinha ? `<p class="empresa-sub">${cepLinha}</p>` : ''}
            </div>
          </div>
          <hr class="divider" />
          ${conteudo.html}
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    janela.print();
  }

  const disableNovo = !documentosVisiveis.length;
  const documentoLabel = documentosEmpresa.find((d) => d.id === documentoSelecionado);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Documento Conteúdo
          </Typography.Title>
          <Typography.Text type="secondary">
            Crie versões em HTML para documentos da empresa.
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
                form.setFieldValue('documento_empresa_id', documentoSelecionado);
              }
              setModalAberta(true);
            }}
            disabled={disableNovo}
          >
            Nova versão
          </Button>
        </Space>
      </Flex>

      {disableNovo && !carregando ? (
        <Card>
          <Empty description="Cadastre documentos da empresa antes de criar conteúdo" />
        </Card>
      ) : (
        <Card
          title="Conteúdos por documento"
          extra={
            <Select
              style={{ minWidth: 280 }}
              placeholder="Selecione o documento"
              value={documentoSelecionado ?? undefined}
              onChange={(value) => setDocumentoSelecionado(value)}
              options={documentosVisiveis.map((doc) => ({
                value: doc.id,
                label: doc.documento_regulatorio_sigla
                  ? `${doc.documento_regulatorio_nome} (${doc.documento_regulatorio_sigla})`
                  : doc.documento_regulatorio_nome
              }))}
            />
          }
        >
          {carregando ? (
            <Skeleton active />
          ) : !documentoSelecionado ? (
            <Empty description="Selecione um documento para visualizar os conteúdos" />
          ) : conteudos.length === 0 ? (
            <Empty description="Nenhum conteúdo cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={conteudos}
              pagination={{ pageSize: 8, showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}` }}
              size="middle"
              columns={[
                {
                  title: 'Versão',
                  dataIndex: 'versao',
                  render: (value: number) => <Tag color="geekblue">v{value}</Tag>
                },
                {
                  title: 'Título',
                  dataIndex: 'titulo_versao',
                  render: (value: string | null) => value || '-'
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value: ConteudoStatus) => (
                    <Tag color={statusColor[value]}>{value}</Tag>
                  )
                },
                {
                  title: 'Documento',
                  dataIndex: 'documento_empresa_id',
                  render: () => (
                    <Space>
                      <FileTextOutlined style={{ color: '#0b5be1' }} />
                      <Typography.Text>
                        {documentoLabel?.documento_regulatorio_nome || 'Documento'}
                      </Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 260,
                  render: (_: unknown, record: DocumentoConteudo) => (
                    <Space>
                      <Button size="small" icon={<FilePdfOutlined />} onClick={() => handleExportPdf(record)}>
                        Exportar PDF
                      </Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir conteúdo"
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
              {estaEditando ? 'Edição' : 'Nova versão'}
            </Tag>
            <span>{estaEditando ? `Conteúdo #${editandoId}` : 'Criar conteúdo'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar conteúdo'}
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
          initialValues={{ status: 'RASCUNHO' }}
        >
          <Form.Item
            label="Documento da empresa"
            name="documento_empresa_id"
            rules={[{ required: true, message: 'Selecione o documento' }]}
          >
            <Select
              placeholder="Selecione o documento"
              options={documentosVisiveis.map((doc) => ({
                value: doc.id,
                label: doc.documento_regulatorio_sigla
                  ? `${doc.documento_regulatorio_nome} (${doc.documento_regulatorio_sigla})`
                  : doc.documento_regulatorio_nome
              }))}
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
            <Form.Item label="Título da versão" name="titulo_versao" style={{ minWidth: 240, flex: 2 }}>
              <Input placeholder="Ex: Versão inicial, Revisão de layout" maxLength={255} />
            </Form.Item>
          </Space>

          <Form.Item name="versao">
            <Input type="hidden" />
          </Form.Item>

          <Form.Item name="html" rules={[{ required: true, message: 'Informe o conteúdo HTML' }]}>
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
        </Form>
      </Modal>
    </Space>
  );
}

export default DocumentoConteudo;
