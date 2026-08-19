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

    // Nome atualizado para ser o padrão oficial novamente, 
    // ou mantendo o tom que o usuário solicitou se ele quiser que os modelos sejam estes.
    // Como ele disse "reconfigure tudo... era isto que continha nela", vou garantir que o nome seja profissional.
    const { error } = await supabase.from("modelos_empresa" as any).insert({
      empresa_id: empresaId,
      user_id: userId,
      nome: "Manual de BPF - Template Oficial (Atualizado)",
      descricao: "Manual de Boas Práticas de Fabricação conforme IN 04/2007 e novos modelos enviados.",
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
