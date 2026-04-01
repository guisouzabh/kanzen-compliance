import { useEffect, useState, useCallback } from 'react';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Spin,
  Tag,
  Tooltip,
  Typography,
  Select,
  Statistic
} from 'antd';
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../services/api';
import type { InventarioDado } from '../types/Inventario';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ─── Tipos ────────────────────────────────────────────────────────────────────

type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';

interface AvaliacaoRisco {
  id?: number;
  inventario_id: number;
  probabilidade: number;
  impacto: number;
  nivel_risco: NivelRisco;
  justificativa: string;
  medidas_mitigatorias: string;
  responsavel_risco: string;
  versao?: number;
  updated_at?: string;
  avaliado_por_nome?: string;
}

// ─── Constantes da matriz ─────────────────────────────────────────────────────

const PROBABILIDADES = ['Raro', 'Improvável', 'Possível', 'Provável', 'Quase certo'];
const IMPACTOS = ['Insignificante', 'Menor', 'Moderado', 'Maior', 'Catastrófico'];

const MATRIZ: NivelRisco[][] = [
  ['BAIXO',  'BAIXO',  'BAIXO',  'MEDIO',  'MEDIO'],
  ['BAIXO',  'BAIXO',  'MEDIO',  'MEDIO',  'ALTO'],
  ['BAIXO',  'MEDIO',  'MEDIO',  'ALTO',   'CRITICO'],
  ['MEDIO',  'MEDIO',  'ALTO',   'CRITICO','CRITICO'],
  ['MEDIO',  'ALTO',   'CRITICO','CRITICO','CRITICO'],
];

const NIVEL_CONFIG: Record<NivelRisco, { label: string; color: string; bg: string; border: string; icon: React.ReactNode; acao: string }> = {
  BAIXO:   { label: 'Baixo',   color: '#237804', bg: '#f6ffed', border: '#b7eb8f', icon: <SafetyOutlined />,          acao: 'Monitorar' },
  MEDIO:   { label: 'Médio',   color: '#874d00', bg: '#fffbe6', border: '#ffe58f', icon: <ClockCircleOutlined />,      acao: 'Plano de mitigação' },
  ALTO:    { label: 'Alto',    color: '#ad2102', bg: '#fff2e8', border: '#ffbb96', icon: <WarningOutlined />,          acao: 'Ação prioritária' },
  CRITICO: { label: 'Crítico', color: '#a8071a', bg: '#fff1f0', border: '#ffa39e', icon: <AlertOutlined />,            acao: 'RIPD obrigatório' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nivelTag(nivel?: NivelRisco) {
  if (!nivel) return <Text type="secondary" style={{ fontSize: 12 }}>Pendente</Text>;
  const cfg = NIVEL_CONFIG[nivel];
  return (
    <Tag color={nivel === 'BAIXO' ? 'success' : nivel === 'MEDIO' ? 'warning' : nivel === 'ALTO' ? 'orange' : 'error'}>
      {cfg.label}
    </Tag>
  );
}

// ─── Componente da Matriz ─────────────────────────────────────────────────────

interface MatrizProps {
  selected: { prob: number; imp: number } | null;
  onSelect: (prob: number, imp: number) => void;
}

function MatrizRisco5x5({ selected, onSelect }: MatrizProps) {
  const cellSize = 56;

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: 380 }}>
        {/* Cabeçalho de impacto */}
        <div style={{ display: 'flex', marginLeft: 110, marginBottom: 4 }}>
          {IMPACTOS.map((imp, ci) => (
            <div
              key={ci}
              style={{
                width: cellSize,
                textAlign: 'center',
                fontSize: 11,
                color: '#666',
                fontWeight: 600,
                lineHeight: '14px',
                padding: '0 2px'
              }}
            >
              {imp}
            </div>
          ))}
        </div>

        {/* Linhas: probabilidade de alta para baixa */}
        {[...PROBABILIDADES].reverse().map((prob, ri) => {
          const probIdx = PROBABILIDADES.length - 1 - ri; // índice real (4 → 0)
          return (
            <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              {/* Label probabilidade */}
              <div
                style={{
                  width: 106,
                  textAlign: 'right',
                  paddingRight: 8,
                  fontSize: 11,
                  color: '#666',
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {prob}
              </div>

              {/* Células */}
              {IMPACTOS.map((_, ci) => {
                const nivel = MATRIZ[probIdx][ci];
                const cfg = NIVEL_CONFIG[nivel];
                const isSelected = selected?.prob === probIdx && selected?.imp === ci;

                return (
                  <Tooltip
                    key={ci}
                    title={`${prob} × ${IMPACTOS[ci]} = ${cfg.label}`}
                    placement="top"
                  >
                    <div
                      onClick={() => onSelect(probIdx, ci)}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        borderRadius: 6,
                        marginRight: 3,
                        backgroundColor: cfg.bg,
                        border: isSelected
                          ? `2.5px solid ${cfg.color}`
                          : `1.5px solid ${cfg.border}`,
                        boxShadow: isSelected ? `0 0 0 3px ${cfg.border}` : undefined,
                        opacity: selected && !isSelected ? 0.45 : 1,
                        transition: 'all 0.15s',
                        fontSize: 18
                      }}
                    >
                      {isSelected ? (
                        <CheckCircleOutlined style={{ color: cfg.color, fontSize: 20 }} />
                      ) : (
                        <span style={{ color: cfg.color, fontSize: 11, fontWeight: 700 }}>
                          {cfg.label.charAt(0)}
                        </span>
                      )}
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          );
        })}

        {/* Eixo X label */}
        <div style={{ marginLeft: 110, marginTop: 6, textAlign: 'center', fontSize: 11, color: '#999', fontWeight: 600 }}>
          ← Impacto sobre o Titular →
        </div>
      </div>

      {/* Eixo Y label */}
      <div style={{ marginTop: 8, fontSize: 11, color: '#999', fontWeight: 600 }}>
        ↑ Probabilidade
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function AvaliacaoRisco() {
  const { message } = App.useApp();

  const [inventario, setInventario] = useState<InventarioDado[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Record<number, AvaliacaoRisco>>({});
  const [loadingInv, setLoadingInv] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [matrizSel, setMatrizSel] = useState<{ prob: number; imp: number } | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // ── Carga inicial ───────────────────────────────────────────────────────────

  const carregarInventario = useCallback(async () => {
    try {
      setLoadingInv(true);
      const [invRes, avRes] = await Promise.all([
        api.get('/inventario-dados'),
        api.get('/avaliacao-risco')
      ]);
      setInventario(invRes.data ?? []);
      const map: Record<number, AvaliacaoRisco> = {};
      (avRes.data ?? []).forEach((a: AvaliacaoRisco) => { map[a.inventario_id] = a; });
      setAvaliacoes(map);
    } catch {
      message.error('Erro ao carregar dados');
    } finally {
      setLoadingInv(false);
    }
  }, [message]);

  useEffect(() => { carregarInventario(); }, [carregarInventario]);

  // ── Seleção de item ─────────────────────────────────────────────────────────

  function selecionarItem(id: number) {
    setSelectedItemId(id);
    setSavedMsg(false);
    const av = avaliacoes[id];
    if (av) {
      setMatrizSel({ prob: av.probabilidade, imp: av.impacto });
      form.setFieldsValue({
        justificativa: av.justificativa,
        medidas_mitigatorias: av.medidas_mitigatorias,
        responsavel_risco: av.responsavel_risco
      });
    } else {
      setMatrizSel(null);
      form.resetFields();
    }
  }

  // ── Salvar ──────────────────────────────────────────────────────────────────

  async function salvar() {
    if (!selectedItemId || !matrizSel) return;
    try {
      await form.validateFields();
    } catch {
      return;
    }

    const valores = form.getFieldsValue();
    setSaving(true);
    try {
      const res = await api.post('/avaliacao-risco', {
        inventario_id: selectedItemId,
        probabilidade: matrizSel.prob,
        impacto: matrizSel.imp,
        justificativa: valores.justificativa,
        medidas_mitigatorias: valores.medidas_mitigatorias,
        responsavel_risco: valores.responsavel_risco
      });
      setAvaliacoes(prev => ({ ...prev, [selectedItemId]: res.data }));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch {
      message.error('Erro ao salvar avaliação');
    } finally {
      setSaving(false);
    }
  }

  // ── Derivados ───────────────────────────────────────────────────────────────

  const item = inventario.find(i => i.id === selectedItemId) ?? null;
  const nivelAtual = matrizSel ? MATRIZ[matrizSel.prob][matrizSel.imp] : null;
  const cfgAtual = nivelAtual ? NIVEL_CONFIG[nivelAtual] : null;

  const totalAvaliados = Object.keys(avaliacoes).length;
  const totalPendentes = inventario.length - totalAvaliados;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: '#f5f5f5' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Avaliação de Risco — LGPD</Title>
        <Text type="secondary">Selecione um item do inventário e avalie na matriz 5×5</Text>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col>
            <Card size="small" style={{ minWidth: 120 }}>
              <Statistic title="Total" value={inventario.length} valueStyle={{ fontSize: 20 }} />
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ minWidth: 120 }}>
              <Statistic
                title="Avaliados"
                value={totalAvaliados}
                valueStyle={{ fontSize: 20, color: '#27ae60' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col>
            <Card size="small" style={{ minWidth: 120 }}>
              <Statistic
                title="Pendentes"
                value={totalPendentes}
                valueStyle={{ fontSize: 20, color: totalPendentes > 0 ? '#d46b08' : '#27ae60' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Seletor mobile (< 768px) */}
      <div style={{ display: 'none', marginBottom: 16 }} className="avaliacao-risco-mobile-select">
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione um item do inventário"
          value={selectedItemId ?? undefined}
          onChange={selecionarItem}
          options={inventario.map(i => ({
            value: i.id!,
            label: `${i.dado_tratado}${avaliacoes[i.id!] ? ` [${NIVEL_CONFIG[avaliacoes[i.id!].nivel_risco].label}]` : ' [Pendente]'}`
          }))}
        />
      </div>

      {/* Corpo em dois painéis */}
      <div
        style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}
        className="avaliacao-risco-body"
      >
        {/* ─── Painel esquerdo ─── */}
        <Card
          size="small"
          style={{ width: 320, flexShrink: 0, maxHeight: 'calc(100vh - 220px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ padding: 0, flex: 1, overflowY: 'auto' }}
          title={<Text strong style={{ fontSize: 13 }}>Inventário de Dados</Text>}
          className="avaliacao-risco-left-panel"
        >
          <Spin spinning={loadingInv}>
            {inventario.length === 0 && !loadingInv && (
              <div style={{ padding: 16, textAlign: 'center' }}>
                <Text type="secondary">Nenhum item encontrado</Text>
              </div>
            )}
            {inventario.map(inv => {
              const av = avaliacoes[inv.id!];
              const isActive = selectedItemId === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => selecionarItem(inv.id!)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#e6f4ff' : undefined,
                    borderLeft: isActive ? '3px solid #0b5be1' : '3px solid transparent',
                    transition: 'background 0.15s'
                  }}
                >
                  <div style={{ fontWeight: isActive ? 600 : 400, fontSize: 13, color: '#222', marginBottom: 4 }}>
                    {inv.dado_tratado}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {inv.dados_sensiveis && (
                      <Tag color="purple" style={{ fontSize: 10, padding: '0 4px' }}>Sensível</Tag>
                    )}
                    {inv.categoria && (
                      <Text type="secondary" style={{ fontSize: 11 }}>{inv.categoria}</Text>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                      {nivelTag(av?.nivel_risco)}
                    </div>
                  </div>
                </div>
              );
            })}
          </Spin>
        </Card>

        {/* ─── Painel direito ─── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!item ? (
            <Card style={{ textAlign: 'center', padding: '60px 0' }}>
              <SafetyOutlined style={{ fontSize: 48, color: '#d9d9d9', display: 'block', marginBottom: 16 }} />
              <Text type="secondary" style={{ fontSize: 15 }}>
                Selecione um item à esquerda para iniciar a avaliação
              </Text>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 1. Resumo do item */}
              <Card size="small" title="Item selecionado">
                <Title level={5} style={{ margin: '0 0 8px' }}>{item.dado_tratado}</Title>
                <Row gutter={[16, 8]}>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Categoria: </Text>
                    <Text style={{ fontSize: 12 }}>{item.categoria ?? '—'}</Text>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Dados sensíveis: </Text>
                    <Tag color={item.dados_sensiveis ? 'purple' : 'default'} style={{ fontSize: 11 }}>
                      {item.dados_sensiveis ? 'Sim' : 'Não'}
                    </Tag>
                  </Col>
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>Menor: </Text>
                    <Tag color={item.dados_menor ? 'red' : 'default'} style={{ fontSize: 11 }}>
                      {item.dados_menor ? 'Sim' : 'Não'}
                    </Tag>
                  </Col>
                  {item.local_armazenamento && (
                    <Col>
                      <Text type="secondary" style={{ fontSize: 12 }}>Armazenamento: </Text>
                      <Text style={{ fontSize: 12 }}>{item.local_armazenamento}</Text>
                    </Col>
                  )}
                  {item.principal_agente && (
                    <Col>
                      <Text type="secondary" style={{ fontSize: 12 }}>Agente: </Text>
                      <Text style={{ fontSize: 12 }}>{item.principal_agente}</Text>
                    </Col>
                  )}
                </Row>
                {avaliacoes[item.id!]?.versao && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Versão {avaliacoes[item.id!].versao} — Última avaliação:{' '}
                      {avaliacoes[item.id!].updated_at
                        ? new Date(avaliacoes[item.id!].updated_at!).toLocaleString('pt-BR')
                        : '—'}
                      {avaliacoes[item.id!].avaliado_por_nome && ` por ${avaliacoes[item.id!].avaliado_por_nome}`}
                    </Text>
                  </div>
                )}
              </Card>

              {/* 2. Matriz de risco */}
              <Card
                size="small"
                title="Matriz de Risco 5×5 — ISO 27005 / ISO 31000"
                extra={
                  matrizSel && (
                    <Button
                      size="small"
                      type="link"
                      onClick={() => setMatrizSel(null)}
                    >
                      Limpar seleção
                    </Button>
                  )
                }
              >
                <MatrizRisco5x5 selected={matrizSel} onSelect={(p, i) => setMatrizSel({ prob: p, imp: i })} />
              </Card>

              {/* 3. Banner de resultado */}
              {nivelAtual && cfgAtual && (
                <div
                  style={{
                    padding: '14px 20px',
                    borderRadius: 8,
                    backgroundColor: cfgAtual.bg,
                    border: `1.5px solid ${cfgAtual.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22, color: cfgAtual.color }}>{cfgAtual.icon}</span>
                    <div>
                      <Text strong style={{ color: cfgAtual.color, fontSize: 16 }}>
                        Risco {cfgAtual.label}
                      </Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {PROBABILIDADES[matrizSel!.prob]} × {IMPACTOS[matrizSel!.imp]}
                        </Text>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: 13, color: cfgAtual.color, fontWeight: 600 }}>
                      Ação recomendada:
                    </Text>
                    <div>
                      <Text style={{ fontSize: 13 }}>{cfgAtual.acao}</Text>
                    </div>
                    {nivelAtual === 'CRITICO' && (
                      <Badge
                        count="RIPD EXIGIDO"
                        style={{ backgroundColor: '#cf1322', marginTop: 4 }}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* 4. Formulário */}
              <Card size="small" title="Detalhes da avaliação">
                <Form form={form} layout="vertical" requiredMark={false}>
                  <Form.Item
                    name="justificativa"
                    label="Justificativa da avaliação"
                    rules={[{ required: true, message: 'Informe a justificativa' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="Por que esse nível de risco? Quais fatores considerou?"
                    />
                  </Form.Item>

                  <Form.Item
                    name="medidas_mitigatorias"
                    label="Medidas mitigatórias"
                    rules={[{ required: true, message: 'Informe as medidas' }]}
                  >
                    <TextArea
                      rows={3}
                      placeholder="Controles técnicos e organizacionais aplicados ou planejados"
                    />
                  </Form.Item>

                  <Form.Item
                    name="responsavel_risco"
                    label="Responsável pelo risco"
                    rules={[{ required: true, message: 'Informe o responsável' }]}
                  >
                    <Input placeholder="Nome ou cargo do responsável" />
                  </Form.Item>
                </Form>
              </Card>

              {/* 5. Botão salvar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Button
                  type="primary"
                  size="large"
                  disabled={!matrizSel}
                  loading={saving}
                  onClick={salvar}
                  icon={<CheckCircleOutlined />}
                >
                  Salvar avaliação
                </Button>
                {savedMsg && (
                  <Text style={{ color: '#27ae60', fontWeight: 600 }}>
                    <CheckCircleOutlined /> Salvo com sucesso
                  </Text>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Estilos responsivos */}
      <style>{`
        @media (max-width: 768px) {
          .avaliacao-risco-mobile-select { display: block !important; }
          .avaliacao-risco-left-panel { display: none !important; }
          .avaliacao-risco-body { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
