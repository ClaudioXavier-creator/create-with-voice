import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "./useEmpresa";
import { MODULOS_CUSTOM } from "@/config/modulosCustom";

export function useModulosCustom() {
  const { empresaAtiva } = useEmpresa();

  const { data, isLoading } = useQuery({
    queryKey: ["empresa_modulos_custom", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return new Map<string, boolean>();
      const { data, error } = await (supabase.from as any)("empresa_modulos_custom")
        .select("modulo_codigo, ativo")
        .eq("empresa_id", empresaAtiva.id);
      if (error) throw error;
      return new Map<string, boolean>((data || []).map((r: any) => [r.modulo_codigo, !!r.ativo]));
    },
    enabled: !!empresaAtiva?.id,
    staleTime: 1000 * 60 * 2,
  });

  const isAtivo = (codigo: string): boolean => {
    if (!data) {
      const m = MODULOS_CUSTOM.find((x) => x.codigo === codigo);
      return m?.padrao_ativo ?? false;
    }
    if (data.has(codigo)) return !!data.get(codigo);
    const m = MODULOS_CUSTOM.find((x) => x.codigo === codigo);
    return m?.padrao_ativo ?? false;
  };

  const ativos = MODULOS_CUSTOM.filter((m) => isAtivo(m.codigo));

  return { isAtivo, ativos, loading: isLoading };
}
