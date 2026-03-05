import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message
} from 'antd';
import {
  ReloadOutlined,
  SaveOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';

type StatusComite = 'ATIVO' | 'INATIVO';
type PapelComite = 'PRESIDENTE' | 'SECRETARIO' | 'MEMBRO';

interface ComiteDpo {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  nome: string;
  descricao?: string | null;
  status: StatusComite;
  tipo: 'DPO';
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

interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface DpoComiteFormValues {
  nome: string;
  descricao?: string | null;
  status: StatusComite;
}

interface DpoMembroFormValues {
  usuario_id: number;
  papel: PapelComite;
}

function Dpo() {
  const { empresaSelecionada, empresas } = useEmpresaContext();
  const [carregando, setCarregando] = useState(true);
  const [salvandoComite, setSalvandoComite] = useState(false);
  const [salvandoMembro, setSalvandoMembro] = useState(false);
  const [modalComiteAberta, setModalComiteAberta] = useState(false);
  const [modalMembroAberta, setModalMembroAberta] = useState(false);
  const [comiteDpo, setComiteDpo] = useState<ComiteDpo | null>(null);
  const [membros, setMembros] = useState<ComiteMembro[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [formComite] = Form.useForm<DpoComiteFormValues>();
  const [formMembro] = Form.useForm<DpoMembroFormValues>();

  const membroAtual = membros[0] ?? null;

  async function carregarMembros(comiteId: number) {
    const membrosResp = await api.get(`/comites/${comiteId}/membros`);
    setMembros(membrosResp.data || []);
  }

  async function carregarTela(showMessage = false) {
    if (!empresaSelecionada) {
      setComiteDpo(null);
      setMembros([]);
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      const [comitesResp, usuariosResp] = await Promise.all([
        api.get('/comites', { params: { tipo: 'DPO', empresa_id: empresaSelecionada } }),
        api.get('/usuarios')
      ]);

      const dpo = (comitesResp.data || [])[0] ?? null;
      setComiteDpo(dpo);
      setUsuarios(usuariosResp.data || []);

      if (dpo?.id) {
        await carregarMembros(dpo.id);
      } else {
        setMembros([]);
      }

      if (showMessage) {
        message.success('Dados do DPO atualizados');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar dados do DPO');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarTela();
  }, [empresaSelecionada]);

  function abrirModalComite() {
    if (comiteDpo) {
      formComite.setFieldsValue({
        nome: comiteDpo.nome,
        descricao: comiteDpo.descricao ?? undefined,
        status: comiteDpo.status
      });
    } else {
      formComite.setFieldsValue({
        nome: 'Comitê DPO',
        descricao: null,
        status: 'ATIVO'
      });
    }
    setModalComiteAberta(true);
  }

  function fecharModalComite() {
    setModalComiteAberta(false);
    formComite.resetFields();
  }

  async function salvarComite(values: DpoComiteFormValues) {
    if (!empresaSelecionada) {
      message.warning('Selecione uma empresa para configurar o DPO');
      return;
    }

    try {
      setSalvandoComite(true);
      if (comiteDpo?.id) {
        await api.put(`/comites/${comiteDpo.id}`, {
          ...values,
          tipo: 'DPO',
          empresa_id: empresaSelecionada
        });
        message.success('Comitê DPO atualizado');
      } else {
        await api.post('/comites', {
          ...values,
          tipo: 'DPO',
          empresa_id: empresaSelecionada
        });
        message.success('Comitê DPO criado');
      }
      fecharModalComite();
      await carregarTela();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar comitê DPO');
    } finally {
      setSalvandoComite(false);
    }
  }

  function abrirModalMembro() {
    if (!comiteDpo?.id) {
      message.warning('Crie o comitê DPO antes de definir o responsável');
      return;
    }

    formMembro.setFieldsValue({
      usuario_id: membroAtual?.usuario_id,
      papel: membroAtual?.papel ?? 'PRESIDENTE'
    });
    setModalMembroAberta(true);
  }

  function fecharModalMembro() {
    setModalMembroAberta(false);
    formMembro.resetFields();
  }

  async function salvarMembro(values: DpoMembroFormValues) {
    if (!comiteDpo?.id) return;
    try {
      setSalvandoMembro(true);

      if (
        membroAtual &&
        membroAtual.usuario_id === values.usuario_id &&
        membroAtual.papel === values.papel
      ) {
        message.success('Responsável DPO já está atualizado');
        fecharModalMembro();
        return;
      }

      if (membroAtual) {
        await api.delete(`/comites/${comiteDpo.id}/membros/${membroAtual.id}`);
      }

      await api.post(`/comites/${comiteDpo.id}/membros`, values);
      message.success('Responsável DPO atualizado');
      fecharModalMembro();
      await carregarMembros(comiteDpo.id);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar responsável DPO');
    } finally {
      setSalvandoMembro(false);
    }
  }

  async function removerResponsavel() {
    if (!comiteDpo?.id || !membroAtual) return;
    try {
      await api.delete(`/comites/${comiteDpo.id}/membros/${membroAtual.id}`);
      message.success('Responsável DPO removido');
      await carregarMembros(comiteDpo.id);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao remover responsável DPO');
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="space-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            DPO
          </Typography.Title>
          <Typography.Text type="secondary">
            Funcionalidade dedicada para o comitê do tipo DPO (com membro único).
            {empresaSelecionada
              ? ` Empresa selecionada: ${empresas.find((empresa) => empresa.id === empresaSelecionada)?.nome ?? `#${empresaSelecionada}`}.`
              : ' Selecione uma empresa no topo para continuar.'}
          </Typography.Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => carregarTela(true)} />
          <Button
            type="primary"
            icon={<SafetyOutlined />}
            onClick={abrirModalComite}
            disabled={!empresaSelecionada}
          >
            {comiteDpo ? 'Editar comitê DPO' : 'Criar comitê DPO'}
          </Button>
        </Space>
      </Flex>

      <Card title="Comitê DPO">
        {carregando ? (
          <Skeleton active />
        ) : !comiteDpo ? (
          <Empty description="Nenhum comitê DPO cadastrado" />
        ) : (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Nome">{comiteDpo.nome}</Descriptions.Item>
            <Descriptions.Item label="Descrição">
              {comiteDpo.descricao || <Typography.Text type="secondary">—</Typography.Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={comiteDpo.status === 'ATIVO' ? 'green' : 'default'}>{comiteDpo.status}</Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card
        title={
          <Space>
            <TeamOutlined />
            <span>Responsável DPO</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<UserSwitchOutlined />}
            onClick={abrirModalMembro}
            disabled={!empresaSelecionada || !comiteDpo}
          >
            {membroAtual ? 'Trocar responsável' : 'Definir responsável'}
          </Button>
        }
      >
        {carregando ? (
          <Skeleton active />
        ) : !comiteDpo ? (
          <Empty description="Crie o comitê DPO para definir o responsável" />
        ) : !membroAtual ? (
          <Empty description="Nenhum responsável definido para o DPO" />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Nome">{membroAtual.usuario_nome}</Descriptions.Item>
              <Descriptions.Item label="Email">{membroAtual.usuario_email}</Descriptions.Item>
              <Descriptions.Item label="Papel">
                <Tag color="gold">{membroAtual.papel}</Tag>
              </Descriptions.Item>
            </Descriptions>
            <div>
              <Button danger onClick={removerResponsavel}>
                Remover responsável
              </Button>
            </div>
          </Space>
        )}
      </Card>

      <Modal
        title={comiteDpo ? 'Editar comitê DPO' : 'Criar comitê DPO'}
        open={modalComiteAberta}
        onCancel={fecharModalComite}
        onOk={() => formComite.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ loading: salvandoComite, icon: <SaveOutlined /> }}
        destroyOnClose
      >
        <Form<DpoComiteFormValues>
          form={formComite}
          layout="vertical"
          onFinish={salvarComite}
          initialValues={{ nome: 'Comitê DPO', status: 'ATIVO' }}
        >
          <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Informe o nome do comitê DPO' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={4} placeholder="Descrição opcional" />
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
        title="Definir responsável DPO"
        open={modalMembroAberta}
        onCancel={fecharModalMembro}
        onOk={() => formMembro.submit()}
        okText="Salvar"
        cancelText="Cancelar"
        okButtonProps={{ loading: salvandoMembro, icon: <SaveOutlined /> }}
        destroyOnClose
      >
        <Form<DpoMembroFormValues>
          form={formMembro}
          layout="vertical"
          onFinish={salvarMembro}
          initialValues={{ papel: 'PRESIDENTE' }}
        >
          <Form.Item
            label="Usuário"
            name="usuario_id"
            rules={[{ required: true, message: 'Selecione um usuário' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={usuarios.map((usuario) => ({
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

export default Dpo;
