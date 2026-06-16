// Estrutura espelhada do TF-Autocontroles do MAPA/DIPOA (v3.0)
// Termo de Fiscalização baseado em Autocontroles — fábricas de alimentação animal
// Itens marcados com `obrigatorio` = (O) do manual; `riscoRegulatorio` = (RR)

export interface TFItem {
  id: string;
  texto: string;
  obrigatorio?: boolean;     // (O) — NC dispara medida fiscal cautelar
  riscoRegulatorio?: boolean; // (RR) — vinculado à classificação de risco
  sugestoesNC?: string[];    // frases sugeridas pelo manual para descrever a NC
}

export interface TFModulo {
  codigo: string;
  titulo: string;
  itens: TFItem[];
}

export const TF_AUTOCONTROLES: TFModulo[] = [
  {
    codigo: "A",
    titulo: "A. Cadastro e Registro do Estabelecimento (SIPEAGRO)",
    itens: [
      { id: "A1", texto: "O estabelecimento possui registro vigente no SIPEAGRO.", obrigatorio: true, riscoRegulatorio: true,
        sugestoesNC: ["Registro vencido no SIPEAGRO.", "Atividade exercida sem registro correspondente no SIPEAGRO."] },
      { id: "A2", texto: "As atividades realizadas correspondem àquelas registradas no SIPEAGRO.", obrigatorio: true,
        sugestoesNC: ["Estabelecimento executa atividade não constante do cadastro SIPEAGRO."] },
      { id: "A3", texto: "Alterações de instalações/equipamentos que impactam capacidade ou produtos foram comunicadas." },
      { id: "A4", texto: "Suspensões de atividade foram comunicadas no SIPEAGRO." },
    ],
  },
  {
    codigo: "B",
    titulo: "B. Instalações, Pragas e Estrutura Física",
    itens: [
      { id: "B1", texto: "Entorno do estabelecimento livre de focos de contaminação e abrigo de pragas.",
        sugestoesNC: ["Entulho e objetos em desuso no entorno servindo de abrigo para pragas.", "Estabelecimento situado em zona sujeita a alojamento de pragas."] },
      { id: "B2", texto: "Pisos, paredes, tetos e portas em estado de conservação e fácil higienização.",
        sugestoesNC: ["Material das portas dificulta limpeza/higienização.", "Pisos com rachaduras impedem higienização adequada."] },
      { id: "B3", texto: "Iluminação e ventilação adequadas nas áreas de processo." },
      { id: "B4", texto: "Lavatórios de mãos em local coberto e em condições de uso." },
      { id: "B5", texto: "Vestiários e sanitários em adequadas condições de higiene.",
        sugestoesNC: ["Vestiários e sanitários em condições precárias de higiene."] },
      { id: "B6", texto: "Áreas de armazenamento adequadas (sem MP/PA no pátio, sob lonas, fora da área destinada).", obrigatorio: true,
        sugestoesNC: ["Matérias-primas armazenadas em pátio sob lonas, fora de área apropriada."] },
    ],
  },
  {
    codigo: "C",
    titulo: "C. Controle Integrado de Pragas",
    itens: [
      { id: "C1", texto: "POP de controle de pragas implementado e atendido." },
      { id: "C2", texto: "Mapa de iscas/armadilhas mantido atualizado com inspeções periódicas." },
      { id: "C3", texto: "Produtos químicos registrados no órgão competente e armazenados corretamente.", obrigatorio: true },
    ],
  },
  {
    codigo: "D",
    titulo: "D. Processo Produtivo, Mistura e Carry-over",
    itens: [
      { id: "D1", texto: "Verifica o processo de mistura (tempo, ordem, capacidade do misturador).",
        sugestoesNC: ["Não verifica o processo de mistura.", "Não estabeleceu tempo de mistura ideal."] },
      { id: "D2", texto: "Monitoramento dos parâmetros de processo previstos no procedimento escrito.",
        sugestoesNC: ["Não monitora parâmetros de processo que o procedimento escrito prevê como importantes."] },
      { id: "D3", texto: "Procedimentos de flushing/limpeza de linha implementados (IN 15/2009) para evitar carry-over.", obrigatorio: true, riscoRegulatorio: true,
        sugestoesNC: ["Ausência/ineficácia de flushing entre fórmulas medicamentosas e não medicamentosas."] },
      { id: "D4", texto: "Linhas compartilhadas monogástricos/ruminantes possuem segregação e validação (prevenção EEB).", obrigatorio: true, riscoRegulatorio: true,
        sugestoesNC: ["Linha compartilhada mono/rumi sem procedimento validado de segregação — risco EEB."] },
      { id: "D5", texto: "Uso de madeira restrito aos casos permitidos.",
        sugestoesNC: ["Uso de madeira em situações não permitidas (descrever)."] },
    ],
  },
  {
    codigo: "E",
    titulo: "E. Medicamentos e Aditivos",
    itens: [
      { id: "E1", texto: "Possui autorização vigente para uso/fabricação de produtos com medicamentos.", obrigatorio: true, riscoRegulatorio: true },
      { id: "E2", texto: "Uso de aditivos antimicrobianos conforme normas (incluindo Sulfato de Colistina — IN MAPA 45/2016).", obrigatorio: true, riscoRegulatorio: true,
        sugestoesNC: ["Uso de princípio ativo proibido para a espécie."] },
      { id: "E3", texto: "Adesão ao programa livre de ractopamina respeitada (quando aplicável).", obrigatorio: true, riscoRegulatorio: true,
        sugestoesNC: ["Detecção de uso de ractopamina em linha declarada livre."] },
      { id: "E4", texto: "Receituário e rastreabilidade de medicamentos arquivados." },
    ],
  },
  {
    codigo: "F",
    titulo: "F. Higiene, Limpeza e Sanitização",
    itens: [
      { id: "F1", texto: "POP de limpeza/higienização de instalações, equipamentos e utensílios implementado." },
      { id: "F2", texto: "Higienização de reservatórios de água executada e registrada." },
      { id: "F3", texto: "POP de higiene pessoal e uso de uniformes atendido.",
        sugestoesNC: ["POP especifica uso/higiene de uniformes, mas funcionários trabalham sem uniformes."] },
    ],
  },
  {
    codigo: "G",
    titulo: "G. Matérias-Primas e Rastreabilidade",
    itens: [
      { id: "G1", texto: "MP de origem animal devidamente identificada, com registro/isenção MAPA.", obrigatorio: true, riscoRegulatorio: true },
      { id: "G2", texto: "Rastreabilidade lote-a-lote garantida de MP a produto acabado.", obrigatorio: true },
      { id: "G3", texto: "Amostras de retenção mantidas pelo prazo previsto." },
    ],
  },
  {
    codigo: "H",
    titulo: "H. Resíduos e Coprodutos",
    itens: [
      { id: "H1", texto: "Gestão de resíduos (PGRS) implementada conforme CONAMA 430/2011." },
      { id: "H2", texto: "Resíduos destinados a fabricantes de coprodutos com ficha técnica e rastreabilidade documentadas." },
    ],
  },
  {
    codigo: "I",
    titulo: "I. Plano de Ação e Não Conformidades Pretéritas",
    itens: [
      { id: "I1", texto: "Empresa atendeu integralmente ao plano de ação proposto na fiscalização anterior.", obrigatorio: true,
        sugestoesNC: ["A empresa não atendeu ao plano de ação proposto em (data).", "A empresa atendeu ao plano de ação proposto em (data) parcialmente."] },
      { id: "I2", texto: "Todas as NCs identificadas estão tratadas com responsável, prazo e evidência." },
    ],
  },
];

export type TFResposta = "C" | "NC" | "NA";

export interface TFRespostaDetalhe {
  status: TFResposta;
  observacao?: string;
}

export function calcularResumoTF(respostas: Record<string, TFRespostaDetalhe>) {
  const todosItens = TF_AUTOCONTROLES.flatMap(m => m.itens);
  const total = todosItens.length;
  let conformes = 0, ncs = 0, nas = 0, ncObrigatorios = 0, ncRR = 0;

  todosItens.forEach((item) => {
    const r = respostas[item.id]?.status;
    if (r === "C") conformes++;
    else if (r === "NA") nas++;
    else if (r === "NC") {
      ncs++;
      if (item.obrigatorio) ncObrigatorios++;
      if (item.riscoRegulatorio) ncRR++;
    }
  });

  const avaliados = conformes + ncs;
  const scorePct = avaliados > 0 ? Math.round((conformes / avaliados) * 100) : 0;

  return { total, conformes, ncs, nas, ncObrigatorios, ncRR, scorePct };
}
