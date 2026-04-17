/**
 * Configuração de níveis de licença (Entrada / Intermediário / Avançado)
 * — Compatível com MAPA IN 04/2007 e Decreto 12.031/2024
 *
 * Decisões:
 * - ENTRADA: modo híbrido. Mantém TODAS as exigências legais mínimas digitais
 *   (Documentos, Rastreabilidade, Recall, Matriz de Risco, ASO, Auditoria).
 *   Os módulos operacionais (lançamento diário) ficam bloqueados para entrada
 *   digital — usuário baixa planilhas em branco (PDF/Excel), preenche à mão e
 *   anexa o PDF digitalizado em Documentos BPF.
 * - INTERMEDIÁRIO: libera operacionais (Recebimento, Produção, Higiene, Pragas,
 *   Resíduos, Análises, Manutenção, etc.) + PCP + Fórmulas. Multi-empresa até 3.
 * - AVANÇADO: tudo + IA + SIPEAGRO + Tendências. Multi-empresa até 10.
 */

export type Tier = "entrada" | "intermediario" | "avancado";

export const TIER_LABEL: Record<Tier, string> = {
  entrada: "Entrada",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export const TIER_MAX_EMPRESAS: Record<Tier, number> = {
  entrada: 1,
  intermediario: 3,
  avancado: 10,
};

/**
 * Módulos SEMPRE liberados (todos os tiers) — exigências legais mínimas
 * do Decreto 12.031/2024 e IN 04/2007.
 */
export const ALWAYS_ALLOWED: string[] = [
  "/dashboard",
  "/cadastro",
  "/documentos",
  "/documentos-bpf",
  "/execucao-pops",
  "/manual",
  "/guia-pops",
  "/modelos",
  "/legislacao",
  // Exigências legais mínimas (devem estar em TODOS os planos)
  "/rastreabilidade",
  "/simulacao-recall",
  "/matriz-risco",
  "/saude-pessoal",
  "/treinamentos",
  "/visitantes",
  "/auditoria",
  "/checklist-pre-auditoria",
  "/nao-conformidades",
  "/qualidade-total",
  "/sala-auditor",
  "/potabilidade-agua",
  "/ativar-licenca",
  "/instalar",
];

/**
 * Módulos OPERACIONAIS — lançamento digital diário.
 * No plano ENTRADA ficam em "modo híbrido": exibem aviso e oferecem download
 * de planilha em branco para preenchimento manual + arquivamento via PDF.
 */
export const OPERATIONAL_MODULES: string[] = [
  "/recebimento",
  "/producao",
  "/pcp",
  "/higiene",
  "/validacao-limpeza",
  "/pragas",
  "/residuos",
  "/manutencao",
  "/analises",
  "/substancias",
  "/fornecedores",
  "/armazenamento-transporte",
  "/produtos",
  "/formulas",
  "/planilhas-pop",
  "/modo-tablet",
  "/relatorio-producao",
  "/indicadores",
  "/relatorios",
  "/planejamento-anual",
  "/busca-global",
];

/**
 * Módulos AVANÇADOS — IA + integrações externas. Apenas tier "avancado".
 */
export const ADVANCED_ONLY: string[] = [
  "/analise-tendencias",
  "/consulta-sipeagro",
  "/geracao-manual-bpf",
];

/**
 * Resolve se uma rota é permitida no nível.
 * - hybrid=true significa: rota acessível somente em modo "híbrido"
 *   (mostrar aviso + download de planilha em branco, sem lançamento digital).
 */
export function checkAccess(
  tier: Tier,
  pathname: string,
): { allowed: boolean; hybrid: boolean; reason?: string } {
  // Normaliza
  const path = pathname.replace(/\/+$/, "") || "/";

  if (ALWAYS_ALLOWED.includes(path)) {
    return { allowed: true, hybrid: false };
  }

  if (ADVANCED_ONLY.includes(path)) {
    if (tier === "avancado") return { allowed: true, hybrid: false };
    return {
      allowed: false,
      hybrid: false,
      reason: "Recurso disponível apenas no plano Avançado (IA / integrações).",
    };
  }

  if (OPERATIONAL_MODULES.includes(path)) {
    if (tier === "intermediario" || tier === "avancado") {
      return { allowed: true, hybrid: false };
    }
    // Entrada → modo híbrido
    return {
      allowed: true,
      hybrid: true,
      reason:
        "Plano Entrada: lançamento digital indisponível neste módulo. Baixe a planilha em branco, preencha e arquive em Documentos BPF.",
    };
  }

  // Default: permitir (rotas administrativas, perfil, etc.)
  return { allowed: true, hybrid: false };
}

/**
 * Resolve o tier a partir do registro de licença (campo `plano` em `licencas`).
 * Mapeamento: trial→intermediario (para o usuário experimentar tudo durante 7d).
 */
export function resolveTier(plano: string | undefined | null): Tier {
  if (!plano) return "entrada";
  const p = plano.toLowerCase();
  if (p.includes("avancado") || p.includes("avançado")) return "avancado";
  if (p.includes("intermediario") || p.includes("intermediário")) return "intermediario";
  if (p.includes("entrada")) return "entrada";
  if (p === "trial") return "avancado"; // trial libera tudo
  return "entrada";
}
