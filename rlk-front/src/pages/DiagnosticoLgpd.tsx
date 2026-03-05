import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Empty,
  Flex,
  Form,
  Input,
  AutoComplete,
  Modal,
  Popconfirm,
  Progress,
  Radio,
  Row,
  Col,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CheckCircleFilled,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  FileSearchOutlined,
  LeftOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  AudioOutlined,
  StopOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import api from '../services/api';
import { useEmpresaContext } from '../contexts/EmpresaContext';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

interface DiagnosticoModelo {
  id: number;
  nome: string;
  descricao?: string | null;
  dm_escopo_id?: number;
  escopo_nome?: string | null;
  versao?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DmEscopo {
  id: number;
  nome: string;
  descricao?: string | null;
}

interface DiagnosticoPergunta {
  id: number;
  modelo_id: number;
  codigo: string;
  dominio: string;
  macro_dominio?: string;
  pergunta: string;
  opcao_0: string;
  opcao_1: string;
  opcao_2: string;
  opcao_3: string;
  peso: number;
  ordem?: number;
  ativo?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DiagnosticoExecucao {
  id: number;
  empresa_id: number;
  empresa_nome?: string;
  modelo_id: number;
  modelo_nome?: string;
  status?: string;
  nota_geral?: number;
  created_at?: string;
  updated_at?: string;
}

interface DiagnosticoResposta {
  pergunta_id: number;
  opcao: number;
  observacoes?: string | null;
}

interface DiagnosticoResultadoDominio {
  dominio: string;
  nota: number;
  total_peso?: number;
  max_pontos?: number;
  pontos?: number;
}

interface DiagnosticoResultadoMacro {
  macro_dominio: string;
  nota: number;
  total_peso?: number;
  max_pontos?: number;
  pontos?: number;
}

interface DiagnosticoAcaoSugerida {
  acao: string;
  objetivo?: string | null;
  macro_dominio?: string | null;
  prioridade?: number;
  esforco?: number;
}

function formatNota(value?: number | string) {
  if (value === null || value === undefined) return '0.00';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return '0.00';
  return num.toFixed(2);
}

function normalizarNota(value?: number | string) {
  if (value === null || value === undefined) return 0;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function obterNivelMaturidade(nota: number) {
  if (nota < 20) return 'Inicial';
  if (nota < 40) return 'Gerenciado';
  if (nota < 60) return 'Definido';
  if (nota < 80) return 'Qualidade';
  return 'Otimização';
}

const coresDominio = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#17becf'];

type ModeloFormValues = {
  nome: string;
  descricao?: string | null;
  dm_escopo_id: number;
  versao?: number;
  ativo?: boolean;
};

type PerguntaFormValues = {
  modelo_id: number;
  codigo: string;
  dominio: string;
  macro_dominio: string;
  pergunta: string;
  opcao_0: string;
  opcao_1: string;
  opcao_2: string;
  opcao_3: string;
  peso: number;
  ordem?: number;
  ativo?: boolean;
};

type ExecucaoFormValues = {
  empresa_id: number;
  modelo_id: number;
};

const statusColor: Record<string, string> = {
  RASCUNHO: 'gold',
  FINALIZADO: 'green'
};

const macroDominiosPadrao = [
  'Governança e Cultura',
  'Bases Legais e Transparência',
  'Direitos do Titular',
  'Inventário e Registro',
  'Segurança e Continuidade',
  'Terceiros e Compartilhamento',
  'Dados Sensíveis e Impacto'
];

function DiagnosticoLgpd() {
  const { empresas, empresaSelecionada } = useEmpresaContext();
  const [escopos, setEscopos] = useState<DmEscopo[]>([]);
  const [modelos, setModelos] = useState<DiagnosticoModelo[]>([]);
  const [perguntasModelo, setPerguntasModelo] = useState<DiagnosticoPergunta[]>([]);
  const [perguntasExecucao, setPerguntasExecucao] = useState<DiagnosticoPergunta[]>([]);
  const [execucoes, setExecucoes] = useState<DiagnosticoExecucao[]>([]);
  const [resultados, setResultados] = useState<DiagnosticoResultadoDominio[]>([]);
  const [resultadosMacro, setResultadosMacro] = useState<DiagnosticoResultadoMacro[]>([]);
  const [analisePorExecucao, setAnalisePorExecucao] = useState<Record<number, string>>({});
  const [acoesPorExecucao, setAcoesPorExecucao] = useState<
    Record<number, DiagnosticoAcaoSugerida[]>
  >({});

  const [carregandoModelos, setCarregandoModelos] = useState(false);
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(false);
  const [carregandoExecucoes, setCarregandoExecucoes] = useState(false);
  const [carregandoResultados, setCarregandoResultados] = useState(false);
  const [carregandoAnalise, setCarregandoAnalise] = useState(false);
  const [exportandoPdfId, setExportandoPdfId] = useState<number | null>(null);
  const [gerandoAnaliseId, setGerandoAnaliseId] = useState<number | null>(null);
  const [modalAcoesAberto, setModalAcoesAberto] = useState(false);
  const [acoesSelecionadas, setAcoesSelecionadas] = useState<number[]>([]);
  const [salvandoAcoes, setSalvandoAcoes] = useState(false);

  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<number | null>(null);

  const [modalModeloAberto, setModalModeloAberto] = useState(false);
  const [editandoModelo, setEditandoModelo] = useState<DiagnosticoModelo | null>(null);
  const [modalPerguntaAberta, setModalPerguntaAberta] = useState(false);
  const [editandoPergunta, setEditandoPergunta] = useState<DiagnosticoPergunta | null>(null);
  const [modalExecucaoAberta, setModalExecucaoAberta] = useState(false);
  const [execucaoSelecionada, setExecucaoSelecionada] = useState<DiagnosticoExecucao | null>(null);
  const [modalResponderAberto, setModalResponderAberto] = useState(false);
  const [modalResultadosAberto, setModalResultadosAberto] = useState(false);

  const [respostas, setRespostas] = useState<Record<number, { opcao?: number; observacoes?: string }>>({});
  const [salvandoRespostas, setSalvandoRespostas] = useState(false);
  const [dominioAtivo, setDominioAtivo] = useState<string | null>(null);
  const [gravandoPerguntaId, setGravandoPerguntaId] = useState<number | null>(null);
  const [speechDisponivel, setSpeechDisponivel] = useState(false);
  const speechRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechDisponivel(Boolean(SpeechRecognition));
  }, []);

  const [formModelo] = Form.useForm<ModeloFormValues>();
  const [formPergunta] = Form.useForm<PerguntaFormValues>();
  const [formExecucao] = Form.useForm<ExecucaoFormValues>();

  const dominiosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    perguntasModelo.forEach((p) => set.add(p.dominio));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [perguntasModelo]);

  const perguntasPorDominio = useMemo(() => {
    const mapa: Record<string, DiagnosticoPergunta[]> = {};
    perguntasExecucao.forEach((p) => {
      if (!mapa[p.dominio]) mapa[p.dominio] = [];
      mapa[p.dominio].push(p);
    });
    Object.values(mapa).forEach((lista) => lista.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)));
    return mapa;
  }, [perguntasExecucao]);

  const dominiosOrdenados = useMemo(() => {
    const vistos = new Set<string>();
    const lista: string[] = [];
    perguntasExecucao.forEach((p) => {
      if (!vistos.has(p.dominio)) {
        vistos.add(p.dominio);
        lista.push(p.dominio);
      }
    });
    return lista;
  }, [perguntasExecucao]);

  const dominioCompleto = useMemo(() => {
    const status: Record<string, boolean> = {};
    dominiosOrdenados.forEach((dominio) => {
      const lista = perguntasPorDominio[dominio] || [];
      status[dominio] =
        lista.length > 0 && lista.every((p) => typeof respostas[p.id]?.opcao === 'number');
    });
    return status;
  }, [dominiosOrdenados, perguntasPorDominio, respostas]);

  const totalPerguntas = perguntasExecucao.length;
  const totalRespondidas = useMemo(() => {
    return perguntasExecucao.filter((p) => typeof respostas[p.id]?.opcao === 'number').length;
  }, [perguntasExecucao, respostas]);

  async function carregarModelos(showMessage = false) {
    try {
      setCarregandoModelos(true);
      const resp = await api.get('/diagnosticos/modelos');
      setModelos(resp.data || []);
      if (showMessage) message.success('Modelos atualizados');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar modelos');
    } finally {
      setCarregandoModelos(false);
    }
  }

  async function carregarEscopos() {
    try {
      const resp = await api.get('/dm-escopos');
      setEscopos(resp.data || []);
    } catch {
      setEscopos([]);
    }
  }

  async function carregarPerguntasModelo(modeloId: number, showMessage = false) {
    try {
      setCarregandoPerguntas(true);
      const resp = await api.get(`/diagnosticos/modelos/${modeloId}/perguntas`);
      setPerguntasModelo(resp.data || []);
      if (showMessage) message.success('Perguntas atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar perguntas');
    } finally {
      setCarregandoPerguntas(false);
    }
  }

  async function carregarPerguntasExecucao(modeloId: number) {
    const resp = await api.get(`/diagnosticos/modelos/${modeloId}/perguntas`);
    setPerguntasExecucao(resp.data || []);
  }

  async function carregarExecucoes(showMessage = false) {
    try {
      setCarregandoExecucoes(true);
      const resp = await api.get('/diagnosticos/execucoes', {
        params: empresaSelecionada ? { empresa_id: empresaSelecionada } : undefined
      });
      setExecucoes(resp.data || []);
      if (showMessage) message.success('Execuções atualizadas');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar execuções');
    } finally {
      setCarregandoExecucoes(false);
    }
  }

  async function carregarRespostas(execucaoId: number) {
    const resp = await api.get(`/diagnosticos/execucoes/${execucaoId}/respostas`);
    const lista: DiagnosticoResposta[] = resp.data || [];
    const map: Record<number, { opcao?: number; observacoes?: string }> = {};
    lista.forEach((r) => {
      map[r.pergunta_id] = {
        opcao: r.opcao,
        observacoes: r.observacoes ?? ''
      };
    });
    setRespostas(map);
  }

  async function carregarAnalise(execucaoId: number, force = false) {
    if (!force && analisePorExecucao[execucaoId]) return;
    try {
      setCarregandoAnalise(true);
      const resp = await api.post(`/diagnosticos/execucoes/${execucaoId}/analise`);
      const texto = resp.data?.texto ?? '';
      const acoes = resp.data?.acoes_sugeridas ?? [];
      if (texto) setAnalisePorExecucao((prev) => ({ ...prev, [execucaoId]: texto }));
      setAcoesPorExecucao((prev) => ({ ...prev, [execucaoId]: acoes }));
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao gerar análise');
    } finally {
      setCarregandoAnalise(false);
    }
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function gerarRadarSvg(resultadosLocal: DiagnosticoResultadoDominio[]) {
    const dados = resultadosLocal.map((r) => ({
      dominio: r.dominio,
      nota: normalizarNota(r.nota)
    }));
    if (dados.length < 3) {
      return '<div style="font-size:12px;color:#6b7280">Sem dados suficientes para o radar.</div>';
    }

    const size = 220;
    const center = size / 2;
    const radius = 80;
    const levels = 4;
    const angleStep = (Math.PI * 2) / dados.length;

    const grid = Array.from({ length: levels }, (_, i) => {
      const r = (radius * (i + 1)) / levels;
      return `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#e5e7eb" />`;
    }).join('');

    const axes = dados
      .map((_, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="#e5e7eb" />`;
      })
      .join('');

    const points = dados
      .map((d, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const r = (radius * d.nota) / 100;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(' ');

    const labels = dados
      .map((d, i) => {
        const angle = -Math.PI / 2 + angleStep * i;
        const r = radius + 16;
        const x = center + r * Math.cos(angle);
        const y = center + r * Math.sin(angle);
        const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';
        return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="10" fill="#374151">${escapeHtml(d.dominio)}</text>`;
      })
      .join('');

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        ${grid}
        ${axes}
        <polygon points="${points}" fill="#0b5be1" fill-opacity="0.35" stroke="#0b5be1" />
        ${labels}
      </svg>
    `;
  }

  function gerarPdf(
    execucao: DiagnosticoExecucao,
    resultadosLocal: DiagnosticoResultadoDominio[],
    analiseTexto: string,
    labelDominio: string,
    acoesSugeridas: DiagnosticoAcaoSugerida[]
  ) {
    const empresaNome =
      execucao.empresa_nome || empresas.find((e) => e.id === execucao.empresa_id)?.nome || 'Empresa';
    const modeloNome =
      execucao.modelo_nome || modelos.find((m) => m.id === execucao.modelo_id)?.nome || 'Modelo';
    const data = new Date().toLocaleDateString('pt-BR');

    const resultadosOrdenadosLocal = [...resultadosLocal].sort((a, b) =>
      a.dominio.localeCompare(b.dominio)
    );
    const notaGeral = normalizarNota(execucao.nota_geral);
    const nivel = obterNivelMaturidade(notaGeral);
    const alerta = resultadosOrdenadosLocal.some((r) => normalizarNota(r.nota) === 0);

    const barras = resultadosOrdenadosLocal
      .map((r, idx) => {
        const nota = normalizarNota(r.nota);
        const cor = coresDominio[idx % coresDominio.length];
        return `
          <div class="bar-row">
            <div class="bar-label">${escapeHtml(r.dominio)}</div>
            <div class="bar-value">${formatNota(nota)}</div>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${Math.round(nota)}%; background:${cor};"></div>
          </div>
        `;
      })
      .join('');

    const paragrafos = (analiseTexto || '')
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');

    const acoesHtml = (acoesSugeridas || [])
      .map((acao) => {
        const detalhes = [
          acao.macro_dominio ? `Macro: ${acao.macro_dominio}` : null,
          acao.prioridade ? `Prioridade: ${acao.prioridade}` : null,
          acao.esforco ? `Esforço: ${acao.esforco}` : null
        ]
          .filter(Boolean)
          .join(' • ');
        const objetivo = acao.objetivo ? ` — ${acao.objetivo}` : '';
        return `<li>${escapeHtml(acao.acao)}${escapeHtml(objetivo)}${
          detalhes ? `<div class="meta">${escapeHtml(detalhes)}</div>` : ''
        }</li>`;
      })
      .join('');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Diagnóstico LGPD</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1f2a37; padding: 24px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      h2 { font-size: 14px; margin: 16px 0 8px; }
      .meta { color: #6b7280; font-size: 12px; margin-bottom: 12px; }
      .badge { display: inline-block; padding: 6px 10px; border-radius: 8px; background: #eef2ff; margin-right: 8px; margin-bottom: 8px; font-size: 12px; }
      .summary { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; margin: 16px 0; }
      .summary-label { color: #6b7280; font-size: 12px; }
      .summary-value { font-size: 22px; font-weight: bold; }
      .summary-right { text-align: right; }
      .summary-tag { display: inline-block; padding: 4px 10px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-size: 11px; margin-bottom: 6px; }
      .summary-bar { width: 180px; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
      .summary-bar-fill { height: 100%; background: #0b5be1; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
      .radar { display: flex; justify-content: center; align-items: center; min-height: 240px; }
      .alert { padding: 8px 10px; border-radius: 8px; font-size: 12px; margin-bottom: 12px; }
      .alert-danger { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
      .alert-ok { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
      .bar-row { display: flex; justify-content: space-between; font-size: 12px; margin-top: 6px; }
      .bar-track { width: 100%; height: 8px; background: #e5e7eb; border-radius: 999px; overflow: hidden; margin-bottom: 4px; }
      .bar-fill { height: 100%; }
      p { font-size: 12px; line-height: 1.6; margin: 0 0 12px; white-space: pre-wrap; }
      @media print {
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <h1>Resultado do Diagnóstico</h1>
    <div class="meta">Data: ${data}</div>
    <div class="badge">Empresa: ${escapeHtml(empresaNome)}</div>
    <div class="badge">Modelo: ${escapeHtml(modeloNome)}</div>

    <div class="summary">
      <div>
        <div class="summary-label">Total de conformidade</div>
        <div class="summary-value">${Math.round(notaGeral)}%</div>
      </div>
      <div class="summary-right">
        <div class="summary-tag">${escapeHtml(nivel)}</div>
        <div class="summary-bar">
          <div class="summary-bar-fill" style="width:${Math.round(notaGeral)}%"></div>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h2>Mapa de maturidade</h2>
        <div class="radar">${gerarRadarSvg(resultadosOrdenadosLocal)}</div>
      </div>
      <div class="card">
        <h2>Alertas</h2>
        <div class="alert ${alerta ? 'alert-danger' : 'alert-ok'}">
          ${alerta ? 'Alto Risco Regulatório' : 'Sem alertas críticos'}
        </div>
        <h2>Pontuação por ${labelDominio}</h2>
        ${barras || '<div class="meta">Sem dados</div>'}
      </div>
    </div>

    <div class="card">
      <h2>Diagnóstico textual</h2>
      ${paragrafos || '<p>Sem análise disponível.</p>'}
    </div>

    <div class="card">
      <h2>Ações sugeridas</h2>
      ${
        acoesHtml
          ? `<ul style="padding-left:18px; margin: 0;">${acoesHtml}</ul>`
          : '<div class="meta">Sem ações sugeridas.</div>'
      }
    </div>
  </body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
      message.error('Não foi possível abrir a janela de impressão.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  }

  async function exportarPdf(execucao: DiagnosticoExecucao) {
    if (execucao.status !== 'FINALIZADO') {
      message.warning('Finalize o diagnóstico antes de exportar');
      return;
    }
    setExportandoPdfId(execucao.id);
    try {
      const [respDom, respMacro] = await Promise.all([
        api.get(`/diagnosticos/execucoes/${execucao.id}/resultados`),
        api.get(`/diagnosticos/execucoes/${execucao.id}/resultados-macro`)
      ]);
      const usaMacro = respMacro.data?.length > 0;
      const resultadosLocal: DiagnosticoResultadoDominio[] =
        usaMacro
          ? respMacro.data.map((r: DiagnosticoResultadoMacro) => ({
              dominio: r.macro_dominio,
              nota: r.nota,
              total_peso: r.total_peso,
              max_pontos: r.max_pontos,
              pontos: r.pontos
            }))
          : respDom.data || [];
      let texto = analisePorExecucao[execucao.id];
      let acoesSugeridas = acoesPorExecucao[execucao.id] || [];
      if (!texto) {
        const analiseResp = await api.post(`/diagnosticos/execucoes/${execucao.id}/analise`);
        texto = analiseResp.data?.texto ?? '';
        acoesSugeridas = analiseResp.data?.acoes_sugeridas ?? [];
        if (texto) {
          setAnalisePorExecucao((prev) => ({ ...prev, [execucao.id]: texto! }));
        }
        setAcoesPorExecucao((prev) => ({ ...prev, [execucao.id]: acoesSugeridas }));
      }
      gerarPdf(
        execucao,
        resultadosLocal,
        texto || '',
        usaMacro ? 'macro domínio' : 'domínio',
        acoesSugeridas
      );
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao exportar PDF');
    } finally {
      setExportandoPdfId(null);
    }
  }

  async function abrirResponder(execucao: DiagnosticoExecucao) {
    try {
      setExecucaoSelecionada(execucao);
      setModalResponderAberto(true);
      setPerguntasExecucao([]);
      setRespostas({});
      setDominioAtivo(null);
      await carregarPerguntasExecucao(execucao.modelo_id);
      await carregarRespostas(execucao.id);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao preparar diagnóstico');
    }
  }
  
  useEffect(() => {
    if (dominiosOrdenados.length && !dominioAtivo) {
      setDominioAtivo(dominiosOrdenados[0]);
    }
  }, [dominiosOrdenados, dominioAtivo]);

  async function abrirResultados(execucao: DiagnosticoExecucao, forceAnalise = false) {
    try {
      setCarregandoResultados(true);
      setExecucaoSelecionada(execucao);
      const [respDom, respMacro] = await Promise.all([
        api.get(`/diagnosticos/execucoes/${execucao.id}/resultados`),
        api.get(`/diagnosticos/execucoes/${execucao.id}/resultados-macro`)
      ]);
      setResultados(respDom.data || []);
      setResultadosMacro(respMacro.data || []);
      setModalResultadosAberto(true);
      await carregarAnalise(execucao.id, forceAnalise);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao carregar resultados');
    } finally {
      setCarregandoResultados(false);
    }
  }

  async function gerarAnaliseNoGrid(execucao: DiagnosticoExecucao) {
    if (execucao.status !== 'FINALIZADO') {
      message.warning('Finalize o diagnóstico antes de gerar a análise');
      return;
    }
    setGerandoAnaliseId(execucao.id);
    try {
      await abrirResultados(execucao, true);
    } finally {
      setGerandoAnaliseId(null);
    }
  }

  function abrirModalAcoes(execucao: DiagnosticoExecucao) {
    const acoes = acoesPorExecucao[execucao.id] || [];
    if (!acoes.length) {
      message.info('Nenhuma ação sugerida disponível para este diagnóstico');
      return;
    }
    setExecucaoSelecionada(execucao);
    setAcoesSelecionadas(acoes.map((_, idx) => idx));
    setModalAcoesAberto(true);
  }

  async function cadastrarAcoesSelecionadas() {
    if (!execucaoSelecionada) return;
    const acoes = acoesPorExecucao[execucaoSelecionada.id] || [];
    const selecionadas = acoes
      .map((acao, idx) => ({ ...acao, id: idx }))
      .filter((acao) => acoesSelecionadas.includes(acao.id))
      .map(({ acao, objetivo, macro_dominio, prioridade, esforco }) => ({
        acao,
        objetivo,
        macro_dominio,
        prioridade,
        esforco
      }));

    if (!selecionadas.length) {
      message.warning('Selecione ao menos uma ação');
      return;
    }

    setSalvandoAcoes(true);
    try {
      await api.post(`/diagnosticos/execucoes/${execucaoSelecionada.id}/acoes`, {
        acoes: selecionadas
      });
      message.success('Ações cadastradas na matriz');
      setModalAcoesAberto(false);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao cadastrar ações');
    } finally {
      setSalvandoAcoes(false);
    }
  }

  useEffect(() => {
    carregarModelos();
    carregarEscopos();
    carregarExecucoes();
  }, []);

  useEffect(() => {
    carregarExecucoes();
  }, [empresaSelecionada]);

  useEffect(() => {
    if (modeloSelecionadoId) carregarPerguntasModelo(modeloSelecionadoId);
  }, [modeloSelecionadoId]);

  function abrirNovoModelo() {
    setEditandoModelo(null);
    formModelo.resetFields();
    formModelo.setFieldsValue({
      versao: 1,
      ativo: true,
      dm_escopo_id: escopos[0]?.id
    });
    setModalModeloAberto(true);
  }

  function abrirEditarModelo(item: DiagnosticoModelo) {
    setEditandoModelo(item);
    formModelo.setFieldsValue({
      nome: item.nome,
      descricao: item.descricao ?? undefined,
      dm_escopo_id: item.dm_escopo_id,
      versao: item.versao ?? 1,
      ativo: item.ativo ?? true
    });
    setModalModeloAberto(true);
  }

  async function salvarModelo(values: ModeloFormValues) {
    try {
      if (editandoModelo) {
        const resp = await api.put(`/diagnosticos/modelos/${editandoModelo.id}`, values);
        const atualizado: DiagnosticoModelo = resp.data;
        setModelos((prev) => prev.map((m) => (m.id === atualizado.id ? atualizado : m)));
        message.success('Modelo atualizado');
      } else {
        const resp = await api.post('/diagnosticos/modelos', values);
        const criado: DiagnosticoModelo = resp.data;
        setModelos((prev) => [criado, ...prev]);
        message.success('Modelo criado');
      }
      setModalModeloAberto(false);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar modelo');
    }
  }

  function abrirNovaPergunta() {
    if (!modeloSelecionadoId) {
      message.warning('Selecione um modelo primeiro');
      return;
    }
    setEditandoPergunta(null);
    formPergunta.resetFields();
    formPergunta.setFieldsValue({
      modelo_id: modeloSelecionadoId,
      peso: 1,
      ordem: perguntasModelo.length + 1,
      ativo: true,
      macro_dominio: macroDominiosPadrao[0]
    });
    setModalPerguntaAberta(true);
  }

  function abrirEditarPergunta(item: DiagnosticoPergunta) {
    setEditandoPergunta(item);
    formPergunta.setFieldsValue({
      modelo_id: item.modelo_id,
      codigo: item.codigo,
      dominio: item.dominio,
      macro_dominio: item.macro_dominio ?? macroDominiosPadrao[0],
      pergunta: item.pergunta,
      opcao_0: item.opcao_0,
      opcao_1: item.opcao_1,
      opcao_2: item.opcao_2,
      opcao_3: item.opcao_3,
      peso: item.peso,
      ordem: item.ordem ?? 0,
      ativo: item.ativo ?? true
    });
    setModalPerguntaAberta(true);
  }

  async function salvarPergunta(values: PerguntaFormValues) {
    try {
      if (editandoPergunta) {
        const resp = await api.put(`/diagnosticos/perguntas/${editandoPergunta.id}`, values);
        const atualizado: DiagnosticoPergunta = resp.data;
        setPerguntasModelo((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)));
        message.success('Pergunta atualizada');
      } else {
        const resp = await api.post(
          `/diagnosticos/modelos/${values.modelo_id}/perguntas`,
          values
        );
        const criada: DiagnosticoPergunta = resp.data;
        setPerguntasModelo((prev) => [...prev, criada]);
        message.success('Pergunta criada');
      }
      setModalPerguntaAberta(false);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar pergunta');
    }
  }

  async function deletarPergunta(id: number) {
    try {
      await api.delete(`/diagnosticos/perguntas/${id}`);
      setPerguntasModelo((prev) => prev.filter((p) => p.id !== id));
      message.success('Pergunta removida');
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao excluir pergunta');
    }
  }

  function abrirNovaExecucao() {
    formExecucao.resetFields();
    formExecucao.setFieldsValue({
      empresa_id: empresaSelecionada ?? undefined,
      modelo_id: modeloSelecionadoId ?? undefined
    });
    setModalExecucaoAberta(true);
  }

  async function salvarExecucao(values: ExecucaoFormValues) {
    try {
      const resp = await api.post('/diagnosticos/execucoes', values);
      const criada: DiagnosticoExecucao = resp.data;
      setExecucoes((prev) => [criada, ...prev]);
      message.success('Execução criada');
      setModalExecucaoAberta(false);
      await abrirResponder(criada);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao criar execução');
    }
  }

  function atualizarResposta(perguntaId: number, opcao: number) {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        opcao
      }
    }));
  }

  function atualizarObservacoes(perguntaId: number, observacoes: string) {
    setRespostas((prev) => ({
      ...prev,
      [perguntaId]: {
        ...prev[perguntaId],
        observacoes
      }
    }));
  }

  function iniciarTranscricao(perguntaId: number) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      message.warning('Seu navegador não suporta transcrição de áudio.');
      return;
    }

    if (gravandoPerguntaId && gravandoPerguntaId !== perguntaId) {
      pararTranscricao();
    }

    const recognition = new SpeechRecognition();
    speechRef.current = recognition;
    setGravandoPerguntaId(perguntaId);

    const base = (respostas[perguntaId]?.observacoes ?? '').trim();
    let finalTranscript = '';

    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript.trim()} `;
        } else {
          interim += `${result[0].transcript.trim()} `;
        }
      }
      const texto = [base, `${finalTranscript}${interim}`.trim()].filter(Boolean).join('\n');
      atualizarObservacoes(perguntaId, texto);
    };

    recognition.onerror = () => {
      message.error('Falha ao capturar áudio. Verifique o microfone.');
      setGravandoPerguntaId(null);
    };

    recognition.onend = () => {
      const textoFinal = [base, finalTranscript.trim()].filter(Boolean).join('\n');
      if (finalTranscript.trim()) atualizarObservacoes(perguntaId, textoFinal);
      setGravandoPerguntaId(null);
    };

    recognition.start();
  }

  function pararTranscricao() {
    if (speechRef.current) {
      speechRef.current.stop();
      speechRef.current = null;
    }
    setGravandoPerguntaId(null);
  }

  async function salvarRascunho() {
    if (!execucaoSelecionada) return;
    const respostasArray = perguntasExecucao
      .map((p) => {
        const resp = respostas[p.id];
        if (typeof resp?.opcao !== 'number') return null;
        return {
          pergunta_id: p.id,
          opcao: resp.opcao,
          observacoes: resp.observacoes?.trim() || null
        };
      })
      .filter(Boolean);

    if (respostasArray.length === 0) {
      message.warning('Responda pelo menos uma pergunta para salvar');
      return;
    }

    try {
      setSalvandoRespostas(true);
      await api.put(`/diagnosticos/execucoes/${execucaoSelecionada.id}/respostas`, {
        respostas: respostasArray
      });
      message.success('Rascunho salvo');
      await carregarExecucoes();
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao salvar rascunho');
    } finally {
      setSalvandoRespostas(false);
    }
  }

  async function finalizarExecucao() {
    if (!execucaoSelecionada) return;

    const todasRespondidas = perguntasExecucao.every((p) => typeof respostas[p.id]?.opcao === 'number');
    if (!todasRespondidas) {
      message.warning('Responda todas as perguntas antes de finalizar');
      return;
    }

    try {
      setSalvandoRespostas(true);
      const respostasArray = perguntasExecucao.map((p) => ({
        pergunta_id: p.id,
        opcao: respostas[p.id]?.opcao ?? 0,
        observacoes: respostas[p.id]?.observacoes?.trim() || null
      }));

      await api.put(`/diagnosticos/execucoes/${execucaoSelecionada.id}/respostas`, {
        respostas: respostasArray
      });
      const resp = await api.post(`/diagnosticos/execucoes/${execucaoSelecionada.id}/finalizar`);
      message.success('Diagnóstico finalizado');
      const execAtualizada: DiagnosticoExecucao = resp.data.execucao;
      setExecucoes((prev) =>
        prev.map((e) => (e.id === execAtualizada.id ? execAtualizada : e))
      );
      setModalResponderAberto(false);
      setExecucaoSelecionada(execAtualizada);
      setResultados(resp.data.resultados || []);
      setModalResultadosAberto(true);
      await carregarAnalise(execAtualizada.id, true);
    } catch (err: any) {
      message.error(err?.response?.data?.erro || 'Erro ao finalizar diagnóstico');
    } finally {
      setSalvandoRespostas(false);
    }
  }

  const colunasModelos = [
    {
      title: 'Modelo',
      dataIndex: 'nome',
      render: (value: string, record: DiagnosticoModelo) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{value}</Typography.Text>
          {record.descricao ? (
            <Typography.Text type="secondary">{record.descricao}</Typography.Text>
          ) : null}
          <Typography.Text type="secondary">Versão {record.versao ?? 1}</Typography.Text>
        </Space>
      )
    },
    {
      title: 'Escopo',
      dataIndex: 'escopo_nome',
      width: 200,
      render: (value: string, record: DiagnosticoModelo) => (
        <Tag color="geekblue">{value || escopos.find((e) => e.id === record.dm_escopo_id)?.nome || 'Escopo'}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'ativo',
      width: 120,
      render: (value?: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? 'Ativo' : 'Inativo'}</Tag>
      )
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 120,
      render: (_: unknown, record: DiagnosticoModelo) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditarModelo(record)} />
        </Space>
      )
    }
  ];

  const colunasPerguntas = [
    { title: 'Código', dataIndex: 'codigo', width: 110 },
    { title: 'Domínio', dataIndex: 'dominio', width: 150 },
    { title: 'Macro domínio', dataIndex: 'macro_dominio', width: 180 },
    { title: 'Pergunta', dataIndex: 'pergunta' },
    {
      title: 'Peso',
      dataIndex: 'peso',
      width: 80,
      render: (value: number) => <Tag color="blue">{value}</Tag>
    },
    {
      title: 'Ativo',
      dataIndex: 'ativo',
      width: 90,
      render: (value?: boolean) => (value ? 'Sim' : 'Não')
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 140,
      render: (_: unknown, record: DiagnosticoPergunta) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditarPergunta(record)} />
          <Popconfirm
            title="Excluir pergunta?"
            okText="Sim"
            cancelText="Não"
            onConfirm={() => deletarPergunta(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const colunasExecucoes = [
    {
      title: 'Empresa',
      dataIndex: 'empresa_nome',
      render: (_: unknown, record: DiagnosticoExecucao) => (
        <Space>
          <Tag color="blue">
            {record.empresa_nome ||
              empresas.find((e) => e.id === record.empresa_id)?.nome ||
              'Empresa'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Modelo',
      dataIndex: 'modelo_nome',
      render: (value: string, record: DiagnosticoExecucao) => (
        <Typography.Text>
          {value || modelos.find((m) => m.id === record.modelo_id)?.nome || 'Modelo'}
        </Typography.Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 120,
      render: (value?: string) => (
        <Tag color={statusColor[value ?? 'RASCUNHO']}>{value ?? 'RASCUNHO'}</Tag>
      )
    },
    {
      title: 'Nota geral',
      dataIndex: 'nota_geral',
      width: 140,
      render: (value?: number | string) =>
        value !== undefined ? <Tag color="geekblue">{formatNota(value)}</Tag> : '-'
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      width: 140,
      render: (value?: string) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-')
    },
    {
      title: 'Ações',
      key: 'acoes',
      width: 360,
      render: (_: unknown, record: DiagnosticoExecucao) => (
        <Space>
          <Button
            size="small"
            icon={<FileDoneOutlined />}
            onClick={() => abrirResponder(record)}
            disabled={record.status === 'FINALIZADO'}
          >
            Responder
          </Button>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => abrirResultados(record)}
            disabled={record.status !== 'FINALIZADO'}
          >
            Resultados
          </Button>
          <Button
            size="small"
            icon={<FileSearchOutlined />}
            onClick={() => gerarAnaliseNoGrid(record)}
            loading={gerandoAnaliseId === record.id}
            disabled={record.status !== 'FINALIZADO'}
          >
            Análise
          </Button>
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => exportarPdf(record)}
            loading={exportandoPdfId === record.id}
            disabled={record.status !== 'FINALIZADO'}
          >
            PDF
          </Button>
        </Space>
      )
    }
  ];

  const colunasAcoesSugeridas = [
    { title: 'Ação', dataIndex: 'acao' },
    {
      title: 'Objetivo',
      dataIndex: 'objetivo',
      render: (value?: string) => value || '-'
    },
    {
      title: 'Macro domínio',
      dataIndex: 'macro_dominio',
      render: (value?: string) => value || '-'
    },
    {
      title: 'Prioridade',
      dataIndex: 'prioridade',
      width: 90,
      render: (value?: number) => value ?? 3
    },
    {
      title: 'Esforço',
      dataIndex: 'esforco',
      width: 80,
      render: (value?: number) => value ?? 3
    }
  ];

  const analiseAtual =
    execucaoSelecionada && execucaoSelecionada.id
      ? analisePorExecucao[execucaoSelecionada.id]
      : '';
  const acoesSugeridasAtual =
    execucaoSelecionada && execucaoSelecionada.id
      ? acoesPorExecucao[execucaoSelecionada.id] || []
      : [];
  const acoesSugeridasTabela = acoesSugeridasAtual.map((acao, idx) => ({ ...acao, id: idx }));

  const resultadosOrdenados = useMemo(() => {
    if (resultadosMacro.length > 0) {
      return resultadosMacro
        .map((r) => ({
          dominio: r.macro_dominio,
          nota: r.nota,
          total_peso: r.total_peso,
          max_pontos: r.max_pontos,
          pontos: r.pontos
        }))
        .sort((a, b) => a.dominio.localeCompare(b.dominio));
    }
    return [...resultados].sort((a, b) => a.dominio.localeCompare(b.dominio));
  }, [resultados, resultadosMacro]);

  const usaMacroDominio = resultadosMacro.length > 0;
  const labelDominio = usaMacroDominio ? 'macro domínio' : 'domínio';

  const notaGeralNum = normalizarNota(execucaoSelecionada?.nota_geral);
  const nivelMaturidade = obterNivelMaturidade(notaGeralNum);
  const alertaRegulatorio = resultadosOrdenados.some((r) => normalizarNota(r.nota) === 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Flex align="center" justify="flex-end">
        <Button icon={<ReloadOutlined />} onClick={() => {
          carregarModelos(true);
          if (modeloSelecionadoId) carregarPerguntasModelo(modeloSelecionadoId, true);
          carregarExecucoes(true);
        }} />
      </Flex>

      <Tabs
        defaultActiveKey="modelos"
        items={[
          {
            key: 'modelos',
            label: 'Modelos',
            children: (
              <Card>
                <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
                  <Typography.Text strong>Modelos cadastrados</Typography.Text>
                  <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovoModelo}>
                    Novo modelo
                  </Button>
                </Flex>
                {modelos.length === 0 && !carregandoModelos ? (
                  <Empty description="Nenhum modelo cadastrado" />
                ) : (
                  <Table
                    rowKey="id"
                    dataSource={modelos}
                    columns={colunasModelos}
                    loading={carregandoModelos}
                    pagination={{ pageSize: 8 }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'perguntas',
            label: 'Perguntas',
            children: (
              <Card>
                <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
                  <Space>
                    <Typography.Text strong>Modelo</Typography.Text>
                    <Select
                      style={{ minWidth: 260 }}
                      placeholder="Selecione um modelo"
                      value={modeloSelecionadoId ?? undefined}
                      onChange={(value) => setModeloSelecionadoId(value)}
                      options={modelos.map((m) => ({ value: m.id, label: m.nome }))}
                    />
                  </Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={abrirNovaPergunta}
                    disabled={!modeloSelecionadoId}
                  >
                    Nova pergunta
                  </Button>
                </Flex>
                {!modeloSelecionadoId ? (
                  <Empty description="Selecione um modelo para visualizar as perguntas" />
                ) : perguntasModelo.length === 0 && !carregandoPerguntas ? (
                  <Empty description="Nenhuma pergunta cadastrada" />
                ) : (
                  <Table
                    rowKey="id"
                    dataSource={perguntasModelo}
                    columns={colunasPerguntas}
                    loading={carregandoPerguntas}
                    pagination={{ pageSize: 8 }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'execucoes',
            label: 'Execuções',
            children: (
              <Card>
                <Flex align="center" justify="space-between" style={{ marginBottom: 16 }}>
                  <Space>
                    <Typography.Text strong>Empresa</Typography.Text>
                    <Tag color="geekblue">
                      {empresaSelecionada
                        ? empresas.find((e) => e.id === empresaSelecionada)?.nome || 'Empresa'
                        : 'Selecione uma empresa'}
                    </Tag>
                  </Space>
                  <Button type="primary" icon={<PlusOutlined />} onClick={abrirNovaExecucao}>
                    Nova execução
                  </Button>
                </Flex>
                {execucoes.length === 0 && !carregandoExecucoes ? (
                  <Empty description="Nenhuma execução cadastrada" />
                ) : (
                  <Table
                    rowKey="id"
                    dataSource={execucoes}
                    columns={colunasExecucoes}
                    loading={carregandoExecucoes}
                    pagination={{ pageSize: 8 }}
                  />
                )}
              </Card>
            )
          }
        ]}
      />

      <Modal
        title={editandoModelo ? 'Editar modelo' : 'Novo modelo'}
        open={modalModeloAberto}
        onCancel={() => setModalModeloAberto(false)}
        okText={editandoModelo ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined /> }}
        onOk={() => formModelo.submit()}
        destroyOnClose
      >
        <Form form={formModelo} layout="vertical" onFinish={salvarModelo}>
          <Form.Item label="Nome" name="nome" rules={[{ required: true, message: 'Informe o nome' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label="Escopo"
            name="dm_escopo_id"
            rules={[{ required: true, message: 'Selecione o escopo' }]}
          >
            <Select
              placeholder="Selecione"
              options={escopos.map((e) => ({ value: e.id, label: e.nome }))}
            />
          </Form.Item>
          <Form.Item label="Descrição" name="descricao">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Versão" name="versao">
            <Input type="number" min={1} step={1} />
          </Form.Item>
          <Form.Item label="Ativo" name="ativo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editandoPergunta ? 'Editar pergunta' : 'Nova pergunta'}
        open={modalPerguntaAberta}
        onCancel={() => setModalPerguntaAberta(false)}
        okText={editandoPergunta ? 'Salvar alterações' : 'Salvar'}
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined /> }}
        onOk={() => formPergunta.submit()}
        destroyOnClose
        width={720}
      >
        <Form form={formPergunta} layout="vertical" onFinish={salvarPergunta}>
          <Form.Item name="modelo_id" hidden>
            <Input type="hidden" />
          </Form.Item>
          <Form.Item label="Código" name="codigo" rules={[{ required: true, message: 'Informe o código' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Domínio" name="dominio" rules={[{ required: true, message: 'Informe o domínio' }]}>
            <AutoComplete
              placeholder="Informe ou selecione"
              options={dominiosDisponiveis.map((d) => ({ value: d }))}
              filterOption={(inputValue, option) =>
                (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            label="Macro domínio"
            name="macro_dominio"
            rules={[{ required: true, message: 'Informe o macro domínio' }]}
          >
            <AutoComplete
              placeholder="Informe ou selecione"
              options={macroDominiosPadrao.map((d) => ({ value: d }))}
              filterOption={(inputValue, option) =>
                (option?.value ?? '').toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            label="Pergunta"
            name="pergunta"
            rules={[{ required: true, message: 'Informe a pergunta' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Divider />
          <Form.Item label="Opção 0" name="opcao_0" rules={[{ required: true, message: 'Informe a opção 0' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Opção 1" name="opcao_1" rules={[{ required: true, message: 'Informe a opção 1' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Opção 2" name="opcao_2" rules={[{ required: true, message: 'Informe a opção 2' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Opção 3" name="opcao_3" rules={[{ required: true, message: 'Informe a opção 3' }]}>
            <Input />
          </Form.Item>
          <Divider />
          <Form.Item label="Peso" name="peso" rules={[{ required: true, message: 'Informe o peso' }]}>
            <Input type="number" min={1} max={10} step={1} />
          </Form.Item>
          <Form.Item label="Ordem" name="ordem">
            <Input type="number" min={0} step={1} />
          </Form.Item>
          <Form.Item label="Ativo" name="ativo" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Nova execução"
        open={modalExecucaoAberta}
        onCancel={() => setModalExecucaoAberta(false)}
        okText="Criar"
        cancelText="Cancelar"
        okButtonProps={{ icon: <SaveOutlined /> }}
        onOk={() => formExecucao.submit()}
        destroyOnClose
      >
        <Form form={formExecucao} layout="vertical" onFinish={salvarExecucao}>
          <Form.Item
            label="Empresa"
            name="empresa_id"
            rules={[{ required: true, message: 'Selecione a empresa' }]}
          >
            <Select
              placeholder="Selecione"
              options={empresas.map((e) => ({ value: e.id, label: e.nome }))}
            />
          </Form.Item>
          <Form.Item
            label="Modelo"
            name="modelo_id"
            rules={[{ required: true, message: 'Selecione o modelo' }]}
          >
            <Select
              placeholder="Selecione"
              options={modelos.map((m) => ({ value: m.id, label: m.nome }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Responder diagnóstico"
        open={modalResponderAberto}
        onCancel={() => setModalResponderAberto(false)}
        footer={null}
        width={960}
        destroyOnClose
      >
        {execucaoSelecionada ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Flex align="center" justify="space-between">
              <Space direction="vertical" size={0}>
                <Typography.Text strong>
                  {execucaoSelecionada.empresa_nome ||
                    empresas.find((e) => e.id === execucaoSelecionada.empresa_id)?.nome ||
                    'Empresa'}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {execucaoSelecionada.modelo_nome ||
                    modelos.find((m) => m.id === execucaoSelecionada.modelo_id)?.nome ||
                    'Modelo'}
                </Typography.Text>
              </Space>
              <Tag color={statusColor[execucaoSelecionada.status ?? 'RASCUNHO']}>
                {execucaoSelecionada.status ?? 'RASCUNHO'}
              </Tag>
            </Flex>

            <Progress
              percent={totalPerguntas ? Math.round((totalRespondidas / totalPerguntas) * 100) : 0}
              format={(percent) => `${totalRespondidas}/${totalPerguntas} (${percent}%)`}
            />

            {totalPerguntas === 0 ? (
              <Empty description="Nenhuma pergunta cadastrada para este modelo" />
            ) : (
              <Tabs
                activeKey={dominioAtivo ?? undefined}
                onChange={(key) => setDominioAtivo(key)}
                items={dominiosOrdenados.map((dominio) => ({
                  key: dominio,
                  label: (
                    <Space size="small">
                      <CheckCircleFilled
                        style={{ color: dominioCompleto[dominio] ? '#27ae60' : '#b0b7c3' }}
                      />
                      <span>{dominio}</span>
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      {perguntasPorDominio[dominio].map((p) => (
                        <Card key={p.id} size="small">
                          <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <Space size="small" align="start">
                              <SafetyCertificateOutlined style={{ color: '#0b5be1', fontSize: 16, marginTop: 2 }} />
                              <Typography.Text strong>{p.pergunta}</Typography.Text>
                            </Space>
                            <Radio.Group
                              value={respostas[p.id]?.opcao}
                              onChange={(e) => atualizarResposta(p.id, e.target.value)}
                              style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
                          >
                            <Radio value={0}>{p.opcao_0}</Radio>
                            <Radio value={1}>{p.opcao_1}</Radio>
                            <Radio value={2}>{p.opcao_2}</Radio>
                            <Radio value={3}>{p.opcao_3}</Radio>
                          </Radio.Group>
                            <div>
                              <Flex align="center" justify="space-between">
                                <Typography.Text type="secondary">Observações</Typography.Text>
                                <Button
                                  size="small"
                                  icon={gravandoPerguntaId === p.id ? <StopOutlined /> : <AudioOutlined />}
                                  onClick={() =>
                                    gravandoPerguntaId === p.id
                                      ? pararTranscricao()
                                      : iniciarTranscricao(p.id)
                                  }
                                  disabled={!speechDisponivel}
                                >
                                  {gravandoPerguntaId === p.id ? 'Parar' : 'Gravar'}
                                </Button>
                              </Flex>
                              <Input.TextArea
                                rows={3}
                                value={respostas[p.id]?.observacoes}
                                onChange={(e) => atualizarObservacoes(p.id, e.target.value)}
                                placeholder="Descreva evidências ou comentários relevantes"
                              />
                            </div>
                          </Space>
                        </Card>
                      ))}
                    </Space>
                  )
                }))}
              />
            )}

            <Divider style={{ margin: 0 }} />

            <Flex align="center" justify="space-between">
              <Typography.Text type="secondary">
                Salve o rascunho quantas vezes precisar.
              </Typography.Text>
              <Space>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => {
                    const idx = dominiosOrdenados.indexOf(dominioAtivo ?? '');
                    if (idx > 0) setDominioAtivo(dominiosOrdenados[idx - 1]);
                  }}
                  disabled={!dominioAtivo || dominiosOrdenados.indexOf(dominioAtivo) <= 0}
                >
                  Anterior
                </Button>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => {
                    const idx = dominiosOrdenados.indexOf(dominioAtivo ?? '');
                    if (idx >= 0 && idx < dominiosOrdenados.length - 1) {
                      setDominioAtivo(dominiosOrdenados[idx + 1]);
                    }
                  }}
                  disabled={
                    !dominioAtivo || dominiosOrdenados.indexOf(dominioAtivo) === dominiosOrdenados.length - 1
                  }
                >
                  Próximo
                </Button>
                <Button onClick={salvarRascunho} loading={salvandoRespostas}>
                  Salvar rascunho
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={finalizarExecucao}
                  loading={salvandoRespostas}
                >
                  Finalizar diagnóstico
                </Button>
              </Space>
            </Flex>
          </Space>
        ) : (
          <Empty description="Selecione uma execução" />
        )}
      </Modal>

      <Modal
        title="Resultados do diagnóstico"
        open={modalResultadosAberto}
        onCancel={() => setModalResultadosAberto(false)}
        footer={null}
        destroyOnClose
      >
        {execucaoSelecionada && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Flex align="center" justify="space-between">
              <Typography.Text strong>Resumo do diagnóstico</Typography.Text>
              <Space>
                {!analiseAtual && (
                  <Button
                    onClick={() => carregarAnalise(execucaoSelecionada.id, true)}
                    loading={carregandoAnalise}
                  >
                    Gerar análise
                  </Button>
                )}
                <Button
                  onClick={() => abrirModalAcoes(execucaoSelecionada)}
                  disabled={!acoesSugeridasAtual.length}
                >
                  Cadastrar ações
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => exportarPdf(execucaoSelecionada)}
                  loading={exportandoPdfId === execucaoSelecionada.id}
                  disabled={execucaoSelecionada.status !== 'FINALIZADO'}
                >
                  Exportar PDF
                </Button>
              </Space>
            </Flex>

            <Card size="small">
              <Flex align="center" justify="space-between">
                <Space direction="vertical" size={4}>
                  <Typography.Text type="secondary">Total de conformidade</Typography.Text>
                  <Typography.Title level={3} style={{ margin: 0 }}>
                    {Math.round(notaGeralNum)}%
                  </Typography.Title>
                </Space>
                <Space direction="vertical" size={4} align="end">
                  <Tag color="blue">{nivelMaturidade}</Tag>
                  <Progress
                    percent={Math.round(notaGeralNum)}
                    showInfo={false}
                    strokeColor="#0b5be1"
                    style={{ width: 160 }}
                  />
                </Space>
              </Flex>
            </Card>

            {resultadosOrdenados.length === 0 ? (
              <Empty description={`Sem resultados por ${labelDominio}`} />
            ) : (
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Card size="small" title="Mapa de maturidade">
                    <div style={{ width: '100%', height: 260 }}>
                      <ResponsiveContainer>
                        <RadarChart data={resultadosOrdenados.map((r) => ({
                          dominio: r.dominio,
                          nota: normalizarNota(r.nota)
                        }))}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dominio" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} />
                          <Radar
                            name="Maturidade"
                            dataKey="nota"
                            stroke="#0b5be1"
                            fill="#0b5be1"
                            fillOpacity={0.35}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <Card size="small" title="Alertas">
                      <Space>
                        <SafetyCertificateOutlined
                          style={{ color: alertaRegulatorio ? '#d93025' : '#27ae60' }}
                        />
                        <Typography.Text strong>
                          {alertaRegulatorio
                            ? 'Alto Risco Regulatório'
                            : 'Sem alertas críticos'}
                        </Typography.Text>
                      </Space>
                    </Card>

                    <Card size="small" title={`Pontuação por ${labelDominio}`}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {resultadosOrdenados.map((item, index) => {
                          const nota = normalizarNota(item.nota);
                          const cor = coresDominio[index % coresDominio.length];
                          return (
                            <div key={item.dominio} style={{ width: '100%' }}>
                              <Flex align="center" justify="space-between">
                                <Typography.Text>{item.dominio}</Typography.Text>
                                <Tag color="geekblue">{formatNota(nota)}</Tag>
                              </Flex>
                              <Progress
                                percent={Math.round(nota)}
                                showInfo={false}
                                strokeColor={cor}
                              />
                            </div>
                          );
                        })}
                      </Space>
                    </Card>
                  </Space>
                </Col>
              </Row>
            )}

            <Card size="small" title="Diagnóstico textual">
              {carregandoAnalise && !analiseAtual ? (
                <Typography.Text type="secondary">Gerando análise...</Typography.Text>
              ) : analiseAtual ? (
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {analiseAtual}
                </Typography.Paragraph>
              ) : (
                <Typography.Text type="secondary">
                  Nenhuma análise gerada ainda.
                </Typography.Text>
              )}
            </Card>

            <Card size="small" title="Ações sugeridas">
              {acoesSugeridasAtual.length ? (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {acoesSugeridasAtual.map((acao, idx) => (
                    <div key={`${acao.acao}-${idx}`} style={{ width: '100%' }}>
                      <Typography.Text strong>{acao.acao}</Typography.Text>
                      {acao.objetivo && (
                        <Typography.Text type="secondary"> — {acao.objetivo}</Typography.Text>
                      )}
                      <div style={{ marginTop: 6 }}>
                        {acao.macro_dominio && <Tag color="geekblue">{acao.macro_dominio}</Tag>}
                        <Tag>Prioridade {acao.prioridade ?? 3}</Tag>
                        <Tag>Esforço {acao.esforco ?? 3}</Tag>
                      </div>
                    </div>
                  ))}
                </Space>
              ) : (
                <Typography.Text type="secondary">
                  Nenhuma ação sugerida disponível.
                </Typography.Text>
              )}
            </Card>
          </Space>
        )}
      </Modal>

      <Modal
        title="Cadastrar ações sugeridas"
        open={modalAcoesAberto}
        onCancel={() => setModalAcoesAberto(false)}
        okText="Cadastrar selecionadas"
        cancelText="Cancelar"
        onOk={cadastrarAcoesSelecionadas}
        confirmLoading={salvandoAcoes}
        width={880}
        destroyOnClose
      >
        <Table
          rowKey="id"
          dataSource={acoesSugeridasTabela}
          columns={colunasAcoesSugeridas}
          pagination={false}
          rowSelection={{
            selectedRowKeys: acoesSelecionadas,
            onChange: (keys) => setAcoesSelecionadas(keys as number[])
          }}
        />
      </Modal>
    </Space>
  );
}

export default DiagnosticoLgpd;
