import { useEffect, useMemo, useState } from 'react';
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
  message
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
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
    const doc = documentosRegulatorios.find((d) => d.id === documentoRegIdNoFormulario);
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
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar documentos');
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
        setDocumentos((prev) => prev.map((d) => (d.id === atualizado.id ? atualizado : d)));
        message.success('Documento atualizado');
      } else {
        const response = await api.post('/documentos-empresa', payload);
        const criado: DocumentoEmpresa = response.data;
        setDocumentos((prev) => [...prev, criado]);
        message.success('Documento criado');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar documento');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/documentos-empresa/${id}`);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Documento removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir documento');
    }
  }

  const disableNovo = !empresas.length || !documentosRegulatorios.length;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Documentos da Empresa
          </Typography.Title>
          <Typography.Text type="secondary">
            Vincule documentos regulatórios às empresas e acompanhe status e validade.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              if (empresaSelecionada) {
                form.setFieldValue('empresa_id', empresaSelecionada);
              }
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
                        <Typography.Text strong>
                          {record.documento_regulatorio_nome || 'Documento'}
                        </Typography.Text>
                        {record.documento_regulatorio_sigla ? (
                          <Typography.Text type="secondary">
                            {' '}
                            ({record.documento_regulatorio_sigla})
                          </Typography.Text>
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
                      {record.empresa_nome ||
                        empresas.find((e) => e.id === record.empresa_id)?.nome ||
                        'Empresa'}
                    </Tag>
                  )
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value: DocumentoEmpresaStatus) => (
                    <Tag color={statusColor[value]}>{value}</Tag>
                  )
                },
                {
                  title: 'Validade',
                  dataIndex: 'data_validade',
                  render: (value?: string | null) => (
                    <Typography.Text>{formatDate(value)}</Typography.Text>
                  )
                },
                {
                  title: 'Responsável',
                  dataIndex: 'responsavel_area_id',
                  render: (_: unknown, record: DocumentoEmpresa) => {
                    const area = areas.find((a) => a.id === record.responsavel_area_id);
                    const usuario = usuarios.find((u) => u.id === record.usuario_responsavel_id);
                    return (
                      <Space direction="vertical" size={0}>
                        <Typography.Text>{area?.nome || '-'}</Typography.Text>
                        <Typography.Text type="secondary">
                          {usuario?.nome || ''}
                        </Typography.Text>
                      </Space>
                    );
                  }
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: DocumentoEmpresa) => (
                    <Space>
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
            <Tag color={estaEditando ? 'blue' : 'green'}>
              {estaEditando ? 'Edição' : 'Novo registro'}
            </Tag>
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
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'PENDENTE'
          }}
        >
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
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
            <Form.Item
              label="Impacto"
              name="impacto"
              style={{ minWidth: 200, flex: 1 }}
              rules={[{ required: false }]}
            >
              <Select
                placeholder="Selecione o impacto"
                options={impactoOptions}
                allowClear
              />
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
    </Space>
  );
}

export default DocumentosEmpresa;
