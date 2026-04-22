import { POPS_CONFIG, type PopConfig, type PopPeriodicidade } from "@/config/popsConfig";
import type { InstrucaoTrabalho } from "@/config/instrucoesTrabalho";
import { supabase } from "@/integrations/supabase/client";

const normalizar = (valor?: string | null) =>
  (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const corresponde = (base?: string | null, alvo?: string | null) => {
  const a = normalizar(base);
  const b = normalizar(alvo);

  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
};

export function resolverPeriodicidadeOperacional(
  popCodigo: string,
  itSelecionada?: InstrucaoTrabalho | null,
): PopPeriodicidade | null {
  const pop = POPS_CONFIG.find((item) => item.codigo === popCodigo);

  if (!pop || pop.periodicidades.length === 0) return null;
  if (pop.periodicidades.length === 1) return pop.periodicidades[0];

  const referencia = [itSelecionada?.registroVinculado, itSelecionada?.titulo];

  return (
    pop.periodicidades.find((periodicidade) =>
      referencia.some(
        (valor) =>
          corresponde(valor, periodicidade.label) ||
          corresponde(valor, periodicidade.key),
      ),
    ) ?? null
  );
}

interface GarantirPlanilhaParams {
  empresaId: string;
  popCodigo: string;
  popNome: string;
  userId: string;
  itSelecionada?: InstrucaoTrabalho | null;
}

interface GarantirPlanilhaResult {
  created: boolean;
  documentoId: string | null;
  documentoVinculado: boolean;
  periodicidade: PopPeriodicidade | null;
  planilhaId: string | null;
}

export async function garantirPlanilhaOperacional(
  params: GarantirPlanilhaParams,
): Promise<GarantirPlanilhaResult> {
  const periodicidade = resolverPeriodicidadeOperacional(params.popCodigo, params.itSelecionada);

  if (!periodicidade) {
    return { created: false, documentoId: null, documentoVinculado: false, periodicidade: null, planilhaId: null };
  }

  const { data: documento, error: documentoError } = await supabase
    .from("documentos")
    .select("id")
    .eq("empresa_id", params.empresaId)
    .eq("codigo", params.popCodigo)
    .maybeSingle();

  if (documentoError) throw documentoError;

  if (!documento) {
    return { created: false, documentoId: null, documentoVinculado: false, periodicidade, planilhaId: null };
  }

  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  const { data: existente, error: consultaError } = await supabase
    .from("pop_planilhas")
    .select("id")
    .eq("user_id", params.userId)
    .eq("empresa_id", params.empresaId)
    .eq("pop_codigo", params.popCodigo)
    .eq("periodicidade", periodicidade.key)
    .eq("mes", mes)
    .eq("ano", ano)
    .maybeSingle();

  if (consultaError) throw consultaError;

  if (existente) {
    return { created: false, documentoId: documento.id, documentoVinculado: true, periodicidade, planilhaId: existente.id };
  }

  const { data: criada, error: createError } = await supabase
    .from("pop_planilhas")
    .insert({
      user_id: params.userId,
      empresa_id: params.empresaId,
      pop_codigo: params.popCodigo,
      pop_nome: params.popNome,
      periodicidade: periodicidade.key,
      mes,
      ano,
    })
    .select("id")
    .single();

  if (createError) throw createError;

  return { created: true, documentoId: documento.id, documentoVinculado: true, periodicidade, planilhaId: criada.id };
}

export function obterPopConfig(popCodigo: string): PopConfig | null {
  return POPS_CONFIG.find((item) => item.codigo === popCodigo) ?? null;
}