export interface RequisitosPorAreaItem {
  area: string;
  quantidade: number;
}

export interface StatusStackedItem {
  categoria: string;
  naoIniciado: number;
  emAndamento: number;
  concluido: number;
  atrasado: number;
}

export interface EvolucaoMensalItem {
  mes: string;
  concluidos: number;
  novos?: number;
}

export interface ClassificacaoDistribuicaoItem {
  classificacao: string;
  valor: number;
}

export interface MaturidadeAreaItem {
  area: string;
  percentual: number;
}

export interface NormaNode {
  name: string;
  value?: number;
  children?: NormaNode[];
}

export interface RiscoHeatmapItem {
  probabilidade: string;
  severidade: string;
  risco: number;
}

export interface RevisaoPorAreaItem {
  area: string;
  diasSemRevisao: number;
  slaDias: number;
}

export interface IndicadorCard {
  titulo: string;
  valor: string;
  detalhe?: string;
}

export const indicadoresResumo: IndicadorCard[] = [
  { titulo: 'Requisitos ativos', valor: '148', detalhe: '+6 vs último mês' },
  { titulo: 'Concluídos no mês', valor: '32', detalhe: 'meta: 28' },
  { titulo: 'Atrasados', valor: '7', detalhe: 'priorizar mitigação' },
  { titulo: 'Áreas cobertas', valor: '9', detalhe: 'todas com responsáveis' }
];

export const requisitosPorAreaData: RequisitosPorAreaItem[] = [
  { area: 'Operações', quantidade: 42 },
  { area: 'Jurídico', quantidade: 31 },
  { area: 'Segurança', quantidade: 27 },
  { area: 'Compliance', quantidade: 21 },
  { area: 'TI', quantidade: 18 },
  { area: 'Financeiro', quantidade: 9 }
];

export const statusStackedData: StatusStackedItem[] = [
  { categoria: 'Legal', naoIniciado: 6, emAndamento: 12, concluido: 28, atrasado: 3 },
  { categoria: 'Interno', naoIniciado: 4, emAndamento: 9, concluido: 18, atrasado: 2 },
  { categoria: 'Externo', naoIniciado: 3, emAndamento: 8, concluido: 14, atrasado: 2 }
];

export const evolucaoConcluidosData: EvolucaoMensalItem[] = [
  { mes: 'Jan', concluidos: 12, novos: 18 },
  { mes: 'Fev', concluidos: 15, novos: 16 },
  { mes: 'Mar', concluidos: 21, novos: 22 },
  { mes: 'Abr', concluidos: 18, novos: 17 },
  { mes: 'Mai', concluidos: 24, novos: 20 },
  { mes: 'Jun', concluidos: 27, novos: 23 },
  { mes: 'Jul', concluidos: 26, novos: 19 },
  { mes: 'Ago', concluidos: 30, novos: 21 },
  { mes: 'Set', concluidos: 32, novos: 24 },
  { mes: 'Out', concluidos: 29, novos: 18 },
  { mes: 'Nov', concluidos: 34, novos: 22 },
  { mes: 'Dez', concluidos: 31, novos: 20 }
];

export const classificacaoDistribuicaoData: ClassificacaoDistribuicaoItem[] = [
  { classificacao: 'Segurança', valor: 38 },
  { classificacao: 'Qualidade', valor: 26 },
  { classificacao: 'PLD-FT', valor: 18 },
  { classificacao: 'SPA', valor: 14 },
  { classificacao: 'LGPD', valor: 12 },
  { classificacao: 'Ambiental', valor: 9 }
];

export const maturidadePorAreaData: MaturidadeAreaItem[] = [
  { area: 'Operações', percentual: 82 },
  { area: 'Jurídico', percentual: 76 },
  { area: 'Segurança', percentual: 71 },
  { area: 'Compliance', percentual: 88 },
  { area: 'TI', percentual: 67 },
  { area: 'Financeiro', percentual: 63 }
];

export const normasTreemapData: NormaNode[] = [
  {
    name: 'NR',
    children: [
      { name: 'NR-05', value: 8 },
      { name: 'NR-12', value: 12 },
      { name: 'NR-35', value: 5 }
    ]
  },
  {
    name: 'ISO',
    children: [
      { name: 'ISO 9001', value: 14 },
      { name: 'ISO 14001', value: 6 },
      { name: 'ISO 27001', value: 9 }
    ]
  },
  {
    name: 'SPA',
    children: [
      { name: 'SPA 001', value: 4 },
      { name: 'SPA 005', value: 6 },
      { name: 'SPA 010', value: 3 }
    ]
  },
  {
    name: 'Outras',
    children: [
      { name: 'PLD-FT', value: 7 },
      { name: 'LGPD', value: 5 },
      { name: 'SOX', value: 4 }
    ]
  }
];

export const riscoHeatmapData: RiscoHeatmapItem[] = [
  { probabilidade: 'Baixa', severidade: 'Leve', risco: 1 },
  { probabilidade: 'Baixa', severidade: 'Média', risco: 2 },
  { probabilidade: 'Baixa', severidade: 'Alta', risco: 3 },
  { probabilidade: 'Média', severidade: 'Leve', risco: 2 },
  { probabilidade: 'Média', severidade: 'Média', risco: 3 },
  { probabilidade: 'Média', severidade: 'Alta', risco: 4 },
  { probabilidade: 'Alta', severidade: 'Leve', risco: 3 },
  { probabilidade: 'Alta', severidade: 'Média', risco: 4 },
  { probabilidade: 'Alta', severidade: 'Alta', risco: 5 },
  { probabilidade: 'Crítica', severidade: 'Leve', risco: 4 },
  { probabilidade: 'Crítica', severidade: 'Média', risco: 5 },
  { probabilidade: 'Crítica', severidade: 'Alta', risco: 5 }
];

export const revisaoPorAreaData: RevisaoPorAreaItem[] = [
  { area: 'Operações', diasSemRevisao: 12, slaDias: 30 },
  { area: 'Jurídico', diasSemRevisao: 38, slaDias: 30 },
  { area: 'Segurança', diasSemRevisao: 22, slaDias: 25 },
  { area: 'Compliance', diasSemRevisao: 9, slaDias: 20 },
  { area: 'TI', diasSemRevisao: 27, slaDias: 25 },
  { area: 'Financeiro', diasSemRevisao: 33, slaDias: 30 }
];
