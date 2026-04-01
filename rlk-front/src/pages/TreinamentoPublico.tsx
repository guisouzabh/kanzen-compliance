import { useEffect, useState } from 'react';
import {
  Alert, Button, Card, Col, Divider, Form, Input, Row, Space, Spin, Steps, Tag, Typography, Result, Radio
} from 'antd';
import { CheckCircleOutlined, LinkOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

type Tela = 'loading' | 'identificacao' | 'treinamento' | 'quiz' | 'conclusao' | 'erro';

interface TurmaInfo {
  tema: string;
  empresa_nome: string;
  label_identificador: string;
  prazo_conclusao: string | null;
}

interface DadosParticipante {
  participante_id: number;
  status: string;
  nota_final: number | null;
  tentativas_realizadas: number;
  turma: {
    tema: string;
    empresa_nome: string;
    quiz_habilitado: number;
    nota_minima: number | null;
    max_tentativas: number | null;
  };
  materiais: Array<{ titulo: string; tipo: string; url: string; origem: string }>;
  perguntas: Array<{
    id: number;
    pergunta: string;
    alternativas: Array<{ index: number; texto: string }>;
  }>;
  pode_tentar: boolean;
}

interface ResultadoQuiz {
  nota: number;
  acertos: number;
  total_perguntas: number;
  status: string;
  aprovado: boolean;
  pode_refazer: boolean;
}

const BASE = import.meta.env.VITE_API_URL;

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.erro ?? `Erro ${res.status}`);
  }
  return res.json();
}

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const b = await res.json().catch(() => ({}));
    throw new Error(b.erro ?? `Erro ${res.status}`);
  }
  return res.json();
}

export default function TreinamentoPublico() {
  const { slug, token } = useParams<{ slug?: string; token?: string }>();

  const [tela, setTela] = useState<Tela>('loading');
  const [turmaInfo, setTurmaInfo] = useState<TurmaInfo | null>(null);
  const [dados, setDados] = useState<DadosParticipante | null>(null);
  const [erro, setErro] = useState('');
  const [identificando, setIdentificando] = useState(false);
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (token) {
      // Acesso via magic link
      get(`/api/v1/treinamento-publico/magic/${token}`)
        .then((d) => {
          setDados(d);
          setTela('treinamento');
        })
        .catch((e) => { setErro(e.message); setTela('erro'); });
    } else if (slug) {
      // Acesso via slug — mostrar tela de identificação
      get(`/api/v1/treinamento-publico/turma/${slug}`)
        .then((d) => {
          setTurmaInfo(d);
          setTela('identificacao');
        })
        .catch((e) => { setErro(e.message); setTela('erro'); });
    } else {
      setErro('URL inválida');
      setTela('erro');
    }
  }, [slug, token]);

  const identificar = async (valores: any) => {
    setIdentificando(true);
    try {
      const d = await post(`/api/v1/treinamento-publico/turma/${slug}/identificar`, valores);
      setDados(d);
      setTela('treinamento');
      setStep(0);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setIdentificando(false);
    }
  };

  const confirmarConclusao = async () => {
    if (!dados) return;
    setSalvando(true);
    try {
      await post('/api/v1/treinamento-publico/confirmar-conclusao', { participante_id: dados.participante_id });
      setTela('conclusao');
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const iniciarQuiz = async () => {
    if (!dados) return;
    setSalvando(true);
    try {
      const r = await post('/api/v1/treinamento-publico/quiz/iniciar', { participante_id: dados.participante_id });
      setExecucaoId(r.execucao_id);
      setRespostas({});
      setStep(1);
      setTela('quiz');
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const finalizarQuiz = async () => {
    if (!execucaoId) return;
    const listaRespostas = Object.entries(respostas).map(([pergunta_id, alternativa_index]) => ({
      pergunta_id: Number(pergunta_id),
      alternativa_index
    }));

    if (listaRespostas.length < (dados?.perguntas.length ?? 0)) {
      setErro('Responda todas as perguntas antes de finalizar.');
      return;
    }

    setSalvando(true);
    try {
      const r = await post('/api/v1/treinamento-publico/quiz/finalizar', {
        execucao_id: execucaoId,
        respostas: listaRespostas
      });
      setResultado(r);
      setStep(2);
      setTela('conclusao');
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const refazer = () => {
    setResultado(null);
    setExecucaoId(null);
    setRespostas({});
    setTela('treinamento');
    setStep(0);
  };

  // ─── Tela de carregamento ──────────────────────────────────────────────────
  if (tela === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // ─── Tela de erro ──────────────────────────────────────────────────────────
  if (tela === 'erro') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: 24 }}>
        <Result status="error" title="Acesso não encontrado" subTitle={erro} />
      </div>
    );
  }

  // ─── Tela de identificação ─────────────────────────────────────────────────
  if (tela === 'identificacao') {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Card style={{ width: 420, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>{turmaInfo?.empresa_nome}</Title>
            <Text type="secondary">{turmaInfo?.tema}</Text>
          </div>
          <Divider>Identificação</Divider>
          {erro && <Alert type="error" message={erro} style={{ marginBottom: 16 }} />}
          <Form layout="vertical" onFinish={identificar}>
            <Form.Item
              name="identificador"
              label={turmaInfo?.label_identificador ?? 'Identificador'}
              rules={[{ required: true }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item name="data_nascimento" label="Data de nascimento" rules={[{ required: true }]}>
              <Input type="date" size="large" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={identificando}>
              Acessar Treinamento
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  // ─── Tela de conclusão ─────────────────────────────────────────────────────
  if (tela === 'conclusao') {
    if (resultado) {
      return (
        <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Card style={{ width: 480, textAlign: 'center' }}>
            <Result
              status={resultado.aprovado ? 'success' : 'warning'}
              title={resultado.aprovado ? 'Parabéns! Você foi aprovado!' : 'Não foi desta vez'}
              subTitle={
                <>
                  <div>Nota: <strong>{resultado.nota.toFixed(1)}</strong></div>
                  <div>Acertos: <strong>{resultado.acertos} de {resultado.total_perguntas}</strong></div>
                  {dados?.turma.nota_minima && <div>Nota mínima: {dados.turma.nota_minima}</div>}
                </>
              }
              extra={resultado.pode_refazer ? (
                <Button onClick={refazer}>Tentar novamente</Button>
              ) : undefined}
            />
          </Card>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Card style={{ width: 480, textAlign: 'center' }}>
          <Result
            status="success"
            icon={<CheckCircleOutlined style={{ color: '#27ae60' }} />}
            title="Treinamento concluído!"
            subTitle="Sua conclusão foi registrada com sucesso."
          />
        </Card>
      </div>
    );
  }

  // ─── Tela de quiz ──────────────────────────────────────────────────────────
  if (tela === 'quiz' && dados) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
          <Card title={dados.turma.tema}>
            {erro && <Alert type="error" message={erro} style={{ marginBottom: 16 }} onClose={() => setErro('')} closable />}
            {dados.perguntas.map((p, idx) => (
              <div key={p.id} style={{ marginBottom: 24 }}>
                <Text strong>{idx + 1}. {p.pergunta}</Text>
                <div style={{ marginTop: 8 }}>
                  <Radio.Group
                    value={respostas[p.id]}
                    onChange={(e) => setRespostas((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    {p.alternativas.map((a) => (
                      <Radio key={a.index} value={a.index}>{a.texto}</Radio>
                    ))}
                  </Radio.Group>
                </div>
                {idx < dados.perguntas.length - 1 && <Divider />}
              </div>
            ))}
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Button
                type="primary"
                size="large"
                loading={salvando}
                onClick={finalizarQuiz}
              >
                Finalizar e enviar
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Tela do treinamento (materiais) ───────────────────────────────────────
  if (tela === 'treinamento' && dados) {
    const quizHabilitado = dados.turma.quiz_habilitado;
    const jaAprovado = dados.status === 'APROVADO';

    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', padding: '24px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px' }}>
          <Card style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>{dados.turma.tema}</Title>
            <Text type="secondary">{dados.turma.empresa_nome}</Text>
            <div style={{ marginTop: 8 }}>
              <Tag color={jaAprovado ? 'success' : 'default'}>{dados.status.replace('_', ' ')}</Tag>
              {dados.nota_final !== null && <Tag>Nota: {dados.nota_final}</Tag>}
              {dados.tentativas_realizadas > 0 && (
                <Text type="secondary"> — {dados.tentativas_realizadas} tentativa(s)</Text>
              )}
            </div>
          </Card>

          {jaAprovado ? (
            <Result status="success" title="Você já completou este treinamento!" />
          ) : (
            <>
              <Card title="Materiais de Estudo" style={{ marginBottom: 16 }}>
                {dados.materiais.length === 0 && <Text type="secondary">Nenhum material disponível.</Text>}
                {dados.materiais.map((m, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <LinkOutlined style={{ marginRight: 8, color: '#0b5be1' }} />
                    <a href={m.url} target="_blank" rel="noreferrer">{m.titulo}</a>
                    <Tag style={{ marginLeft: 8 }} color={m.tipo === 'PDF' ? 'red' : m.tipo === 'VIDEO' ? 'purple' : 'blue'}>
                      {m.tipo}
                    </Tag>
                  </div>
                ))}
              </Card>

              <div style={{ textAlign: 'center' }}>
                {quizHabilitado ? (
                  dados.pode_tentar ? (
                    <Button type="primary" size="large" loading={salvando} onClick={iniciarQuiz}>
                      Iniciar Quiz
                    </Button>
                  ) : (
                    <Alert type="error" message="Número máximo de tentativas atingido." />
                  )
                ) : (
                  <Button type="primary" size="large" loading={salvando} onClick={confirmarConclusao}>
                    Confirmar conclusão
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}
