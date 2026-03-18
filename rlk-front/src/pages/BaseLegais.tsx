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
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import type { BaseLegalEmpresaItem, BaseLegalStatus, DmBaseLegalItem } from '../types/BaseLegal';

type CatalogoFormValues = {
  codigo: string;
  nome: string;
  ativo: boolean;
};

type EmpresaFormValues = {
  base_legal_id: number;
  status: BaseLegalStatus;
  fundamento_juridico_empresa?: string | null;
  data_inicio_vigencia?: string | null;
  data_termino_vigencia?: string | null;
};

function getRoleFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

function formatarData(value?: string | null): string {
  if (!value) return '—';
  const data = new Date(`${value}T00:00:00`);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR');
}

function BaseLegais() {
  const { empresaSelecionada, empresas } = useEmpresaContext();
  const [catalogo, setCatalogo] = useState<DmBaseLegalItem[]>([]);
  const [listaEmpresa, setListaEmpresa] = useState<BaseLegalEmpresaItem[]>([]);
  const [carregandoCatalogo, setCarregandoCatalogo] = useState(true);
  const [carregandoEmpresa, setCarregandoEmpresa] = useState(true);
  const [salvandoCatalogo, setSalvandoCatalogo] = useState(false);
  const [salvandoEmpresa, setSalvandoEmpresa] = useState(false);

  const [modalCatalogoAberta, setModalCatalogoAberta] = useState(false);
  const [modalEmpresaAberta, setModalEmpresaAberta] = useState(false);

  const [catalogoEmEdicao, setCatalogoEmEdicao] = useState<DmBaseLegalItem | null>(null);
  const [registroEmpresaEmEdicao, setRegistroEmpresaEmEdicao] =
    useState<BaseLegalEmpresaItem | null>(null);

  const [formCatalogo] = Form.useForm<CatalogoFormValues>();
  const [formEmpresa] = Form.useForm<EmpresaFormValues>();

  const usuarioRole = getRoleFromToken();
  const somenteLeitura = usuarioRole === 'USUARIO_TAREFA';

  const nomeEmpresaSelecionada = useMemo(() => {
    if (!empresaSelecionada) return null;
    return empresas.find((empresa) => empresa.id === empresaSelecionada)?.nome ?? `#${empresaSelecionada}`;
  }, [empresaSelecionada, empresas]);

  const opcoesBaseLegalAtiva = useMemo(() => {
    const ativas = catalogo.filter((item) => item.ativo === 1);
    if (!registroEmpresaEmEdicao) return ativas;

    const jaExiste = ativas.some((item) => item.id === registroEmpresaEmEdicao.base_legal_id);
    if (jaExiste) return ativas;

    const itemEdicao = catalogo.find((item) => item.id === registroEmpresaEmEdicao.base_legal_id);
    if (!itemEdicao) return ativas;

    return [itemEdicao, ...ativas];
  }, [catalogo, registroEmpresaEmEdicao]);

  async function carregarCatalogo() {
    try {
      setCarregandoCatalogo(true);
      const response = await api.get('/base-legais');
      setCatalogo(response.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar catálogo de base legais');
    } finally {
      setCarregandoCatalogo(false);
    }
  }

  async function carregarBaseLegalEmpresa() {
    if (!empresaSelecionada) {
      setListaEmpresa([]);
      setCarregandoEmpresa(false);
      return;
    }

    try {
      setCarregandoEmpresa(true);
      const response = await api.get('/base-legais-empresa', {
        params: { empresa_id: empresaSelecionada }
      });
      setListaEmpresa(response.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar base legal da empresa');
    } finally {
      setCarregandoEmpresa(false);
    }
  }

  async function recarregarTudo(showMessage = false) {
    await Promise.all([carregarCatalogo(), carregarBaseLegalEmpresa()]);
    if (showMessage) {
      message.success('Dados atualizados');
    }
  }

  useEffect(() => {
    carregarCatalogo();
  }, []);

  useEffect(() => {
    carregarBaseLegalEmpresa();
  }, [empresaSelecionada]);

  function abrirModalNovoCatalogo() {
    setCatalogoEmEdicao(null);
    formCatalogo.resetFields();
    formCatalogo.setFieldsValue({ ativo: true });
    setModalCatalogoAberta(true);
  }

  function abrirModalEditarCatalogo(item: DmBaseLegalItem) {
    setCatalogoEmEdicao(item);
    formCatalogo.setFieldsValue({
      codigo: item.codigo,
      nome: item.nome,
      ativo: item.ativo === 1
    });
    setModalCatalogoAberta(true);
  }

  function fecharModalCatalogo() {
    setCatalogoEmEdicao(null);
    formCatalogo.resetFields();
    setModalCatalogoAberta(false);
  }

  async function salvarCatalogo(values: CatalogoFormValues) {
    try {
      setSalvandoCatalogo(true);
      const payload = {
        codigo: values.codigo.trim(),
        nome: values.nome.trim(),
        ativo: values.ativo
      };

      if (catalogoEmEdicao) {
        await api.put(`/base-legais/${catalogoEmEdicao.id}`, payload);
        message.success('Base legal atualizada');
      } else {
        await api.post('/base-legais', payload);
        message.success('Base legal criada');
      }

      fecharModalCatalogo();
      await recarregarTudo();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar base legal');
    } finally {
      setSalvandoCatalogo(false);
    }
  }

  async function inativarCatalogo(item: DmBaseLegalItem) {
    try {
      await api.delete(`/base-legais/${item.id}`);
      message.success('Base legal inativada');
      await recarregarTudo();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao inativar base legal');
    }
  }

  function abrirModalNovoRegistroEmpresa() {
    if (!empresaSelecionada) {
      message.warning('Selecione uma empresa para continuar');
      return;
    }

    setRegistroEmpresaEmEdicao(null);
    formEmpresa.resetFields();
    formEmpresa.setFieldsValue({
      status: 'ATIVA'
    });
    setModalEmpresaAberta(true);
  }

  function abrirModalEditarRegistroEmpresa(item: BaseLegalEmpresaItem) {
    setRegistroEmpresaEmEdicao(item);
    formEmpresa.setFieldsValue({
      base_legal_id: item.base_legal_id,
      status: item.status,
      fundamento_juridico_empresa: item.fundamento_juridico_empresa ?? undefined,
      data_inicio_vigencia: item.data_inicio_vigencia ?? undefined,
      data_termino_vigencia: item.data_termino_vigencia ?? undefined
    });
    setModalEmpresaAberta(true);
  }

  function fecharModalEmpresa() {
    setRegistroEmpresaEmEdicao(null);
    formEmpresa.resetFields();
    setModalEmpresaAberta(false);
  }

  async function salvarRegistroEmpresa(values: EmpresaFormValues) {
    if (!empresaSelecionada) {
      message.warning('Selecione uma empresa para continuar');
      return;
    }

    try {
      setSalvandoEmpresa(true);

      const payload = {
        empresa_id: empresaSelecionada,
        base_legal_id: values.base_legal_id,
        status: values.status,
        fundamento_juridico_empresa: values.fundamento_juridico_empresa?.trim() || null,
        data_inicio_vigencia: values.data_inicio_vigencia || null,
        data_termino_vigencia: values.data_termino_vigencia || null
      };

      if (registroEmpresaEmEdicao) {
        await api.put(`/base-legais-empresa/${registroEmpresaEmEdicao.id}`, payload);
        message.success('Base legal da empresa atualizada');
      } else {
        await api.post('/base-legais-empresa', payload);
        message.success('Base legal vinculada à empresa');
      }

      fecharModalEmpresa();
      await carregarBaseLegalEmpresa();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar base legal da empresa');
    } finally {
      setSalvandoEmpresa(false);
    }
  }

  async function inativarRegistroEmpresa(item: BaseLegalEmpresaItem) {
    try {
      await api.delete(`/base-legais-empresa/${item.id}`);
      message.success('Registro da empresa inativado');
      await carregarBaseLegalEmpresa();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao inativar registro da empresa');
    }
  }

  const colunasCatalogo = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 160,
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>
    },
    {
      title: 'Nome',
      dataIndex: 'nome',
      key: 'nome'
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      key: 'ativo',
      width: 120,
      render: (value: number) => (
        <Tag color={value === 1 ? 'green' : 'default'}>{value === 1 ? 'Sim' : 'Não'}</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 160,
      render: (_: unknown, item: DmBaseLegalItem) => {
        if (somenteLeitura) {
          return <Typography.Text type="secondary">Somente leitura</Typography.Text>;
        }

        return (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirModalEditarCatalogo(item)} />
            <Popconfirm
              title="Inativar base legal?"
              okText="Sim"
              cancelText="Não"
              onConfirm={() => inativarCatalogo(item)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  const colunasEmpresa = [
    {
      title: 'Código',
      dataIndex: 'base_legal_codigo',
      key: 'base_legal_codigo',
      width: 160,
      render: (value?: string) => value || '—'
    },
    {
      title: 'Base legal',
      dataIndex: 'base_legal_nome',
      key: 'base_legal_nome',
      render: (value?: string) => value || '—'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: BaseLegalStatus) => (
        <Tag color={value === 'ATIVA' ? 'green' : 'default'}>{value}</Tag>
      )
    },
    {
      title: 'Fundamento jurídico da empresa',
      dataIndex: 'fundamento_juridico_empresa',
      key: 'fundamento_juridico_empresa',
      render: (value?: string | null) => value || '—'
    },
    {
      title: 'Vigência',
      key: 'vigencia',
      width: 220,
      render: (_: unknown, item: BaseLegalEmpresaItem) => (
        <Typography.Text>
          {formatarData(item.data_inicio_vigencia)} até {formatarData(item.data_termino_vigencia)}
        </Typography.Text>
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 160,
      render: (_: unknown, item: BaseLegalEmpresaItem) => {
        if (somenteLeitura) {
          return <Typography.Text type="secondary">Somente leitura</Typography.Text>;
        }

        return (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={() => abrirModalEditarRegistroEmpresa(item)} />
            <Popconfirm
              title="Inativar registro da empresa?"
              okText="Sim"
              cancelText="Não"
              onConfirm={() => inativarRegistroEmpresa(item)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Base Legais
          </Typography.Title>
          <Typography.Text type="secondary">
            Catálogo mestre de bases legais e vínculo por empresa.
            {nomeEmpresaSelecionada
              ? ` Empresa selecionada: ${nomeEmpresaSelecionada}.`
              : ' Selecione uma empresa no topo para gerenciar o vínculo por empresa.'}
          </Typography.Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => recarregarTudo(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={abrirModalNovoCatalogo}
            disabled={somenteLeitura}
          >
            Nova base legal
          </Button>
          <Button
            type="primary"
            ghost
            icon={<PlusOutlined />}
            onClick={abrirModalNovoRegistroEmpresa}
            disabled={somenteLeitura || !empresaSelecionada}
          >
            Vincular à empresa
          </Button>
        </Space>
      </Flex>

      <Card title="Catálogo mestre (dm_base_legais)">
        {catalogo.length === 0 && !carregandoCatalogo ? (
          <Empty description="Nenhuma base legal cadastrada" />
        ) : (
          <Table<DmBaseLegalItem>
            rowKey="id"
            loading={carregandoCatalogo}
            dataSource={catalogo}
            columns={colunasCatalogo}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Card title="Base legal por empresa (base_legal_empresa)">
        {!empresaSelecionada ? (
          <Empty description="Selecione uma empresa para visualizar os vínculos" />
        ) : listaEmpresa.length === 0 && !carregandoEmpresa ? (
          <Empty description="Nenhuma base legal vinculada para esta empresa" />
        ) : (
          <Table<BaseLegalEmpresaItem>
            rowKey="id"
            loading={carregandoEmpresa}
            dataSource={listaEmpresa}
            columns={colunasEmpresa}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title={catalogoEmEdicao ? 'Editar base legal do catálogo' : 'Nova base legal do catálogo'}
        open={modalCatalogoAberta}
        onCancel={fecharModalCatalogo}
        okText={catalogoEmEdicao ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvandoCatalogo }}
        onOk={() => formCatalogo.submit()}
        destroyOnClose
      >
        <Form<CatalogoFormValues>
          form={formCatalogo}
          layout="vertical"
          onFinish={salvarCatalogo}
          initialValues={{ ativo: true }}
        >
          <Form.Item label="Código" name="codigo" rules={[{ required: true, message: 'Informe o código' }]}>
            <Input maxLength={50} placeholder="Ex: LGPD-ART7-I" />
          </Form.Item>

          <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input maxLength={255} placeholder="Ex: Consentimento do titular" />
          </Form.Item>

          <Form.Item label="Ativo" name="ativo" valuePropName="checked">
            <Switch checkedChildren="Sim" unCheckedChildren="Não" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={registroEmpresaEmEdicao ? 'Editar base legal da empresa' : 'Vincular base legal à empresa'}
        open={modalEmpresaAberta}
        onCancel={fecharModalEmpresa}
        okText={registroEmpresaEmEdicao ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined />, loading: salvandoEmpresa }}
        onOk={() => formEmpresa.submit()}
        destroyOnClose
      >
        <Form<EmpresaFormValues>
          form={formEmpresa}
          layout="vertical"
          onFinish={salvarRegistroEmpresa}
          initialValues={{ status: 'ATIVA' }}
        >
          <Form.Item
            label="Base legal"
            name="base_legal_id"
            rules={[{ required: true, message: 'Selecione uma base legal' }]}
          >
            <Select
              placeholder="Selecione"
              options={opcoesBaseLegalAtiva.map((item) => ({
                value: item.id,
                label: `${item.codigo} - ${item.nome}${item.ativo === 1 ? '' : ' (Inativa no catálogo)'}`
              }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Informe o status' }]}>
            <Select
              options={[
                { value: 'ATIVA', label: 'ATIVA' },
                { value: 'INATIVA', label: 'INATIVA' }
              ]}
            />
          </Form.Item>

          <Form.Item label="Fundamento jurídico da empresa" name="fundamento_juridico_empresa">
            <Input.TextArea rows={3} placeholder="Texto livre" />
          </Form.Item>

          <Form.Item label="Data início vigência" name="data_inicio_vigencia">
            <Input type="date" />
          </Form.Item>

          <Form.Item label="Data término vigência" name="data_termino_vigencia">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default BaseLegais;
