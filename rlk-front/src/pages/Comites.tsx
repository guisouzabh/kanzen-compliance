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
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  message
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  TeamOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type StatusComite = 'ATIVO' | 'INATIVO';
type PapelComite = 'PRESIDENTE' | 'SECRETARIO' | 'MEMBRO';
type TipoComite = 'COMITE' | 'DPO';

interface Comite {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  nome: string;
  descricao?: string | null;
  status: StatusComite;
  tipo: TipoComite;
  total_membros?: number;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface ComiteMembro {
  id: number;
  comite_id: number;
  usuario_id: number;
  papel: PapelComite;
  ativo: number;
  usuario_nome: string;
  usuario_email: string;
}

interface ComiteFormValues {
  nome: string;
  descricao?: string | null;
  status: StatusComite;
}

interface MembroFormValues {
  usuario_id: number;
  papel: PapelComite;
}

function corPapel(papel: PapelComite): string {
  if (papel === 'PRESIDENTE') return 'gold';
  if (papel === 'SECRETARIO') return 'blue';
  return 'default';
}

function Comites() {
  const { empresaSelecionada, empresas } = useEmpresaContext();
  const [comites, setComites] = useState<Comite[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [membros, setMembros] = useState<ComiteMembro[]>([]);
  const [comiteSelecionadoId, setComiteSelecionadoId] = useState<number | null>(null);
  const [carregandoComites, setCarregandoComites] = useState(true);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [salvandoComite, setSalvandoComite] = useState(false);
  const [salvandoMembro, setSalvandoMembro] = useState(false);
  const [modalComiteAberta, setModalComiteAberta] = useState(false);
  const [modalMembroAberta, setModalMembroAberta] = useState(false);
  const [comiteEmEdicao, setComiteEmEdicao] = useState<Comite | null>(null);
  const [formComite] = Form.useForm<ComiteFormValues>();
  const [formMembro] = Form.useForm<MembroFormValues>();

  const comiteSelecionado = useMemo(
    () => comites.find((comite) => comite.id === comiteSelecionadoId) ?? null,
    [comites, comiteSelecionadoId]
  );

  const usuariosDisponiveis = useMemo(() => {
    const membrosIds = new Set(membros.map((membro) => membro.usuario_id));
    return usuarios.filter((usuario) => !membrosIds.has(usuario.id));
  }, [membros, usuarios]);

  async function carregarUsuarios() {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data || []);
    } catch {
      message.error('Erro ao carregar usuários');
    }
  }

  async function carregarComites(showMessage = false) {
    if (!empresaSelecionada) {
      setComites([]);
      setComiteSelecionadoId(null);
      return;
    }

    try {
      setCarregandoComites(true);
      const response = await api.get('/comites', {
        params: { tipo: 'COMITE', empresa_id: empresaSelecionada }
      });
      const lista: Comite[] = response.data || [];
      setComites(lista);
      setComiteSelecionadoId((atual) => {
        if (!lista.length) return null;
        if (atual && lista.some((item) => item.id === atual)) return atual;
        return lista[0].id;
      });
      if (showMessage) {
        message.success('Comitês atualizados');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar comitês');
    } finally {
      setCarregandoComites(false);
    }
  }

  async function carregarMembros(comiteId: number) {
    try {
      setCarregandoMembros(true);
      const response = await api.get(`/comites/${comiteId}/membros`);
      setMembros(response.data || []);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar membros do comitê');
    } finally {
      setCarregandoMembros(false);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  useEffect(() => {
    carregarComites();
  }, [empresaSelecionada]);

  useEffect(() => {
    if (!comiteSelecionadoId) {
      setMembros([]);
      return;
    }
    carregarMembros(comiteSelecionadoId);
  }, [comiteSelecionadoId]);

  function abrirModalNovoComite() {
    setComiteEmEdicao(null);
    formComite.resetFields();
    formComite.setFieldsValue({ status: 'ATIVO' });
    setModalComiteAberta(true);
  }

  function abrirModalEditarComite(comite: Comite) {
    setComiteEmEdicao(comite);
    formComite.setFieldsValue({
      nome: comite.nome,
      descricao: comite.descricao ?? undefined,
      status: comite.status
    });
    setModalComiteAberta(true);
  }

  function fecharModalComite() {
    setComiteEmEdicao(null);
    setModalComiteAberta(false);
    formComite.resetFields();
  }

  async function salvarComite(values: ComiteFormValues) {
    if (!empresaSelecionada) {
      message.warning('Selecione uma empresa para cadastrar o comitê');
      return;
    }

    try {
      setSalvandoComite(true);
      if (comiteEmEdicao?.id) {
        await api.put(`/comites/${comiteEmEdicao.id}`, {
          ...values,
          tipo: 'COMITE',
          empresa_id: empresaSelecionada
        });
        message.success('Comitê atualizado');
        await carregarComites();
      } else {
        const response = await api.post('/comites', {
          ...values,
          tipo: 'COMITE',
          empresa_id: empresaSelecionada
        });
        message.success('Comitê criado');
        await carregarComites();
        const novoId = response.data?.id;
        if (typeof novoId === 'number') {
          setComiteSelecionadoId(novoId);
        }
      }
      fecharModalComite();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar comitê');
    } finally {
      setSalvandoComite(false);
    }
  }

  function confirmarExclusaoComite(comite: Comite) {
    Modal.confirm({
      title: 'Excluir comitê?',
      content: `Essa ação removerá o comitê "${comite.nome}" e seus membros.`,
      okText: 'Excluir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await api.delete(`/comites/${comite.id}`);
          message.success('Comitê excluído');
          await carregarComites();
        } catch (err: any) {
          message.error(err?.response?.data?.erro || 'Erro ao excluir comitê');
        }
      }
    });
  }

  function abrirModalMembro() {
    if (!comiteSelecionadoId) {
      message.warning('Selecione um comitê');
      return;
    }
    formMembro.resetFields();
    formMembro.setFieldsValue({ papel: 'MEMBRO' });
    setModalMembroAberta(true);
  }

  function fecharModalMembro() {
    setModalMembroAberta(false);
    formMembro.resetFields();
  }

  async function adicionarMembro(values: MembroFormValues) {
    if (!comiteSelecionadoId) return;
    try {
      setSalvandoMembro(true);
      await api.post(`/comites/${comiteSelecionadoId}/membros`, values);
      message.success('Membro adicionado');
      fecharModalMembro();
      await carregarMembros(comiteSelecionadoId);
      await carregarComites();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao adicionar membro');
    } finally {
      setSalvandoMembro(false);
    }
  }

  async function removerMembro(membroId: number) {
    if (!comiteSelecionadoId) return;
    try {
      await api.delete(`/comites/${comiteSelecionadoId}/membros/${membroId}`);
      message.success('Membro removido');
      await carregarMembros(comiteSelecionadoId);
      await carregarComites();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao remover membro');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Comitês
          </Typography.Title>
          <Typography.Text type="secondary">
            Cadastre comitês e gerencie membros vinculados a usuários do sistema.
            {empresaSelecionada
              ? ` Empresa selecionada: ${empresas.find((empresa) => empresa.id === empresaSelecionada)?.nome ?? `#${empresaSelecionada}`}.`
              : ' Selecione uma empresa no topo para continuar.'}
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarComites(true)} />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={abrirModalNovoComite}
            disabled={!empresaSelecionada}
          >
            Novo comitê
          </Button>
        </Space>
      </Flex>

      <Card title="Comitês cadastrados">
        {carregandoComites ? (
          <Skeleton active />
        ) : comites.length === 0 ? (
          <Empty description="Nenhum comitê cadastrado" />
        ) : (
          <Table<Comite>
            rowKey="id"
            dataSource={comites}
            pagination={false}
            rowSelection={{
              type: 'radio',
              selectedRowKeys: comiteSelecionadoId ? [comiteSelecionadoId] : [],
              onChange: (selectedKeys) => {
                const selecionado = selectedKeys[0];
                if (typeof selecionado === 'number') {
                  setComiteSelecionadoId(selecionado);
                }
              }
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: 'Nome', dataIndex: 'nome' },
              {
                title: 'Descrição',
                dataIndex: 'descricao',
                render: (value: string | null | undefined) =>
                  value ? value : <Typography.Text type="secondary">—</Typography.Text>
              },
              {
                title: 'Status',
                dataIndex: 'status',
                width: 120,
                render: (value: StatusComite) => <Tag color={value === 'ATIVO' ? 'green' : 'default'}>{value}</Tag>
              },
              {
                title: 'Membros',
                dataIndex: 'total_membros',
                width: 120,
                render: (value?: number) => value ?? 0
              },
              {
                title: 'Ações',
                width: 160,
                render: (_, record) => (
                  <Space>
                    <Button
                      icon={<EditOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        abrirModalEditarComite(record);
                      }}
                    />
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(event) => {
                        event.stopPropagation();
                        confirmarExclusaoComite(record);
                      }}
                    />
                  </Space>
                )
              }
            ]}
          />
        )}
      </Card>

      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>
              {comiteSelecionado
                ? `Membros do comitê: ${comiteSelecionado.nome}`
                : 'Selecione um comitê para gerenciar membros'}
            </span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<UserAddOutlined />} onClick={abrirModalMembro} disabled={!comiteSelecionado}>
            Adicionar membro
          </Button>
        }
      >
        {!comiteSelecionado ? (
          <Empty description="Nenhum comitê selecionado" />
        ) : carregandoMembros ? (
          <Skeleton active />
        ) : membros.length === 0 ? (
          <Empty description="Nenhum membro neste comitê" />
        ) : (
          <Table<ComiteMembro>
            rowKey="id"
            dataSource={membros}
            pagination={false}
            columns={[
              {
                title: 'Nome',
                dataIndex: 'usuario_nome'
              },
              {
                title: 'Email',
                dataIndex: 'usuario_email'
              },
              {
                title: 'Papel',
                dataIndex: 'papel',
                render: (value: PapelComite) => <Tag color={corPapel(value)}>{value}</Tag>
              },
              {
                title: 'Status',
                dataIndex: 'ativo',
                width: 120,
                render: (value: number) => <Tag color={value ? 'green' : 'default'}>{value ? 'ATIVO' : 'INATIVO'}</Tag>
              },
              {
                title: 'Ações',
                width: 140,
                render: (_, record) => (
                  <Popconfirm
                    title="Remover membro?"
                    description="O usuário deixará de participar deste comitê."
                    okText="Remover"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => removerMembro(record.id)}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      Remover
                    </Button>
                  </Popconfirm>
                )
              }
            ]}
          />
        )}
      </Card>

      <Modal
        title={comiteEmEdicao ? 'Editar comitê' : 'Novo comitê'}
        open={modalComiteAberta}
        onCancel={fecharModalComite}
        onOk={() => formComite.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ loading: salvandoComite, icon: <SaveOutlined /> }}
        destroyOnClose
      >
        <Form<ComiteFormValues>
          form={formComite}
          layout="vertical"
          onFinish={salvarComite}
          initialValues={{ status: 'ATIVO' }}
        >
          <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Informe o nome do comitê' }]}>
            <Input placeholder="Nome do comitê" />
          </Form.Item>

          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={4} placeholder="Descrição (opcional)" />
          </Form.Item>

          <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Selecione o status' }]}>
            <Select
              options={[
                { value: 'ATIVO', label: 'Ativo' },
                { value: 'INATIVO', label: 'Inativo' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Adicionar membro ao comitê"
        open={modalMembroAberta}
        onCancel={fecharModalMembro}
        onOk={() => formMembro.submit()}
        okText="Adicionar"
        cancelText="Cancelar"
        okButtonProps={{ loading: salvandoMembro, icon: <SaveOutlined /> }}
        destroyOnClose
      >
        <Form<MembroFormValues>
          form={formMembro}
          layout="vertical"
          onFinish={adicionarMembro}
          initialValues={{ papel: 'MEMBRO' }}
        >
          <Form.Item
            label="Usuário"
            name="usuario_id"
            rules={[{ required: true, message: 'Selecione um usuário' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Selecione um usuário"
              options={usuariosDisponiveis.map((usuario) => ({
                value: usuario.id,
                label: `${usuario.nome} (${usuario.email})`
              }))}
            />
          </Form.Item>

          <Form.Item label="Papel" name="papel" rules={[{ required: true, message: 'Selecione o papel' }]}>
            <Select
              options={[
                { value: 'PRESIDENTE', label: 'Presidente' },
                { value: 'SECRETARIO', label: 'Secretário' },
                { value: 'MEMBRO', label: 'Membro' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Comites;
