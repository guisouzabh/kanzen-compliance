import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  Segmented,
  Select,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type SecaoStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
type TipoInput = 'RICH_TEXT' | 'TEXT' | 'JSON';

interface DocumentoEmpresa {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  documento_regulatorio_id: number;
  documento_regulatorio_nome?: string;
  documento_regulatorio_sigla?: string | null;
}

interface DocumentoConteudo {
  id: number;
  documento_empresa_id: number;
  versao: number;
  status: 'RASCUNHO' | 'EM_REVISAO' | 'APROVADO' | 'PUBLICADO';
  titulo_versao?: string | null;
  html: string;
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
  links?: { titulo: string; url: string }[];
}

interface DocumentoConteudoSecao {
  id: number;
  documento_conteudo_id: number;
  modelo_secao_id: number;
  status: SecaoStatus;
  conteudo_html?: string | null;
  dados_json?: string | null;
  chave?: string;
  titulo?: string;
  ordem?: number;
  obrigatoria?: boolean;
  tipo_input?: TipoInput;
}

type SecaoFormValues = {
  status?: SecaoStatus;
  conteudo_html?: string | null;
  dados_json?: string | null;
};

const statusOptions = [
  { value: 'NAO_INICIADO', label: 'Não iniciado' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  { value: 'CONCLUIDO', label: 'Concluído' }
];

const statusColor: Record<SecaoStatus, string> = {
  NAO_INICIADO: 'default',
  EM_ANDAMENTO: 'blue',
  CONCLUIDO: 'green'
};

function AssistenteSecoes() {
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [documentosEmpresa, setDocumentosEmpresa] = useState<DocumentoEmpresa[]>([]);
  const [conteudos, setConteudos] = useState<DocumentoConteudo[]>([]);
  const [modeloSecoes, setModeloSecoes] = useState<DocumentoModeloSecao[]>([]);
  const [secoes, setSecoes] = useState<DocumentoConteudoSecao[]>([]);
  const [documentoEmpresaId, setDocumentoEmpresaId] = useState<number | null>(null);
  const [documentoConteudoId, setDocumentoConteudoId] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm<SecaoFormValues>();

  const documentosVisiveis = useMemo(() => {
    if (!empresaSelecionada) return documentosEmpresa;
    return documentosEmpresa.filter((doc) => doc.empresa_id === empresaSelecionada);
  }, [documentosEmpresa, empresaSelecionada]);

  const secaoModeloAtual = modeloSecoes[activeStep];
  const secaoSalvaAtual = useMemo(() => {
    if (!secaoModeloAtual) return undefined;
    return secoes.find((s) => s.modelo_secao_id === secaoModeloAtual.id);
  }, [secoes, secaoModeloAtual]);

  async function carregarDocumentosEmpresa() {
    const resp = await api.get('/documentos-empresa');
    const lista = resp.data || [];
    setDocumentosEmpresa(lista);
    return lista as DocumentoEmpresa[];
  }

  async function carregarConteudos(id: number) {
    const resp = await api.get(`/documentos-empresa/${id}/conteudos`);
    const lista = resp.data || [];
    setConteudos(lista);
    return lista as DocumentoConteudo[];
  }

  async function carregarModeloSecoes(documentoRegulatorioId: number) {
    const resp = await api.get(`/documentos-regulatorios/${documentoRegulatorioId}/modelo-secoes`);
    setModeloSecoes(resp.data || []);
  }

  async function carregarSecoes(docConteudoId: number) {
    const resp = await api.get(`/documento-conteudo/${docConteudoId}/secoes`);
    setSecoes(resp.data || []);
  }

  async function criarConteudoBasico(docEmpresaId: number) {
    const payload = {
      status: 'RASCUNHO',
      titulo_versao: 'Assistente',
      html: ' '
    };
    const resp = await api.post(`/documentos-empresa/${docEmpresaId}/conteudos`, payload);
    return resp.data as DocumentoConteudo;
  }

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const listaDocs = await carregarDocumentosEmpresa();
      const primeiroId = listaDocs[0]?.id ?? null;
      const docSelecionado = documentoEmpresaId ?? primeiroId;
      setDocumentoEmpresaId(docSelecionado);

      if (docSelecionado) {
        const conteudosLista = await carregarConteudos(docSelecionado);
        let conteudoAtual = conteudosLista[0];
        if (!conteudoAtual) {
          conteudoAtual = await criarConteudoBasico(docSelecionado);
          setConteudos([conteudoAtual]);
        }
        setDocumentoConteudoId(conteudoAtual.id);

        const docEmpresa = listaDocs.find((d) => d.id === docSelecionado);
        if (docEmpresa?.documento_regulatorio_id) {
          await carregarModeloSecoes(docEmpresa.documento_regulatorio_id);
        } else {
          setModeloSecoes([]);
        }

        await carregarSecoes(conteudoAtual.id);
      } else {
        setModeloSecoes([]);
        setSecoes([]);
        setDocumentoConteudoId(null);
      }

      setActiveStep(0);
      if (showMessage) message.success('Dados atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar assistente');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!documentoEmpresaId) return;
    carregarConteudos(documentoEmpresaId).then(async (lista) => {
      let conteudo = lista[0];
      if (!conteudo) {
        conteudo = await criarConteudoBasico(documentoEmpresaId);
        setConteudos([conteudo]);
      }
      setDocumentoConteudoId(conteudo.id);
      const docEmpresa = documentosEmpresa.find((d) => d.id === documentoEmpresaId);
      if (docEmpresa?.documento_regulatorio_id) {
        await carregarModeloSecoes(docEmpresa.documento_regulatorio_id);
      } else {
        setModeloSecoes([]);
      }
      await carregarSecoes(conteudo.id);
      setActiveStep(0);
    });
  }, [documentoEmpresaId, documentosEmpresa]);

  useEffect(() => {
    if (!secaoModeloAtual) return;
    const template = secaoModeloAtual.template_html ?? '';
    const isJson = secaoModeloAtual.tipo_input === 'JSON';
    const conteudoInicial = secaoSalvaAtual?.conteudo_html ?? (isJson ? '' : template);
    const jsonInicial = secaoSalvaAtual?.dados_json ?? (isJson ? template : '');

    form.setFieldsValue({
      status: secaoSalvaAtual?.status ?? 'NAO_INICIADO',
      conteudo_html: conteudoInicial,
      dados_json: jsonInicial
    });
  }, [secaoModeloAtual, secaoSalvaAtual, form]);

  const podeAvancar = activeStep < modeloSecoes.length - 1;
  const podeVoltar = activeStep > 0;

  async function salvarSecao(proximoStatus?: SecaoStatus) {
    if (!documentoConteudoId || !secaoModeloAtual) return;
    const values = await form.validateFields();

    const payload = {
      documento_conteudo_id: documentoConteudoId,
      modelo_secao_id: secaoModeloAtual.id,
      status: values.status ?? 'EM_ANDAMENTO',
      conteudo_html:
        secaoModeloAtual.tipo_input === 'JSON'
          ? null
          : (values.conteudo_html && values.conteudo_html.trim()) ||
            secaoModeloAtual.template_html ||
            null,
      dados_json:
        secaoModeloAtual.tipo_input === 'JSON'
          ? (values.dados_json && values.dados_json.trim()) || secaoModeloAtual.template_html || null
          : null
    };

    setSalvando(true);
    try {
      if (secaoSalvaAtual) {
        const resp = await api.put(`/documento-conteudo-secao/${secaoSalvaAtual.id}`, payload);
        const atualizado: DocumentoConteudoSecao = resp.data;
        setSecoes((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)));
      } else {
        const resp = await api.post(`/documento-conteudo/${documentoConteudoId}/secoes`, payload);
        const criado: DocumentoConteudoSecao = resp.data;
        setSecoes((prev) => [...prev, criado]);
      }
      if (proximoStatus === 'CONCLUIDO') {
        form.setFieldValue('status', 'CONCLUIDO');
      }
      message.success('Seção salva');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar seção');
      throw err;
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEAvancar(concluir = false) {
    const statusDesejado: SecaoStatus | undefined = concluir ? 'CONCLUIDO' : undefined;
    await salvarSecao(statusDesejado);
    if (podeAvancar) {
      setActiveStep((prev) => prev + 1);
    }
  }

  const dadosCarregados = !!documentosEmpresa.length && !!modeloSecoes.length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
        </Space>
      </Flex>

      <Card>
        <Flex gap={16} wrap="wrap">
          <div style={{ minWidth: 260 }}>
            <Typography.Text strong>Documento da empresa</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder="Selecione"
              value={documentoEmpresaId ?? undefined}
              onChange={setDocumentoEmpresaId}
              options={documentosVisiveis.map((doc) => ({
                value: doc.id,
                label: doc.documento_regulatorio_sigla
                  ? `${doc.documento_regulatorio_sigla} • ${doc.empresa_nome ?? 'Empresa'}`
                  : `${doc.documento_regulatorio_nome ?? 'Documento'} • ${doc.empresa_nome ?? ''}`
              }))}
              loading={carregando}
            />
          </div>

          <div style={{ minWidth: 220 }}>
            <Typography.Text strong>Versão do conteúdo</Typography.Text>
            <Segmented
              style={{ marginTop: 8 }}
              value={documentoConteudoId ?? undefined}
              onChange={(id) => setDocumentoConteudoId(Number(id))}
              options={conteudos.map((c) => ({
                label: `v${c.versao}`,
                value: c.id
              }))}
            />
          </div>
        </Flex>
      </Card>

      {carregando ? (
        <Card>
          <Skeleton active />
        </Card>
      ) : !dadosCarregados ? (
        <Empty description="Selecione um documento para começar" />
      ) : (
        <Card>
          <Steps
            current={activeStep}
            onChange={setActiveStep}
            items={modeloSecoes.map((secao) => ({
              title: secao.titulo,
              description: secao.obrigatoria ? 'Obrigatória' : 'Opcional',
              status:
                secoes.find((s) => s.modelo_secao_id === secao.id)?.status === 'CONCLUIDO'
                  ? 'finish'
                  : undefined
            }))}
            style={{ marginBottom: 24 }}
          />

          {secaoModeloAtual ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Flex justify="space-between" align="center">
                <div>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {secaoModeloAtual.titulo}
                  </Typography.Title>
                  {secaoModeloAtual.descricao && (
                    <Typography.Text type="secondary">{secaoModeloAtual.descricao}</Typography.Text>
                  )}
                </div>
                <Tag color={statusColor[secaoSalvaAtual?.status ?? 'NAO_INICIADO']}>
                  {statusOptions.find((s) => s.value === (secaoSalvaAtual?.status ?? 'NAO_INICIADO'))?.label}
                </Tag>
              </Flex>

              {secaoModeloAtual.obrigatoria && (
                <Alert
                  type="info"
                  message="Esta seção é obrigatória para concluir o documento."
                  showIcon
                />
              )}

              {!!secaoModeloAtual.links?.length && (
                <Card size="small" title="Links úteis">
                  <Space direction="vertical">
                    {secaoModeloAtual.links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noreferrer">
                        {link.titulo}
                      </a>
                    ))}
                  </Space>
                </Card>
              )}

              <Form
                layout="vertical"
                form={form}
                initialValues={{ status: 'NAO_INICIADO', conteudo_html: '', dados_json: '' }}
              >
                <Form.Item
                  label="Status da seção"
                  name="status"
                  rules={[{ required: true, message: 'Selecione o status' }]}
                  style={{ maxWidth: 260 }}
                >
                  <Select options={statusOptions} />
                </Form.Item>

                {secaoModeloAtual.tipo_input === 'JSON' ? (
                  <Form.Item
                    label="Dados (JSON)"
                    name="dados_json"
                    rules={[{ required: secaoModeloAtual.obrigatoria, message: 'Informe o JSON' }]}
                  >
                    <Input.TextArea
                      rows={10}
                      placeholder='Ex: {"campo":"valor"}'
                      autoSize={{ minRows: 8, maxRows: 16 }}
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    label="Conteúdo"
                    name="conteudo_html"
                    rules={[
                      {
                        required: secaoModeloAtual.obrigatoria,
                        message: 'Preencha o conteúdo da seção'
                      }
                    ]}
                  >
                    <Input.TextArea
                      rows={12}
                      placeholder={
                        secaoModeloAtual.tipo_input === 'TEXT'
                          ? 'Texto simples'
                          : 'Rich text (HTML permitido)'
                      }
                    />
                  </Form.Item>
                )}
              </Form>

              <Flex justify="space-between">
                <Space>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    disabled={!podeVoltar}
                    onClick={() => setActiveStep((prev) => prev - 1)}
                  >
                    Voltar
                  </Button>
                </Space>
                <Space>
                  <Button
                    icon={<SaveOutlined />}
                    loading={salvando}
                    onClick={() => salvarSecao()}
                  >
                    Salvar
                  </Button>
                  <Button
                    type="primary"
                    icon={podeAvancar ? <ArrowRightOutlined /> : <CheckOutlined />}
                    loading={salvando}
                    onClick={() => salvarEAvancar(!podeAvancar)}
                  >
                    {podeAvancar ? 'Salvar e avançar' : 'Concluir seção'}
                  </Button>
                </Space>
              </Flex>
            </Space>
          ) : (
            <Empty description="Nenhuma seção disponível" />
          )}
        </Card>
      )}
    </Space>
  );
}

export default AssistenteSecoes;
