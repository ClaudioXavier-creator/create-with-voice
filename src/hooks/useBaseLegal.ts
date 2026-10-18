import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { getBaseLegal, type AssuntoBaseLegal, type BaseLegal } from "@/config/baseLegal";

const CACHE_24H = 1000 * 60 * 60 * 24;

interface NormaVinculada {
  resumo: string | null;
}

/**
 * Lê a norma vinculada ao assunto em normas_legislacao (slug = assunto), da empresa ativa
 * ou do acervo global (empresa_id nulo), preferindo a da empresa.
 * A citação (norma e artigo) vem SEMPRE de getBaseLegal: o banco só complementa a
 * observação com o resumo, quando preenchido. Se a consulta falhar ou não houver linha,
 * retorna a reserva sem erro. Cache de 24 h.
 */
export function useBaseLegal(assunto: AssuntoBaseLegal): BaseLegal {
  const { empresaAtiva } = useEmpresa();
  const reserva = getBaseLegal(assunto);
  const empresaId = empresaAtiva?.id ?? null;

  const { data } = useQuery({
    queryKey: ["base-legal", empresaId, assunto],
    staleTime: CACHE_24H,
    gcTime: CACHE_24H,
    retry: 1,
    queryFn: async (): Promise<NormaVinculada | null> => {
      let consulta = supabase.from("normas_legislacao").select("resumo, empresa_id").eq("slug", assunto);
      consulta = empresaId
        ? consulta.or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
        : consulta.is("empresa_id", null);
      const { data, error } = await consulta.limit(2);
      if (error || !data || data.length === 0) return null; // falha silenciosa: usa a reserva
      const linha = data.find((r) => r.empresa_id === empresaId) ?? data[0];
      return { resumo: linha.resumo };
    },
  });

  const resumo = data?.resumo?.trim();
  if (!resumo) return reserva;

  return { ...reserva, observacao: resumo };
}
