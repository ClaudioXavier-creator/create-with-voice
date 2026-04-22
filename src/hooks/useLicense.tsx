import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEmpresa } from "./useEmpresa";
import { resolveLicenseTier, type Tier } from "@/config/tiers";

export interface LicenseInfo {
  id: string;
  plano: string;
  nivel?: string | null;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  chave_licenca: string;
  empresa_id: string | null;
  liberado_admin: boolean;
}

export function useLicense() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const tier: Tier = useMemo(() => resolveLicenseTier(license), [license]);

  const isExpired = license
    ? new Date(license.data_expiracao) < new Date() || license.status === "expirada"
    : false;

  const isActive = license
    ? (!isExpired && license.status === "ativa") || license.liberado_admin
    : false;

  const daysRemaining = license
    ? Math.max(0, Math.ceil((new Date(license.data_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (!user) { setLicense(null); setLoading(false); return; }

    const fetchLicense = async () => {
      setLoading(true);

      let query = supabase
        .from("licencas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (empresaAtiva) {
        query = query.eq("empresa_id", empresaAtiva.id);
      } else {
        query = query.eq("user_id", user.id).is("empresa_id", null);
      }

      const { data } = await query.maybeSingle();
      setLicense(data as LicenseInfo | null);
      setLoading(false);
    };

    fetchLicense();
  }, [user, empresaAtiva]);

  const activateKey = async (key: string) => {
    if (!user) throw new Error("Não autenticado");

    const session = (await supabase.auth.getSession()).data.session;
    const { data, error } = await supabase.functions.invoke("activate-license", {
      body: { chave: key, empresa_id: empresaAtiva?.id || null },
    });

    if (error) throw new Error(error.message || "Erro ao ativar licença");

    // Refresh license
    let query = supabase
      .from("licencas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (empresaAtiva) {
      query = query.eq("empresa_id", empresaAtiva.id);
    } else {
      query = query.eq("user_id", user.id).is("empresa_id", null);
    }

    const { data: refreshed } = await query.maybeSingle();
    setLicense(refreshed as LicenseInfo | null);
    return data;
  };

  return { license, tier, loading, isActive, isExpired, daysRemaining, activateKey };
}
