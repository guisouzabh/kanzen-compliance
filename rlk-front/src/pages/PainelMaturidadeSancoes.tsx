import { useMemo } from 'react';
import { Card, Empty, Flex, Select, Space, Tag, Typography } from 'antd';
import { useEmpresaContext } from '../contexts/EmpresaContext';

const maturidadeOptions = [
  { value: 0, nome: 'Inicial', descricao: 'Processos imprevisíveis e pouco controlados' },
  { value: 1, nome: 'Gerenciado', descricao: 'Processos são projetos, ainda reativos' },
  { value: 2, nome: 'Definido', descricao: 'Processos conhecidos, documentados e proativos' },
  { value: 3, nome: 'Qualidade', descricao: 'Processos organizados e medidos' },
  { value: 4, nome: 'Otimização', descricao: 'Processos organizados, medidos e otimizados' }
];

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
    descricao: 'Até 2% do faturamento da empresa no Brasil, limitada a R$ 50 milhões por infração.'
  },
  {
    value: 3,
    nome: 'Muito alto impacto',
    sancao: 'Publicização da infração',
    descricao: 'Obrigação de divulgar publicamente a infração cometida, gerando dano reputacional relevante.'
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
    descricao: 'Parte relevante das operações de dados da empresa fica proibida de operar.'
  },
  {
    value: 6,
    nome: 'Máximo impacto',
    sancao: 'Suspensão ou proibição total do tratamento de dados pessoais',
    descricao:
      'A empresa fica legalmente impedida de tratar dados pessoais, podendo inviabilizar o negócio.'
  }
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function Gauge({
  value,
  max,
  color,
  label,
  subtitle
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  subtitle?: string;
}) {
  const clamped = clamp(value, 0, max);
  const angle = -90 + (clamped / max) * 180;
  const radius = 90;
  const centerX = 120;
  const centerY = 120;
  const needleLength = 70;
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180);
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180);

  const ticks = Array.from({ length: max + 1 }).map((_, idx) => {
    const tAngle = -90 + (idx / max) * 180;
    const inner = radius - 8;
    const outer = radius;
    const x1 = centerX + inner * Math.cos((tAngle * Math.PI) / 180);
    const y1 = centerY + inner * Math.sin((tAngle * Math.PI) / 180);
    const x2 = centerX + outer * Math.cos((tAngle * Math.PI) / 180);
    const y2 = centerY + outer * Math.sin((tAngle * Math.PI) / 180);
    return { x1, y1, x2, y2, idx };
  });

  return (
    <Card>
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Typography.Text strong>{label}</Typography.Text>
        {subtitle ? <Typography.Text type="secondary">{subtitle}</Typography.Text> : null}
        <div style={{ width: 260, height: 170 }}>
          <svg width="260" height="170" viewBox="0 0 260 170">
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <path
              d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(clamped / max) * Math.PI * radius} ${Math.PI * radius}`}
            />
            {ticks.map((tick) => (
              <line
                key={`tick-${tick.idx}`}
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#94a3b8"
                strokeWidth="2"
              />
            ))}
            <line
              x1={centerX}
              y1={centerY}
              x2={needleX}
              y2={needleY}
              stroke="#111827"
              strokeWidth="3"
            />
            <circle cx={centerX} cy={centerY} r="5" fill="#111827" />
            <text x={centerX} y={centerY + 30} textAnchor="middle" fontSize="16" fill="#111827">
              {clamped} / {max}
            </text>
          </svg>
        </div>
      </Space>
    </Card>
  );
}

function PainelMaturidadeSancoes() {
  const { empresas, empresaSelecionada, setEmpresaSelecionada } = useEmpresaContext();
  const empresa = useMemo(
    () => empresas.find((item) => item.id === empresaSelecionada) || null,
    [empresas, empresaSelecionada]
  );

  const maturidadeData = useMemo(
    () =>
      maturidadeOptions.map((item) => ({
        ...item,
        ativo: empresa?.parametro_maturidade === item.value
      })),
    [empresa]
  );

  const sancoesData = useMemo(
    () =>
      sancoesOptions.map((item) => ({
        ...item,
        ativo: empresa?.termometro_sancoes_id === item.value
      })),
    [empresa]
  );

  const maturidadeAtual = maturidadeOptions.find(
    (item) => item.value === (empresa?.parametro_maturidade ?? 0)
  );
  const sancaoAtual = sancoesOptions.find(
    (item) => item.value === (empresa?.termometro_sancoes_id ?? 0)
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Painel de Maturidade e Sanções
        </Typography.Title>
        <Typography.Text type="secondary">
          Visualize todos os níveis e destaque a posição atual da empresa selecionada.
        </Typography.Text>
      </div>

      {!empresaSelecionada ? (
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Empty description="Selecione uma empresa para visualizar o painel" />
            <Select
              placeholder="Selecione a empresa"
              value={empresaSelecionada ?? undefined}
              onChange={(value) => setEmpresaSelecionada(value ?? null)}
              options={empresas.map((item) => ({ value: item.id, label: item.nome }))}
              style={{ maxWidth: 320 }}
            />
          </Space>
        </Card>
      ) : !empresa ? (
        <Card>
          <Empty description="Empresa não encontrada" />
        </Card>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Flex align="center" justify="space-between" wrap>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {empresa.nome}
                </Typography.Title>
                <Typography.Text type="secondary">
                  Parâmetro de maturidade e termômetro de sanções administrativas
                </Typography.Text>
              </div>
              <Space>
                <Tag color="geekblue">Maturidade: {maturidadeAtual?.nome ?? '—'}</Tag>
                <Tag color="purple">Sanções: {sancaoAtual?.nome ?? '—'}</Tag>
              </Space>
            </Flex>
          </Card>

          <Flex gap={16} wrap>
            <Gauge
              value={empresa.parametro_maturidade ?? 0}
              max={4}
              color="#0b5be1"
              label="Parâmetro de maturidade"
              subtitle={maturidadeAtual?.nome}
            />
            <Gauge
              value={empresa.termometro_sancoes_id ?? 0}
              max={6}
              color="#7d4ce5"
              label="Termômetro de sanções administrativas"
              subtitle={sancaoAtual?.nome}
            />
          </Flex>

          <Card title="Detalhamento de maturidade">
            <Space direction="vertical" size="small">
              {maturidadeData.map((item) => (
                <Flex key={item.value} align="center" gap={8}>
                  <Tag color={item.ativo ? 'blue' : 'default'}>{item.value}</Tag>
                  <Typography.Text strong={item.ativo}>{item.nome}</Typography.Text>
                  <Typography.Text type="secondary">{item.descricao}</Typography.Text>
                </Flex>
              ))}
            </Space>
          </Card>

          <Card title="Detalhamento de sanções administrativas">
            <Space direction="vertical" size="small">
              {sancoesData.map((item) => (
                <Flex key={item.value} align="center" gap={8}>
                  <Tag color={item.ativo ? 'purple' : 'default'}>{item.value}</Tag>
                  <Typography.Text strong={item.ativo}>{item.nome}</Typography.Text>
                  <Typography.Text type="secondary">{item.sancao}</Typography.Text>
                  <Typography.Text type="secondary">{item.descricao}</Typography.Text>
                </Flex>
              ))}
            </Space>
          </Card>
        </Space>
      )}
    </Space>
  );
}

export default PainelMaturidadeSancoes;
