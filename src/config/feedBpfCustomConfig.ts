export const POPS_CUSTOM = [
  { codigo: "POP-01", nome: "Recebimento de Matérias-Primas" },
  { codigo: "POP-02", nome: "Higiene e Sanitização" },
  { codigo: "POP-03", nome: "Saúde dos Manipuladores" },
  { codigo: "POP-04", nome: "Potabilidade da Água" },
  { codigo: "POP-05", nome: "Produção e PCP" },
  { codigo: "POP-06", nome: "Manutenção e Calibração" },
  { codigo: "POP-07", nome: "Controle de Pragas" },
  { codigo: "POP-08", nome: "Resíduos e Efluentes" },
  { codigo: "POP-09", nome: "Armazenamento e Transporte" },
  { codigo: "POP-10", nome: "PAC — Programa de Autocontrole" },
];

export const CUSTOM_STORAGE_PREFIX = "custom";

/**
 * Sugere um POP a partir do nome do arquivo por regex simples.
 */
export function sugerirPopPorNome(nomeArquivo: string): string | null {
  const nome = nomeArquivo.toLowerCase();
  const regras: Array<[RegExp, string]> = [
    [/receb|materia[- ]?prima|mp\b|fornecedor/, "POP-01"],
    [/higien|sanitiz|limpez|desinfec/, "POP-02"],
    [/saud|aso|manipulador|epi\b/, "POP-03"],
    [/agua|potab|cloro|reservat/, "POP-04"],
    [/produc|pcp|batida|formul|mistur/, "POP-05"],
    [/manutenc|calibr|equipam/, "POP-06"],
    [/praga|isca|armadilha|dedetiz|roedor/, "POP-07"],
    [/residu|efluent|lixo|descart/, "POP-08"],
    [/armazen|transport|expedic|veicul/, "POP-09"],
    [/pac\b|autocontrol|haccp|appcc/, "POP-10"],
  ];
  for (const [re, pop] of regras) if (re.test(nome)) return pop;
  return null;
}

export type CampoTipo = "texto" | "numero" | "data" | "checkbox" | "textarea" | "select";

export interface CampoModelo {
  id: string;
  nome: string;
  tipo: CampoTipo;
  obrigatorio: boolean;
  opcoes?: string[]; // usado quando tipo = select
}
