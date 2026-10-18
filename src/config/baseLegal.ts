/** Reserva local da base legal. Na Fase 2, os slugs identificam normas na tabela. */
export interface BaseLegal {
  readonly norma: string;
  readonly artigo: string;
  readonly citacao: string;
  readonly observacao: string;
}

interface DefinicaoBaseLegal extends BaseLegal {
  readonly slugs: readonly string[];
}

const decreto = "Decreto 12.031/2024";
const bpf = "IN 04/2007";

export const BASE_LEGAL = {
  bpf_geral: { norma: bpf, artigo: "", citacao: bpf, observacao: "Regulamento Técnico de BPF.", slugs: ["in-04-2007"] },
  autocontrole: { norma: decreto, artigo: "art. 40", citacao: `${decreto}, art. 40; Decreto 12.126/2024`, observacao: "Programas de autocontrole e registros auditáveis; selo de integridade: art. 40, §3º.", slugs: ["decreto-12031-2024", "decreto-12126-2024"] },
  relatorio_producao_mensal: { norma: decreto, artigo: "art. 39, III", citacao: `${decreto}, art. 39, III`, observacao: "Envio até o 10º dia do mês seguinte (Ofício-Circular 51/2023/CGI/DIPOA/SDA/MAPA).", slugs: ["decreto-12031-2024", "oficio-circular-51-2023"] },
  rastreabilidade: { norma: decreto, artigo: "arts. 41 e 44", citacao: `${decreto}, arts. 41 e 44`, observacao: "", slugs: ["decreto-12031-2024"] },
  registro_estabelecimento: { norma: "IN 17/2020", artigo: "", citacao: "IN 17/2020", observacao: "Registro e cadastro de estabelecimentos e produtos no sistema eletrônico do MAPA.", slugs: ["in-17-2020"] },
  rotulagem: { norma: "IN 22/2009", artigo: "", citacao: "IN 22/2009 (alterada pelas INs 30/2009, 66/2009, 42/2010, 39/2014 e 47/2020)", observacao: "", slugs: ["in-22-2009", "in-30-2009", "in-66-2009", "in-42-2010", "in-39-2014", "in-47-2020"] },
  contraprova_fiscal: { norma: decreto, artigo: "art. 70", citacao: `${decreto}, art. 70`, observacao: "Contraprova da análise fiscal; não há prazo geral de retenção de amostra pelo fabricante.", slugs: ["decreto-12031-2024"] },
  amostra_arquivo: { norma: decreto, artigo: "art. 40", citacao: `Prática interna do autocontrole (${decreto}, art. 40)`, observacao: "Sem prazo fixado em norma.", slugs: ["decreto-12031-2024"] },
  recolhimento_recall: { norma: decreto, artigo: "arts. 39 e 44", citacao: `${decreto}, arts. 39 e 44`, observacao: "", slugs: ["decreto-12031-2024"] },
  alimentos_medicados: { norma: "Portaria SDA 798/2023", artigo: "", citacao: "Portaria SDA 798/2023", observacao: "", slugs: ["portaria-sda-798-2023"] },
  pneeb: { norma: "Portaria SDA 1.180/2024", artigo: "", citacao: "Portaria SDA 1.180/2024", observacao: "", slugs: ["portaria-sda-1180-2024"] },
  controle_pragas: { norma: "RDC ANVISA 622/2022", artigo: "", citacao: "RDC ANVISA 622/2022", observacao: "", slugs: ["rdc-anvisa-622-2022"] },
  substancias_proibidas: { norma: "Lista oficial de substâncias proibidas do MAPA", artigo: "", citacao: "Lista oficial de substâncias proibidas do MAPA; norma por substância (ex.: IN 9/2003, IN 17/2004, IN 26/2009, IN 14/2012, IN 45/2016, IN 1/2020)", observacao: "Não classificar ractopamina como proibida.", slugs: ["in-9-2003", "in-17-2004", "in-26-2009", "in-14-2012", "in-45-2016", "in-1-2020"] },
  decreto_base: { norma: decreto, artigo: "", citacao: decreto, observacao: "Revogou o Decreto 6.296/2007.", slugs: ["decreto-12031-2024"] },
} as const satisfies Record<string, DefinicaoBaseLegal>;

export type AssuntoBaseLegal = keyof typeof BASE_LEGAL;

/** Sempre síncrona: PDFs/exportações nunca aguardam rede ou uma sessão React. */
export function getBaseLegal(assunto: AssuntoBaseLegal): BaseLegal {
  const { norma, artigo, citacao, observacao } = BASE_LEGAL[assunto];
  return { norma, artigo, citacao, observacao };
}

/** Compatibilidade para futuros consumidores da tabela por slug; sem consulta nesta fase. */
export function useBaseLegal(assunto: AssuntoBaseLegal): BaseLegal {
  return getBaseLegal(assunto);
}