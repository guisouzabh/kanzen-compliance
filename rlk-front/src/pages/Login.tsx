import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Form, Input, Typography, Space, Flex } from 'antd';
import api from '../services/api';

const { Title, Text } = Typography;

export default function Login() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  async function handleSubmit(values: { email: string; senha: string }) {
    setErro(null);
    setCarregando(true);

    try {
      const response = await api.post('/auth/login', values);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setErro(err?.response?.data?.erro || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f1ff 0%, #f6f8fb 50%, #fff4d9 100%)' }}
    >
      <Card
        style={{ width: 360, boxShadow: '0 20px 60px -24px rgba(0,0,0,0.25)' }}
        bordered={false}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 4, color: '#0b5be1' }}>
              RLK Login
            </Title>
            <Text type="secondary">Acesse o painel administrativo</Text>
          </div>

          {erro && <Alert type="error" message={erro} showIcon />}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ email: 'admin@teste.com', senha: '123456' }}
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Informe o email' },
                { type: 'email', message: 'Email inválido' }
              ]}
            >
              <Input placeholder="voce@empresa.com" />
            </Form.Item>

            <Form.Item
              label="Senha"
              name="senha"
              rules={[{ required: true, message: 'Informe a senha' }]}
            >
              <Input.Password placeholder="••••••" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={carregando}
              size="large"
            >
              Entrar
            </Button>
          </Form>
        </Space>
      </Card>
    </Flex>
  );
}
