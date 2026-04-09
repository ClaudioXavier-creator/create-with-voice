import { supabase } from "@/integrations/supabase/client";

/**
 * Registra uma ação no log de auditoria.
 * Usado para trilha de auditoria completa (Decreto 12.031/2024).
 */
export async function registrarAuditLog(params: {
  userId: string;
  empresaId?: string;
  tabela: string;
  registroId?: string;
  acao: "criar" | "editar" | "excluir";
  dadosAnteriores?: Record<string, any>;
  dadosNovos?: Record<string, any>;
}) {
  try {
    await (supabase.from("audit_log") as any).insert({
      user_id: params.userId,
      empresa_id: params.empresaId || null,
      tabela: params.tabela,
      registro_id: params.registroId || null,
      acao: params.acao,
      dados_anteriores: params.dadosAnteriores || null,
      dados_novos: params.dadosNovos || null,
    });
  } catch (e) {
    console.warn("Audit log error:", e);
  }
}

/**
 * Registra uma nova versão de documento (POP).
 */
export async function registrarVersaoDocumento(params: {
  userId: string;
  empresaId?: string;
  documentoId: string;
  versaoAnterior: string;
  versaoNova: string;
  responsavel: string;
  motivo: string;
  alteracoes: string;
}) {
  try {
    await (supabase.from("documento_versoes") as any).insert({
      user_id: params.userId,
      empresa_id: params.empresaId || null,
      documento_id: params.documentoId,
      versao_anterior: params.versaoAnterior,
      versao_nova: params.versaoNova,
      responsavel: params.responsavel,
      motivo: params.motivo,
      alteracoes: params.alteracoes,
    });
  } catch (e) {
    console.warn("Version log error:", e);
  }
}
