import { AppError } from '../errors/AppError';

export interface CnaeBuscaItem {
  codigo: string;
  descricao: string;
}

type IbgeCnaeItem = {
  id?: string | number;
  descricao?: string;
};

const CNAE_IBGE_URL = 'https://servicodados.ibge.gov.br/api/v2/cnae/subclasses';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h
const MAX_LIMIT = 50;

let cnaeCache: CnaeBuscaItem[] | null = null;
let cnaeCacheAt = 0;

function formatarCodigoCnae(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 7) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
  }
  return raw.trim();
}

function normalizarTermo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

async function carregarBaseCnae(): Promise<CnaeBuscaItem[]> {
  const now = Date.now();
  if (cnaeCache && now - cnaeCacheAt < CACHE_TTL_MS) {
    return cnaeCache;
  }

  const response = await fetch(CNAE_IBGE_URL);
  if (!response.ok) {
    throw new AppError('Falha ao consultar base oficial de CNAE', 502);
  }

  const payload = (await response.json()) as IbgeCnaeItem[];
  const base = (Array.isArray(payload) ? payload : [])
    .map((item) => ({
      codigo: formatarCodigoCnae(String(item.id ?? '')),
      descricao: String(item.descricao ?? '').trim()
    }))
    .filter((item) => item.codigo.length > 0 && item.descricao.length > 0)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  cnaeCache = base;
  cnaeCacheAt = now;
  return base;
}

export async function buscarCnaesOnlineService(
  termo: string,
  limit = 20
): Promise<CnaeBuscaItem[]> {
  const termoNormalizado = normalizarTermo(termo);
  if (termoNormalizado.length < 2) {
    return [];
  }

  const limite = Math.max(1, Math.min(limit, MAX_LIMIT));
  const base = await carregarBaseCnae();

  const resultados = base
    .filter((item) => {
      const codigoSemMascara = item.codigo.replace(/\D/g, '');
      const codigoAlvo = normalizarTermo(item.codigo);
      const descricaoAlvo = normalizarTermo(item.descricao);
      return (
        codigoAlvo.includes(termoNormalizado) ||
        codigoSemMascara.includes(termoNormalizado.replace(/\D/g, '')) ||
        descricaoAlvo.includes(termoNormalizado)
      );
    })
    .sort((a, b) => {
      const aCodigo = a.codigo.replace(/\D/g, '');
      const bCodigo = b.codigo.replace(/\D/g, '');
      const termoDigits = termoNormalizado.replace(/\D/g, '');
      const aStarts = aCodigo.startsWith(termoDigits) ? 0 : 1;
      const bStarts = bCodigo.startsWith(termoDigits) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return a.codigo.localeCompare(b.codigo);
    });

  return resultados.slice(0, limite);
}
