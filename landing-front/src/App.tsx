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
  'Oi, quero estruturar a operação LGPD da minha empresa e entender o melhor plano no Vanttagem.';

const modules = [
  {
    icon: <SafetyCertificateOutlined />,
    title: 'Governança',
    description:
      'Controle papéis, políticas e trilhas de decisão para sustentar a governança de privacidade com evidências.'
  },
  {
    icon: <FileProtectOutlined />,
    title: 'Inventários de Dados',
    description:
      'Mapeie tratamentos, finalidades, bases legais e ciclo de vida dos dados pessoais em um único fluxo.'
  },
  {
    icon: <WarningOutlined />,
    title: 'Risco',
    description:
      'Classifique riscos, priorize mitigações e acompanhe plano de ação com foco no impacto regulatório.'
  },
  {
    icon: <AuditOutlined />,
    title: 'Auditoria',
    description:
      'Registre evidências, acompanhe pendências e mantenha histórico pronto para fiscalização e comitês.'
  },
  {
    icon: <FileTextOutlined />,
    title: 'Documentos',
    description:
      'Padronize políticas, termos e registros operacionais para padrão único de compliance em toda a empresa.'
  },
  {
    icon: <GlobalOutlined />,
    title: 'Processos',
    description:
      'Conecte execução, responsáveis e acompanhamento contínuo para transformar exigência regulatória em rotina operacional.'
  }
];

const proofPoints = [
  'Diagnóstico gratuito para mapear maturidade LGPD antes da decisão comercial',
  'Entrada objetiva por R$ 299,00/mes no pacote principal',
  '1 usuário comum e 5 usuários de tarefa incluídos no plano básico',
  'Governança, inventário, risco, auditoria e documentos em um único fluxo com evidências'
];

const coreOffer = {
  name: 'Pacote Sistema Básico',
  price: 'R$ 299,00/mes',
  description:
    'Oferta principal para sair do improviso, organizar responsabilidades e manter uma rotina de compliance com trilha auditável.',
  audience: 'Ideal para empresas que querem trocar planilha dispersa por operação LGPD previsível em poucas semanas.',
  features: [
    '1 usuário comum para liderança e governança central',
    '5 usuários de tarefa para execução distribuída',
    'Base completa para diagnóstico, governança, inventários, risco, auditoria, documentos e processos',
    'Contratação simples, com expansão por módulos apenas quando fizer sentido'
  ]
};

const additionalPackages = [
  {
    title: 'Treinamento',
    value: 'R$ 99,00',
    details:
      'Agenda, turmas, certificado e conteúdos de onboarding, introdução LGPD, mapeamento, DPO e atendimento para acelerar adoção interna. Até 100 participantes.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Qualificação de Fornecedores',
    value: 'R$ 99,00',
    details: 'Pacote adicional para avaliar fornecedores com capacidade inicial de até 10 cadastros.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Portal',
    value: 'R$ 149,00',
    details: 'Gestão de incidentes, direitos dos titulares, canal de privacidade e políticas para o site em um único pacote.',
    tag: 'Pacote adicional'
  },
  {
    title: 'Análise de Contrato LGPD',
    value: 'R$ 350,00',
    details: 'Análise pontual para revisar cláusulas e fortalecer a aderência contratual.',
    tag: 'Serviço consultivo'
  },
  {
    title: 'Pacote Consultoria A',
    value: 'R$ 1.000,00',
    details: '6 reuniões de 45 minutos para acelerar desenho, implantação e tomada de decisão com apoio especializado.',
    tag: 'Serviço consultivo'
  },
  {
    title: 'Pacote DPO',
    value: 'R$ 499,00',
    details: 'Oferta para pequenas empresas que precisam de apoio recorrente com previsibilidade de custo.',
    tag: 'Serviço consultivo'
  }
];

const userPackages = [
  {
    title: 'Pacote com 1 usuário comum',
    value: 'R$ 36,90/mes',
    details: 'Cada usuário comum adicional libera também 5 usuários de tarefa.',
    tag: 'Licenciamento'
  },
  {
    title: 'Pacote com 3 usuários comuns',
    value: 'R$ 99,00/mes',
    details: 'Expansão para equipes que precisam crescer mais rápido com melhor custo por usuário.',
    tag: 'Licenciamento'
  },
  {
    title: 'Pacote com 10 usuários tarefa',
    value: 'R$ 89,90/mes',
    details: 'Pacote dedicado para ampliar capacidade operacional sem elevar o custo da camada de gestão.',
    tag: 'Operacional'
  }
];

const faq = [
  {
    key: '1',
    label: 'O Vanttagem LGPD substitui consultoria jurídica?',
    children:
      'Não. O sistema organiza a operação de compliance e evidências. A consultoria jurídica segue relevante para decisões legais específicas.'
  },
  {
    key: '2',
    label: 'Em quanto tempo consigo operar o sistema?',
    children:
      'Na maioria dos cenários, você consegue iniciar governança e inventários em poucos dias, evoluindo os módulos por maturidade.'
  },
  {
    key: '3',
    label: 'Posso contratar somente o pacote básico sem adicionais?',
    children:
      'Sim. O foco comercial é o pacote básico. Os adicionais entram apenas quando fizerem sentido para sua operação.'
  },
  {
    key: '4',
    label: 'Tem suporte para auditorias internas e externas?',
    children:
      'Sim. O módulo de auditoria e documentos foi desenhado para consolidar trilhas, registros e evidências de compliance.'
  },
  {
    key: '5',
    label: 'Os diagnósticos digitais substituem o sistema?',
    children:
      'Não. Os diagnósticos digitais funcionam como porta de entrada e educação comercial. O sistema é a oferta principal para operação recorrente.'
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
          className="cta-primary"
          size="large"
          href={whatsappLink('header')}
          target="_blank"
          onClick={() => trackEvent('cta_click', 'header')}
        >
          Falar com especialista
        </Button>
      </Header>

      <Content>
        <section className="hero-section">
          <div className="hero-glow hero-glow-blue" />
          <div className="hero-glow hero-glow-pink" />

          <Row gutter={[32, 32]} align="middle">
            <Col xs={24} lg={14}>
              <Space direction="vertical" size={20}>
                <Tag color="blue">LGPD operacional, sem improviso</Tag>
                <Title level={1} className="hero-title">
                  Sua LGPD trava quando cada área opera sem método
                </Title>
                <Paragraph className="hero-paragraph">
                  Isso aumenta retrabalho, deixa riscos sem dono e enfraquece sua defesa em auditorias. Com o Vanttagem LGPD, sua
                  empresa organiza governança, inventário, risco, auditoria e documentos em um fluxo único, com evidências e
                  prioridade clara. Comece pelo pacote básico e evolua no seu ritmo.
                </Paragraph>
                <Space wrap>
                  <Button
                    type="primary"
                    className="cta-primary"
                    size="large"
                    href={whatsappLink('hero')}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', 'hero')}
                  >
                    Falar no WhatsApp agora
                  </Button>
                  <Button
                    className="cta-secondary"
                    size="large"
                    icon={<FileSearchOutlined />}
                    onClick={() => {
                      trackEvent('cta_click', 'diagnostico_gratis_hero');
                      setPagina('diagnostico');
                    }}
                  >
                    Diagnóstico gratuito
                  </Button>
                </Space>
                <Text type="secondary">
                  Estratégia comercial objetiva: oferta principal clara, adicionais sob demanda e porta de entrada com diagnóstico.
                </Text>
              </Space>
            </Col>

            <Col xs={24} lg={10}>
              <Card className="hero-card" bordered={false}>
                <Space direction="vertical" size={12}>
                  <Title level={4} style={{ margin: 0 }}>
                    O que você ganha com o Vanttagem LGPD
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
                <Statistic title="Usuários inclusos" value="1 + 5" prefix={<TeamOutlined />} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Foco" value="LGPD" prefix={<SafetyCertificateOutlined />} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card>
                <Statistic title="Expansão" value="Modular" prefix={<RiseOutlined />} />
              </Card>
            </Col>
          </Row>
        </section>

        <section className="section-block">
          <Row gutter={[32, 24]}>
            <Col xs={24} lg={10}>
              <Title level={2}>Sem método, compliance vira retrabalho</Title>
              <Paragraph>
                Quando os processos ficam dispersos, sua empresa perde prazo, repete tarefa e expõe a operação a risco regulatório.
                O Vanttagem organiza a rotina ponta a ponta com dono, evidências e critério de prioridade.
              </Paragraph>
            </Col>
            <Col xs={24} lg={14}>
              <Timeline
                items={[
                  {
                    children: 'Diagnóstico gratuito para qualificar lead e acelerar decisão'
                  },
                  {
                    children: 'Pacote sistema básico para iniciar a operação recorrente'
                  },
                  {
                    children: 'Adicionais por necessidade de treinamento, portal, consultoria ou DPO'
                  },
                  {
                    children: 'Melhoria contínua orientada por evidências e expansão modular'
                  }
                ]}
              />
            </Col>
          </Row>
        </section>

        <section className="section-block section-soft" id="modulos">
          <Title level={2}>Módulos do Vanttagem LGPD</Title>
          <Paragraph>Arquitetura funcional pensada para reduzir risco regulatório e dar previsibilidade de execução.</Paragraph>
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

        <section className="section-block section-soft" id="planos">
          <Title level={2}>Oferta principal e pacotes adicionais</Title>
          <Paragraph>
            A decisão comercial precisa ser simples: primeiro consolidar operação com o pacote básico. Depois, ampliar escopo com
            pacotes adicionais conforme necessidade.
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
                      className="cta-primary"
                      size="large"
                      href={whatsappLink('pacote_sistema_basico')}
                      target="_blank"
                      onClick={() => trackEvent('cta_click', 'pacote_sistema_basico')}
                    >
                      Falar sobre o pacote básico
                    </Button>
                    <Button
                      className="cta-secondary"
                      size="large"
                      icon={<FileSearchOutlined />}
                      onClick={() => {
                        trackEvent('cta_click', 'diagnostico_gratis_oferta');
                        setPagina('diagnostico');
                      }}
                    >
                      Fazer diagnóstico gratuito
                    </Button>
                  </Space>
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card className="offer-card offer-card-secondary" bordered={false}>
                <Space direction="vertical" size={18}>
                  <Title level={4}>Como evoluir sem travar a decisão de compra</Title>
                  <Paragraph>
                    O sistema básico é a resposta padrão para iniciar. Pacotes funcionais entram por contexto da empresa e o
                    licenciamento adicional cresce junto com a operação.
                  </Paragraph>
                  <div className="offer-mini-grid">
                    <Card size="small" className="offer-mini-card">
                      <Text strong>Expansão operacional</Text>
                      <Paragraph>Treinamento, portal e aumento de capacidade do time.</Paragraph>
                    </Card>
                    <Card size="small" className="offer-mini-card">
                      <Text strong>Apoio especializado</Text>
                      <Paragraph>Consultoria, DPO e análise contratual para decisões com maior risco.</Paragraph>
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
            Estes pacotes ampliam capacidade funcional depois da base estar implementada. O licenciamento adicional fica separado para
            manter a proposta principal simples.
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
                    className="cta-secondary"
                    href={whatsappLink(`adicional_${addon.title.toLowerCase().replaceAll(' ', '_')}`)}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', `adicional_${addon.title}`)}
                  >
                    Falar sobre este adicional
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />
          <Title level={3}>Pacotes de usuários adicionais</Title>
          <Paragraph>
            O plano básico começa com 1 usuário comum e 5 usuários de tarefa. Quando a operação crescer, você expande licenças por
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
                    className="cta-secondary"
                    block
                    href={whatsappLink(`licenciamento_${pack.title.toLowerCase().replaceAll(' ', '_')}`)}
                    target="_blank"
                    onClick={() => trackEvent('cta_click', `licenciamento_${pack.title}`)}
                  >
                    Falar sobre licenciamento
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
          <Title level={2}>Pronto para tirar a LGPD do improviso?</Title>
          <Paragraph>
            Fale com um especialista, valide seu cenário e implemente uma operação LGPD com prioridades claras e trilha de evidência.
          </Paragraph>
          <Space wrap>
            <Button
              type="primary"
              className="cta-primary"
              size="large"
              href={whatsappLink('cta_final')}
              target="_blank"
              onClick={() => trackEvent('cta_click', 'cta_final')}
            >
              Falar no WhatsApp agora
            </Button>
            <Button
              className="cta-secondary"
              size="large"
              icon={<FileSearchOutlined />}
              onClick={() => {
                trackEvent('cta_click', 'cta_final_diagnostico');
                setPagina('diagnostico');
              }}
            >
              Fazer diagnóstico gratuito
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
