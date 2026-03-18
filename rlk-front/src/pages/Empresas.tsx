import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Typography,
  message,
  Popconfirm,
  Flex,
  Empty,
  Skeleton,
  Modal,
  Upload
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  matriz_ou_filial: 'MATRIZ' | 'FILIAL';
  razao_social: string;
  ramo_atuacao?: string | null;
  cnae_principal_codigo?: string | null;
  cnae_principal_descricao?: string | null;
  cnaes_secundarios?: CnaeSecundario[];
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  logo_url?: string | null;
  parametro_maturidade?: number;
  termometro_sancoes_id?: number;
}

interface CnaeSecundario {
  codigo: string;
  descricao: string;
}

interface CnaeBuscaItem {
  codigo: string;
  descricao: string;
}

type EmpresaFormValues = Omit<Empresa, 'id' | 'cnaes_secundarios'> & {
  cnaes_secundarios_codigos?: string[];
};

function extrairMensagemErro(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { erro?: string } } }).response;
    if (response?.data?.erro) return response.data.erro;
  }
  return fallback;
}

const maturidadeOptions = [
  { value: 0, label: 'Inicial', descricao: 'Processos imprevisiveis e pouco controlados' },
  { value: 1, label: 'Gerenciado', descricao: 'Processos sao projetos, ainda reativos' },
  { value: 2, label: 'Definido', descricao: 'Processos conhecidos, documentados e proativos' },
  { value: 3, label: 'Qualidade', descricao: 'Processos organizados e medidos' },
  { value: 4, label: 'Otimizacao', descricao: 'Processos organizados, medidos e otimizados' }
];
const mapaMaturidade = new Map(maturidadeOptions.map((item) => [item.value, item]));
const maturidadeExtra = (
  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
    {maturidadeOptions.map((item) => (
      <div key={item.value}>
        {item.value} - {item.label}: {item.descricao}
      </div>
    ))}
  </div>
);

const sancoesOptions = [
  {
    value: 0,
    nome: 'Baixo impacto',
    sancao: 'Advertência',
    descricao:
      'A ANPD notifica a empresa e estabelece prazo para correção da irregularidade, sem multa financeira.'
  },
  {
    value: 1,
    nome: 'Médio impacto',
    sancao: 'Multa diária',
    descricao:
      'Multa aplicada por dia de descumprimento, limitada ao teto legal, enquanto a irregularidade persistir.'
  },
  {
    value: 2,
    nome: 'Alto impacto',
    sancao: 'Multa simples',
    descricao:
      'Até 2% do faturamento da empresa no Brasil, limitada a R$ 50 milhões por infração.'
  },
  {
    value: 3,
    nome: 'Muito alto impacto',
    sancao: 'Publicização da infração',
    descricao:
      'Obrigação de divulgar publicamente a infração cometida, gerando dano reputacional relevante.'
  },
  {
    value: 4,
    nome: 'Crítico',
    sancao: 'Bloqueio ou eliminação dos dados pessoais',
    descricao:
      'Impedimento temporário do uso dos dados ou exclusão definitiva dos dados relacionados à infração.'
  },
  {
    value: 5,
    nome: 'Extremo',
    sancao: 'Suspensão parcial do funcionamento do banco de dados',
    descricao:
      'Parte relevante das operações de dados da empresa fica proibida de operar.'
  },
  {
    value: 6,
    nome: 'Máximo impacto',
    sancao: 'Suspensão ou proibição total do tratamento de dados pessoais',
    descricao:
      'A empresa fica legalmente impedida de tratar dados pessoais, podendo inviabilizar o negócio.'
  }
];
const mapaSancoes = new Map(sancoesOptions.map((item) => [item.value, item]));
const sancoesExtra = (
  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
    {sancoesOptions.map((item) => (
      <div key={item.value}>
        {item.value} - {item.nome} · {item.sancao}: {item.descricao}
      </div>
    ))}
  </div>
);

function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [buscandoCnae, setBuscandoCnae] = useState(false);
  const [cnaeResultados, setCnaeResultados] = useState<CnaeBuscaItem[]>([]);
  const [catalogoCnae, setCatalogoCnae] = useState<Record<string, string>>({});
  const cnaeTimeoutRef = useRef<number | null>(null);
  const cnaeRequestIdRef = useRef(0);
  const [form] = Form.useForm();
  const cnaePrincipalCodigo = Form.useWatch<string | undefined>('cnae_principal_codigo', form);
  const cnaesSecundariosCodigos = Form.useWatch<string[] | undefined>(
    'cnaes_secundarios_codigos',
    form
  );

  async function carregarEmpresas(showMessage = false) {
    try {
      setCarregando(true);
      const response = await api.get('/empresas');
      setEmpresas(response.data);
      if (showMessage) message.success('Empresas atualizadas');
    } catch (err: unknown) {
      message.error(extrairMensagemErro(err, 'Erro ao carregar empresas'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarEmpresas();
  }, []);

  useEffect(() => {
    return () => {
      if (cnaeTimeoutRef.current !== null) {
        window.clearTimeout(cnaeTimeoutRef.current);
      }
    };
  }, []);

  const estaEditando = useMemo(() => editandoId !== null, [editandoId]);

  function incluirNoCatalogoCnae(itens: CnaeBuscaItem[]) {
    if (!itens.length) return;
    setCatalogoCnae((anterior) => {
      const proximo = { ...anterior };
      for (const item of itens) {
        proximo[item.codigo] = item.descricao;
      }
      return proximo;
    });
  }

  async function buscarCnaesOnline(termo: string) {
    const termoLimpo = termo.trim();
    if (termoLimpo.length < 2) {
      setCnaeResultados([]);
      setBuscandoCnae(false);
      return;
    }

    const requestId = ++cnaeRequestIdRef.current;
    setBuscandoCnae(true);
    try {
      const response = await api.get<CnaeBuscaItem[]>('/cnaes/busca', {
        params: { q: termoLimpo, limit: 20 }
      });
      if (requestId !== cnaeRequestIdRef.current) return;
      const resultados = Array.isArray(response.data) ? response.data : [];
      setCnaeResultados(resultados);
      incluirNoCatalogoCnae(resultados);
    } catch {
      if (requestId === cnaeRequestIdRef.current) {
        setCnaeResultados([]);
        message.error('Nao foi possivel consultar a base CNAE');
      }
    } finally {
      if (requestId === cnaeRequestIdRef.current) {
        setBuscandoCnae(false);
      }
    }
  }

  function agendarBuscaCnae(termo: string) {
    if (cnaeTimeoutRef.current !== null) {
      window.clearTimeout(cnaeTimeoutRef.current);
    }
    cnaeTimeoutRef.current = window.setTimeout(() => {
      buscarCnaesOnline(termo);
    }, 300);
  }

  const opcoesCnae = useMemo(() => {
    const mapa = new Map<string, CnaeBuscaItem>();
    for (const item of cnaeResultados) {
      mapa.set(item.codigo, item);
    }

    const codigosSelecionados = [
      cnaePrincipalCodigo,
      ...(cnaesSecundariosCodigos ?? [])
    ].filter(Boolean) as string[];

    for (const codigo of codigosSelecionados) {
      if (!mapa.has(codigo) && catalogoCnae[codigo]) {
        mapa.set(codigo, { codigo, descricao: catalogoCnae[codigo] });
      }
    }

    return Array.from(mapa.values()).map((item) => ({
      value: item.codigo,
      label: `${item.codigo} - ${item.descricao}`
    }));
  }, [catalogoCnae, cnaePrincipalCodigo, cnaesSecundariosCodigos, cnaeResultados]);

  function iniciarEdicao(empresa: Empresa) {
    const cnaesSecundarios = empresa.cnaes_secundarios ?? [];
    incluirNoCatalogoCnae([
      ...(empresa.cnae_principal_codigo && empresa.cnae_principal_descricao
        ? [{ codigo: empresa.cnae_principal_codigo, descricao: empresa.cnae_principal_descricao }]
        : []),
      ...cnaesSecundarios
    ]);

    form.setFieldsValue({
      nome: empresa.nome,
      cnpj: empresa.cnpj,
      matriz_ou_filial: empresa.matriz_ou_filial,
      razao_social: empresa.razao_social,
      ramo_atuacao: empresa.ramo_atuacao ?? undefined,
      cnae_principal_codigo: empresa.cnae_principal_codigo ?? undefined,
      cnae_principal_descricao: empresa.cnae_principal_descricao ?? undefined,
      cnaes_secundarios_codigos: cnaesSecundarios.map((item) => item.codigo),
      cep: empresa.cep ?? undefined,
      endereco: empresa.endereco ?? undefined,
      cidade: empresa.cidade ?? undefined,
      estado: empresa.estado ?? undefined,
      logo_url: empresa.logo_url ?? undefined,
      parametro_maturidade: empresa.parametro_maturidade ?? 0,
      termometro_sancoes_id: empresa.termometro_sancoes_id ?? 0
    });
    if (empresa.logo_url) {
      setLogoFileList([
        {
          uid: `logo-${empresa.id}`,
          name: 'Logomarca',
          status: 'done',
          url: empresa.logo_url
        }
      ]);
    } else {
      setLogoFileList([]);
    }
    setEditandoId(empresa.id);
    setModalAberta(true);
  }

  function resetarFormulario() {
    setEditandoId(null);
    form.resetFields();
    setLogoFileList([]);
    setCnaeResultados([]);
    setBuscandoCnae(false);
    setModalAberta(false);
  }

  async function handleSubmit(values: EmpresaFormValues) {
    setSalvando(true);
    try {
      const principalCodigo = values.cnae_principal_codigo?.trim() || null;
      const principalDescricao = principalCodigo
        ? catalogoCnae[principalCodigo] ?? values.cnae_principal_descricao ?? null
        : null;

      const codigosSecundarios = (values.cnaes_secundarios_codigos ?? [])
        .filter((codigo) => codigo !== principalCodigo)
        .slice(0, 3);

      const cnaesSecundarios = codigosSecundarios
        .map((codigo) => {
          const descricao = catalogoCnae[codigo];
          if (!descricao) return null;
          return { codigo, descricao };
        })
        .filter((item): item is CnaeSecundario => Boolean(item));

      const payload = {
        nome: values.nome,
        cnpj: values.cnpj,
        matriz_ou_filial: values.matriz_ou_filial,
        razao_social: values.razao_social,
        ramo_atuacao: values.ramo_atuacao || null,
        cnae_principal_codigo: principalCodigo,
        cnae_principal_descricao: principalDescricao,
        cnaes_secundarios: cnaesSecundarios,
        cep: values.cep || null,
        endereco: values.endereco || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
        logo_url: values.logo_url || null,
        parametro_maturidade: values.parametro_maturidade ?? 0,
        termometro_sancoes_id: values.termometro_sancoes_id ?? 0
      };
      if (estaEditando && editandoId !== null) {
        const response = await api.put(`/empresas/${editandoId}`, payload);
        const atualizada: Empresa = response.data;
        setEmpresas(prev => prev.map(emp => (emp.id === atualizada.id ? atualizada : emp)));
        message.success('Empresa atualizada');
      } else {
        const response = await api.post('/empresas', payload);
        setEmpresas(prev => [...prev, response.data]);
        message.success('Empresa criada');
      }
      resetarFormulario();
    } catch (err: unknown) {
      message.error(extrairMensagemErro(err, 'Erro ao salvar empresa'));
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.delete(`/empresas/${id}`);
      setEmpresas(prev => prev.filter(e => e.id !== id));
      if (editandoId === id) resetarFormulario();
      message.success('Empresa removida');
    } catch (err: unknown) {
      message.error(extrairMensagemErro(err, 'Erro ao excluir empresa'));
    }
  }

  const uploadAction = `${api.defaults.baseURL ?? ''}/uploads/logos`;
  const token = localStorage.getItem('token');
  const uploadProps: UploadProps = {
    name: 'file',
    action: uploadAction,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    maxCount: 1,
    listType: 'picture',
    onChange(info) {
      const fileList = info.fileList.slice(-1);
      setLogoFileList(fileList);
      const file = fileList[0];
      if (file?.status === 'done') {
        const response = file.response as { url?: string } | undefined;
        const url = response?.url;
        if (url) {
          form.setFieldValue('logo_url', url);
        }
      }
      if (file?.status === 'removed') {
        form.setFieldValue('logo_url', null);
      }
    }
  };

  const opcoesCnaeSecundario = opcoesCnae.map((item) => ({
    ...item,
    disabled: Boolean(cnaePrincipalCodigo) && item.value === cnaePrincipalCodigo
  }));

  function selecionarCnaePrincipal(codigo: string) {
    const descricao = catalogoCnae[codigo];
    form.setFieldValue('cnae_principal_descricao', descricao ?? null);
    const secundarios = form.getFieldValue('cnaes_secundarios_codigos') as string[] | undefined;
    if (Array.isArray(secundarios) && secundarios.includes(codigo)) {
      form.setFieldValue(
        'cnaes_secundarios_codigos',
        secundarios.filter((item) => item !== codigo)
      );
    }
  }

  function alterarCnaesSecundarios(codigos: string[]) {
    if (codigos.length > 3) {
      message.warning('Selecione no máximo 3 CNAEs secundários');
      form.setFieldValue('cnaes_secundarios_codigos', codigos.slice(0, 3));
      return;
    }
    if (cnaePrincipalCodigo && codigos.includes(cnaePrincipalCodigo)) {
      form.setFieldValue(
        'cnaes_secundarios_codigos',
        codigos.filter((item) => item !== cnaePrincipalCodigo)
      );
      return;
    }
    form.setFieldValue('cnaes_secundarios_codigos', codigos);
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Empresas
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre e gerencie as empresas do tenant.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarEmpresas(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetarFormulario();
              setModalAberta(true);
            }}
          >
            Nova empresa
          </Button>
        </Space>
      </Flex>

      <Card title="Lista de empresas">
        {carregando ? (
          <Skeleton active />
        ) : empresas.length === 0 ? (
          <Empty description="Nenhuma empresa cadastrada" />
        ) : (
          <Table
            rowKey="id"
            dataSource={empresas}
            pagination={false}
            size="middle"
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Nome', dataIndex: 'nome' },
              { title: 'CNPJ', dataIndex: 'cnpj' },
              {
                title: 'Tipo',
                dataIndex: 'matriz_ou_filial',
                render: (value: Empresa['matriz_ou_filial']) => (
                  <Tag color={value === 'MATRIZ' ? 'blue' : 'volcano'}>
                    {value}
                  </Tag>
                ),
                width: 120
              },
              {
                title: 'Maturidade',
                dataIndex: 'parametro_maturidade',
                render: (value?: number) => {
                  const info = typeof value === 'number' ? mapaMaturidade.get(value) : undefined;
                  return (
                    <Tag color={info?.value === 0 ? 'default' : info?.value === 1 ? 'gold' : info?.value === 2 ? 'blue' : info?.value === 3 ? 'green' : 'geekblue'}>
                      {info ? `${info.label} (${info.value})` : '—'}
                    </Tag>
                  );
                },
                width: 160
              },
              {
                title: 'Sanções',
                dataIndex: 'termometro_sancoes_id',
                render: (value?: number) => {
                  const info = typeof value === 'number' ? mapaSancoes.get(value) : undefined;
                  return <Tag color="purple">{info ? info.nome : '—'}</Tag>;
                },
                width: 180
              },
              { title: 'Razão Social', dataIndex: 'razao_social' },
              {
                title: 'Ramo de atuação',
                dataIndex: 'ramo_atuacao',
                render: (value?: string | null) => value || '—'
              },
              {
                title: 'CNAE principal',
                dataIndex: 'cnae_principal_codigo',
                render: (_: string | null | undefined, record: Empresa) =>
                  record.cnae_principal_codigo && record.cnae_principal_descricao
                    ? `${record.cnae_principal_codigo} - ${record.cnae_principal_descricao}`
                    : '—'
              },
              {
                title: 'Ações',
                dataIndex: 'acoes',
                width: 160,
                render: (_: unknown, record: Empresa) => (
                  <Space>
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => iniciarEdicao(record)}
                    >
                      Editar
                    </Button>
                    <Popconfirm
                      title="Excluir empresa"
                      description="Confirmar exclusão?"
                      okText="Sim"
                      cancelText="Não"
                      onConfirm={() => handleDelete(record.id)}
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      >
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

      <Modal
        title={
          <Space>
            <Tag color={estaEditando ? 'blue' : 'green'}>
              {estaEditando ? 'Edição' : 'Novo registro'}
            </Tag>
            <span>{estaEditando ? `Empresa #${editandoId}` : 'Cadastrar empresa'}</span>
          </Space>
        }
        open={modalAberta}
        onCancel={resetarFormulario}
        okText={estaEditando ? 'Salvar alterações' : 'Salvar empresa'}
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
            matriz_ou_filial: 'MATRIZ',
            parametro_maturidade: 0,
            termometro_sancoes_id: 0,
            cnaes_secundarios_codigos: []
          }}
        >
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input placeholder="Nome fantasia" />
          </Form.Item>

          <Form.Item
            label="CNPJ"
            name="cnpj"
            rules={[{ required: true, message: 'Informe o CNPJ' }]}
          >
            <Input placeholder="00.000.000/0000-00" />
          </Form.Item>

          <Form.Item
            label="Matriz ou Filial"
            name="matriz_ou_filial"
            rules={[{ required: true, message: 'Selecione o tipo' }]}
          >
            <Select
              options={[
                { value: 'MATRIZ', label: 'Matriz' },
                { value: 'FILIAL', label: 'Filial' }
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Razão Social"
            name="razao_social"
            rules={[{ required: true, message: 'Informe a razão social' }]}
          >
            <Input placeholder="Razão social" />
          </Form.Item>

          <Form.Item label="Ramo de atuação" name="ramo_atuacao">
            <Input placeholder="Ex.: Consultoria em privacidade e governança" maxLength={255} />
          </Form.Item>

          <Form.Item label="CNAE principal" name="cnae_principal_codigo">
            <Select
              showSearch
              allowClear
              placeholder="Digite código ou descrição (mínimo 2 caracteres)"
              filterOption={false}
              onSearch={agendarBuscaCnae}
              options={opcoesCnae}
              loading={buscandoCnae}
              onSelect={selecionarCnaePrincipal}
              onClear={() => form.setFieldValue('cnae_principal_descricao', null)}
              notFoundContent={
                buscandoCnae
                  ? 'Buscando na base oficial...'
                  : 'Digite ao menos 2 caracteres para buscar'
              }
            />
          </Form.Item>

          <Form.Item
            label="CNAEs secundários (até 3)"
            name="cnaes_secundarios_codigos"
            rules={[
              {
                validator: async (_, value: string[] | undefined) => {
                  if (!value || value.length <= 3) return;
                  throw new Error('Selecione no máximo 3 CNAEs secundários');
                }
              }
            ]}
            extra="Busca manual na lista oficial do IBGE/CONCLA."
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Busque e selecione até 3 CNAEs"
              filterOption={false}
              maxCount={3}
              onSearch={agendarBuscaCnae}
              options={opcoesCnaeSecundario}
              loading={buscandoCnae}
              onChange={alterarCnaesSecundarios}
              maxTagCount="responsive"
              notFoundContent={
                buscandoCnae
                  ? 'Buscando na base oficial...'
                  : 'Digite ao menos 2 caracteres para buscar'
              }
            />
          </Form.Item>

          <Form.Item name="cnae_principal_descricao" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            label="Parametro de maturidade"
            name="parametro_maturidade"
            rules={[{ required: true, message: 'Selecione o nivel de maturidade' }]}
            extra={maturidadeExtra}
          >
            <Select
              options={maturidadeOptions.map((item) => ({
                value: item.value,
                label: `${item.label} (${item.value})`
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Termometro de sanções administrativas"
            name="termometro_sancoes_id"
            rules={[{ required: true, message: 'Selecione o nível de impacto' }]}
            extra={sancoesExtra}
          >
            <Select
              options={sancoesOptions.map((item) => ({
                value: item.value,
                label: `${item.nome} · ${item.sancao} (${item.value})`
              }))}
            />
          </Form.Item>

          <Space size="large" style={{ width: '100%' }} wrap>
            <Form.Item label="CEP" name="cep" style={{ minWidth: 160, flex: 1 }}>
              <Input placeholder="00000-000" maxLength={10} />
            </Form.Item>
            <Form.Item label="Estado" name="estado" style={{ minWidth: 120, flex: 1 }}>
              <Input placeholder="UF" maxLength={2} />
            </Form.Item>
            <Form.Item label="Cidade" name="cidade" style={{ minWidth: 200, flex: 2 }}>
              <Input placeholder="Cidade" maxLength={100} />
            </Form.Item>
          </Space>

          <Form.Item label="Endereço" name="endereco">
            <Input placeholder="Rua, número, complemento" maxLength={255} />
          </Form.Item>

          <Form.Item name="logo_url" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item label="Logomarca">
            <Upload {...uploadProps} fileList={logoFileList}>
              <Button icon={<UploadOutlined />}>Enviar logomarca</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Empresas;
