import { useEffect, useState, useCallback } from 'react';
import {
  App, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Spin, Table, Tag, Typography
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

const { Title, Text } = Typography;

type PlanoStatus = 'RASCUNHO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';

interface Treinamento {
  id: number;
  nome: string;
  empresa_nome: string;
  empresa_id: number;
  status: PlanoStatus;
  responsavel_nome: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  descricao: string | null;
}

interface Empresa {
  id: number;
  nome: string;
}

const STATUS_COLOR: Record<PlanoStatus, string> = {
  RASCUNHO:    'default',
  EM_ANDAMENTO: 'processing',
  CONCLUIDO:   'success',
  CANCELADO:   'error'
};

export default function Capacitacao() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { empresaSelecionada: empresaId } = useEmpresaContext();

  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (empresaId) params.empresa_id = empresaId;
      const res = await api.get('/treinamentos', { params });
      setTreinamentos(res.data);
    } catch {
      message.error('Erro ao carregar treinamentos');
    } finally {
      setLoading(false);
    }
  }, [empresaId, message]);

  useEffect(() => {
    carregar();
    api.get('/empresas').then((r) => setEmpresas(r.data)).catch(() => {});
  }, [carregar]);

  const salvar = async (valores: any) => {
    setSalvando(true);
    try {
      await api.post('/treinamentos', { ...valores, tipo: 'TREINAMENTO' });
      message.success('Plano de treinamento criado');
      setModalAberto(false);
      form.resetFields();
      carregar();
    } catch {
      message.error('Erro ao criar treinamento');
    } finally {
      setSalvando(false);
    }
  };

  const colunas = [
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome',
      render: (nome: string, rec: Treinamento) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/capacitacao/${rec.id}`)}>
          {nome}
        </Button>
      )
    },
    { title: 'Empresa', dataIndex: 'empresa_nome', key: 'empresa_nome' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: PlanoStatus) => <Tag color={STATUS_COLOR[s]}>{s.replace('_', ' ')}</Tag>
    },
    { title: 'Responsável', dataIndex: 'responsavel_nome', key: 'responsavel_nome', render: (v: any) => v ?? '—' },
    { title: 'Início', dataIndex: 'data_inicio', key: 'data_inicio', render: (v: any) => v ?? '—' },
    { title: 'Fim', dataIndex: 'data_fim', key: 'data_fim', render: (v: any) => v ?? '—' },
    {
      title: '',
      key: 'acoes',
      render: (_: any, rec: Treinamento) => (
        <Button size="small" onClick={() => navigate(`/capacitacao/${rec.id}`)}>Abrir</Button>
      )
    }
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>Programas de Treinamento LGPD</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalAberto(true)}>
            Novo Plano de Treinamento
          </Button>
        </Col>
      </Row>

      <Card>
        <Spin spinning={loading}>
          <Table
            dataSource={treinamentos}
            columns={colunas}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
          />
        </Spin>
      </Card>

      <Modal
        title="Novo Plano de Treinamento"
        open={modalAberto}
        onCancel={() => { setModalAberto(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Criar"
        confirmLoading={salvando}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={salvar} style={{ marginTop: 16 }}>
          <Form.Item name="nome" label="Nome do Plano" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="empresa_id" label="Empresa" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
              options={empresas.map((e) => ({ value: e.id, label: e.nome }))}
            />
          </Form.Item>
          <Form.Item name="descricao" label="Descrição">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="data_inicio" label="Início">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="data_fim" label="Fim">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="Status" initialValue="RASCUNHO">
            <Select options={[
              { value: 'RASCUNHO', label: 'Rascunho' },
              { value: 'EM_ANDAMENTO', label: 'Em andamento' },
              { value: 'CONCLUIDO', label: 'Concluído' },
              { value: 'CANCELADO', label: 'Cancelado' }
            ]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
