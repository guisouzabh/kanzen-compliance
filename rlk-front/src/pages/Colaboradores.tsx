import { useEffect, useState, useCallback } from 'react';
import {
  App, Button, Card, Col, Form, Input, Modal, Popconfirm, Row,
  Select, Space, Spin, Table, Tag, Typography
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

const { Title } = Typography;

interface Colaborador {
  id: number;
  nome: string;
  email: string;
  cpf: string | null;
  data_nascimento: string | null;
  identificador: string | null;
  cargo: string | null;
  empresa_id: number;
  empresa_nome: string;
  ativo: number;
}

interface Empresa {
  id: number;
  nome: string;
}

export default function Colaboradores() {
  const { message } = App.useApp();
  const { empresaSelecionada: empresaId } = useEmpresaContext();

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (empresaId) params.empresa_id = empresaId;
      const res = await api.get('/colaboradores', { params });
      setColaboradores(res.data);
    } catch {
      message.error('Erro ao carregar colaboradores');
    } finally {
      setLoading(false);
    }
  }, [empresaId, message]);

  useEffect(() => {
    carregar();
    api.get('/empresas').then((r) => setEmpresas(r.data)).catch(() => {});
  }, [carregar]);

  const abrir = (c?: Colaborador) => {
    setEditando(c ?? null);
    form.resetFields();
    if (c) form.setFieldsValue(c);
    setModalAberto(true);
  };

  const salvar = async (valores: any) => {
    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/colaboradores/${editando.id}`, valores);
        message.success('Colaborador atualizado');
      } else {
        await api.post('/colaboradores', valores);
        message.success('Colaborador criado');
      }
      setModalAberto(false);
      carregar();
    } catch {
      message.error('Erro ao salvar colaborador');
    } finally {
      setSalvando(false);
    }
  };

  const deletar = async (id: number) => {
    try {
      await api.delete(`/colaboradores/${id}`);
      message.success('Colaborador removido');
      carregar();
    } catch {
      message.error('Erro ao remover colaborador');
    }
  };

  const colunas = [
    { title: 'Nome', dataIndex: 'nome' },
    { title: 'E-mail', dataIndex: 'email' },
    { title: 'Empresa', dataIndex: 'empresa_nome' },
    { title: 'Cargo', dataIndex: 'cargo', render: (v: any) => v ?? '—' },
    { title: 'Identificador', dataIndex: 'identificador', render: (v: any) => v ?? '—' },
    { title: 'Ativo', dataIndex: 'ativo', render: (v: number) => <Tag color={v ? 'success' : 'default'}>{v ? 'Sim' : 'Não'}</Tag> },
    {
      title: '',
      render: (_: any, r: Colaborador) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrir(r)} />
          <Popconfirm title="Remover colaborador?" onConfirm={() => deletar(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={4} style={{ margin: 0 }}>Colaboradores</Title></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => abrir()}>
            Novo Colaborador
          </Button>
        </Col>
      </Row>

      <Card>
        <Spin spinning={loading}>
          <Table dataSource={colaboradores} columns={colunas} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
        </Spin>
      </Card>

      <Modal
        title={editando ? 'Editar Colaborador' : 'Novo Colaborador'}
        open={modalAberto}
        onCancel={() => { setModalAberto(false); setEditando(null); }}
        onOk={() => form.submit()}
        confirmLoading={salvando}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={salvar} style={{ marginTop: 16 }}>
          <Form.Item name="empresa_id" label="Empresa" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={(input, opt) => (opt?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
              options={empresas.map((e) => ({ value: e.id, label: e.nome }))}
            />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="nome" label="Nome" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="E-mail" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="cpf" label="CPF"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="data_nascimento" label="Data de nascimento"><Input type="date" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="identificador" label="Identificador (matrícula etc.)"><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cargo" label="Cargo"><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="ativo" label="Ativo" initialValue={1}>
            <Select options={[{ value: 1, label: 'Sim' }, { value: 0, label: 'Não' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
