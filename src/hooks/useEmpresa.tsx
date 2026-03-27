import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  responsavel_tecnico: string | null;
  crmv: string | null;
  tipo_producao: string[] | null;
  capacidade: string | null;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaAtiva: Empresa | null;
  loading: boolean;
  setEmpresaAtiva: (empresa: Empresa) => void;
  recarregar: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType>({
  empresas: [],
  empresaAtiva: null,
  loading: true,
  setEmpresaAtiva: () => {},
  recarregar: async () => {},
});

const STORAGE_KEY = "feedbpf_empresa_ativa_id";

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtivaState] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) { setEmpresas([]); setEmpresaAtivaState(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .order("nome");
    
    const lista = (data || []) as Empresa[];
    setEmpresas(lista);

    const savedId = localStorage.getItem(STORAGE_KEY);
    const saved = lista.find(e => e.id === savedId);
    setEmpresaAtivaState(saved || lista[0] || null);
    setLoading(false);
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const setEmpresaAtiva = (empresa: Empresa) => {
    setEmpresaAtivaState(empresa);
    localStorage.setItem(STORAGE_KEY, empresa.id);
  };

  return (
    <EmpresaContext.Provider value={{ empresas, empresaAtiva, loading, setEmpresaAtiva, recarregar: carregar }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export const useEmpresa = () => useContext(EmpresaContext);
