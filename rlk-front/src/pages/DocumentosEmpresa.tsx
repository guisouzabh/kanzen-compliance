import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
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
  Typography,
  Upload,
  message
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  UploadOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type DocumentoEmpresaStatus =
  | 'NAO_APLICAVEL'
  | 'PENDENTE'
  | 'EM_ELABORACAO'
  | 'VIGENTE'
  | 'VENCIDO';

interface DocumentoEmpresa {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  documento_regulatorio_id: number;
  documento_regulatorio_nome?: string;
  documento_regulatorio_sigla?: string | null;
  impacto?: number | null;
  status: DocumentoEmpresaStatus;
  data_emissao?: string | null;
  data_validade?: string | null;
  responsavel_area_id?: number | null;
  usuario_responsavel_id?: number | null;
  responsavel_tecnico?: string | null;
  observacoes?: string | null;
}

interface DocumentoRegulatorio {
  id: number;
  nome: string;
  sigla?: string | null;
  impacto?: number | null;
}

interface Area {
  id: number;
  nome: string;
  empresa_id: number;
}

interface Usuario {
  id: number;
  nome: string;
}

interface DocumentoArquivo {
  id: number;
  documento_empresa_id: number;
  tipo_arquivo: 'DOCUMENTO_PRINCIPAL' | 'LAUDO' | 'ANEXO' | 'COMPROVANTE' | 'OUTRO';
  nome_arquivo: string;
  caminho_arquivo: string;
  hash_arquivo?: string | null;
  versao?: string | null;
  data_upload?: string;
  url?: string;
}

interface OnlyofficeConfigResponse {
  documentServerUrl: string;
  config: Record<string, unknown>;
  token: string;
}

type DocumentoEmpresaFormValues = {
  empresa_id: number;
  documento_regulatorio_id: number;
  impacto?: number | null;
  status?: DocumentoEmpresaStatus;
  data_emissao?: Dayjs | null;
  data_validade?: Dayjs | null;
  responsavel_area_id?: number | null;
  usuario_responsavel_id?: number | null;
  responsavel_tecnico?: string | null;
  observacoes?: string | null;
};

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (placeholderId: string, config: Record<string, unknown>) => {
        destroyEditor?: () => void;
      };
    };
  }
}

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ELABORACAO', label: 'Em elaboração' },
  { value: 'VIGENTE', label: 'Vigente' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'NAO_APLICAVEL', label: 'Não aplicável' }
];

const impactoOptions = [
  { value: 5, label: '5 - Crítico' },
  { value: 4, label: '4 - Alto' },
  { value: 3, label: '3 - Importante' },
  { value: 2, label: '2 - Operacional' },
  { value: 1, label: '1 - Governança' },
  { value: 0, label: '0 - Ausente' }
];

const statusColor: Record<DocumentoEmpresaStatus, string> = {
  PENDENTE: 'gold',
  EM_ELABORACAO: 'blue',
  VIGENTE: 'green',
  VENCIDO: 'red',
  NAO_APLICAVEL: 'default'
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : '-';
}

function formatSubmitDate(value?: Dayjs | null) {
  return value ? value.format('YYYY-MM-DD') : null;
}

function getArquivoUrl(caminho: string, url?: string) {
  if (url) return url;
  if (!caminho) return '#';
  if (caminho.startsWith('http://') || caminho.startsWith('https://')) return caminho;
  const baseUrl = api.defaults.baseURL || '';
  if (!baseUrl) return caminho;
  const origin = new URL(baseUrl).origin;
  return `${origin}${caminho}`;
}

function isDocxFile(nomeArquivo: string) {
  return nomeArquivo.toLowerCase().endsWith('.docx');
}

function getApiErrorMessage(err: unknown, fallback: string) {
  const maybeAxios = err as {
    response?: {
      data?: {
        erro?: string;
      };
    };
  };
  return maybeAxios.response?.data?.erro || fallback;
}

function DocumentosEmpresa() {
  const { empresas, empresaSelecionada, carregando: carregandoEmpresas } = useEmpresaContext();
  const [documentos, setDocumentos] = useState<DocumentoEmpresa[]>([]);
  const [documentosRegulatorios, setDocumentosRegulatorios] = useState<DocumentoRegulatorio[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [modalArquivosAberta, setModalArquivosAberta] = useState(false);
  const [documentoArquivosAtual, setDocumentoArquivosAtual] = useState<DocumentoEmpresa | null>(null);
  const [arquivosDocumento, setArquivosDocumento] = useState<DocumentoArquivo[]>([]);
  const [carregandoArquivos, setCarregandoArquivos] = useState(false);
  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [fileListArquivo, setFileListArquivo] = useState<UploadFile[]>([]);

  const [modalEditorOnlyofficeAberto, setModalEditorOnlyofficeAberto] = useState(false);
  const [carregandoEditorOnlyoffice, setCarregandoEditorOnlyoffice] = useState(false);
  const [erroEditorOnlyoffice, setErroEditorOnlyoffice] = useState<string | null>(null);
  const [arquivoEmEdicao, setArquivoEmEdicao] = useState<DocumentoArquivo | null>(null);
  const [onlyofficePayload, setOnlyofficePayload] = useState<OnlyofficeConfigResponse | null>(null);
  const editorRef = useRef<{ destroyEditor?: () => void } | null>(null);
  const editorHostId = 'onlyoffice-editor-host';

  const [form] = Form.useForm<DocumentoEmpresaFormValues>();
  const empresaSelecionadaNoFormulario = Form.useWatch('empresa_id', form);
  const documentoRegIdNoFormulario = Form.useWatch('documento_regulatorio_id', form);
  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  const documentosVisiveis = useMemo(() => {
    if (!empresaSelecionada) return documentos;
    return documentos.filter((doc) => doc.empresa_id === empresaSelecionada);
  }, [documentos, empresaSelecionada]);

  const areasFiltradas = useMemo(() => {
    if (!empresaSelecionadaNoFormulario) return areas;
    return areas.filter((area) => area.empresa_id === empresaSelecionadaNoFormulario);
  }, [areas, empresaSelecionadaNoFormulario]);

  useEffect(() => {
    if (!documentoRegIdNoFormulario || estaEditando) return;
    const doc = documentosRegulatorios.find((item) => item.id === documentoRegIdNoFormulario);
    if (doc && doc.impacto !== undefined && doc.impacto !== null) {
      form.setFieldValue('impacto', doc.impacto);
    }
  }, [documentoRegIdNoFormulario, documentosRegulatorios, estaEditando, form]);

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const [documentosResp, docsRegResp, areasResp, usuariosResp] = await Promise.all([
        api.get('/documentos-empresa'),
        api.get('/documentos-regulatorios'),
        api.get('/areas'),
        api.get('/usuarios')
      ]);
      setDocumentos(documentosResp.data || []);
      setDocumentosRegulatorios(docsRegResp.data || []);
      setAreas(areasResp.data || []);
      setUsuarios(usuariosResp.data || []);
      if (showMessage) message.success('Documentos atualizados');
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao carregar documentos'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function iniciarEdicao(doc: DocumentoEmpresa) {
    form.setFieldsValue({
      empresa_id: doc.empresa_id,
      documento_regulatorio_id: doc.documento_regulatorio_id,
      impacto: doc.impacto ?? null,
      status: doc.status,
      data_emissao: doc.data_emissao ? dayjs(doc.data_emissao) : null,
      data_validade: doc.data_validade ? dayjs(doc.data_validade) : null,
      responsavel_area_id: doc.responsavel_area_id ?? null,
      usuario_responsavel_id: doc.usuario_responsavel_id ?? null,
      responsavel_tecnico: doc.responsavel_tecnico ?? null,
      observacoes: doc.observacoes ?? null
    });
    setEditandoId(doc.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function abrirModalArquivos(doc: DocumentoEmpresa) {
    try {
      setModalArquivosAberta(true);
      setDocumentoArquivosAtual(doc);
      setCarregandoArquivos(true);
      const response = await api.get(`/documentos-empresa/${doc.id}/arquivos`);
      setArquivosDocumento(response.data || []);
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao carregar arquivos do documento'));
    } finally {
      setCarregandoArquivos(false);
    }
  }

  function fecharModalArquivos() {
    setModalArquivosAberta(false);
    setDocumentoArquivosAtual(null);
    setArquivosDocumento([]);
    setFileListArquivo([]);
  }

  const validarWord = (file: RcFile) => {
    const nome = file.name.toLowerCase();
    const tipoValido = nome.endsWith('.doc') || nome.endsWith('.docx');
    if (!tipoValido) {
      message.error('Envie apenas arquivo Word (.doc ou .docx).');
      return Upload.LIST_IGNORE;
    }
    const tamanhoOk = file.size / 1024 / 1024 <= 10;
    if (!tamanhoOk) {
      message.error('O arquivo deve ter no máximo 10MB.');
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const enviarWord: UploadProps['customRequest'] = async (options) => {
    if (!documentoArquivosAtual) return;
    const { file, onError, onSuccess } = options;
    const arquivo = file as RcFile;

    if (validarWord(arquivo) === Upload.LIST_IGNORE) {
      return;
    }

    const formData = new FormData();
    formData.append('file', arquivo);

    try {
      setUploadingArquivo(true);
      const response = await api.post(
        `/documentos-empresa/${documentoArquivosAtual.id}/arquivos/upload-word`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const novoArquivo: DocumentoArquivo = response.data;
      setArquivosDocumento((prev) => [novoArquivo, ...prev]);
      setFileListArquivo([
        {
          uid: arquivo.uid,
          name: arquivo.name,
          status: 'done',
          url: getArquivoUrl(novoArquivo.caminho_arquivo, novoArquivo.url)
        }
      ]);
      message.success('Arquivo Word enviado');
      onSuccess?.(response.data, arquivo);
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao enviar arquivo Word'));
      onError?.(new Error(getApiErrorMessage(err, 'Erro ao enviar arquivo Word')));
    } finally {
      setUploadingArquivo(false);
    }
  };

  async function handleDeleteArquivo(arquivoId: number) {
    if (!documentoArquivosAtual) return;
    try {
      await api.delete(`/documentos-empresa/${documentoArquivosAtual.id}/arquivos/${arquivoId}`);
      setArquivosDocumento((prev) => prev.filter((item) => item.id !== arquivoId));
      message.success('Arquivo removido');
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao remover arquivo'));
    }
  }

  function destruirEditorOnlyoffice() {
    if (editorRef.current?.destroyEditor) {
      editorRef.current.destroyEditor();
    }
    editorRef.current = null;
    const host = document.getElementById(editorHostId);
    if (host) host.innerHTML = '';
  }

  async function carregarScriptOnlyoffice(documentServerUrl: string) {
    const scriptSrc = `${documentServerUrl.replace(/\/$/, '')}/web-apps/apps/api/documents/api.js`;
    const scriptId = `onlyoffice-docsapi-${btoa(scriptSrc).replace(/=/g, '')}`;

    if (window.DocsAPI) return;

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      await new Promise<void>((resolve, reject) => {
        if (window.DocsAPI) {
          resolve();
          return;
        }
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar script do OnlyOffice')), {
          once: true
        });
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = scriptSrc;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Falha ao carregar script do OnlyOffice'));
      document.body.appendChild(script);
    });
  }

  async function abrirEditorOnlyoffice(arquivo: DocumentoArquivo) {
    if (!documentoArquivosAtual) return;
    if (!isDocxFile(arquivo.nome_arquivo)) {
      message.warning('Edição online habilitada apenas para .docx');
      return;
    }
    try {
      setModalEditorOnlyofficeAberto(true);
      setCarregandoEditorOnlyoffice(true);
      setErroEditorOnlyoffice(null);
      setArquivoEmEdicao(arquivo);
      const response = await api.get(
        `/documentos-empresa/${documentoArquivosAtual.id}/arquivos/${arquivo.id}/onlyoffice-config`
      );
      setOnlyofficePayload(response.data);
    } catch (err: unknown) {
      setErroEditorOnlyoffice(getApiErrorMessage(err, 'Erro ao preparar editor OnlyOffice'));
      setCarregandoEditorOnlyoffice(false);
    }
  }

  function fecharEditorOnlyoffice() {
    destruirEditorOnlyoffice();
    setModalEditorOnlyofficeAberto(false);
    setOnlyofficePayload(null);
    setErroEditorOnlyoffice(null);
    setArquivoEmEdicao(null);
    setCarregandoEditorOnlyoffice(false);
  }

  useEffect(() => {
    let ativo = true;
    async function iniciarEditorOnlyoffice() {
      if (!modalEditorOnlyofficeAberto || !onlyofficePayload) return;
      const host = document.getElementById(editorHostId);
      if (!host) return;
      try {
        setCarregandoEditorOnlyoffice(true);
        setErroEditorOnlyoffice(null);
        destruirEditorOnlyoffice();
        await carregarScriptOnlyoffice(onlyofficePayload.documentServerUrl);
        if (!ativo || !window.DocsAPI) return;
        editorRef.current = new window.DocsAPI.DocEditor(editorHostId, {
          ...onlyofficePayload.config,
          token: onlyofficePayload.token
        });
      } catch (err: unknown) {
        if (!ativo) return;
        const maybeError = err as { message?: string };
        setErroEditorOnlyoffice(maybeError.message || 'Não foi possível abrir o editor');
      } finally {
        if (ativo) setCarregandoEditorOnlyoffice(false);
      }
    }
    iniciarEditorOnlyoffice();
    return () => {
      ativo = false;
    };
  }, [modalEditorOnlyofficeAberto, onlyofficePayload]);

  useEffect(() => () => destruirEditorOnlyoffice(), []);

  async function handleSubmit(values: DocumentoEmpresaFormValues) {
    setSalvando(true);
    try {
      const payload = {
        ...values,
        impacto: values.impacto ?? null,
        status: values.status ?? 'PENDENTE',
        data_emissao: formatSubmitDate(values.data_emissao),
        data_validade: formatSubmitDate(values.data_validade),
        responsavel_area_id: values.responsavel_area_id ?? null,
        usuario_responsavel_id: values.usuario_responsavel_id ?? null,
        responsavel_tecnico: values.responsavel_tecnico || null,
        observacoes: values.observacoes || null
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/documentos-empresa/${editandoId}`, payload);
        const atualizado: DocumentoEmpresa = response.data;
        setDocumentos((prev) => prev.map((doc) => (doc.id === atualizado.id ? atualizado : doc)));
        message.success('Documento atualizado');
      } else {
        const response = await api.post('/documentos-empresa', payload);
        const criado: DocumentoEmpresa = response.data;
        setDocumentos((prev) => [...prev, criado]);
        message.success('Documento criado');
      }
      resetarFormulario();
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao salvar documento'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/documentos-empresa/${id}`);
      setDocumentos((prev) => prev.filter((doc) => doc.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Documento removido');
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Erro ao excluir documento'));
    }
  }

  const disableNovo = !empresas.length || !documentosRegulatorios.length;

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
              if (empresaSelecionada) form.setFieldValue('empresa_id', empresaSelecionada);
              setModalAberta(true);
            }}
            disabled={disableNovo}
          >
            Novo documento
          </Button>
        </Space>
      </Flex>

      {disableNovo && !carregando && !carregandoEmpresas ? (
        <Card>
          <Empty description="Cadastre empresas e documentos regulatórios antes de criar documentos" />
        </Card>
      ) : (
        <Card title="Lista de documentos">
          {carregando ? (
            <Skeleton active />
          ) : documentosVisiveis.length === 0 ? (
            <Empty description="Nenhum documento cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={documentosVisiveis}
              pagination={{ pageSize: 10, showTotal: (total, range) => `${range[0]}-${range[1]} de ${total}` }}
              size="middle"
              columns={[
                {
                  title: 'Documento',
                  dataIndex: 'documento_regulatorio_nome',
                  render: (_: string, record: DocumentoEmpresa) => (
                    <Space>
                      <FileTextOutlined style={{ color: '#0b5be1' }} />
                      <div>
                        <Typography.Text strong>{record.documento_regulatorio_nome || 'Documento'}</Typography.Text>
                        {record.documento_regulatorio_sigla ? (
                          <Typography.Text type="secondary"> ({record.documento_regulatorio_sigla})</Typography.Text>
                        ) : null}
                      </div>
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: string, record: DocumentoEmpresa) => (
                    <Tag color="geekblue">
                      {record.empresa_nome || empresas.find((item) => item.id === record.empresa_id)?.nome || 'Empresa'}
                    </Tag>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value: DocumentoEmpresaStatus) => <Tag color={statusColor[value]}>{value}</Tag>
                },
                {
                  title: 'Validade',
                  dataIndex: 'data_validade',
                  render: (value?: string | null) => <Typography.Text>{formatDate(value)}</Typography.Text>
                },
                {
                  title: 'Responsável',
                  dataIndex: 'responsavel_area_id',
                  render: (_: unknown, record: DocumentoEmpresa) => {
                    const area = areas.find((item) => item.id === record.responsavel_area_id);
                    const usuario = usuarios.find((item) => item.id === record.usuario_responsavel_id);
                    return (
                      <Space direction="vertical" size={0}>
                        <Typography.Text>{area?.nome || '-'}</Typography.Text>
                        <Typography.Text type="secondary">{usuario?.nome || ''}</Typography.Text>
                      </Space>
                    );
                  }
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 300,
                  render: (_: unknown, record: DocumentoEmpresa) => (
                    <Space>
                      <Button size="small" icon={<LinkOutlined />} onClick={() => abrirModalArquivos(record)}>
                        Arquivos
                      </Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => iniciarEdicao(record)}>
                        Editar
                      </Button>
                      <Popconfirm
                        title="Excluir documento"
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
            <Tag color={estaEditando ? 'blue' : 'green'}>{estaEditando ? 'Edição' : 'Novo registro'}</Tag>
            <span>{estaEditando ? `Documento #${editandoId}` : 'Cadastrar documento'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar documento'}
        cancelText="Cancelar"
        okButtonProps={{ icon: estaEditando ? <SaveOutlined /> : <PlusOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'PENDENTE' }}>
          <Form.Item label="Empresa" name="empresa_id" rules={[{ required: true, message: 'Selecione a empresa' }]}>
            <Select
              placeholder="Selecione a empresa"
              options={empresas.map((empresa) => ({ value: empresa.id, label: empresa.nome }))}
            />
          </Form.Item>

          <Form.Item
            label="Documento regulatório"
            name="documento_regulatorio_id"
            rules={[{ required: true, message: 'Selecione o documento' }]}
          >
            <Select
              placeholder="Selecione o documento"
              showSearch
              optionFilterProp="label"
              options={documentosRegulatorios.map((doc) => ({
                value: doc.id,
                label: doc.sigla ? `${doc.nome} (${doc.sigla})` : doc.nome
              }))}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="Impacto" name="impacto" style={{ minWidth: 200, flex: 1 }}>
              <Select placeholder="Selecione o impacto" options={impactoOptions} allowClear />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Selecione o status' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item label="Responsável (área)" name="responsavel_area_id" style={{ minWidth: 240, flex: 1 }}>
              <Select
                placeholder="Selecione a área"
                allowClear
                options={areasFiltradas.map((area) => ({ value: area.id, label: area.nome }))}
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="Data de emissão" name="data_emissao" style={{ minWidth: 220, flex: 1 }}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Data de validade" name="data_validade" style={{ minWidth: 220, flex: 1 }}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item label="Responsável (usuário)" name="usuario_responsavel_id">
            <Select
              placeholder="Selecione o usuário"
              allowClear
              options={usuarios.map((usuario) => ({ value: usuario.id, label: usuario.nome }))}
            />
          </Form.Item>

          <Form.Item label="Responsável técnico" name="responsavel_tecnico">
            <Input placeholder="Nome do responsável técnico" maxLength={255} />
          </Form.Item>

          <Form.Item label="Observações" name="observacoes">
            <Input.TextArea rows={3} placeholder="Detalhes adicionais" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Arquivos do documento${documentoArquivosAtual ? ` #${documentoArquivosAtual.id}` : ''}`}
        open={modalArquivosAberta}
        onCancel={fecharModalArquivos}
        footer={null}
        width={960}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Upload
            accept=".doc,.docx"
            customRequest={enviarWord}
            fileList={fileListArquivo}
            maxCount={1}
            multiple={false}
            onRemove={() => {
              setFileListArquivo([]);
              return true;
            }}
            beforeUpload={validarWord}
            showUploadList={{ showRemoveIcon: true }}
          >
            <Button icon={<UploadOutlined />} loading={uploadingArquivo}>
              Enviar arquivo Word
            </Button>
          </Upload>

          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Permitido apenas .doc/.docx com até 10MB. Para edição online, use arquivos .docx.
          </Typography.Text>

          {carregandoArquivos ? (
            <Skeleton active />
          ) : arquivosDocumento.length === 0 ? (
            <Empty description="Nenhum arquivo enviado para este documento" />
          ) : (
            <Table
              rowKey="id"
              dataSource={arquivosDocumento}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Nome',
                  dataIndex: 'nome_arquivo',
                  render: (_: string, record: DocumentoArquivo) => (
                    <a href={getArquivoUrl(record.caminho_arquivo, record.url)} target="_blank" rel="noreferrer">
                      {record.nome_arquivo}
                    </a>
                  )
                },
                {
                  title: 'Tipo',
                  dataIndex: 'tipo_arquivo',
                  width: 170
                },
                {
                  title: 'Upload',
                  dataIndex: 'data_upload',
                  width: 160,
                  render: (value?: string) => (value ? dayjs(value).format('DD/MM/YYYY HH:mm') : '-')
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 260,
                  render: (_: unknown, record: DocumentoArquivo) => (
                    <Space>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => abrirEditorOnlyoffice(record)}
                        disabled={!isDocxFile(record.nome_arquivo)}
                      >
                        Editar online
                      </Button>
                      <Popconfirm
                        title="Remover arquivo"
                        description="Confirmar exclusão do registro?"
                        okText="Sim"
                        cancelText="Não"
                        onConfirm={() => handleDeleteArquivo(record.id)}
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
        </Space>
      </Modal>

      <Modal
        title={`Editar no OnlyOffice${arquivoEmEdicao ? ` - ${arquivoEmEdicao.nome_arquivo}` : ''}`}
        open={modalEditorOnlyofficeAberto}
        onCancel={fecharEditorOnlyoffice}
        footer={null}
        width="95vw"
        destroyOnClose
      >
        {erroEditorOnlyoffice ? (
          <Empty description={erroEditorOnlyoffice} />
        ) : (
          <div style={{ minHeight: '75vh', position: 'relative' }}>
            {carregandoEditorOnlyoffice ? (
              <Flex
                align="center"
                justify="center"
                style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', zIndex: 10 }}
              >
                <Typography.Text>Carregando editor...</Typography.Text>
              </Flex>
            ) : null}
            <div id={editorHostId} style={{ height: '75vh', width: '100%' }} />
          </div>
        )}
      </Modal>
    </Space>
  );
}

export default DocumentosEmpresa;
