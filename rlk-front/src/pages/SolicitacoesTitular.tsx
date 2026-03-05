import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

interface SolicitacaoTitular {
  id: number;
  tenant_id?: number;
  empresa_id: number;
  empresa_nome?: string;
  protocolo?: string;
  canal_entrada?: string | null;
  nome: string;
  cpf?: string | null;
  data_nascimento?: string | null;
  email: string;
  telefone?: string | null;
  endereco?: string | null;
  tipo_relacao?: string | null;
  identificador_interno?: string | null;
  periodo_relacao?: string | null;
  tipo_solicitacao: string;
  descricao_pedido: string;
  categorias_dados?: string | null;
  sistemas?: string | null;
  canal_resposta?: string | null;
  idioma?: string | null;
  declaracao_veracidade?: boolean;
  ciente_prazo?: boolean;
  autorizacao_uso?: boolean;
  status?: string;
  prazo_resposta?: string | null;
  created_at?: string;
}

type SolicitacaoFormValues = {
  empresa_id?: number;
  canal_entrada?: string | null;
  nome: string;
  cpf?: string | null;
  data_nascimento?: Dayjs | null;
  email: string;
  telefone?: string | null;
  endereco?: string | null;
  tipo_relacao?: string | null;
  identificador_interno?: string | null;
  periodo_relacao?: string | null;
  tipo_solicitacao: string;
  descricao_pedido: string;
  categorias_dados?: string | null;
  sistemas?: string | null;
  canal_resposta?: string | null;
  idioma?: string | null;
  declaracao_veracidade?: boolean;
  ciente_prazo?: boolean;
  autorizacao_uso?: boolean;
  status?: string | null;
  prazo_resposta?: Dayjs | null;
};

const opcoesRelacao = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'EX_CLIENTE', label: 'Ex-cliente' },
  { value: 'COLABORADOR', label: 'Colaborador' },
  { value: 'CANDIDATO', label: 'Candidato' },
  { value: 'PARCEIRO', label: 'Parceiro' },
  { value: 'OUTRO', label: 'Outro' }
];

const opcoesSolicitacao = [
  { value: 'ACESSO', label: 'Acesso aos dados' },
  { value: 'CONFIRMACAO', label: 'Confirmação de tratamento' },
  { value: 'CORRECAO', label: 'Correção/atualização' },
  { value: 'ANONIMIZACAO_ELIMINACAO', label: 'Anonimização/bloqueio/eliminação' },
  { value: 'PORTABILIDADE', label: 'Portabilidade' },
  { value: 'REVOGACAO_CONSENTIMENTO', label: 'Revogação de consentimento' },
  { value: 'INFORMACOES_COMPARTILHAMENTO', label: 'Informações sobre compartilhamento' },
  { value: 'OPOSICAO', label: 'Oposição ao tratamento' },
  { value: 'OUTRO', label: 'Outro' }
];

const opcoesCanalEntrada = [
  { value: 'PORTAL', label: 'Portal' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'OUTRO', label: 'Outro' }
];

const opcoesCanalResposta = [
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'TELEFONE', label: 'Telefone' },
  { value: 'PORTAL', label: 'Portal' },
  { value: 'OUTRO', label: 'Outro' }
];

const opcoesStatus = [
  { value: 'ABERTO', label: 'Aberto', color: 'blue' },
  { value: 'EM_ANALISE', label: 'Em análise', color: 'gold' },
  { value: 'EM_TRATATIVA', label: 'Em tratativa', color: 'orange' },
  { value: 'CONCLUIDO', label: 'Concluído', color: 'green' },
  { value: 'NEGADO', label: 'Negado', color: 'red' }
];

const mapaSolicitacao = new Map(opcoesSolicitacao.map((item) => [item.value, item.label]));
const mapaStatus = new Map(opcoesStatus.map((item) => [item.value, item]));

function SolicitacoesTitular() {
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [lista, setLista] = useState<SolicitacaoTitular[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form] = Form.useForm<SolicitacaoFormValues>();
  const estaEditando = editandoId !== null;

  const listaFiltrada = useMemo(() => {
    if (!empresaSelecionada) return lista;
    return lista.filter((item) => item.empresa_id === empresaSelecionada);
  }, [lista, empresaSelecionada]);

  async function carregarDados(showMessage = false) {
    try {
      setCarregando(true);
      const resp = await api.get('/solicitacoes-titular');
      setLista(resp.data || []);
      if (showMessage) message.success('Solicitações atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar solicitações');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function iniciarEdicao(item: SolicitacaoTitular) {
    form.setFieldsValue({
      empresa_id: item.empresa_id,
      canal_entrada: item.canal_entrada ?? undefined,
      nome: item.nome,
      cpf: item.cpf ?? undefined,
      data_nascimento: item.data_nascimento ? dayjs(item.data_nascimento) : null,
      email: item.email,
      telefone: item.telefone ?? undefined,
      endereco: item.endereco ?? undefined,
      tipo_relacao: item.tipo_relacao ?? undefined,
      identificador_interno: item.identificador_interno ?? undefined,
      periodo_relacao: item.periodo_relacao ?? undefined,
      tipo_solicitacao: item.tipo_solicitacao,
      descricao_pedido: item.descricao_pedido,
      categorias_dados: item.categorias_dados ?? undefined,
      sistemas: item.sistemas ?? undefined,
      canal_resposta: item.canal_resposta ?? undefined,
      idioma: item.idioma ?? undefined,
      declaracao_veracidade: item.declaracao_veracidade ?? false,
      ciente_prazo: item.ciente_prazo ?? false,
      autorizacao_uso: item.autorizacao_uso ?? false,
      status: item.status ?? 'ABERTO',
      prazo_resposta: item.prazo_resposta ? dayjs(item.prazo_resposta) : null
    });
    setEditandoId(item.id);
    setModalAberta(true);
  }

  function prepararNovo() {
    setEditandoId(null);
    form.resetFields();
    form.setFieldsValue({
      empresa_id: empresaSelecionada ?? undefined,
      canal_resposta: 'EMAIL',
      status: 'ABERTO',
      declaracao_veracidade: false,
      ciente_prazo: false,
      autorizacao_uso: false
    });
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: SolicitacaoFormValues) {
    setSalvando(true);
    try {
      const payload = {
        empresa_id: values.empresa_id,
        canal_entrada: values.canal_entrada || null,
        nome: values.nome.trim(),
        cpf: values.cpf?.trim() || null,
        data_nascimento: values.data_nascimento
          ? values.data_nascimento.format('YYYY-MM-DD')
          : null,
        email: values.email.trim(),
        telefone: values.telefone?.trim() || null,
        endereco: values.endereco?.trim() || null,
        tipo_relacao: values.tipo_relacao || null,
        identificador_interno: values.identificador_interno?.trim() || null,
        periodo_relacao: values.periodo_relacao?.trim() || null,
        tipo_solicitacao: values.tipo_solicitacao,
        descricao_pedido: values.descricao_pedido.trim(),
        categorias_dados: values.categorias_dados?.trim() || null,
        sistemas: values.sistemas?.trim() || null,
        canal_resposta: values.canal_resposta || null,
        idioma: values.idioma?.trim() || null,
        declaracao_veracidade: values.declaracao_veracidade ?? false,
        ciente_prazo: values.ciente_prazo ?? false,
        autorizacao_uso: values.autorizacao_uso ?? false,
        status: values.status || 'ABERTO',
        prazo_resposta: values.prazo_resposta ? values.prazo_resposta.format('YYYY-MM-DD') : null
      };

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/solicitacoes-titular/${editandoId}`, payload);
        const atualizado: SolicitacaoTitular = resp.data;
        setLista((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        message.success('Solicitação atualizada');
      } else {
        const resp = await api.post('/solicitacoes-titular', payload);
        const criado: SolicitacaoTitular = resp.data;
        setLista((prev) => [criado, ...prev]);
        message.success('Solicitação registrada');
      }
      resetarFormulario();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar solicitação');
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/solicitacoes-titular/${id}`);
      setLista((prev) => prev.filter((item) => item.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Solicitação removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir solicitação');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={prepararNovo}
            disabled={!empresas.length}
          >
            Nova solicitação
          </Button>
        </Space>
      </Flex>

      {!empresas.length && !carregando ? (
        <Card>
          <Empty description="Cadastre uma empresa antes de criar solicitações" />
        </Card>
      ) : (
        <Card title="Solicitações registradas">
          {listaFiltrada.length === 0 && !carregando ? (
            <Empty description="Nenhuma solicitação registrada" />
          ) : (
            <Table
              rowKey="id"
              dataSource={listaFiltrada}
              loading={carregando}
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: 'Protocolo',
                  dataIndex: 'protocolo',
                  render: (value?: string) =>
                    value ? <Typography.Text strong>{value}</Typography.Text> : '-'
                },
                {
                  title: 'Titular',
                  dataIndex: 'nome',
                  render: (_: string, record: SolicitacaoTitular) => (
                    <Space direction="vertical" size={0}>
                      <Typography.Text>{record.nome}</Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {record.email}
                      </Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Empresa',
                  dataIndex: 'empresa_nome',
                  render: (_: unknown, record: SolicitacaoTitular) => (
                    <Space>
                      <Tag color="blue">
                        {record.empresa_nome ||
                          empresas.find((e) => e.id === record.empresa_id)?.nome ||
                          'Empresa'}
                      </Tag>
                      <Typography.Text type="secondary">#{record.empresa_id}</Typography.Text>
                    </Space>
                  )
                },
                {
                  title: 'Solicitação',
                  dataIndex: 'tipo_solicitacao',
                  render: (value: string) => mapaSolicitacao.get(value) || value
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  render: (value?: string) => {
                    const info = value ? mapaStatus.get(value) : undefined;
                    return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                  }
                },
                {
                  title: 'Criado em',
                  dataIndex: 'created_at',
                  render: (value?: string) =>
                    value ? <Tag>{new Date(value).toLocaleDateString('pt-BR')}</Tag> : '-'
                },
                {
                  title: 'Ações',
                  key: 'acoes',
                  width: 140,
                  render: (_: unknown, record: SolicitacaoTitular) => (
                    <Space>
                      <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => iniciarEdicao(record)}
                      />
                      <Popconfirm
                        title="Excluir solicitação?"
                        okText="Sim"
                        cancelText="Não"
                        onConfirm={() => handleDelete(record.id)}
                      >
                        <Button icon={<DeleteOutlined />} size="small" danger />
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
        title={estaEditando ? 'Editar solicitação' : 'Nova solicitação'}
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Registrar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
        width={940}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider orientation="left">Identificação</Divider>
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione a empresa"
              options={empresas.map((empresa) => ({
                value: empresa.id,
                label: empresa.nome
              }))}
            />
          </Form.Item>
          <Form.Item label="Canal de entrada" name="canal_entrada">
            <Select placeholder="Selecione" options={opcoesCanalEntrada} allowClear />
          </Form.Item>
          <Form.Item label="Nome completo" name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input placeholder="Nome do titular" maxLength={255} />
          </Form.Item>
          <Form.Item label="CPF" name="cpf">
            <Input placeholder="000.000.000-00" maxLength={20} />
          </Form.Item>
          <Form.Item label="Data de nascimento" name="data_nascimento">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="E-mail"
            name="email"
            rules={[{ required: true, message: 'Informe o e-mail' }, { type: 'email' }]}
          >
            <Input placeholder="email@dominio.com" />
          </Form.Item>
          <Form.Item label="Telefone" name="telefone">
            <Input placeholder="(00) 00000-0000" maxLength={50} />
          </Form.Item>
          <Form.Item label="Endereço" name="endereco">
            <Input.TextArea rows={2} placeholder="Endereço completo (opcional)" />
          </Form.Item>

          <Divider orientation="left">Relação com a empresa</Divider>
          <Form.Item label="Tipo de relação" name="tipo_relacao">
            <Select placeholder="Selecione" options={opcoesRelacao} allowClear />
          </Form.Item>
          <Form.Item label="Identificador interno" name="identificador_interno">
            <Input placeholder="Matrícula, ID do cliente, protocolo interno" maxLength={100} />
          </Form.Item>
          <Form.Item label="Período aproximado" name="periodo_relacao">
            <Input placeholder="Ex: 2021-2024" maxLength={100} />
          </Form.Item>

          <Divider orientation="left">Solicitação</Divider>
          <Form.Item
            label="Tipo de solicitação"
            name="tipo_solicitacao"
            rules={[{ required: true, message: 'Selecione o tipo de solicitação' }]}
          >
            <Select placeholder="Selecione" options={opcoesSolicitacao} />
          </Form.Item>
          <Form.Item
            label="Descrição do pedido"
            name="descricao_pedido"
            rules={[{ required: true, message: 'Descreva o pedido' }]}
          >
            <Input.TextArea rows={4} placeholder="Detalhe o pedido do titular" />
          </Form.Item>
          <Form.Item label="Categorias de dados" name="categorias_dados">
            <Input.TextArea rows={2} placeholder="Ex: dados pessoais, financeiros" />
          </Form.Item>
          <Form.Item label="Sistemas/serviços envolvidos" name="sistemas">
            <Input.TextArea rows={2} placeholder="Ex: CRM, ERP, RH" />
          </Form.Item>

          <Divider orientation="left">Resposta e acompanhamento</Divider>
          <Form.Item label="Canal de resposta" name="canal_resposta">
            <Select placeholder="Selecione" options={opcoesCanalResposta} allowClear />
          </Form.Item>
          <Form.Item label="Idioma" name="idioma">
            <Input placeholder="Ex: PT-BR" maxLength={20} />
          </Form.Item>
          <Form.Item label="Prazo de resposta" name="prazo_resposta">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select placeholder="Selecione" options={opcoesStatus.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>

          <Divider orientation="left">Declarações</Divider>
          <Form.Item name="declaracao_veracidade" valuePropName="checked">
            <Checkbox>Declaro que as informações acima são verdadeiras.</Checkbox>
          </Form.Item>
          <Form.Item name="ciente_prazo" valuePropName="checked">
            <Checkbox>Estou ciente dos prazos de atendimento.</Checkbox>
          </Form.Item>
          <Form.Item name="autorizacao_uso" valuePropName="checked">
            <Checkbox>Autorizo o uso dos dados apenas para esta solicitação.</Checkbox>
          </Form.Item>

        </Form>
      </Modal>
    </Space>
  );
}

export default SolicitacoesTitular;
