import { useEffect, useMemo, useState } from 'react';
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
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import api from '../services/api';

interface Classificacao {
  id: number;
  nome: string;
}

type Obrigatoriedade = 'OBRIGATORIO' | 'CONDICIONAL';

type Periodicidade = 'UNICO' | 'ANUAL' | 'BIENAL' | 'TRIENAL' | 'QUINQUENAL' | 'EVENTUAL';

interface DocumentoRegulatorio {
  id: number;
  classificacao_id: number;
  classificacao_nome?: string;
  nome: string;
  sigla?: string | null;
  descricao: string;
  base_legal?: string | null;
  orgao_emissor?: string | null;
  obrigatoriedade: Obrigatoriedade;
  periodicidade: Periodicidade;
  exige_responsavel_tecnico?: boolean;
  exige_assinatura?: boolean;
  exige_validade?: boolean;
  ativo?: boolean;
}

type DocumentoFormValues = Omit<DocumentoRegulatorio, 'id' | 'classificacao_nome'>;

const obrigatoriedadeOptions = [
  { value: 'OBRIGATORIO', label: 'Obrigatório' },
  { value: 'CONDICIONAL', label: 'Condicional' }
];

const periodicidadeOptions = [
  { value: 'UNICO', label: 'Único' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'BIENAL', label: 'Bienal' },
  { value: 'TRIENAL', label: 'Trienal' },
  { value: 'QUINQUENAL', label: 'Quinquenal' },
  { value: 'EVENTUAL', label: 'Eventual' }
];

function DocumentosRegulatorios() {
  const [documentos, setDocumentos] = useState<DocumentoRegulatorio[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<DocumentoFormValues>();

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  async function carregarClassificacoes() {
    const response = await api.get('/classificacoes');
    setClassificacoes(response.data || []);
  }

  async function carregarDocumentos(showMessage = false) {
    try {
      setCarregando(true);
      await carregarClassificacoes();
      const response = await api.get('/documentos-regulatorios');
      setDocumentos(response.data || []);
      if (showMessage) message.success('Documentos atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar documentos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDocumentos();
  }, []);

  function iniciarEdicao(doc: DocumentoRegulatorio) {
    form.setFieldsValue({
      classificacao_id: doc.classificacao_id,
      nome: doc.nome,
      sigla: doc.sigla ?? undefined,
      descricao: doc.descricao,
      base_legal: doc.base_legal ?? undefined,
      orgao_emissor: doc.orgao_emissor ?? undefined,
      obrigatoriedade: doc.obrigatoriedade,
      periodicidade: doc.periodicidade,
      exige_responsavel_tecnico: doc.exige_responsavel_tecnico ?? false,
      exige_assinatura: doc.exige_assinatura ?? false,
      exige_validade: doc.exige_validade ?? true,
      ativo: doc.ativo ?? true
    });
    setEditandoId(doc.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: DocumentoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        ...values,
        sigla: values.sigla || null,
        base_legal: values.base_legal || null,
        orgao_emissor: values.orgao_emissor || null,
        exige_responsavel_tecnico: values.exige_responsavel_tecnico ?? false,
        exige_assinatura: values.exige_assinatura ?? false,
        exige_validade: values.exige_validade ?? true,
        ativo: values.ativo ?? true
      };

      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/documentos-regulatorios/${editandoId}`, payload);
        const atualizado: DocumentoRegulatorio = response.data;
        setDocumentos((prev) => prev.map((d) => (d.id === atualizado.id ? atualizado : d)));
        message.success('Documento atualizado');
      } else {
        const response = await api.post('/documentos-regulatorios', payload);
        const criado: DocumentoRegulatorio = response.data;
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
      await api.delete(`/documentos-regulatorios/${id}`);
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Documento removido');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir documento');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Documentos Regulatórios
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre documentos regulatórios por classificação, periodicidade e obrigatoriedade.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDocumentos(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
            disabled={!classificacoes.length}
          >
            Novo documento
          </Button>
        </Space>
      </Flex>

      {!classificacoes.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma classificação antes de criar documentos" />
        </Card>
      ) : (
        <Card title="Lista de documentos">
          {carregando ? (
            <Skeleton active />
          ) : documentos.length === 0 ? (
            <Empty description="Nenhum documento cadastrado" />
          ) : (
            <Table
              rowKey="id"
              dataSource={documentos}
              pagination={{ pageSize: 10 }}
              size="middle"
              columns={[
                {
                  title: 'Nome',
                  dataIndex: 'nome',
                  render: (value: string, record: DocumentoRegulatorio) => (
                    <Space>
                      <FileTextOutlined style={{ color: '#0b5be1' }} />
                      <div>
                        <Typography.Text strong>{value}</Typography.Text>
                        {record.sigla ? (
                          <Typography.Text type="secondary"> ({record.sigla})</Typography.Text>
                        ) : null}
                      </div>
                    </Space>
                  )
                },
                {
                  title: 'Classificação',
                  dataIndex: 'classificacao_nome',
                  render: (_: unknown, record: DocumentoRegulatorio) => (
                    <Tag color="geekblue">
                      {record.classificacao_nome ||
                        classificacoes.find((c) => c.id === record.classificacao_id)?.nome ||
                        'Classificação'}
                    </Tag>
                  )
                },
                {
                  title: 'Obrigatoriedade',
                  dataIndex: 'obrigatoriedade',
                  render: (value: Obrigatoriedade) => (
                    <Tag color={value === 'OBRIGATORIO' ? 'red' : 'gold'}>{value}</Tag>
                  )
                },
                {
                  title: 'Periodicidade',
                  dataIndex: 'periodicidade',
                  render: (value: Periodicidade) => <Tag color="blue">{value}</Tag>
                },
                {
                  title: 'Ativo',
                  dataIndex: 'ativo',
                  render: (value?: boolean) => (
                    <Tag color={value ? 'green' : 'default'}>{value ? 'Ativo' : 'Inativo'}</Tag>
                  )
                },
                {
                  title: 'Ações',
                  dataIndex: 'acoes',
                  width: 180,
                  render: (_: unknown, record: DocumentoRegulatorio) => (
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
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
          obrigatoriedade: 'OBRIGATORIO',
          periodicidade: 'ANUAL',
          exige_responsavel_tecnico: false,
          exige_assinatura: false,
          exige_validade: true,
          ativo: true
        }}>
          <Form.Item
            label="Classificação"
            name="classificacao_id"
            rules={[{ required: true, message: 'Selecione a classificação' }]}
          >
            <Select
              placeholder="Selecione a classificação"
              options={classificacoes.map((c) => ({ value: c.id, label: c.nome }))}
            />
          </Form.Item>

          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Nome do documento" />
          </Form.Item>

          <Form.Item label="Sigla" name="sigla">
            <Input placeholder="Sigla (opcional)" maxLength={50} />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ required: true, message: 'Informe a descrição' }]}
          >
            <Input.TextArea rows={4} placeholder="Descrição do documento" />
          </Form.Item>

          <Form.Item label="Base legal" name="base_legal">
            <Input placeholder="Ex: NR-07, ISO 9001, LGPD art. 46" maxLength={255} />
          </Form.Item>

          <Form.Item label="Órgão emissor" name="orgao_emissor">
            <Input placeholder="Ex: MTE, ANPD, CBM" maxLength={255} />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Obrigatoriedade"
              name="obrigatoriedade"
              rules={[{ required: true, message: 'Selecione a obrigatoriedade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={obrigatoriedadeOptions} />
            </Form.Item>

            <Form.Item
              label="Periodicidade"
              name="periodicidade"
              rules={[{ required: true, message: 'Selecione a periodicidade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={periodicidadeOptions} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="Exige responsável técnico" name="exige_responsavel_tecnico" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Exige assinatura" name="exige_assinatura" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Exige validade" name="exige_validade" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label="Ativo" name="ativo" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Space>
  );
}

export default DocumentosRegulatorios;
