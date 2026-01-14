import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Space,
  Button,
  Typography,
  message,
  Flex
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Option {
  value: number;
  label: string;
}

type FormValues = {
  titulo: string;
  descricao: string;
  tipo: 'INTERNO' | 'EXTERNO';
  status: 'CONFORME' | 'NAO_CONFORME' | 'EM_ANALISE' | 'SEM_ANALISE' | 'EM_REANALISE';
  origem: 'MUNICIPAL' | 'ESTADUAL' | 'FEDERAL';
  criticidade: 0 | 1 | 2 | 3 | 4;
  prioridade: 1 | 2 | 3 | 4 | 5;
  classificacao_id: number;
  area_responsavel_id: number;
  usuario_responsavel_id?: number | null;
  outras_areas_ids?: number[];
  tags?: string[];
};

const tipoOptions: { value: FormValues['tipo']; label: string }[] = [
  { value: 'INTERNO', label: 'Interno' },
  { value: 'EXTERNO', label: 'Externo' }
];

const statusOptions: { value: FormValues['status']; label: string }[] = [
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'NAO_CONFORME', label: 'Não conforme' },
  { value: 'EM_ANALISE', label: 'Em análise' },
  { value: 'SEM_ANALISE', label: 'Sem análise' },
  { value: 'EM_REANALISE', label: 'Em re-análise' }
];

const origemOptions: { value: FormValues['origem']; label: string }[] = [
  { value: 'MUNICIPAL', label: 'Municipal' },
  { value: 'ESTADUAL', label: 'Estadual' },
  { value: 'FEDERAL', label: 'Federal' }
];

const criticidadeOptions: { value: FormValues['criticidade']; label: string }[] = [
  { value: 0, label: 'Urgente' },
  { value: 1, label: 'Muito alta' },
  { value: 2, label: 'Alta' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'Baixa' }
];

const prioridadeOptions: { value: FormValues['prioridade']; label: string }[] = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' }
];

function NovoRequisito() {
  const [areas, setAreas] = useState<Option[]>([]);
  const [usuarios, setUsuarios] = useState<Option[]>([]);
  const [classificacoes, setClassificacoes] = useState<Option[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const navigate = useNavigate();

  const classificacaoPadraoId = useMemo(() => {
    const encontrada = classificacoes.find(
      (c) =>
        c.label.toLowerCase() === 'premios e apostas' ||
        c.label.toLowerCase() === 'prêmios e apostas'
    );
    return encontrada ? Number(encontrada.value) : undefined;
  }, [classificacoes]);

  async function carregarAuxiliares() {
    try {
      const [areasResp, usuariosResp, classificacoesResp] = await Promise.all([
        api.get('/areas'),
        api.get('/usuarios'),
        api.get('/classificacoes')
      ]);
      setAreas((areasResp.data || []).map((a: any) => ({ value: Number(a.id), label: a.nome })));
      setUsuarios((usuariosResp.data || []).map((u: any) => ({ value: Number(u.id), label: u.nome })));
      setClassificacoes(
        (classificacoesResp.data || []).map((c: any) => ({ value: Number(c.id), label: c.nome }))
      );
    } catch (err) {
      message.error('Erro ao carregar dados auxiliares');
    }
  }

  useEffect(() => {
    carregarAuxiliares();
  }, []);

  useEffect(() => {
    if (typeof classificacaoPadraoId === 'number') {
      form.setFieldsValue({ classificacao_id: classificacaoPadraoId });
    }
  }, [classificacaoPadraoId, form]);

  async function onSubmit(values: FormValues) {
    setSalvando(true);
    try {
      const payload = {
        ...values,
        usuario_responsavel_id: values.usuario_responsavel_id || null,
        outras_areas_ids: values.outras_areas_ids || [],
        tags: values.tags || []
      };
      await api.post('/requisitos', payload);
      message.success('Requisito criado com sucesso');
      navigate('/requisitos');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao criar requisito');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Novo Requisito
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre requisitos internos ou externos. O tenant é aplicado automaticamente.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/requisitos')}>
            Voltar
          </Button>
        </Space>
      </Flex>

      <Card>
        <Form
          layout="vertical"
          form={form}
          onFinish={onSubmit}
          initialValues={{
            tipo: 'INTERNO',
            status: 'EM_ANALISE',
            origem: 'FEDERAL',
            criticidade: 3,
            prioridade: 3
          }}
        >
          <Form.Item
            label="Título"
            name="titulo"
            rules={[{ required: true, message: 'Informe o título' }]}
          >
            <Input placeholder="Título do requisito" />
          </Form.Item>

          <Form.Item
            label="Descrição"
            name="descricao"
            rules={[{ required: true, message: 'Informe a descrição' }]}
          >
            <Input.TextArea rows={4} placeholder="Descreva o requisito" />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Tipo"
              name="tipo"
              rules={[{ required: true, message: 'Selecione o tipo' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={tipoOptions} />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Selecione o status' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item
              label="Origem"
              name="origem"
              rules={[{ required: true, message: 'Selecione a origem' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={origemOptions} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Criticidade"
              name="criticidade"
              rules={[{ required: true, message: 'Selecione a criticidade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={criticidadeOptions} />
            </Form.Item>

            <Form.Item
              label="Prioridade"
              name="prioridade"
              rules={[{ required: true, message: 'Selecione a prioridade' }]}
              style={{ minWidth: 200, flex: 1 }}
            >
              <Select options={prioridadeOptions} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item
              label="Classificação"
              name="classificacao_id"
              rules={[{ required: true, message: 'Selecione a classificação' }]}
              style={{ minWidth: 240, flex: 1 }}
            >
              <Select
                placeholder="Selecione a classificação"
                options={classificacoes}
                loading={!classificacoes.length}
              />
            </Form.Item>

            <Form.Item
              label="Área responsável"
              name="area_responsavel_id"
              rules={[{ required: true, message: 'Selecione a área responsável' }]}
              style={{ minWidth: 240, flex: 1 }}
            >
              <Select
                placeholder="Selecione a área"
                options={areas}
                loading={!areas.length}
              />
            </Form.Item>

            <Form.Item
              label="Usuário responsável (opcional)"
              name="usuario_responsavel_id"
              style={{ minWidth: 240, flex: 1 }}
            >
              <Select
                allowClear
                placeholder="Selecione o usuário"
                options={usuarios}
                loading={!usuarios.length}
              />
            </Form.Item>
          </Space>

          <Form.Item label="Outras áreas envolvidas" name="outras_areas_ids">
            <Select
              mode="multiple"
              allowClear
              placeholder="Selecione as áreas envolvidas"
              options={areas}
            />
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <Select
              mode="tags"
              allowClear
              placeholder="Adicione tags"
            />
          </Form.Item>

          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/requisitos')}>
              Cancelar
            </Button>
            <Button type="primary" icon={<SaveOutlined />} htmlType="submit" loading={salvando}>
              Salvar requisito
            </Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}

export default NovoRequisito;
