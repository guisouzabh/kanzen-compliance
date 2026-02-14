import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface EmpresaContextValue {
  empresas: {
    id: number;
    nome: string;
    cnpj?: string;
    razao_social?: string;
    cep?: string | null;
    endereco?: string | null;
    cidade?: string | null;
    estado?: string | null;
    logo_url?: string | null;
    parametro_maturidade?: number;
    termometro_sancoes_id?: number;
  }[];
  empresaSelecionada: number | null; // null representa "TODAS"
  setEmpresaSelecionada: (id: number | null) => void;
  carregando: boolean;
}

const EmpresaContext = createContext<EmpresaContextValue | undefined>(undefined);

export function EmpresaProvider({ children }: { children: React.ReactNode }) {
  const [empresas, setEmpresas] = useState<
    {
      id: number;
      nome: string;
      cnpj?: string;
      razao_social?: string;
      cep?: string | null;
      endereco?: string | null;
      cidade?: string | null;
      estado?: string | null;
      logo_url?: string | null;
    }[]
  >([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        setCarregando(true);
        const resp = await api.get('/empresas');
        setEmpresas(resp.data || []);
      } finally {
        setCarregando(false);
      }
    }
    carregar();

    function handleTokenChange() {
      carregar();
    }

    window.addEventListener('auth:token', handleTokenChange);
    return () => {
      window.removeEventListener('auth:token', handleTokenChange);
    };
  }, []);

  return (
    <EmpresaContext.Provider
      value={{ empresas, empresaSelecionada, setEmpresaSelecionada, carregando }}
    >
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresaContext() {
  const ctx = useContext(EmpresaContext);
  if (!ctx) throw new Error('useEmpresaContext deve ser usado dentro de EmpresaProvider');
  return ctx;
}
