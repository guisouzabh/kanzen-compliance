function defaultBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  const { hostname } = window.location;
  if (hostname === 'vanttagem.com.br' || hostname === 'www.vanttagem.com.br') {
    return 'https://app.vanttagem.com.br';
  }

  return '';
}

const BASE_URL = ((import.meta.env.VITE_API_URL as string) ?? '').trim() || defaultBaseUrl();

function getErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  if (!('erro' in body)) return null;
  const maybeError = body.erro;
  return typeof maybeError === 'string' && maybeError.trim() ? maybeError : null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    throw new Error(getErrorMessage(body) ?? `Erro ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) })
};
