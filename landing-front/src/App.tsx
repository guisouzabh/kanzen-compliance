import { useState } from 'react';
import {
  AuditOutlined,
  CheckCircleFilled,
  FileProtectOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  GlobalOutlined,
  MessageOutlined,
  RiseOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons';
import DiagnosticoGratis from './pages/DiagnosticoGratis';
import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Divider,
  FloatButton,
  Layout,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography
} from 'antd';
import vanttagemLogo from '../Vanttagem.png';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? '5500000000000';
const DEFAULT_MESSAGE =
  'Oi, quero conhecer o Vanttagem LGPD e entender o melhor plano para minha empresa.';

const modules = [
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Governanca',
    description:
      'Controle papeis, politicas e trilhas de decisao para sustentar a governanca de privacidade com evidencias.'
  },
  {
    icon: <FileProtectOutlined />,
    title: 'Inventarios de Dados',
    description:
      'Mapeie tratamentos, finalidades, bases legais e ciclo de vida dos dados pessoais em um unico fluxo.'
  },
  {
    icon: <WarningOutlined />,
    title: 'Risco',
    description:
      'Classifique riscos, priorize mitigacoes e acompanhe plano de acao com foco no impacto regulatorio.'
  },
  {
    icon: <AuditOutlined />,
    title: 'Auditoria',
    description:
      'Registre evidencias, acompanhe pendencias e mantenha historico pronto para fiscalizacao e comites.'
  },
  {
    icon: <FileTextOutlined />,
    title: 'Documentos',
    description:
      'Padronize politicas, termos e registros operacionais para padrao unico de compliance em toda a empresa.'
  },
  {
    icon: <GlobalOutlined />,
    title: 'Processos',
    description:
      'Conecte execucao, responsaveis e acompanhamento continuo para transformar exigencia regulatoria em rotina operacional.'
  }
];

const proofPoints = [
  'Entrada objetiva por R$ 299,00/mes no pacote principal',
  '1 usuario comum e 5 usuarios de tarefa incluidos no plano basico',
  'Plano de acao, evidencias e trilha operacional em um unico fluxo',
  'Expansao com pacotes funcionais e licenciamento adicional sob demanda'
];

const coreOffer = {
  name: 'Pacote Sistema Basico',
  price: 'R$ 299,00/mes',
  description:
    'Oferta principal para iniciar a operacao de compliance com base estruturada, acesso essencial e possibilidade de crescimento modular.',
  audience: 'Ideal para empresas que querem sair da planilha e entrar em uma rotina real de LGPD.',
  features: [
    '1 usuario comum para lideranca e gestao central',
    '5 usuarios de tarefa para execucao distribuida',
    'Base para diagnostico, governanca, inventarios, risco, auditoria, documentos e processos',
    'Contratacao simples, sem obrigar servicos adicionais no inicio'
  ]
};

const additionalPackages = [
  {
    title: 'Treinamento',
    value: 'R$ 99,00',
    details:
      'Agenda, turmas, certificado e conteudos de onboarding, introducao LGPD, mapeamento, DPO e atendimento. Ate 100 participantes.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Qualificacao de Fornecedores',
    value: 'R$ 99,00',
    details: 'Pacote adicional para avaliar fornecedores com capacidade inicial de ate 10 cadastros.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Portal',
    value: 'R$ 149,00',
    details: 'Gestao de incidentes, direitos dos titulares, canal de privacidade e politicas para o site.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Analise de Contrato LGPD',
    value: 'R$ 350,00',
    details: 'Analise pontual para revisar clausulas e fortalecer a aderencia contratual.',
    tag: 'Servico consultivo'
  },
  {
    title: 'Pacote Consultoria A',
    value: 'R$ 1.000,00',
    details: '6 reunioes de 45 minutos para acelerar desenho, implantacao e tomada de decisao.',
    tag: 'Servico consultivo'
  },
  {
    title: 'Pacote DPO',
    value: 'R$ 499,00',
    details: 'Oferta pensada para pequenas empresas que precisam de apoio recorrente mais leve.',
    tag: 'Servico consultivo'
  }
];

const userPackages = [
  {
    title: 'Pacote com 1 usuario comum',
    value: 'R$ 36,90/mes',
    details: 'Cada usuario comum adicional libera tambem 5 usuarios de tarefa.',
    tag: 'Licenciamento'
  },
  {
    title: 'Pacote com 3 usuarios comuns',
    value: 'R$ 99,00/mes',
    details: 'Expansao para equipes que precisam crescer mais rapido com melhor custo por usuario.',
    tag: 'Licenciamento'
  },
  {
    title: 'Pacote com 10 usuarios tarefa',
    value: 'R$ 89,90/mes',
    details: 'Pacote dedicado para ampliar apenas a capacidade operacional de execucao.',
    tag: 'Operacional'
  }
];

const hotmartProducts = [
  {
    title: 'Diagnostico LGPD Bronze',
    value: 'Gratuito',
    details: 'Produto de entrada para marketing e geracao de demanda.',
    tag: 'Entrada'
  },
  {
    title: 'Diagnostico LGPD Prata',
    value: 'R$ 49,90',
    details: 'Oferta digital para venda simplificada via Hotmart.',
    tag: 'Hotmart'
  },
  {
    title: 'Diagnostico SI',
    value: 'R$ 49,90',
    details: 'Diagnostico digital complementar com foco em seguranca da informacao.',
    tag: 'Hotmart'
  },
  {
    title: 'Diagnostico LGPD Fornecedor Prata',
    value: 'R$ 49,90',
    details: 'Diagnostico digital orientado ao ecossistema de terceiros.',
    tag: 'Hotmart'
  },
  {
    title: 'Pacote Diagnosticos Hotmart',
    value: 'R$ 100,00',
    details: 'Bundle com 3 diagnosticos prata para elevar ticket sem competir com o sistema.',
    tag: 'Bundle'
  }
];

const faq = [
  {
    key: '1',
    label: 'O Vanttagem LGPD substitui consultoria juridica?',
    children:
      'Nao. O sistema organiza a operacao de compliance e evidencias. A consultoria juridica segue relevante para decisoes legais especificas.'
  },
  {
    key: '2',
    label: 'Em quanto tempo consigo operar o sistema?',
    children:
      'Na maioria dos cenarios, voce consegue iniciar governanca e inventarios em poucos dias, evoluindo os modulos por maturidade.'
  },
  {
    key: '3',
    label: 'Posso contratar somente o pacote basico sem adicionais?',
    children:
      'Sim. O foco comercial e o pacote basico. Os adicionais entram apenas quando fizerem sentido para sua operacao.'
  },
  {
    key: '4',
    label: 'Tem suporte para auditorias internas e externas?',
    children:
      'Sim. O modulo de auditoria e documentos foi desenhado para consolidar trilhas, registros e evidencias de compliance.'
  },
  {
    key: '5',
    label: 'Os diagnosticos digitais substituem o sistema?',
    children:
      'Nao. Os diagnosticos digitais funcionam como porta de entrada e educacao comercial. O sistema e a oferta principal para operacao recorrente.'
  }
];

const testimonials = [
  {
    quote:
      'Conseguimos tirar a LGPD do papel e organizar governanca entre juridico, TI e operacao em um unico painel.',
    name: 'Mariana R.',
    role: 'Head de Compliance - Empresa de Servicos'
  },
  {
    quote:
      'O ganho foi a clareza de risco e prioridade. Hoje o board enxerga o plano de acao com dados objetivos.',
    name: 'Felipe T.',
    role: 'Diretor de Operacoes - Industria'
  },
  {
    quote:
      'Padronizamos documentos e auditorias. O time parou de trabalhar com planilha solta e retrabalho.',
    name: 'Renata S.',
    role: 'Gestora de Privacidade - Varejo'
  }
];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function trackEvent(event: string, section: string) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    event,
    section,
    timestamp: Date.now()
  });
}

function whatsappLink(section: string) {
  const message = encodeURIComponent(`${DEFAULT_MESSAGE} Origem: ${section}.`);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

function App() {
  const [pagina, setPagina] = useState<'landing' | 'diagnostico'>('landing');

  if (pagina === 'diagnostico') {
    return <DiagnosticoGratis onBack={() => setPagina('landing')} />;
  }

  return (
    <Layout className="landing-layout">
      <Header className="landing-header">
        <div className="brand">
          <img className="brand-logo" src={vanttagemLogo} alt="Vanttagem LGPD" />
        </div>
        <Button
          type="primary"
          size="large"
          href={whatsappLink('header')}
          target="_blank"
          onClick={() => trackEvent('cta_click', 'header')}
        >
          Falar no WhatsApp
        </Button>
      </Header>

      <Content>
        <section className="hero-section">
          <div className="hero-glow hero-glow-blue" />
          <div className="hero-glow hero-glow-pink" />

          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={20}>
                <Tag color="blue">Sistema de Compliance para LGPD</Tag>
                <Title level={1} className="hero-title">
                  Tire a LGPD do papel e ganhe controle real da sua operacao
                </Title>
                <Paragraph className="hero-paragraph">
                  Por R$ 299,00/mes, o Vanttagem LGPD ajuda sua empresa a organizar governanca, inventarios, riscos, auditoria e
                  documentos em um unico sistema. E quando fizer sentido evoluir, voce adiciona treinamento, portal, consultoria,
                  DPO e diagnosticos no ritmo do seu negocio.
                </Paragraph>
                <Space wrap>
                  <Button
                    type="primary"
                    size="large"
                    href={whatsappLink('hero')}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', 'hero')}
                  >
                    Quero falar com especialista
                  </Button>
                  <Button
                    size="large"
                    icon={<FileSearchOutlined />}
                    onClick={() => {
                      trackEvent('cta_click', 'diagnostico_gratis_hero');
                      setPagina('diagnostico');
                    }}
                  >
                    Diagnóstico gratuito
                  </Button>
                  <Button size="large" href="#planos" onClick={() => trackEvent('cta_click', 'hero_planos')}>
                    Ver oferta
                  </Button>
                </Space>
                <Text type="secondary">
                  Arquitetura comercial enxuta: oferta principal clara, adicionais plugaveis e produtos de entrada para gerar demanda.
                </Text>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="hero-card" bordered={false}>
                <Space direction="vertical" size={12}>
                  <Title level={4} style={{ margin: 0 }}>
                    O que voce ganha com o Vanttagem LGPD
                  </Title>
                  {proofPoints.map((item) => (
                    <Space key={item} align="start">
                      <CheckCircleFilled className="accent-pink" />
                      <Text>{item}</Text>
                    </Space>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} className="stats-row">
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Entrada" value="R$ 299" prefix={<GlobalOutlined />} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Usuarios inclusos" value="1 + 5" prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Foco" value="LGPD" prefix={<SafetyCertificateOutlined />} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Expansao" value="Modular" prefix={<RiseOutlined />} />
              </Card>
            </Col>
          </Row>
        </section>

        <section className="section-block">
          <Row gutter={[32, 24]}>
            <Col xs={24} lg={10}>
              <Title level={2}>Sem metodo, compliance vira retrabalho</Title>
              <Paragraph>
                A maioria das empresas trava em planilhas, documentos dispersos e falta de priorizacao. Nosso modelo estrutura a
                operacao de ponta a ponta com processo claro e uma trilha comercial mais facil de vender.
              </Paragraph>
            </Col>
            <Col xs={24} lg={14}>
              <Timeline
                items={[
                  {
                    children: 'Diagnosticos de entrada para gerar demanda e qualificar lead'
                  },
                  {
                    children: 'Pacote sistema basico para iniciar a operacao recorrente'
                  },
                  {
                    children: 'Adicionais por necessidade de treinamento, portal, consultoria ou DPO'
                  },
                  {
                    children: 'Melhoria continua orientada por evidencias e expansao modular'
                  }
                ]}
              />
            </Col>
          </Row>
        </section>

        <section className="section-block section-soft" id="modulos">
          <Title level={2}>Modulos do Vanttagem LGPD</Title>
          <Paragraph>Arquitetura funcional pensada para reduzir risco regulatorio e dar previsibilidade de execucao.</Paragraph>
          <Row gutter={[16, 16]}>
            {modules.map((module) => (
              <Col xs={24} md={12} lg={8} key={module.title}>
                <Card className="module-card" bordered={false}>
                  <Badge color="#ea4f9e" />
                  <Title level={4}>
                    {module.icon} {module.title}
                  </Title>
                  <Paragraph>{module.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-block">
          <Title level={2}>Depoimentos (demo ilustrativo)</Title>
          <Paragraph>
            Estes depoimentos sao exemplos de comunicacao para a landing. Depois voce pode substituir por clientes reais com
            autorizacao.
          </Paragraph>
          <Row gutter={[16, 16]}>
            {testimonials.map((testimonial) => (
              <Col xs={24} md={8} key={testimonial.name}>
                <Card>
                  <Tag color="magenta">Demo</Tag>
                  <Paragraph className="quote">"{testimonial.quote}"</Paragraph>
                  <Text strong>{testimonial.name}</Text>
                  <br />
                  <Text type="secondary">{testimonial.role}</Text>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-block section-soft" id="planos">
          <Title level={2}>Oferta principal e pacotes adicionais</Title>
          <Paragraph>
            A decisao comercial precisa ser simples: vender o pacote basico primeiro e usar os adicionais para aumentar aderencia e
            ticket.
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card className="offer-card offer-card-primary" bordered={false}>
                <Space direction="vertical" size={18}>
                  <Tag color="blue">Oferta principal</Tag>
                  <Title level={3}>{coreOffer.name}</Title>
                  <Paragraph className="price price-xl">{coreOffer.price}</Paragraph>
                  <Paragraph>{coreOffer.description}</Paragraph>
                  <Paragraph className="offer-note">{coreOffer.audience}</Paragraph>
                  <div className="offer-feature-list">
                    {coreOffer.features.map((feature) => (
                      <Space key={feature} align="start">
                        <CheckCircleFilled className="accent-pink" />
                        <Text>{feature}</Text>
                      </Space>
                    ))}
                  </div>
                  <Space wrap>
                    <Button
                      type="primary"
                      size="large"
                      href={whatsappLink('pacote_sistema_basico')}
                      target="_blank"
                      onClick={() => trackEvent('cta_click', 'pacote_sistema_basico')}
                    >
                      Contratar pacote basico
                    </Button>
                    <Button
                      size="large"
                      href="#adicionais"
                      onClick={() => trackEvent('cta_click', 'ver_adicionais')}
                    >
                      Ver adicionais
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card className="offer-card offer-card-secondary" bordered={false}>
                <Space direction="vertical" size={18}>
                  <Title level={4}>Como aumentar receita sem travar a venda</Title>
                  <Paragraph>
                    O sistema basico deve ser a resposta padrao. Os pacotes funcionais entram por contexto comercial e o
                    licenciamento adicional entra conforme a equipe cresce.
                  </Paragraph>
                  <div className="offer-mini-grid">
                    <Card size="small" className="offer-mini-card">
                      <Text strong>Upsell operacional</Text>
                      <Paragraph>Treinamento, portal e expansao de usuarios.</Paragraph>
                    </Card>
                    <Card size="small" className="offer-mini-card">
                      <Text strong>Upsell consultivo</Text>
                      <Paragraph>Consultoria, DPO e analise contratual quando a empresa exigir apoio mais proximo.</Paragraph>
                    </Card>
                    <Card size="small" className="offer-mini-card">
                      <Text strong>Entrada digital</Text>
                      <Paragraph>Diagnosticos na Hotmart para captacao e qualificacao comercial.</Paragraph>
                    </Card>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Divider />
          <Title level={3} id="adicionais">
            Pacotes adicionais
          </Title>
          <Paragraph>
            Estes pacotes ampliam capacidade funcional e valor percebido da operacao. O licenciamento adicional fica em uma camada
            separada para manter a oferta clara.
          </Paragraph>
          <Row gutter={[16, 16]}>
            {additionalPackages.map((addon) => (
              <Col xs={24} md={12} lg={8} key={addon.title}>
                <Card bordered={false} className="addon-card">
                  <Tag color="magenta">{addon.tag}</Tag>
                  <Title level={4}>{addon.title}</Title>
                  <Paragraph className="price">{addon.value}</Paragraph>
                  <Paragraph>{addon.details}</Paragraph>
                  <Button
                    type="default"
                    href={whatsappLink(`adicional_${addon.title.toLowerCase().replaceAll(' ', '_')}`)}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', `adicional_${addon.title}`)}
                  >
                    Solicitar adicional
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />
          <Title level={3}>Pacotes de usuarios adicionais</Title>
          <Paragraph>
            O plano basico comeca com 1 usuario comum e 5 usuarios de tarefa. Quando a operacao crescer, voce expande licencas por
            pacote mensal sem trocar de plano.
          </Paragraph>
          <Row gutter={[16, 16]}>
            {userPackages.map((pack) => (
              <Col xs={24} md={12} lg={8} key={pack.title}>
                <Card className="pricing-card" bordered={false}>
                  <Tag color={pack.tag === 'Licenciamento' ? 'blue' : 'default'}>{pack.tag}</Tag>
                  <Title level={4}>{pack.title}</Title>
                  <Paragraph className="price">{pack.value}</Paragraph>
                  <Paragraph>{pack.details}</Paragraph>
                  <Button
                    block
                    href={whatsappLink(`licenciamento_${pack.title.toLowerCase().replaceAll(' ', '_')}`)}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', `licenciamento_${pack.title}`)}
                  >
                    Quero ampliar acessos
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />
          <Title level={3}>Diagnosticos digitais e produtos de entrada</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12} lg={8}>
              <Card className="pricing-card offer-card-primary" bordered={false}>
                <Tag color="green">Grátis agora</Tag>
                <Title level={4}>Diagnóstico LGPD Bronze</Title>
                <Paragraph className="price">Gratuito</Paragraph>
                <Paragraph>
                  Responda o questionário e descubra o nível de maturidade LGPD da sua empresa em minutos.
                </Paragraph>
                <Button
                  type="primary"
                  block
                  icon={<FileSearchOutlined />}
                  onClick={() => {
                    trackEvent('cta_click', 'diagnostico_gratis_planos');
                    setPagina('diagnostico');
                  }}
                >
                  Fazer diagnóstico grátis
                </Button>
              </Card>
            </Col>
            {hotmartProducts.filter((p) => p.title !== 'Diagnostico LGPD Bronze').map((product) => (
              <Col xs={24} md={12} lg={8} key={product.title}>
                <Card className="pricing-card" bordered={false}>
                  <Tag color={product.tag === 'Entrada' ? 'blue' : 'default'}>{product.tag}</Tag>
                  <Title level={4}>{product.title}</Title>
                  <Paragraph className="price">{product.value}</Paragraph>
                  <Paragraph>{product.details}</Paragraph>
                  <Button
                    block
                    href={whatsappLink(`produto_${product.title.toLowerCase().replaceAll(' ', '_')}`)}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', `produto_${product.title}`)}
                  >
                    Quero saber mais
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        <section className="section-block">
          <Title level={2}>Perguntas frequentes</Title>
          <Collapse items={faq} size="large" />
        </section>

        <section className="section-block cta-final">
          <Title level={2}>Pronto para estruturar seu compliance LGPD?</Title>
          <Paragraph>
            Comece pelo pacote basico e adicione treinamento, portal, consultoria, DPO ou diagnosticos conforme o momento da empresa.
          </Paragraph>
          <Space wrap>
            <Button
              type="primary"
              size="large"
              href={whatsappLink('cta_final')}
              target="_blank"
              onClick={() => trackEvent('cta_click', 'cta_final')}
            >
              Falar no WhatsApp agora
            </Button>
            <Button size="large" href="#modulos" onClick={() => trackEvent('cta_click', 'cta_final_modulos')}>
              Revisar modulos
            </Button>
          </Space>
        </section>
      </Content>

      <Footer className="landing-footer">
        <Text>Vanttagem LGPD | Sistema de Compliance para LGPD</Text>
        <br />
        <Text type="secondary">vanttagem.com.br</Text>
      </Footer>

      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        tooltip={<div>WhatsApp</div>}
        onClick={() => {
          trackEvent('cta_click', 'float_button');
          window.open(whatsappLink('float_button'), '_blank', 'noopener,noreferrer');
        }}
      />
    </Layout>
  );
}

export default App;
