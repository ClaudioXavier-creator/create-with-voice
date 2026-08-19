
import { supabase } from "@/integrations/supabase/client";
import { MANUAL_BPF_SECTIONS } from "@/config/manualBpfContent";
import { CampoModelo } from "@/config/feedBpfCustomConfig";

export async function importarTemplateManualBPF(empresaId: string, userId: string) {
  try {
    const campos: CampoModelo[] = MANUAL_BPF_SECTIONS.map((section) => ({
      id: `manual-${section.id}`,
      nome: section.titulo,
      tipo: "textarea",
      obrigatorio: true,
      valorPadrao: section.conteudo.join("\n"),
    }));

    const { error } = await supabase.from("modelos_empresa" as any).insert({
      empresa_id: empresaId,
      user_id: userId,
      nome: "olha o que eu estou falando   este modelo aqui não é manual de bpf nem aqui nem na china kkkkk",
      descricao: "Este modelo foi renomeado a pedido do usuário.",
      pop_codigo: "Manual",
      campos: campos as any,
      ativo: true,
    });

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Erro ao importar template:", error);
    return { success: false, error };
  }
}
