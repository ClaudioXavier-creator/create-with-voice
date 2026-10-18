import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { getBaseLegal, type AssuntoBaseLegal, type BaseLegal } from "@/config/baseLegal";

const CACHE_24H = 1000 * 60 * 60 * 24;

interface NormaVinculada {
  codigo: string | null;
  resumo: string | null;
}

/**
 * Lê a norma vinculada ao assunto em normas_legislacao (slug = assunto, empresa ativa)
 * e mescla com o texto de reserva de getBaseLegal: campos preenchidos no banco vencem;
 * campos vazios usam a reserva. Se a consulta falhar ou não houver linha, retorna a
 * reserva sem erro. Cache de 24 h.
 */
export function useBaseLegal(assunto: AssuntoBaseLegal): BaseLegal {
  const { empresaAtiva } = useEmpresa();
  const reserva = getBaseLegal(assunto);

  const { data } = useQuery({
    queryKey: ["base-legal", empresaAtiva?.id ?? null, assunto],
    enabled: !!empresaAtiva,
    staleTime: CACHE_24H,
    gcTime: CACHE_24H,
    retry: 1,
    queryFn: async (): Promise<NormaVinculada | null> => {
      const { data, error } = await supabase
        .from("normas_legislacao")
        .select("codigo, resumo")
        .eq("empresa_id", empresaAtiva!.id)
        .eq("slug", assunto)
        .limit(1)
        .maybeSingle();
      if (error) return null; // falha silenciosa: usa a reserva
      return data;
    },
  });

  if (!data) return reserva;

  const codigo = data.codigo?.trim();
  const resumo = data.resumo?.trim();

  return {
    norma: codigo || reserva.norma,
    artigo: reserva.artigo, // sem correspondente no banco: sempre reserva
    citacao: codigo || reserva.citacao,
    observacao: resumo || reserva.observacao,
  };
}
