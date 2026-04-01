import { useEffect, useState, useCallback } from 'react';
import {
  App, Button, Card, Col, Divider, Form, Input, InputNumber, Modal,
  Row, Select, Space, Spin, Switch, Table, Tabs, Tag, Typography, List,
  Popconfirm
} from 'antd';
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, CopyOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface Plano {
  id: number;
  nome: string;
  empresa_id: number;
  empresa_nome: string;
  status: string;
  descricao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  responsavel_nome: string | null;
}

interface Config {
  quiz_habilitado: number;
  nota_minima: number | null;
  max_tentativas: number | null;
  tipo_identificador: string;
  label_identificador: string;
  link_publico_habilitado: number;
}

interface Material {
  id: number;
  titulo: string;
  tipo: string;
  url: string;
  ordem: number;
}

interface Pergunta {
  id: number;
  pergunta: string;
  alternativas: Array<{ texto: string; correta: boolean }>;
  ordem: number;
}

interface Turma {
  id: number;
  tema: string;
  modalidade: string;
  status: string;
  slug: string;
  data_inicio: string | null;
  data_fim: string | null;
  prazo_conclusao: string | null;
}

export default function TreinamentoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [plano, setPlano] = useState<Plano | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  const [configForm] = Form.useForm();
  const [materialForm] = Form.useForm();
  const [perguntaForm] = Form.useForm();
  const [turmaForm] = Form.useForm();

  const [modalMaterial, setModalMaterial] = useState(false);
  const [modalPergunta, setModalPergunta] = useState(false);
  const [modalTurma, setModalTurma] = useState(false);
  const [editandoMaterial, setEditandoMaterial] = useState<Material | null>(null);
  const [editandoPergunta, setEditandoPergunta] = useState<Pergunta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [alternativas, setAlternativas] = useState([
    { texto: '', correta: false },
    { texto: '', correta: false }
  ]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [planoRes, matRes, quizRes, turmaRes] = await Promise.all([
        api.get(`/treinamentos/${id}`),
        api.get(`/treinamentos/${id}/materiais`),
        api.get(`/treinamentos/${id}/quiz/perguntas`),
        api.get(`/treinamentos/${id}/turmas`)
      ]);
      setPlano(planoRes.data);
      setConfig(planoRes.data.config);
      setMateriais(matRes.data);
      setPerguntas(quizRes.data);
      setTurmas(turmaRes.data);
      if (planoRes.data.config) {
        configForm.setFieldsValue({
          quiz_habilitado: !!planoRes.data.config.quiz_habilitado,
          nota_minima: planoRes.data.config.nota_minima,
          max_tentativas: planoRes.data.config.max_tentativas,
          tipo_identificador: planoRes.data.config.tipo_identificador,
          label_identificador: planoRes.data.config.label_identificador,
          link_publico_habilitado: !!planoRes.data.config.link_publico_habilitado
        });
      }
    } catch {
      message.error('Erro ao carregar treinamento');
    } finally {
      setLoading(false);
    }
  }, [id, configForm, message]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvarConfig = async (valores: any) => {
    setSalvando(true);
    try {
      await api.put(`/treinamentos/${id}/config`, {
        ...valores,
        quiz_habilitado: valores.quiz_habilitado ? 1 : 0,
        link_publico_habilitado: valores.link_publico_habilitado ? 1 : 0
      });
      message.success('Configurações salvas');
      carregar();
    } catch {
      message.error('Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  const salvarMaterial = async (valores: any) => {
    setSalvando(true);
    try {
      if (editandoMaterial) {
        await api.put(`/treinamentos/${id}/materiais/${editandoMaterial.id}`, valores);
      } else {
        await api.post(`/treinamentos/${id}/materiais`, valores);
      }
      message.success('Material salvo');
      setModalMaterial(false);
      materialForm.resetFields();
      setEditandoMaterial(null);
      carregar();
    } catch {
      message.error('Erro ao salvar material');
    } finally {
      setSalvando(false);
    }
  };

  const deletarMaterial = async (materialId: number) => {
    try {
      await api.delete(`/treinamentos/${id}/materiais/${materialId}`);
      message.success('Material removido');
      carregar();
    } catch {
      message.error('Erro ao remover material');
    }
  };

  const abrirEditarMaterial = (m: Material) => {
    setEditandoMaterial(m);
    materialForm.setFieldsValue(m);
    setModalMaterial(true);
  };

  const salvarPergunta = async () => {
    setSalvando(true);
    try {
      const vals = await perguntaForm.validateFields();
      const payload = { ...vals, alternativas };
      if (editandoPergunta) {
        await api.put(`/treinamentos/${id}/quiz/perguntas/${editandoPergunta.id}`, payload);
      } else {
        await api.post(`/treinamentos/${id}/quiz/perguntas`, payload);
      }
      message.success('Pergunta salva');
      setModalPergunta(false);
      perguntaForm.resetFields();
      setEditandoPergunta(null);
      setAlternativas([{ texto: '', correta: false }, { texto: '', correta: false }]);
      carregar();
    } catch {
      message.error('Erro ao salvar pergunta');
    } finally {
      setSalvando(false);
    }
  };

  const deletarPergunta = async (perguntaId: number) => {
    try {
      await api.delete(`/treinamentos/${id}/quiz/perguntas/${perguntaId}`);
      message.success('Pergunta removida');
      carregar();
    } catch {
      message.error('Erro ao remover pergunta');
    }
  };

  const abrirEditarPergunta = (p: Pergunta) => {
    setEditandoPergunta(p);
    perguntaForm.setFieldsValue({ pergunta: p.pergunta, ordem: p.ordem });
    setAlternativas(p.alternativas);
    setModalPergunta(true);
  };

  const criarTurma = async (valores: any) => {
    setSalvando(true);
    try {
      await api.post(`/treinamentos/${id}/turmas`, { ...valores, empresa_id: plano?.empresa_id });
      message.success('Turma criada');
      setModalTurma(false);
      turmaForm.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar turma');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!plano) return <Text>Treinamento não encontrado.</Text>;

  const colMateriais = [
    { title: 'Título', dataIndex: 'titulo' },
    { title: 'Tipo', dataIndex: 'tipo', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'URL', dataIndex: 'url', render: (u: string) => <a href={u} target="_blank" rel="noreferrer">{u.substring(0, 40)}…</a> },
    { title: 'Ordem', dataIndex: 'ordem' },
    {
      title: '',
      render: (_: any, m: Material) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditarMaterial(m)} />
          <Popconfirm title="Remover material?" onConfirm={() => deletarMaterial(m.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const colTurmas = [
    { title: 'Tema', dataIndex: 'tema', render: (t: string, rec: Turma) => (
      <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/capacitacao/turmas/${rec.id}`)}>{t}</Button>
    )},
    { title: 'Modalidade', dataIndex: 'modalidade' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
    { title: 'Prazo', dataIndex: 'prazo_conclusao', render: (v: any) => v ?? '—' },
    {
      title: 'Link Público',
      dataIndex: 'slug',
      render: (slug: string) => slug ? (
        <Button
          size="small"
          icon={<CopyOutlined />}
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/t/${slug}`); message.success('Link copiado!'); }}
        >
          Copiar
        </Button>
      ) : '—'
    },
    { title: '', render: (_: any, r: Turma) => <Button size="small" onClick={() => navigate(`/capacitacao/turmas/${r.id}`)}>Abrir</Button> }
  ];

  return (
    <>
      <Row align="middle" gutter={12} style={{ marginBottom: 16 }}>
        <Col><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/capacitacao')} /></Col>
        <Col flex={1}><Title level={4} style={{ margin: 0 }}>{plano.nome}</Title></Col>
        <Col><Tag color={plano.status === 'EM_ANDAMENTO' ? 'processing' : 'default'}>{plano.status.replace('_', ' ')}</Tag></Col>
      </Row>

      <Text type="secondary">Empresa: {plano.empresa_nome}</Text>

      <Divider style={{ margin: '12px 0' }} />

      <Tabs defaultActiveKey="dados">
        <TabPane tab="Dados Gerais" key="dados">
          <Card>
            <Row gutter={24}>
              <Col span={12}><Text strong>Descrição:</Text><Paragraph>{plano.descricao ?? '—'}</Paragraph></Col>
              <Col span={6}><Text strong>Início:</Text><Paragraph>{plano.data_inicio ?? '—'}</Paragraph></Col>
              <Col span={6}><Text strong>Fim:</Text><Paragraph>{plano.data_fim ?? '—'}</Paragraph></Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="Configurações LGPD" key="config">
          <Card>
            <Form form={configForm} layout="vertical" onFinish={salvarConfig}>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="quiz_habilitado" label="Quiz habilitado" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="link_publico_habilitado" label="Link público habilitado" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item name="nota_minima" label="Nota mínima (0–10)">
                    <InputNumber min={0} max={10} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="max_tentativas" label="Máx. tentativas">
                    <InputNumber min={1} max={10} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="tipo_identificador" label="Tipo de identificador">
                    <Select options={[
                      { value: 'CPF', label: 'CPF' },
                      { value: 'CPF_5_DIGITOS', label: 'Últimos 5 dígitos do CPF' },
                      { value: 'MATRICULA', label: 'Matrícula' },
                      { value: 'CUSTOM', label: 'Personalizado' }
                    ]} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="label_identificador" label="Label exibido ao colaborador">
                <Input style={{ maxWidth: 300 }} />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={salvando}>Salvar Configurações</Button>
            </Form>
          </Card>
        </TabPane>

        <TabPane tab="Materiais" key="materiais">
          <Card
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalMaterial(true)}>
                Adicionar Material
              </Button>
            }
          >
            <Table dataSource={materiais} columns={colMateriais} rowKey="id" size="small" pagination={false} />
          </Card>
        </TabPane>

        <TabPane tab={`Quiz (${perguntas.length} perguntas)`} key="quiz">
          <Card
            extra={
              config?.quiz_habilitado ? (
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalPergunta(true)}>
                  Nova Pergunta
                </Button>
              ) : <Text type="warning">Habilite o quiz nas Configurações LGPD</Text>
            }
          >
            <List
              dataSource={perguntas}
              renderItem={(p, idx) => (
                <List.Item
                  actions={[
                    <Button key="e" size="small" icon={<EditOutlined />} onClick={() => abrirEditarPergunta(p)} />,
                    <Popconfirm key="d" title="Remover pergunta?" onConfirm={() => deletarPergunta(p.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={`${idx + 1}. ${p.pergunta}`}
                    description={
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {p.alternativas?.map((a, i) => (
                          <li key={i} style={{ color: a.correta ? 'green' : undefined }}>
                            {a.texto} {a.correta && '✓'}
                          </li>
                        ))}
                      </ul>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </TabPane>

        <TabPane tab={`Turmas (${turmas.length})`} key="turmas">
          <Card
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalTurma(true)}>
                Nova Turma
              </Button>
            }
          >
            <Table dataSource={turmas} columns={colTurmas} rowKey="id" size="small" pagination={false} />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal Material */}
      <Modal
        title={editandoMaterial ? 'Editar Material' : 'Novo Material'}
        open={modalMaterial}
        onCancel={() => { setModalMaterial(false); materialForm.resetFields(); setEditandoMaterial(null); }}
        onOk={() => materialForm.submit()}
        confirmLoading={salvando}
      >
        <Form form={materialForm} layout="vertical" onFinish={salvarMaterial} style={{ marginTop: 12 }}>
          <Form.Item name="titulo" label="Título" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select options={[{ value: 'LINK', label: 'Link' }, { value: 'PDF', label: 'PDF' }, { value: 'VIDEO', label: 'Vídeo' }]} />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="ordem" label="Ordem"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* Modal Pergunta */}
      <Modal
        title={editandoPergunta ? 'Editar Pergunta' : 'Nova Pergunta'}
        open={modalPergunta}
        onCancel={() => {
          setModalPergunta(false);
          perguntaForm.resetFields();
          setEditandoPergunta(null);
          setAlternativas([{ texto: '', correta: false }, { texto: '', correta: false }]);
        }}
        onOk={salvarPergunta}
        confirmLoading={salvando}
        width={640}
      >
        <Form form={perguntaForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="pergunta" label="Pergunta" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="ordem" label="Ordem"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
        <Divider>Alternativas</Divider>
        {alternativas.map((a, i) => (
          <Row key={i} gutter={8} style={{ marginBottom: 8 }} align="middle">
            <Col flex={1}>
              <Input
                value={a.texto}
                placeholder={`Alternativa ${i + 1}`}
                onChange={(e) => {
                  const nova = [...alternativas];
                  nova[i] = { ...nova[i], texto: e.target.value };
                  setAlternativas(nova);
                }}
              />
            </Col>
            <Col>
              <Button
                type={a.correta ? 'primary' : 'default'}
                size="small"
                onClick={() => {
                  setAlternativas(alternativas.map((alt, j) => ({ ...alt, correta: j === i })));
                }}
              >
                {a.correta ? 'Correta ✓' : 'Marcar correta'}
              </Button>
            </Col>
            {alternativas.length > 2 && (
              <Col>
                <Button danger size="small" icon={<DeleteOutlined />} onClick={() => setAlternativas(alternativas.filter((_, j) => j !== i))} />
              </Col>
            )}
          </Row>
        ))}
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setAlternativas([...alternativas, { texto: '', correta: false }])}
        >
          Adicionar alternativa
        </Button>
      </Modal>

      {/* Modal Turma */}
      <Modal
        title="Nova Turma"
        open={modalTurma}
        onCancel={() => { setModalTurma(false); turmaForm.resetFields(); }}
        onOk={() => turmaForm.submit()}
        confirmLoading={salvando}
      >
        <Form form={turmaForm} layout="vertical" onFinish={criarTurma} style={{ marginTop: 12 }}>
          <Form.Item name="tema" label="Tema" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="instrutor" label="Instrutor"><Input /></Form.Item>
          <Form.Item name="modalidade" label="Modalidade" initialValue="PRESENCIAL">
            <Select options={[
              { value: 'PRESENCIAL', label: 'Presencial' },
              { value: 'ONLINE', label: 'Online' },
              { value: 'HIBRIDO', label: 'Híbrido' }
            ]} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="data_inicio" label="Início"><Input type="date" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="prazo_conclusao" label="Prazo de conclusão"><Input type="date" /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
}
