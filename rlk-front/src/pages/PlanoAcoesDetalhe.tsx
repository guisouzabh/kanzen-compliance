import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

interface PlanoAcao {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  tipo: 'ACOES' | 'TREINAMENTO' | 'AUDITORIA';
  nome: string;
  descricao?: string | null;
  status?: 'RASCUNHO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;
}

interface MatrizAcao {
  id: number;
  empresa_id: number;
  acao: string;
  objetivo?: string | null;
  status?: 'PLANEJADA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'IMPEDIDA';
  prioridade?: number;
  esforco?: number;
  prazo?: string | null;
  status_prazo?: 'NAO_APLICAVEL' | 'NO_PRAZO' | 'ATRASADA';
  origem?: string | null;
  origem_typ?: string | null;
  origem_id?: number | null;
  responsavel_id?: number | null;
  responsavel_nome?: string | null;
  tags?: string[];
}

interface Usuario {
  id: number;
  nome: string;
  email?: string;
}

type AcaoFormValues = {
  acao: string;
  objetivo?: string | null;
  status?: MatrizAcao['status'];
  prioridade?: number;
  esforco?: number;
  prazo?: Dayjs | null;
  status_prazo?: MatrizAcao['status_prazo'];
  origem?: string | null;
  origem_typ?: string | null;
  origem_id?: number | null;
  responsavel_id?: number | null;
  tags?: string[];
};

const statusPlanoMap = new Map([
  ['RASCUNHO', { label: 'Rascunho', color: 'default' }],
  ['EM_ANDAMENTO', { label: 'Em andamento', color: 'blue' }],
  ['CONCLUIDO', { label: 'Concluído', color: 'green' }],
  ['CANCELADO', { label: 'Cancelado', color: 'red' }]
]);

const opcoesStatus = [
  { value: 'PLANEJADA', label: 'Planejada', color: 'default' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento', color: 'blue' },
  { value: 'CONCLUIDA', label: 'Concluída', color: 'green' },
  { value: 'IMPEDIDA', label: 'Impedida', color: 'red' }
];

const opcoesStatusPrazo = [
  { value: 'NAO_APLICAVEL', label: 'Não aplicável', color: 'default' },
  { value: 'NO_PRAZO', label: 'No prazo', color: 'green' },
  { value: 'ATRASADA', label: 'Atrasada', color: 'red' }
];

const opcoesNiveis = [
  { value: 1, label: '1 - Muito baixo' },
  { value: 2, label: '2 - Baixo' },
  { value: 3, label: '3 - Médio' },
  { value: 4, label: '4 - Alto' },
  { value: 5, label: '5 - Muito alto' }
];

const mapaStatus = new Map(opcoesStatus.map((item) => [item.value, item]));
const mapaStatusPrazo = new Map(opcoesStatusPrazo.map((item) => [item.value, item]));

function PlanoAcoesDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plano, setPlano] = useState<PlanoAcao | null>(null);
  const [acoes, setAcoes] = useState<MatrizAcao[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [form] = Form.useForm<AcaoFormValues>();

  const estaEditando = editandoId !== null;
  const planoId = Number(id);

  const titulo = useMemo(() => {
    if (!plano) return 'Plano de Ações';
    return plano.nome;
  }, [plano]);

  function erroApi(err: unknown, fallback: string): string {
    const maybe = err as { response?: { data?: { erro?: string } } };
    return maybe.response?.data?.erro || fallback;
  }

  const carregarDados = useCallback(async (showMessage = false) => {
    if (Number.isNaN(planoId)) {
      message.error('Plano inválido');
      navigate('/planos-acoes');
      return;
    }

    try {
      setCarregando(true);
      const [planoResp, acoesResp, usuariosResp] = await Promise.allSettled([
        api.get(`/planos/${planoId}`),
        api.get(`/planos/${planoId}/acoes`),
        api.get('/usuarios')
      ]);

      if (planoResp.status !== 'fulfilled') {
        message.error(erroApi(planoResp.reason, 'Plano não encontrado'));
        navigate('/planos-acoes');
        return;
      }

      const planoData: PlanoAcao = planoResp.value.data;
      if (planoData.tipo !== 'ACOES') {
        message.error('Este plano não é do tipo AÇÕES');
        navigate('/planos-acoes');
        return;
      }

      setPlano(planoData);

      if (acoesResp.status === 'fulfilled') {
        setAcoes(acoesResp.value.data || []);
      } else {
        setAcoes([]);
      }

      if (usuariosResp.status === 'fulfilled') {
        setUsuarios(usuariosResp.value.data || []);
      } else {
        setUsuarios([]);
      }

      if (showMessage) message.success('Plano atualizado');
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao carregar plano'));
    } finally {
      setCarregando(false);
    }
  }, [navigate, planoId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  function prepararNovaAcao() {
    setEditandoId(null);
    setTagInputValue('');
    form.resetFields();
    form.setFieldsValue({
      status: 'PLANEJADA',
      prioridade: 3,
      esforco: 3,
      tags: []
    });
    setModalAberta(true);
  }

  function iniciarEdicao(item: MatrizAcao) {
    setEditandoId(item.id);
    setTagInputValue('');
    form.setFieldsValue({
      acao: item.acao,
      objetivo: item.objetivo ?? undefined,
      status: item.status ?? 'PLANEJADA',
      prioridade: item.prioridade ?? 3,
      esforco: item.esforco ?? 3,
      prazo: item.prazo ? dayjs(item.prazo) : null,
      status_prazo: item.status_prazo ?? 'NO_PRAZO',
      origem: item.origem ?? undefined,
      origem_typ: item.origem_typ ?? undefined,
      origem_id: item.origem_id ?? null,
      responsavel_id: item.responsavel_id ?? null,
      tags: item.tags ?? []
    });
    setModalAberta(true);
  }

  function fecharModal() {
    setEditandoId(null);
    setTagInputValue('');
    form.resetFields();
    setModalAberta(false);
  }

  async function handleSubmit(values: AcaoFormValues) {
    if (!plano) return;

    setSalvando(true);
    try {
      const payload: Record<string, unknown> = {
        empresa_id: plano.empresa_id,
        acao: values.acao.trim(),
        objetivo: values.objetivo?.trim() || null,
        status: values.status || 'PLANEJADA',
        prioridade: values.prioridade ?? 3,
        esforco: values.esforco ?? 3,
        prazo: values.prazo ? values.prazo.format('YYYY-MM-DD') : null,
        origem: values.origem?.trim() || null,
        origem_typ: values.origem_typ?.trim() || null,
        origem_id: values.origem_id ?? null,
        responsavel_id: values.responsavel_id ?? null,
        tags: values.tags || []
      };

      if (estaEditando) {
        payload.status_prazo = values.status_prazo || 'NO_PRAZO';
      }

      if (estaEditando && editandoId !== null) {
        const resp = await api.put(`/planos/${planoId}/acoes/${editandoId}`, payload);
        const atualizado: MatrizAcao = resp.data;
        setAcoes((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)));
        message.success('Ação atualizada');
      } else {
        const resp = await api.post(`/planos/${planoId}/acoes`, payload);
        const criada: MatrizAcao = resp.data;
        setAcoes((prev) => [criada, ...prev]);
        message.success('Ação criada');
      }

      fecharModal();
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao salvar ação'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeleteAcao(acaoId: number) {
    try {
      await api.delete(`/planos/${planoId}/acoes/${acaoId}`);
      setAcoes((prev) => prev.filter((item) => item.id !== acaoId));
      message.success('Ação removida');
    } catch (err: unknown) {
      message.error(erroApi(err, 'Erro ao excluir ação'));
    }
  }

  if (carregando) {
    return (
      <Card>
        <Spin />
      </Card>
    );
  }

  if (!plano) {
    return (
      <Card>
        <Empty description="Plano não encontrado" />
      </Card>
    );
  }

  const infoStatusPlano = plano.status ? statusPlanoMap.get(plano.status) : undefined;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <Space align="start">
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/planos-acoes')} />
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {titulo}
            </Typography.Title>
            <Space size={8}>
              <Typography.Text type="secondary">{plano.empresa_nome || `Empresa #${plano.empresa_id}`}</Typography.Text>
              <Tag color={infoStatusPlano?.color || 'default'}>
                {infoStatusPlano?.label || plano.status || '-'}
              </Tag>
            </Space>
          </div>
        </Space>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarDados(true)} />
          <Button type="primary" icon={<PlusOutlined />} onClick={prepararNovaAcao}>
            Nova ação
          </Button>
        </Space>
      </Flex>

      <Card title="Dados do plano">
        <Space direction="vertical" size={4}>
          <Typography.Text>
            <strong>Descrição:</strong> {plano.descricao || 'Sem descrição'}
          </Typography.Text>
          <Typography.Text>
            <strong>Período:</strong>{' '}
            {plano.data_inicio ? dayjs(plano.data_inicio).format('DD/MM/YYYY') : '-'} até{' '}
            {plano.data_fim ? dayjs(plano.data_fim).format('DD/MM/YYYY') : '-'}
          </Typography.Text>
          <Typography.Text>
            <strong>Responsável:</strong> {plano.responsavel_nome || '-'}
          </Typography.Text>
        </Space>
      </Card>

      <Card title="Ações vinculadas">
        {acoes.length === 0 ? (
          <Empty description="Nenhuma ação vinculada a este plano" />
        ) : (
          <Table
            rowKey="id"
            dataSource={acoes}
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Ação',
                dataIndex: 'acao',
                width: 340,
                render: (_: string, record: MatrizAcao) => (
                  <Space direction="vertical" size={0} style={{ width: '100%' }}>
                    <Typography.Text>{record.acao}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {record.objetivo || 'Sem objetivo informado'}
                    </Typography.Text>
                    {record.tags && record.tags.length ? (
                      <Space wrap size={[4, 4]}>
                        {record.tags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        Sem tags
                      </Typography.Text>
                    )}
                  </Space>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status',
                render: (value?: MatrizAcao['status']) => {
                  const info = value ? mapaStatus.get(value) : undefined;
                  return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                }
              },
              {
                title: 'Prioridade',
                dataIndex: 'prioridade',
                render: (value?: number) => <Tag>{value ?? '-'}</Tag>
              },
              {
                title: 'Esforço',
                dataIndex: 'esforco',
                render: (value?: number) => <Tag>{value ?? '-'}</Tag>
              },
              {
                title: 'Prazo',
                dataIndex: 'prazo',
                render: (value?: string | null) => (value ? dayjs(value).format('DD/MM/YYYY') : '-')
              },
              {
                title: 'Status do prazo',
                dataIndex: 'status_prazo',
                render: (value?: MatrizAcao['status_prazo']) => {
                  const info = value ? mapaStatusPrazo.get(value) : undefined;
                  return <Tag color={info?.color || 'default'}>{info?.label || value || '-'}</Tag>;
                }
              },
              {
                title: 'Responsável',
                dataIndex: 'responsavel_nome',
                render: (_: unknown, record: MatrizAcao) => record.responsavel_nome || '-'
              },
              {
                title: 'Ações',
                key: 'acoes',
                width: 120,
                render: (_: unknown, record: MatrizAcao) => (
                  <Space>
                    <Button icon={<EditOutlined />} size="small" onClick={() => iniciarEdicao(record)} />
                    <Popconfirm
                      title="Excluir ação?"
                      okText="Sim"
                      cancelText="Não"
                      onConfirm={() => handleDeleteAcao(record.id)}
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

      <Modal
        title={estaEditando ? 'Editar ação do plano' : 'Nova ação do plano'}
        open={modalAberta}
        onCancel={fecharModal}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvando }}
        onOk={() => form.submit()}
        destroyOnClose
        width={920}
        styles={{ body: { maxHeight: '70vh', overflow: 'auto' } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Divider orientation="left">Dados principais</Divider>
          <Form.Item
            label="Ação"
            name="acao"
            rules={[{ required: true, message: 'Informe a ação' }]}
          >
            <Input placeholder="Ex: Definir política de retenção de dados" maxLength={255} />
          </Form.Item>

          <Form.Item label="Objetivo" name="objetivo">
            <Input.TextArea rows={3} placeholder="Por que essa ação é necessária?" maxLength={2000} />
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              placeholder="Adicione tags"
              tokenSeparators={[',', ';']}
              searchValue={tagInputValue}
              onSearch={(value) => setTagInputValue(value)}
              onBlur={() => {
                const novaTag = tagInputValue.trim();
                if (!novaTag) return;
                const atuais = form.getFieldValue('tags') || [];
                if (!atuais.includes(novaTag)) {
                  form.setFieldValue('tags', [...atuais, novaTag]);
                }
                setTagInputValue('');
              }}
            />
          </Form.Item>

          <Divider orientation="left">Planejamento</Divider>
          <Form.Item label="Status" name="status">
            <Select placeholder="Selecione" options={opcoesStatus.map(({ value, label }) => ({ value, label }))} />
          </Form.Item>

          <Form.Item label="Prioridade" name="prioridade">
            <Select placeholder="Selecione" options={opcoesNiveis} />
          </Form.Item>

          <Form.Item label="Esforço" name="esforco">
            <Select placeholder="Selecione" options={opcoesNiveis} />
          </Form.Item>

          <Form.Item label="Prazo" name="prazo">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          {estaEditando && (
            <Form.Item label="Status do prazo" name="status_prazo">
              <Select
                placeholder="Selecione"
                options={opcoesStatusPrazo.map(({ value, label }) => ({ value, label }))}
              />
            </Form.Item>
          )}

          <Divider orientation="left">Origem</Divider>
          <Form.Item label="Origem" name="origem">
            <Input.TextArea rows={2} placeholder="Ex: diagnóstico, auditoria, demanda interna" maxLength={2000} />
          </Form.Item>

          <Form.Item
            label="Tipo de origem"
            name="origem_typ"
            dependencies={['origem_id']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const origemId = getFieldValue('origem_id');
                  if (!origemId || (value && String(value).trim().length > 0)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Informe o tipo de origem quando houver ID'));
                }
              })
            ]}
          >
            <Input placeholder="Ex: DIAGNOSTICO, REQUISITO, PROCESSO" maxLength={50} />
          </Form.Item>

          <Form.Item label="Origem ID" name="origem_id">
            <InputNumber style={{ width: '100%' }} min={1} placeholder="ID de referência" />
          </Form.Item>

          <Divider orientation="left">Responsável</Divider>
          <Form.Item label="Responsável" name="responsavel_id">
            <Select
              allowClear
              placeholder="Selecione (opcional)"
              options={usuarios.map((usuario) => ({
                value: usuario.id,
                label: usuario.email ? `${usuario.nome} (${usuario.email})` : usuario.nome
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default PlanoAcoesDetalhe;
