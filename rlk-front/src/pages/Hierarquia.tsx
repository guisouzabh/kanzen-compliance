import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Skeleton,
  Space,
  Tag,
  Tree,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

interface Empresa {
  id: number;
  nome: string;
}

interface Unidade {
  id: number;
  nome: string;
  empresa_id: number;
  ativo?: number;
}

interface Area {
  id: number;
  nome: string;
  unidade_id: number;
  ativo?: number;
}

interface SubArea {
  id: number;
  nome: string;
  area_id: number;
  ativo?: number;
}

interface SubArea2 {
  id: number;
  nome: string;
  subarea_id: number;
  ativo?: number;
}

type HierarquiaTipo = 'empresa' | 'unidade' | 'area' | 'subarea' | 'subarea2';

interface Selecionado {
  tipo: HierarquiaTipo;
  id: number;
}

interface HierarquiaNode {
  key: string;
  title: React.ReactNode;
  children?: HierarquiaNode[];
}

interface FormValues {
  nome: string;
  unidade_id?: number;
  area_id?: number;
  subarea_id?: number;
}

interface FilhoResumo {
  tipo: HierarquiaTipo;
  id: number;
  nome: string;
}

const LABELS: Record<HierarquiaTipo, string> = {
  empresa: 'Empresa',
  unidade: 'Unidade',
  area: 'Área',
  subarea: 'Subárea',
  subarea2: 'Subárea 2'
};

const CORES: Record<HierarquiaTipo, string> = {
  empresa: 'blue',
  unidade: 'geekblue',
  area: 'purple',
  subarea: 'gold',
  subarea2: 'green'
};

const FILHO_POR_TIPO: Record<HierarquiaTipo, HierarquiaTipo | null> = {
  empresa: 'unidade',
  unidade: 'area',
  area: 'subarea',
  subarea: 'subarea2',
  subarea2: null
};

function keyFromSelecionado(selecionado: Selecionado): string {
  return `${selecionado.tipo}:${selecionado.id}`;
}

function selecionadoFromKey(key: string): Selecionado | null {
  const [tipo, idRaw] = key.split(':');
  const id = Number(idRaw);

  if (
    Number.isNaN(id) ||
    !tipo ||
    !['empresa', 'unidade', 'area', 'subarea', 'subarea2'].includes(tipo)
  ) {
    return null;
  }

  return { tipo: tipo as HierarquiaTipo, id };
}

function getErrorMessage(err: any, fallback: string): string {
  const status = err?.response?.status;
  if (status === 401) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (status === 403) {
    return 'Acesso negado para cadastro. Entre com perfil GESTOR.';
  }
  return err?.response?.data?.erro || fallback;
}

function Hierarquia() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [subareas, setSubareas] = useState<SubArea[]>([]);
  const [subareas2, setSubareas2] = useState<SubArea2[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberta, setModalAberta] = useState(false);
  const [modoModal, setModoModal] = useState<'create' | 'edit'>('create');
  const [tipoModal, setTipoModal] = useState<HierarquiaTipo>('unidade');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [selecionado, setSelecionado] = useState<Selecionado | null>(null);
  const [form] = Form.useForm<FormValues>();
  const { empresas, empresaSelecionada } = useEmpresaContext();

  const empresaAtual = useMemo<Empresa | null>(() => {
    if (!empresaSelecionada) return null;
    return empresas.find((empresa) => empresa.id === empresaSelecionada) ?? null;
  }, [empresas, empresaSelecionada]);

  const unidadesEmpresa = useMemo(() => {
    if (!empresaSelecionada) return [];
    return unidades.filter((unidade) => unidade.empresa_id === empresaSelecionada);
  }, [unidades, empresaSelecionada]);

  const unidadeIds = useMemo(() => new Set(unidadesEmpresa.map((item) => item.id)), [unidadesEmpresa]);

  const areasEmpresa = useMemo(
    () => areas.filter((area) => unidadeIds.has(area.unidade_id)),
    [areas, unidadeIds]
  );

  const areaIds = useMemo(() => new Set(areasEmpresa.map((item) => item.id)), [areasEmpresa]);

  const subareasEmpresa = useMemo(
    () => subareas.filter((subarea) => areaIds.has(subarea.area_id)),
    [subareas, areaIds]
  );

  const subareaIds = useMemo(
    () => new Set(subareasEmpresa.map((item) => item.id)),
    [subareasEmpresa]
  );

  const subareas2Empresa = useMemo(
    () => subareas2.filter((subarea2) => subareaIds.has(subarea2.subarea_id)),
    [subareas2, subareaIds]
  );

  const unidadeById = useMemo(() => new Map(unidadesEmpresa.map((item) => [item.id, item])), [unidadesEmpresa]);
  const areaById = useMemo(() => new Map(areasEmpresa.map((item) => [item.id, item])), [areasEmpresa]);
  const subareaById = useMemo(
    () => new Map(subareasEmpresa.map((item) => [item.id, item])),
    [subareasEmpresa]
  );
  const subarea2ById = useMemo(
    () => new Map(subareas2Empresa.map((item) => [item.id, item])),
    [subareas2Empresa]
  );

  async function carregar(showMessage = false) {
    try {
      setCarregando(true);
      const [unidadesResp, areasResp, subareasResp, subareas2Resp] = await Promise.all([
        api.get('/unidades'),
        api.get('/areas'),
        api.get('/subareas'),
        api.get('/subareas2')
      ]);

      setUnidades(unidadesResp.data || []);
      setAreas(areasResp.data || []);
      setSubareas(subareasResp.data || []);
      setSubareas2(subareas2Resp.data || []);

      if (showMessage) {
        message.success('Hierarquia atualizada');
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, 'Erro ao carregar hierarquia'));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!empresaSelecionada) {
      setSelecionado(null);
      return;
    }

    setSelecionado({ tipo: 'empresa', id: empresaSelecionada });
  }, [empresaSelecionada]);

  const treeData = useMemo<HierarquiaNode[]>(() => {
    if (!empresaAtual) return [];

    const areasByUnidade = new Map<number, Area[]>();
    const subareasByArea = new Map<number, SubArea[]>();
    const subareas2BySubarea = new Map<number, SubArea2[]>();

    for (const area of areasEmpresa) {
      const list = areasByUnidade.get(area.unidade_id) ?? [];
      list.push(area);
      areasByUnidade.set(area.unidade_id, list);
    }

    for (const subarea of subareasEmpresa) {
      const list = subareasByArea.get(subarea.area_id) ?? [];
      list.push(subarea);
      subareasByArea.set(subarea.area_id, list);
    }

    for (const subarea2 of subareas2Empresa) {
      const list = subareas2BySubarea.get(subarea2.subarea_id) ?? [];
      list.push(subarea2);
      subareas2BySubarea.set(subarea2.subarea_id, list);
    }

    const unidadesOrdenadas = [...unidadesEmpresa].sort((a, b) => a.nome.localeCompare(b.nome));

    return [
      {
        key: keyFromSelecionado({ tipo: 'empresa', id: empresaAtual.id }),
        title: (
          <Space size="small">
            <Tag color={CORES.empresa}>{LABELS.empresa}</Tag>
            <span>{empresaAtual.nome}</span>
          </Space>
        ),
        children: unidadesOrdenadas.map((unidade) => ({
          key: keyFromSelecionado({ tipo: 'unidade', id: unidade.id }),
          title: (
            <Space size="small">
              <Tag color={CORES.unidade}>{LABELS.unidade}</Tag>
              <span>{unidade.nome}</span>
            </Space>
          ),
          children: (areasByUnidade.get(unidade.id) ?? [])
            .slice()
            .sort((a, b) => a.nome.localeCompare(b.nome))
            .map((area) => ({
              key: keyFromSelecionado({ tipo: 'area', id: area.id }),
              title: (
                <Space size="small">
                  <Tag color={CORES.area}>{LABELS.area}</Tag>
                  <span>{area.nome}</span>
                </Space>
              ),
              children: (subareasByArea.get(area.id) ?? [])
                .slice()
                .sort((a, b) => a.nome.localeCompare(b.nome))
                .map((subarea) => ({
                  key: keyFromSelecionado({ tipo: 'subarea', id: subarea.id }),
                  title: (
                    <Space size="small">
                      <Tag color={CORES.subarea}>{LABELS.subarea}</Tag>
                      <span>{subarea.nome}</span>
                    </Space>
                  ),
                  children: (subareas2BySubarea.get(subarea.id) ?? [])
                    .slice()
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((subarea2) => ({
                      key: keyFromSelecionado({ tipo: 'subarea2', id: subarea2.id }),
                      title: (
                        <Space size="small">
                          <Tag color={CORES.subarea2}>{LABELS.subarea2}</Tag>
                          <span>{subarea2.nome}</span>
                        </Space>
                      )
                    }))
                }))
            }))
        }))
      }
    ];
  }, [empresaAtual, unidadesEmpresa, areasEmpresa, subareasEmpresa, subareas2Empresa]);

  const selecionadoNome = useMemo(() => {
    if (!selecionado) return null;

    if (selecionado.tipo === 'empresa') {
      return empresaAtual?.nome ?? null;
    }

    if (selecionado.tipo === 'unidade') {
      return unidadeById.get(selecionado.id)?.nome ?? null;
    }

    if (selecionado.tipo === 'area') {
      return areaById.get(selecionado.id)?.nome ?? null;
    }

    if (selecionado.tipo === 'subarea') {
      return subareaById.get(selecionado.id)?.nome ?? null;
    }

    return subarea2ById.get(selecionado.id)?.nome ?? null;
  }, [selecionado, empresaAtual, unidadeById, areaById, subareaById, subarea2ById]);

  const filhosSelecionado = useMemo<FilhoResumo[]>(() => {
    if (!selecionado) return [];

    if (selecionado.tipo === 'empresa') {
      return unidadesEmpresa
        .slice()
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((item) => ({ tipo: 'unidade', id: item.id, nome: item.nome }));
    }

    if (selecionado.tipo === 'unidade') {
      return areasEmpresa
        .filter((item) => item.unidade_id === selecionado.id)
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((item) => ({ tipo: 'area', id: item.id, nome: item.nome }));
    }

    if (selecionado.tipo === 'area') {
      return subareasEmpresa
        .filter((item) => item.area_id === selecionado.id)
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((item) => ({ tipo: 'subarea', id: item.id, nome: item.nome }));
    }

    if (selecionado.tipo === 'subarea') {
      return subareas2Empresa
        .filter((item) => item.subarea_id === selecionado.id)
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((item) => ({ tipo: 'subarea2', id: item.id, nome: item.nome }));
    }

    return [];
  }, [selecionado, unidadesEmpresa, areasEmpresa, subareasEmpresa, subareas2Empresa]);

  const podeCriarFilho = Boolean(selecionado && FILHO_POR_TIPO[selecionado.tipo]);
  const podeEditar = Boolean(selecionado && selecionado.tipo !== 'empresa');

  function abrirModalCriarFilho() {
    if (!selecionado) return;

    const filhoTipo = FILHO_POR_TIPO[selecionado.tipo];
    if (!filhoTipo) return;

    const defaults: FormValues = { nome: '' };

    if (filhoTipo === 'area' && selecionado.tipo === 'unidade') {
      defaults.unidade_id = selecionado.id;
    }

    if (filhoTipo === 'subarea' && selecionado.tipo === 'area') {
      defaults.area_id = selecionado.id;
    }

    if (filhoTipo === 'subarea2' && selecionado.tipo === 'subarea') {
      defaults.subarea_id = selecionado.id;
    }

    form.setFieldsValue(defaults);
    setModoModal('create');
    setTipoModal(filhoTipo);
    setEditandoId(null);
    setModalAberta(true);
  }

  function abrirModalEditar() {
    if (!selecionado || selecionado.tipo === 'empresa') return;

    const defaults: FormValues = { nome: '' };

    if (selecionado.tipo === 'unidade') {
      const unidade = unidadeById.get(selecionado.id);
      if (!unidade) return;
      defaults.nome = unidade.nome;
    }

    if (selecionado.tipo === 'area') {
      const area = areaById.get(selecionado.id);
      if (!area) return;
      defaults.nome = area.nome;
      defaults.unidade_id = area.unidade_id;
    }

    if (selecionado.tipo === 'subarea') {
      const subarea = subareaById.get(selecionado.id);
      if (!subarea) return;
      defaults.nome = subarea.nome;
      defaults.area_id = subarea.area_id;
    }

    if (selecionado.tipo === 'subarea2') {
      const subarea2 = subarea2ById.get(selecionado.id);
      if (!subarea2) return;
      defaults.nome = subarea2.nome;
      defaults.subarea_id = subarea2.subarea_id;
    }

    form.setFieldsValue(defaults);
    setModoModal('edit');
    setTipoModal(selecionado.tipo);
    setEditandoId(selecionado.id);
    setModalAberta(true);
  }

  function fecharModal() {
    setModalAberta(false);
    setEditandoId(null);
    form.resetFields();
  }

  async function salvar(values: FormValues) {
    setSalvando(true);

    try {
      let response: { data?: { id?: number } } | null = null;

      if (tipoModal === 'unidade') {
        if (!empresaSelecionada) {
          message.error('Selecione uma empresa para cadastrar unidade');
          return;
        }

        const payload = {
          nome: values.nome,
          empresa_id: empresaSelecionada,
          descricao: null
        };

        response =
          modoModal === 'create'
            ? await api.post('/unidades', payload)
            : await api.put(`/unidades/${editandoId}`, payload);
      }

      if (tipoModal === 'area') {
        if (!values.unidade_id) {
          message.error('Selecione uma unidade');
          return;
        }

        const payload = {
          nome: values.nome,
          unidade_id: values.unidade_id,
          descricao: null,
          latitude: null,
          longitude: null
        };

        response =
          modoModal === 'create'
            ? await api.post('/areas', payload)
            : await api.put(`/areas/${editandoId}`, payload);
      }

      if (tipoModal === 'subarea') {
        if (!values.area_id) {
          message.error('Selecione uma área');
          return;
        }

        const payload = {
          nome: values.nome,
          area_id: values.area_id,
          descricao: null
        };

        response =
          modoModal === 'create'
            ? await api.post('/subareas', payload)
            : await api.put(`/subareas/${editandoId}`, payload);
      }

      if (tipoModal === 'subarea2') {
        if (!values.subarea_id) {
          message.error('Selecione uma subárea');
          return;
        }

        const payload = {
          nome: values.nome,
          subarea_id: values.subarea_id,
          descricao: null
        };

        response =
          modoModal === 'create'
            ? await api.post('/subareas2', payload)
            : await api.put(`/subareas2/${editandoId}`, payload);
      }

      const registroId = Number(response?.data?.id);

      await carregar();
      fecharModal();

      message.success(modoModal === 'create' ? 'Registro criado' : 'Registro atualizado');

      if (!Number.isNaN(registroId) && registroId > 0) {
        setSelecionado({ tipo: tipoModal, id: registroId });
        return;
      }

      if (empresaSelecionada) {
        setSelecionado({ tipo: 'empresa', id: empresaSelecionada });
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, 'Erro ao salvar registro da hierarquia'));
    } finally {
      setSalvando(false);
    }
  }

  async function excluirSelecionado() {
    if (!selecionado || selecionado.tipo === 'empresa') return;

    try {
      if (selecionado.tipo === 'unidade') {
        await api.delete(`/unidades/${selecionado.id}`);
      }

      if (selecionado.tipo === 'area') {
        await api.delete(`/areas/${selecionado.id}`);
      }

      if (selecionado.tipo === 'subarea') {
        await api.delete(`/subareas/${selecionado.id}`);
      }

      if (selecionado.tipo === 'subarea2') {
        await api.delete(`/subareas2/${selecionado.id}`);
      }

      message.success(`${LABELS[selecionado.tipo]} removida/inativada em cascata com sucesso`);
      await carregar();

      if (empresaSelecionada) {
        setSelecionado({ tipo: 'empresa', id: empresaSelecionada });
      }
    } catch (err: any) {
      message.error(getErrorMessage(err, `Erro ao excluir ${LABELS[selecionado.tipo].toLowerCase()}`));
    }
  }

  const selectedKeys = selecionado ? [keyFromSelecionado(selecionado)] : [];

  const tituloModal = `${modoModal === 'create' ? 'Cadastrar' : 'Editar'} ${LABELS[tipoModal]}`;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Hierarquia
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastro unificado de Unidade, Área, Subárea e Subárea 2 em uma única tela.
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregar(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={abrirModalCriarFilho}
            disabled={!podeCriarFilho}
          >
            Adicionar filho
          </Button>
        </Space>
      </Flex>

      {!empresaAtual && !carregando ? (
        <Card>
          <Empty description="Selecione uma empresa para gerenciar a hierarquia" />
        </Card>
      ) : (
        <Row gutter={16} align="stretch">
          <Col xs={24} lg={12}>
            <Card title="Árvore hierárquica" style={{ height: '100%' }}>
              {carregando ? (
                <Skeleton active />
              ) : treeData.length === 0 ? (
                <Empty description="Nenhum dado de hierarquia encontrado" />
              ) : (
                <Tree
                  showLine
                  defaultExpandAll
                  treeData={treeData}
                  selectedKeys={selectedKeys}
                  onSelect={(keys) => {
                    const key = keys[0];
                    if (!key) return;
                    const parsed = selecionadoFromKey(String(key));
                    if (parsed) setSelecionado(parsed);
                  }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Gestão do nó selecionado" style={{ height: '100%' }}>
              {!selecionado ? (
                <Empty description="Selecione um item da árvore" />
              ) : (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Space align="center" wrap>
                    <Tag color={CORES[selecionado.tipo]}>{LABELS[selecionado.tipo]}</Tag>
                    <Typography.Text strong>{selecionadoNome || 'Registro não encontrado'}</Typography.Text>
                    <Typography.Text type="secondary">#{selecionado.id}</Typography.Text>
                  </Space>

                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={abrirModalCriarFilho}
                      disabled={!podeCriarFilho}
                    >
                      Adicionar filho
                    </Button>

                    <Button icon={<EditOutlined />} onClick={abrirModalEditar} disabled={!podeEditar}>
                      Editar
                    </Button>

                    <Popconfirm
                      title={`Excluir ${LABELS[selecionado.tipo].toLowerCase()}`}
                      description="A ação aplica cascata e pode desativar registros vinculados. Confirmar?"
                      okText="Sim"
                      cancelText="Não"
                      onConfirm={excluirSelecionado}
                      okButtonProps={{ danger: true }}
                      disabled={!podeEditar}
                    >
                      <Button danger icon={<DeleteOutlined />} disabled={!podeEditar}>
                        Excluir
                      </Button>
                    </Popconfirm>
                  </Space>

                  <Card size="small" title="Filhos diretos">
                    {filhosSelecionado.length === 0 ? (
                      <Typography.Text type="secondary">Sem filhos diretos neste nível.</Typography.Text>
                    ) : (
                      <Space wrap>
                        {filhosSelecionado.map((filho) => (
                          <Tag
                            key={`${filho.tipo}-${filho.id}`}
                            color={CORES[filho.tipo]}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setSelecionado({ tipo: filho.tipo, id: filho.id })}
                          >
                            {LABELS[filho.tipo]}: {filho.nome}
                          </Tag>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Space>
              )}
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title={tituloModal}
        open={modalAberta}
        onCancel={fecharModal}
        destroyOnClose
        confirmLoading={salvando}
        okText={modoModal === 'create' ? 'Cadastrar' : 'Salvar'}
        onOk={() => form.submit()}
      >
        <Form<FormValues> form={form} layout="vertical" onFinish={salvar}>
          <Form.Item
            label="Nome"
            name="nome"
            rules={[{ required: true, whitespace: true, message: 'Nome é obrigatório' }]}
          >
            <Input maxLength={150} placeholder={`Nome da ${LABELS[tipoModal].toLowerCase()}`} />
          </Form.Item>

          {tipoModal === 'area' ? (
            <Form.Item
              label="Unidade"
              name="unidade_id"
              rules={[{ required: true, message: 'Unidade é obrigatória' }]}
            >
              <Select
                placeholder="Selecione a unidade"
                options={unidadesEmpresa.map((unidade) => ({
                  value: unidade.id,
                  label: unidade.nome
                }))}
              />
            </Form.Item>
          ) : null}

          {tipoModal === 'subarea' ? (
            <Form.Item
              label="Área"
              name="area_id"
              rules={[{ required: true, message: 'Área é obrigatória' }]}
            >
              <Select
                placeholder="Selecione a área"
                options={areasEmpresa.map((area) => ({ value: area.id, label: area.nome }))}
              />
            </Form.Item>
          ) : null}

          {tipoModal === 'subarea2' ? (
            <Form.Item
              label="Subárea"
              name="subarea_id"
              rules={[{ required: true, message: 'Subárea é obrigatória' }]}
            >
              <Select
                placeholder="Selecione a subárea"
                options={subareasEmpresa.map((subarea) => ({
                  value: subarea.id,
                  label: subarea.nome
                }))}
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </Space>
  );
}

export default Hierarquia;
