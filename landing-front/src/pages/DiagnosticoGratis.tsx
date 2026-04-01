import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Tag,
  Typography
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  MessageOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { api } from '../services/api';

const { Title, Paragraph, Text } = Typography;

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string) ?? '5500000000000';

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
];

const NUM_FUNCIONARIOS_OPCOES = [
  '1 a 10',
  '11 a 50',
  '51 a 200',
  '201 a 500',
  '501 a 1000',
  'Mais de 1000'
];

type Pergunta = {
  id: number;
  codigo: string;
  dominio: string;
  macro_dominio: string;
  pergunta: string;
  opcao_0: string;
  opcao_1: string;
  opcao_2: string;
  opcao_3: string;
  peso: number;
  ordem: number;
};

type Lead = {
  nome?: string;
  email: string;
  celular?: string;
  empresa: string;
  ramo?: string;
  num_funcionarios?: string;
  cidade?: string;
  estado?: string;
};

type Resultado = {
  nota_geral: number;
  resultados_dominio: { dominio: string; nota: number }[];
  resultados_macro: { macro_dominio: string; nota: number }[];
};

type Step = 'intro' | 'perguntas' | 'dados' | 'resultado';

function nivelMaturidade(nota: number): { label: string; color: string } {
  if (nota < 20) return { label: 'Inicial', color: '#ff4d4f' };
  if (nota < 40) return { label: 'Em desenvolvimento', color: '#fa8c16' };
  if (nota < 60) return { label: 'Gerenciado', color: '#fadb14' };
  if (nota < 80) return { label: 'Definido', color: '#52c41a' };
  return { label: 'Otimizado', color: '#1677ff' };
}

function progressColor(nota: number): string {
  if (nota < 30) return '#ff4d4f';
  if (nota < 60) return '#fa8c16';
  if (nota < 80) return '#52c41a';
  return '#1677ff';
}

function groupByMacro(perguntas: Pergunta[]): Map<string, Pergunta[]> {
  const map = new Map<string, Pergunta[]>();
  for (const p of perguntas) {
    const macro = p.macro_dominio || p.dominio;
    if (!map.has(macro)) map.set(macro, []);
    map.get(macro)!.push(p);
  }
  return map;
}

type Props = { onBack: () => void };

export default function DiagnosticoGratis({ onBack }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [macroAtual, setMacroAtual] = useState(0);
  const [form] = Form.useForm<Lead>();

  const grupos = groupByMacro(perguntas);
  const macros = Array.from(grupos.keys());
  const totalPerguntas = perguntas.length;
  const respondidas = Object.keys(respostas).length;

  useEffect(() => {
    setLoading(true);
    api
      .get<Pergunta[]>('/api/v1/public/diagnostico/perguntas')
      .then((data) => setPerguntas(data))
      .catch(() => setErro('Não foi possível carregar o diagnóstico. Tente novamente.'))
      .finally(() => setLoading(false));
  }, []);

  function responder(perguntaId: number, opcao: number) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: opcao }));
  }

  function grupoCompleto(macro: string): boolean {
    return (grupos.get(macro) ?? []).every((p) => respostas[p.id] !== undefined);
  }

  async function submeterComLead(lead: Lead) {
    const payload = Object.entries(respostas).map(([pid, opcao]) => ({
      pergunta_id: Number(pid),
      opcao
    }));

    setLoading(true);
    setErro(null);
    try {
      const res = await api.post<Resultado>('/api/v1/public/diagnostico/calcular', {
        lead,
        respostas: payload
      });
      setResultado(res);
      setStep('resultado');
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao calcular resultado.');
    } finally {
      setLoading(false);
    }
  }

  function whatsapp(lead?: Lead) {
    const empresa = lead?.empresa ? ` da ${lead.empresa}` : '';
    const msg = encodeURIComponent(
      `Oi, fiz o diagnóstico LGPD gratuito${empresa} e quero saber mais sobre o Vanttagem LGPD.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank', 'noopener,noreferrer');
  }

  const grupoAtualNome = macros[macroAtual];
  const perguntasGrupoAtual = grupoAtualNome ? (grupos.get(grupoAtualNome) ?? []) : [];

  if (loading && step === 'intro') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main, #f6f8ff)', padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: '#0a3b8f', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button icon={<ArrowLeftOutlined />} type="text" style={{ color: '#fff' }} onClick={onBack}>
          Voltar
        </Button>
        <Text style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
          Diagnóstico LGPD Gratuito
        </Text>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        {erro && (
          <Alert type="error" message={erro} showIcon style={{ marginBottom: 24 }} closable onClose={() => setErro(null)} />
        )}

        {/* ---- INTRO ---- */}
        {step === 'intro' && (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#0a3b8f' }} />
              <Title level={2} style={{ marginTop: 16 }}>
                Diagnóstico LGPD Gratuito
              </Title>
              <Paragraph style={{ fontSize: 16, color: '#555', maxWidth: 560, margin: '0 auto' }}>
                Descubra em poucos minutos o nível de maturidade da sua empresa em relação à LGPD.
                Responda as perguntas e receba um resultado detalhado por domínio — sem custo.
              </Paragraph>
            </div>

            <Row gutter={[16, 16]}>
              {[
                { icon: '📋', title: `${totalPerguntas} perguntas`, desc: 'Organizadas por domínio de conformidade' },
                { icon: '⚡', title: 'Resultado imediato', desc: 'Score geral e por domínio na hora' },
                { icon: '🔒', title: '100% gratuito', desc: 'Sem custo' }
              ].map((item) => (
                <Col xs={24} md={8} key={item.title}>
                  <Card bordered={false} style={{ textAlign: 'center', background: '#fff' }}>
                    <div style={{ fontSize: 28 }}>{item.icon}</div>
                    <Text strong>{item.title}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 13 }}>{item.desc}</Text>
                  </Card>
                </Col>
              ))}
            </Row>

            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                disabled={perguntas.length === 0}
                onClick={() => setStep('perguntas')}
                style={{ minWidth: 220 }}
              >
                Iniciar diagnóstico
              </Button>
            </div>
          </Space>
        )}

        {/* ---- PERGUNTAS ---- */}
        {step === 'perguntas' && (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Steps
              current={macroAtual}
              items={macros.map((m) => ({
                title: m,
                status: grupoCompleto(m) ? 'finish' : macros[macroAtual] === m ? 'process' : 'wait'
              }))}
              size="small"
            />

            <div>
              <Tag color="blue" style={{ marginBottom: 8 }}>{grupoAtualNome}</Tag>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {respondidas} de {totalPerguntas} respondidas
              </Text>
              <Progress
                percent={Math.round((respondidas / totalPerguntas) * 100)}
                strokeColor="#0a3b8f"
                showInfo={false}
                style={{ marginBottom: 24 }}
              />
            </div>

            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {perguntasGrupoAtual.map((p, idx) => (
                <Card
                  key={p.id}
                  bordered={false}
                  style={{
                    background: '#fff',
                    borderLeft: respostas[p.id] !== undefined ? '4px solid #0a3b8f' : '4px solid #e0e0e0'
                  }}
                >
                  <Text strong style={{ display: 'block', marginBottom: 12 }}>
                    {idx + 1}. {p.pergunta}
                  </Text>
                  <Radio.Group
                    value={respostas[p.id] ?? undefined}
                    onChange={(e) => responder(p.id, e.target.value)}
                  >
                    <Space direction="vertical">
                      {([p.opcao_0, p.opcao_1, p.opcao_2, p.opcao_3] as string[]).map((op, i) => (
                        <Radio key={i} value={i}>{op}</Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Card>
              ))}
            </Space>

            <Row justify="space-between">
              <Button disabled={macroAtual === 0} onClick={() => setMacroAtual((v) => v - 1)}>
                Anterior
              </Button>
              {macroAtual < macros.length - 1 ? (
                <Button
                  type="primary"
                  disabled={!grupoCompleto(grupoAtualNome)}
                  onClick={() => setMacroAtual((v) => v + 1)}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  type="primary"
                  disabled={respondidas < totalPerguntas}
                  onClick={() => setStep('dados')}
                >
                  Ver resultado
                </Button>
              )}
            </Row>
          </Space>
        )}

        {/* ---- DADOS DO LEAD ---- */}
        {step === 'dados' && (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: 40, color: '#0a3b8f' }} />
              <Title level={3} style={{ marginTop: 12 }}>
                Quase lá! Preencha seus dados para ver o resultado
              </Title>
              <Paragraph style={{ color: '#555' }}>
                Usaremos suas informações apenas para personalizar a análise e entrar em contato se você quiser.
              </Paragraph>
            </div>

            <Card bordered={false} style={{ background: '#fff' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={submeterComLead}
                requiredMark={false}
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item label="Nome" name="nome">
                      <Input placeholder="Seu nome" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="E-mail"
                      name="email"
                      rules={[
                        { required: true, message: 'E-mail é obrigatório' },
                        { type: 'email', message: 'E-mail inválido' }
                      ]}
                    >
                      <Input placeholder="seu@email.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Celular" name="celular">
                      <Input placeholder="(11) 99999-9999" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="Empresa"
                      name="empresa"
                      rules={[{ required: true, message: 'Empresa é obrigatória' }]}
                    >
                      <Input placeholder="Nome da empresa" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Ramo de atividade" name="ramo">
                      <Input placeholder="Ex: Saúde, Varejo, Tecnologia..." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Número de funcionários" name="num_funcionarios">
                      <Select placeholder="Selecione">
                        {NUM_FUNCIONARIOS_OPCOES.map((op) => (
                          <Select.Option key={op} value={op}>{op}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Cidade" name="cidade">
                      <Input placeholder="Cidade da empresa" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Estado" name="estado">
                      <Select placeholder="UF" showSearch>
                        {ESTADOS_BR.map((uf) => (
                          <Select.Option key={uf} value={uf}>{uf}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Button onClick={() => setStep('perguntas')}>Voltar</Button>
                  <Button type="primary" htmlType="submit" loading={loading} size="large">
                    Ver meu resultado
                  </Button>
                </Row>
              </Form>
            </Card>
          </Space>
        )}

        {/* ---- RESULTADO ---- */}
        {step === 'resultado' && resultado && (
          <Space direction="vertical" size={32} style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a' }} />
              <Title level={2} style={{ marginTop: 16 }}>
                Seu diagnóstico está pronto!
              </Title>
            </div>

            {/* Nota geral */}
            <Card bordered={false} style={{ textAlign: 'center', background: '#0a3b8f', borderRadius: 16 }}>
              <Text style={{ color: '#fff', fontSize: 14, display: 'block', marginBottom: 8 }}>
                Nível de maturidade geral
              </Text>
              <Progress
                type="circle"
                percent={resultado.nota_geral}
                format={(p) => (
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 22 }}>{p}%</span>
                )}
                strokeColor={nivelMaturidade(resultado.nota_geral).color}
                trailColor="rgba(255,255,255,0.2)"
                size={140}
              />
              <div style={{ marginTop: 16 }}>
                <Tag
                  color={nivelMaturidade(resultado.nota_geral).color}
                  style={{ fontSize: 14, padding: '4px 16px' }}
                >
                  {nivelMaturidade(resultado.nota_geral).label}
                </Tag>
              </div>
            </Card>

            {/* Resultados por macro domínio */}
            {resultado.resultados_macro.length > 0 && (
              <Card title="Resultado por área" bordered={false} style={{ background: '#fff' }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  {resultado.resultados_macro.map((r) => (
                    <div key={r.macro_dominio}>
                      <Row justify="space-between" style={{ marginBottom: 4 }}>
                        <Text strong>{r.macro_dominio}</Text>
                        <Text style={{ color: progressColor(r.nota) }}>{r.nota}%</Text>
                      </Row>
                      <Progress percent={r.nota} strokeColor={progressColor(r.nota)} showInfo={false} />
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {/* Resultado por domínio (detalhado) */}
            {resultado.resultados_dominio.length > resultado.resultados_macro.length && (
              <Card title="Detalhe por domínio" bordered={false} style={{ background: '#fff' }}>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {resultado.resultados_dominio.map((r) => (
                    <div key={r.dominio}>
                      <Row justify="space-between" style={{ marginBottom: 2 }}>
                        <Text>{r.dominio}</Text>
                        <Text type="secondary">{r.nota}%</Text>
                      </Row>
                      <Progress percent={r.nota} strokeColor={progressColor(r.nota)} showInfo={false} size="small" />
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            <Divider />

            {/* CTA */}
            <Card bordered={false} style={{ background: '#fdf3fa', borderRadius: 16, textAlign: 'center' }}>
              <Title level={4}>Quer transformar esse diagnóstico em ação?</Title>
              <Paragraph style={{ color: '#555' }}>
                O Vanttagem LGPD transforma os resultados do diagnóstico em um plano de ação real —
                com governança, inventários, riscos e auditoria em um único sistema.
              </Paragraph>
              <Space wrap>
                <Button
                  type="primary"
                  size="large"
                  icon={<MessageOutlined />}
                  onClick={() => whatsapp(form.getFieldsValue())}
                >
                  Falar com especialista
                </Button>
                <Button size="large" onClick={onBack}>
                  Voltar para o site
                </Button>
              </Space>
            </Card>
          </Space>
        )}
      </div>
    </div>
  );
}
