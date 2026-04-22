export interface DocumentoAtivacaoItem {
  codigo: string;
  nome: string;
  versao: string;
  dataRevisao: string;
  proximaRevisao: string;
  status: string;
  responsavel: string;
}

export const DOCUMENTOS_ATIVACAO_CHECKLIST: DocumentoAtivacaoItem[] = [
  { codigo: "POP-01", nome: "Qualificação de Fornecedores", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-02", nome: "Limpeza de Instalações, Equipamentos e Utensílios", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-03", nome: "Higiene e Saúde Pessoal", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-04", nome: "Potabilidade da Água", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-05", nome: "Controle da Produção e Prevenção da Contaminação Cruzada", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-06", nome: "Manutenção e Calibração de Equipamentos e Instrumentos", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-07", nome: "Controle Integrado de Pragas", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-08", nome: "Controle de Resíduos e Efluentes", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-09", nome: "Programa de Rastreabilidade e Recolhimento (Recall)", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "POP-10", nome: "PAC — Programa de Autocontrole", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-01-01", nome: "Avaliação e Qualificação Inicial de Fornecedor", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-01-02", nome: "Inspeção de Recebimento de Matéria-Prima a Granel", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-01-03", nome: "Inspeção de Recebimento de Matéria-Prima Ensacada", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-02-01", nome: "Limpeza a Seco de Áreas de Produção", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-02-02", nome: "Limpeza Úmida e Sanitização", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-02-03", nome: "Limpeza de Silos e Transportadores", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-03-01", nome: "Higiene Pessoal na Entrada da Fábrica", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-03-02", nome: "Controle de Atestados de Saúde Ocupacional (ASO)", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-04-01", nome: "Coleta de Amostras de Água para Análise", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-04-02", nome: "Higienização de Reservatórios de Água", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-05-01", nome: "Sequenciamento de Produção e Flushing", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-05-02", nome: "Teste de Carry-Over (Arraste)", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-06-01", nome: "Manutenção Preventiva de Equipamentos Críticos", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-06-02", nome: "Verificação Intermediária de Balanças", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-07-01", nome: "Monitoramento Semanal de Pragas", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-07-02", nome: "Inspeção e Manutenção de Barreiras Físicas", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-08-01", nome: "Segregação e Coleta de Resíduos", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-08-02", nome: "Descarte de Produtos Não Conformes", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-09-01", nome: "Rastreabilidade de Lote de Produção", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-09-02", nome: "Procedimento de Recall / Recolhimento", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-10-01", nome: "Auditoria Interna BPF", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
  { codigo: "IT-10-02", nome: "Análise de Indicadores e Reunião de Resultados", versao: "01", dataRevisao: "2026-04-22", proximaRevisao: "2027-04-22", status: "Ativo", responsavel: "Responsável Técnico / Qualidade" },
];

export const DOCUMENTOS_ATIVACAO_HEADERS = [
  "Código",
  "Nome",
  "Versão",
  "Data de revisão",
  "Próxima revisão",
  "Status",
  "Responsável",
] as const;