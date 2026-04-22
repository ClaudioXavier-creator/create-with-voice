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
    if (!user) { setEmpresas([]); setEmpresaAtivaState(null); setLoading(false); return; }
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        supabase
          .from("empresas")
          .select("*")
          .eq("user_id", user.id)
          .order("nome"),
        supabase
          .from("empresa_membros")
          .select("empresa_id")
          .eq("user_id", user.id)
          .eq("ativo", true),
        supabase
          .from("licenca_empresas")
          .select("empresa_id")
          .eq("user_id", user.id)
          .eq("ativo", true),
        user.email
          ? supabase
              .from("convites_empresa")
              .select("empresa_id, aceito_em, aceito_por")
              .eq("email", user.email)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const ownEmpresas = results[0].status === "fulfilled" && !results[0].value.error
        ? ((results[0].value.data as Empresa[] | null) ?? [])
        : [];

      const memberIds = results[1].status === "fulfilled" && !results[1].value.error
        ? (results[1].value.data ?? []).map((item) => item.empresa_id)
        : [];

      const linkedLicenseIds = results[2].status === "fulfilled" && !results[2].value.error
        ? (results[2].value.data ?? []).map((item) => item.empresa_id)
        : [];

      const inviteIds = results[3].status === "fulfilled" && !results[3].value.error
        ? (results[3].value.data ?? [])
            .filter((item) => item.aceito_em || item.aceito_por === user.id)
            .map((item) => item.empresa_id)
        : [];

      const empresaIds = Array.from(
        new Set([
          ...ownEmpresas.map((empresa) => empresa.id),
          ...memberIds,
          ...linkedLicenseIds,
          ...inviteIds,
        ].filter(Boolean)),
      );

      const extraEmpresas = empresaIds.length > 0
        ? await supabase
            .from("empresas")
            .select("*")
            .in("id", empresaIds)
            .order("nome")
        : { data: [], error: null };

      const lista = Array.from(
        new Map(
          [...ownEmpresas, ...((extraEmpresas.data as Empresa[] | null) ?? [])]
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
            .map((empresa) => [empresa.id, empresa]),
        ).values(),
      );

      setEmpresas(lista);

      const savedId = localStorage.getItem(getStorageKey(user.id));
      const saved = lista.find(e => e.id === savedId);
      setEmpresaAtivaState(saved || lista[0] || null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  const setEmpresaAtiva = (empresa: Empresa) => {
    setEmpresaAtivaState(empresa);
    localStorage.setItem(getStorageKey(user?.id), empresa.id);
  };

  return (
    <EmpresaContext.Provider value={{ empresas, empresaAtiva, loading, setEmpresaAtiva, recarregar: carregar }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export const useEmpresa = () => useContext(EmpresaContext);
