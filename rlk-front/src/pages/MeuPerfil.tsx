import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Tabs,
  Typography,
  message
} from 'antd';
import { LockOutlined, ReloadOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import api from '../services/api';

type Perfil = {
  id: number;
  nome: string;
  email: string;
  foto_url?: string | null;
};

type PerfilForm = {
  nome: string;
  email: string;
  foto_url?: string | null;
};

type SenhaForm = {
  senha_atual: string;
  nova_senha: string;
  confirmar_nova_senha: string;
};

function MeuPerfil() {
  const location = useLocation();
  const [carregando, setCarregando] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [formPerfil] = Form.useForm<PerfilForm>();
  const [formSenha] = Form.useForm<SenhaForm>();

  const abaInicial = useMemo(() => {
    const state = location.state as { tab?: string } | null;
    return state?.tab === 'senha' ? 'senha' : 'dados';
  }, [location.state]);

  async function carregarPerfil(showMessage = false) {
    try {
      setCarregando(true);
      const response = await api.get('/usuarios/me');
      const dados: Perfil = response.data;
      setPerfil(dados);
      formPerfil.setFieldsValue({
        nome: dados.nome,
        email: dados.email,
        foto_url: dados.foto_url ?? null
      });
      if (showMessage) message.success('Perfil atualizado');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar perfil');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPerfil();
  }, []);

  async function salvarPerfil(values: PerfilForm) {
    try {
      setSalvandoPerfil(true);
      const payload = {
        nome: values.nome,
        email: values.email,
        foto_url: values.foto_url || null
      };
      const response = await api.put('/usuarios/me', payload);
      const atualizado: Perfil = response.data;
      setPerfil(atualizado);
      message.success('Perfil salvo com sucesso');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar perfil');
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function trocarSenha(values: SenhaForm) {
    if (values.nova_senha !== values.confirmar_nova_senha) {
      message.error('A confirmação da nova senha não confere');
      return;
    }
    try {
      setSalvandoSenha(true);
      await api.post('/usuarios/me/trocar-senha', {
        senha_atual: values.senha_atual,
        nova_senha: values.nova_senha
      });
      formSenha.resetFields();
      message.success('Senha alterada com sucesso');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao trocar senha');
    } finally {
      setSalvandoSenha(false);
    }
  }

  const fotoPreview = Form.useWatch('foto_url', formPerfil);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <FlexHeader
        carregando={carregando}
        onReload={() => carregarPerfil(true)}
      />

      <Tabs
        defaultActiveKey={abaInicial}
        items={[
          {
            key: 'dados',
            label: 'Dados do perfil',
            children: (
              <Card>
                <Row gutter={24} align="middle">
                  <Col xs={24} md={8}>
                    <Space direction="vertical" align="center" style={{ width: '100%' }}>
                      <Avatar
                        size={110}
                        icon={<UserOutlined />}
                        src={(fotoPreview || perfil?.foto_url) ?? undefined}
                        style={{ backgroundColor: '#0b5be1' }}
                      />
                      <Typography.Text type="secondary">
                        URL da foto exibida no menu do usuário
                      </Typography.Text>
                    </Space>
                  </Col>
                  <Col xs={24} md={16}>
                    <Form form={formPerfil} layout="vertical" onFinish={salvarPerfil}>
                      <Form.Item
                        label="Nome"
                        name="nome"
                        rules={[{ required: true, message: 'Informe seu nome' }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label="E-mail"
                        name="email"
                        rules={[{ required: true, message: 'Informe seu e-mail' }, { type: 'email' }]}
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        label="URL da foto"
                        name="foto_url"
                        rules={[{ type: 'url', message: 'Informe uma URL válida' }]}
                      >
                        <Input placeholder="https://..." />
                      </Form.Item>

                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={salvandoPerfil}
                      >
                        Salvar perfil
                      </Button>
                    </Form>
                  </Col>
                </Row>
              </Card>
            )
          },
          {
            key: 'senha',
            label: 'Trocar senha',
            children: (
              <Card>
                <Form form={formSenha} layout="vertical" onFinish={trocarSenha}>
                  <Form.Item
                    label="Senha atual"
                    name="senha_atual"
                    rules={[{ required: true, message: 'Informe sua senha atual' }]}
                  >
                    <Input.Password />
                  </Form.Item>

                  <Form.Item
                    label="Nova senha"
                    name="nova_senha"
                    rules={[{ required: true, message: 'Informe a nova senha' }, { min: 6 }]}
                  >
                    <Input.Password />
                  </Form.Item>

                  <Form.Item
                    label="Confirmar nova senha"
                    name="confirmar_nova_senha"
                    rules={[{ required: true, message: 'Confirme a nova senha' }]}
                  >
                    <Input.Password />
                  </Form.Item>

                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<LockOutlined />}
                    loading={salvandoSenha}
                  >
                    Alterar senha
                  </Button>
                </Form>
              </Card>
            )
          }
        ]}
      />
    </Space>
  );
}

function FlexHeader({
  carregando,
  onReload
}: {
  carregando: boolean;
  onReload: () => void;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Button icon={<ReloadOutlined />} loading={carregando} onClick={onReload}>
        Recarregar
      </Button>
    </div>
  );
}

export default MeuPerfil;
