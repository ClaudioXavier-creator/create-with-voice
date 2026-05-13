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

const getStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtiva, setEmpresaAtivaState] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!user) { 
      setEmpresas([]); 
      setEmpresaAtivaState(null); 
      setLoading(false); 
      return; 
    }
    
    setLoading(true);
    try {
      // Otimização: Buscas paralelas para reduzir tempo de carregamento inicial
      const [own, members, licenses, invites] = await Promise.all([
        supabase.from("empresas").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("empresa_membros").select("empresa_id").eq("user_id", user.id).eq("ativo", true),
        supabase.from("licenca_empresas").select("empresa_id").eq("user_id", user.id).eq("ativo", true),
        user.email
          ? supabase.from("convites_empresa").select("empresa_id, aceito_em, aceito_por").eq("email", user.email)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const ownEmpresas = own.data ?? [];
      const memberIds = (members.data ?? []).map((item) => item.empresa_id);
      const linkedLicenseIds = (licenses.data ?? []).map((item) => item.empresa_id);
      const inviteIds = (invites.data ?? [])
        .filter((item) => item.aceito_em || item.aceito_por === user.id)
        .map((item) => item.empresa_id);

      const empresaIds = Array.from(
        new Set([...ownEmpresas.map((e) => e.id), ...memberIds, ...linkedLicenseIds, ...inviteIds].filter(Boolean))
      );

      // Busca apenas as empresas que o usuário ainda não tem os dados completos
      const missingIds = empresaIds.filter(id => !ownEmpresas.some(e => e.id === id));
      
      let extraEmpresas: any[] = [];
      if (missingIds.length > 0) {
        const { data } = await supabase.from("empresas").select("*").in("id", missingIds);
        extraEmpresas = data ?? [];
      }

      const lista = [...ownEmpresas, ...extraEmpresas].sort((a, b) => 
        a.nome.localeCompare(b.nome, "pt-BR")
      );

      setEmpresas(lista);

      const savedId = localStorage.getItem(getStorageKey(user.id));
      const saved = lista.find(e => e.id === savedId);
      setEmpresaAtivaState(saved || lista[0] || null);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const setEmpresaAtiva = useCallback((empresa: Empresa) => {
    setEmpresaAtivaState(empresa);
    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id), empresa.id);
    }
  }, [user?.id]);

  const contextValue = useMemo(() => ({
    empresas,
    empresaAtiva,
    loading,
    setEmpresaAtiva,
    recarregar: carregar
  }), [empresas, empresaAtiva, loading, setEmpresaAtiva, carregar]);

  return (
    <EmpresaContext.Provider value={contextValue}>
      {children}
    </EmpresaContext.Provider>
  );
}


export const useEmpresa = () => useContext(EmpresaContext);
