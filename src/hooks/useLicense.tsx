import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface LicenseInfo {
  id: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  chave_licenca: string;
}

export function useLicense() {
  const { user } = useAuth();
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const isExpired = license
    ? new Date(license.data_expiracao) < new Date() || license.status === "expirada"
    : false;

  const isActive = license
    ? !isExpired && license.status === "ativa"
    : false;

  const daysRemaining = license
    ? Math.max(0, Math.ceil((new Date(license.data_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("licencas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setLicense(data as LicenseInfo | null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  const activateKey = async (key: string) => {
    if (!user) throw new Error("Não autenticado");

    const url = `https://uyrcxfypdzasdminxizq.supabase.co/functions/v1/activate-license`;
    const session = (await supabase.auth.getSession()).data.session;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ chave: key }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Erro ao ativar licença");

    // Refresh license
    const { data } = await supabase
      .from("licencas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    setLicense(data as LicenseInfo | null);
    return result;
  };

  return { license, loading, isActive, isExpired, daysRemaining, activateKey };
}
