import { useEffect, useState, useCallback } from 'react';
import {
  App, Button, Card, Col, Divider, Form, Input, Modal, Popconfirm, Row,
  Select, Space, Spin, Statistic, Table, Tabs, Tag, Typography, Upload
} from 'antd';
import {
  ArrowLeftOutlined, CopyOutlined, DeleteOutlined, MailOutlined,
  PlusOutlined, UploadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface Turma {
  id: number;
  tema: string;
  plano_id: number;
  nome_plano: string;
  empresa_nome: string;
  modalidade: string;
  instrutor: string | null;
  status: string;
  slug: string;
  prazo_conclusao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  responsavel_nome: string | null;
  stats?: {
    total: number;
    aprovados: number;
    reprovados: number;
    pendentes: number;
    em_andamento: number;
    percentual_conclusao: number;
  };
}

interface Participante {
  id: number;
  colaborador_nome: string;
  colaborador_email: string;
  colaborador_cargo: string | null;
  status: string;
  nota_final: number | null;
  tentativas_realizadas: number;
  concluido_em: string | null;
}

interface Material {
  id?: number;
  titulo: string;
  tipo: string;
  url: string;
  ordem: number;
  origem: string;
}

interface Colaborador {
  id: number;
  nome: string;
  email: string;
  cargo: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  PENDENTE: 'default',
  EM_ANDAMENTO: 'processing',
  APROVADO: 'success',
  REPROVADO: 'error'
};

export default function TurmaDetalhe() {
  const { turmaId } = useParams<{ turmaId: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const [turma, setTurma] = useState<Turma | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalParticipante, setModalParticipante] = useState(false);
  const [modalImport, setModalImport] = useState(false);
  const [modalMaterial, setModalMaterial] = useState(false);
  const [modalClonar, setModalClonar] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [csvLinhas, setCsvLinhas] = useState<any[]>([]);

  const [formParticipante] = Form.useForm();
  const [formMaterial] = Form.useForm();
  const [formClonar] = Form.useForm();
  const [formImport] = Form.useForm();

  const linkPublico = turma?.slug
    ? `${window.location.origin}/t/${turma.slug}`
    : null;

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [turmaRes, partRes, matRes] = await Promise.all([
        api.get(`/turmas/${turmaId}`),
        api.get(`/turmas/${turmaId}/participantes`),
        api.get(`/turmas/${turmaId}/materiais`)
      ]);
      setTurma(turmaRes.data);
      setParticipantes(partRes.data);
      setMateriais(matRes.data);
    } catch {
      message.error('Erro ao carregar turma');
    } finally {
      setLoading(false);
    }
  }, [turmaId, message]);

  useEffect(() => {
    carregar();
    if (turma?.empresa_nome !== undefined) {
      api.get('/colaboradores').then((r) => setColaboradores(r.data)).catch(() => {});
    }
  }, [carregar]);

  useEffect(() => {
    if (turma) {
      api.get('/colaboradores').then((r) => setColaboradores(r.data)).catch(() => {});
    }
  }, [turma]);

  const adicionarParticipante = async (vals: any) => {
    setSalvando(true);
    try {
      await api.post(`/turmas/${turmaId}/participantes`, vals);
      message.success('Participante adicionado');
      setModalParticipante(false);
      formParticipante.resetFields();
      carregar();
    } catch (err: any) {
      message.error(err.response?.data?.erro ?? 'Erro ao adicionar participante');
    } finally {
      setSalvando(false);
    }
  };

  const removerParticipante = async (id: number) => {
    try {
      await api.delete(`/turmas/${turmaId}/participantes/${id}`);
      message.success('Participante removido');
      carregar();
    } catch {
      message.error('Erro ao remover participante');
    }
  };

  const enviarMagicLinks = async () => {
    try {
      const res = await api.post(`/turmas/${turmaId}/participantes/enviar-magic-links`);
      message.success(`${res.data.enfileirados} magic links enfileirados`);
    } catch {
      message.error('Erro ao enviar magic links');
    }
  };

  const criarMaterial = async (vals: any) => {
    setSalvando(true);
    try {
      await api.post(`/turmas/${turmaId}/materiais`, vals);
      message.success('Material adicionado');
      setModalMaterial(false);
      formMaterial.resetFields();
      carregar();
    } catch {
      message.error('Erro ao adicionar material');
    } finally {
      setSalvando(false);
    }
  };

  const deletarMaterial = async (id: number) => {
    try {
      await api.delete(`/turmas/${turmaId}/materiais/${id}`);
      message.success('Material removido');
      carregar();
    } catch {
      message.error('Erro ao remover material');
    }
  };

  const clonarTurma = async (vals: any) => {
    setSalvando(true);
    try {
      const nova = await api.post(`/turmas/${turmaId}/clonar`, vals);
      message.success('Turma clonada com sucesso');
      setModalClonar(false);
      formClonar.resetFields();
      navigate(`/capacitacao/turmas/${nova.data.id}`);
    } catch {
      message.error('Erro ao clonar turma');
    } finally {
      setSalvando(false);
    }
  };

  const processarCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const linhas = text.split('\n').filter((l) => l.trim());
      const cabecalho = linhas[0].split(',').map((c) => c.trim().toLowerCase());
      const dados = linhas.slice(1).map((l) => {
        const cols = l.split(',');
        return cabecalho.reduce((obj: any, key, i) => {
          obj[key] = cols[i]?.trim() ?? '';
          return obj;
        }, {});
      });
      setCsvLinhas(dados);
    };
    reader.readAsText(file);
    return false;
  };

  const importarCsv = async (vals: any) => {
    if (!csvLinhas.length) { message.warning('Carregue o arquivo CSV primeiro'); return; }
    setSalvando(true);
    try {
      const res = await api.post(`/turmas/${turmaId}/participantes/importar`, {
        empresa_id: vals.empresa_id,
        participantes: csvLinhas
      });
      message.success(`Importação concluída: ${res.data.criados} criados, ${res.data.atualizados} atualizados, ${res.data.erros.length} erros`);
      setModalImport(false);
      formImport.resetFields();
      setCsvLinhas([]);
      carregar();
    } catch {
      message.error('Erro na importação');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!turma) return <Text>Turma não encontrada.</Text>;

  const colParticipantes = [
    { title: 'Nome', dataIndex: 'colaborador_nome' },
    { title: 'E-mail', dataIndex: 'colaborador_email' },
    { title: 'Cargo', dataIndex: 'colaborador_cargo', render: (v: any) => v ?? '—' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s.replace('_', ' ')}</Tag>
    },
    { title: 'Nota', dataIndex: 'nota_final', render: (v: any) => v !== null ? v : '—' },
    { title: 'Tentativas', dataIndex: 'tentativas_realizadas' },
    { title: 'Conclusão', dataIndex: 'concluido_em', render: (v: any) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' },
    {
      title: '',
      render: (_: any, r: Participante) => (
        <Popconfirm title="Remover participante?" onConfirm={() => removerParticipante(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  const colMateriais = [
    { title: 'Título', dataIndex: 'titulo' },
    { title: 'Tipo', dataIndex: 'tipo', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Origem', dataIndex: 'origem', render: (o: string) => <Tag color={o === 'PLANO' ? 'blue' : 'green'}>{o}</Tag> },
    {
      title: '',
      render: (_: any, m: Material) => m.origem === 'TURMA' && m.id ? (
        <Popconfirm title="Remover?" onConfirm={() => deletarMaterial(m.id!)}>
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) : null
    }
  ];

  return (
    <>
      <Row align="middle" gutter={12} style={{ marginBottom: 16 }}>
        <Col>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/capacitacao/${turma.plano_id}`)} />
        </Col>
        <Col flex={1}>
          <Title level={4} style={{ margin: 0 }}>{turma.tema}</Title>
          <Text type="secondary">{turma.nome_plano} — {turma.empresa_nome}</Text>
        </Col>
        <Col>
          <Space>
            <Tag color={turma.status === 'EM_ANDAMENTO' ? 'processing' : 'default'}>{turma.status}</Tag>
            {linkPublico && (
              <Button
                icon={<CopyOutlined />}
                onClick={() => { navigator.clipboard.writeText(linkPublico); message.success('Link copiado!'); }}
              >
                Copiar link público
              </Button>
            )}
            <Button onClick={() => setModalClonar(true)}>Clonar turma</Button>
          </Space>
        </Col>
      </Row>

      {turma.stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}><Card><Statistic title="Total" value={turma.stats.total} /></Card></Col>
          <Col span={4}><Card><Statistic title="Aprovados" value={turma.stats.aprovados} valueStyle={{ color: '#27ae60' }} /></Card></Col>
          <Col span={4}><Card><Statistic title="Reprovados" value={turma.stats.reprovados} valueStyle={{ color: '#e74c3c' }} /></Card></Col>
          <Col span={4}><Card><Statistic title="Pendentes" value={turma.stats.pendentes} /></Card></Col>
          <Col span={4}><Card><Statistic title="Em andamento" value={turma.stats.em_andamento} /></Card></Col>
          <Col span={4}><Card><Statistic title="% Conclusão" value={turma.stats.percentual_conclusao} suffix="%" valueStyle={{ color: '#0b5be1' }} /></Card></Col>
        </Row>
      )}

      <Divider style={{ margin: '8px 0 16px' }} />

      <Tabs defaultActiveKey="participantes">
        <TabPane tab={`Participantes (${participantes.length})`} key="participantes">
          <Card
            extra={
              <Space>
                <Button icon={<MailOutlined />} onClick={enviarMagicLinks}>Enviar Magic Links</Button>
                <Button icon={<UploadOutlined />} onClick={() => setModalImport(true)}>Importar CSV</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalParticipante(true)}>
                  Adicionar
                </Button>
              </Space>
            }
          >
            <Table dataSource={participantes} columns={colParticipantes} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
          </Card>
        </TabPane>

        <TabPane tab="Materiais" key="materiais">
          <Card
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setModalMaterial(true)}>
                Adicionar material extra
              </Button>
            }
          >
            <Table dataSource={materiais} columns={colMateriais} rowKey={(r) => `${r.origem}-${r.id ?? r.titulo}`} size="small" pagination={false} />
          </Card>
        </TabPane>

        <TabPane tab="Relatório" key="relatorio">
          <Card>
            <Table
              dataSource={participantes}
              columns={[
                { title: 'Nome', dataIndex: 'colaborador_nome' },
                { title: 'E-mail', dataIndex: 'colaborador_email' },
                { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
                { title: 'Nota', dataIndex: 'nota_final', render: (v: any) => v ?? '—' },
                { title: 'Conclusão', dataIndex: 'concluido_em', render: (v: any) => v ? new Date(v).toLocaleDateString('pt-BR') : '—' }
              ]}
              rowKey="id"
              size="small"
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* Modal Adicionar Participante */}
      <Modal
        title="Adicionar Participante"
        open={modalParticipante}
        onCancel={() => { setModalParticipante(false); formParticipante.resetFields(); }}
        onOk={() => formParticipante.submit()}
        confirmLoading={salvando}
      >
        <Form form={formParticipante} layout="vertical" onFinish={adicionarParticipante} style={{ marginTop: 12 }}>
          <Form.Item name="colaborador_id" label="Colaborador" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
              options={colaboradores.map((c) => ({ value: c.id, label: `${c.nome} (${c.email})` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Import CSV */}
      <Modal
        title="Importar Participantes via CSV"
        open={modalImport}
        onCancel={() => { setModalImport(false); formImport.resetFields(); setCsvLinhas([]); }}
        onOk={() => formImport.submit()}
        confirmLoading={salvando}
        width={600}
      >
        <Form form={formImport} layout="vertical" onFinish={importarCsv} style={{ marginTop: 12 }}>
          <Form.Item name="empresa_id" label="Empresa" rules={[{ required: true }]}>
            <Input type="number" placeholder="ID da empresa" />
          </Form.Item>
          <Form.Item label="Arquivo CSV (colunas: nome, email, identificador, data_nascimento, cargo)">
            <Upload beforeUpload={processarCsv} accept=".csv" showUploadList={false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Selecionar CSV</Button>
            </Upload>
            {csvLinhas.length > 0 && (
              <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                {csvLinhas.length} linhas carregadas. Preview: {csvLinhas[0]?.nome}, {csvLinhas[0]?.email}
              </Text>
            )}
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Material Extra */}
      <Modal
        title="Adicionar Material Extra"
        open={modalMaterial}
        onCancel={() => { setModalMaterial(false); formMaterial.resetFields(); }}
        onOk={() => formMaterial.submit()}
        confirmLoading={salvando}
      >
        <Form form={formMaterial} layout="vertical" onFinish={criarMaterial} style={{ marginTop: 12 }}>
          <Form.Item name="titulo" label="Título" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="tipo" label="Tipo" rules={[{ required: true }]}>
            <Select options={[{ value: 'LINK', label: 'Link' }, { value: 'PDF', label: 'PDF' }, { value: 'VIDEO', label: 'Vídeo' }]} />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>

      {/* Modal Clonar */}
      <Modal
        title="Clonar Turma"
        open={modalClonar}
        onCancel={() => { setModalClonar(false); formClonar.resetFields(); }}
        onOk={() => formClonar.submit()}
        confirmLoading={salvando}
      >
        <Form form={formClonar} layout="vertical" onFinish={clonarTurma} style={{ marginTop: 12 }}>
          <Form.Item name="tema" label="Tema da nova turma (opcional)">
            <Input placeholder={`${turma.tema} (cópia)`} />
          </Form.Item>
          <Form.Item name="prazo_conclusao" label="Novo prazo de conclusão">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
