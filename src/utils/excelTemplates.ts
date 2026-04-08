import * as XLSX from "xlsx";

// Helper to create a styled worksheet with proper column widths and formatting
function createSheet(data: (string | number | boolean | null)[][], colWidths: number[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = colWidths.map(w => ({ wch: w }));
  // Set print area
  ws["!printarea"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: colWidths.length - 1 } });
  return ws;
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: "xlsx", cellStyles: true });
}

// ─── POP 1: Fornecedores ───
export function gerarPL_POP_1() {
  const wb = XLSX.utils.book_new();

  // 1.1 Qualificação de Fornecedores
  const qual = [
    ["PLANILHA 1.1 — QUALIFICAÇÃO DE FORNECEDORES"],
    ["Empresa:", "", "", "Responsável:", ""],
    [""],
    ["Nº", "Fornecedor", "CNPJ", "Registro MAPA/SIPEAGRO", "Produtos Fornecidos", "Ficha Técnica", "Cert. Análise", "Alvará", "Registro Produto", "Nota Avaliação (0-10)", "Status", "Próx. Avaliação", "Observações"],
    ...Array.from({ length: 20 }, (_, i) => [i + 1, "", "", "", "", "☐", "☐", "☐", "☐", "", "", "", ""]),
    [""],
    ["Critérios: ≥8 Aprovado | 6-7 Aprovado com restrição | <6 Reprovado"],
    ["Assinatura RT:", "", "", "CRMV:", "", "Data:", ""],
  ];
  const ws1 = createSheet(qual, [5, 25, 18, 22, 25, 12, 12, 10, 14, 14, 12, 14, 20]);
  XLSX.utils.book_append_sheet(wb, ws1, "1.1 Qualificação");

  // 1.2 Recebimento de MP
  const receb = [
    ["PLANILHA 1.2 — RECEBIMENTO DE MATÉRIA-PRIMA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Fornecedor", "Matéria-Prima", "Lote", "Quantidade", "Unid.", "Validade", "Odor", "Insetos", "Umidade (%)", "Temp. (°C)", "Cert. Análise", "Aprovado", "Responsável", "Obs."],
    ...Array.from({ length: 30 }, () => ["", "", "", "", "", "", "", "☐N ☐A", "☐Aus ☐Pres", "", "", "☐", "☐S ☐N", "", ""]),
    [""],
    ["Assinatura Executor:", "", "", "Assinatura Supervisor:", "", "Data:", ""],
  ];
  const ws2 = createSheet(receb, [10, 20, 20, 12, 10, 6, 10, 10, 12, 10, 10, 12, 10, 15, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, "1.2 Recebimento MP");

  // 1.3 Recebimento de Embalagens
  const emb = [
    ["PLANILHA 1.3 — RECEBIMENTO DE EMBALAGENS"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Fornecedor", "Tipo Embalagem", "Lote", "Quantidade", "Integridade", "Limpeza", "Aprovado", "Responsável", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "☐C ☐NC", "☐C ☐NC", "☐S ☐N", "", ""]),
  ];
  const ws3 = createSheet(emb, [10, 20, 18, 12, 10, 12, 12, 10, 15, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, "1.3 Embalagens");

  downloadWorkbook(wb, "PL_POP_1_Fornecedores");
}

// ─── POP 2: Limpeza ───
export function gerarPL_POP_2() {
  const wb = XLSX.utils.book_new();

  // 2.1 Limpeza Diária
  const diaria = [
    ["PLANILHA 2.1 — REGISTRO DE LIMPEZA DIÁRIA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Área/Equipamento", "Tipo Limpeza", "Produto Utilizado", "Concentração", "Hora Início", "Hora Fim", "Conforme", "Executor", "Verificado por", "Obs."],
    ...Array.from({ length: 31 }, () => ["", "", "☐Seca ☐Úmida", "", "", "", "", "☐C ☐NC", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws1 = createSheet(diaria, [10, 22, 16, 18, 12, 10, 10, 10, 15, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "2.1 Limpeza Diária");

  // 2.2 Limpeza Semanal
  const semanal = [
    ["PLANILHA 2.2 — REGISTRO DE LIMPEZA SEMANAL"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Semana", "Área", "Equipamento", "Procedimento", "Produto", "Concentração", "Conforme", "Executor", "Obs."],
    ...Array.from({ length: 8 }, (_, i) => [`Sem ${i + 1}`, "", "", "", "", "", "☐C ☐NC", "", ""]),
  ];
  const ws2 = createSheet(semanal, [10, 20, 20, 25, 18, 12, 10, 15, 20]);
  XLSX.utils.book_append_sheet(wb, ws2, "2.2 Limpeza Semanal");

  // 2.3 Limpeza Mensal
  const mensal = [
    ["PLANILHA 2.3 — REGISTRO DE LIMPEZA MENSAL / PROGRAMADA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Mês", "Área/Equipamento", "Procedimento", "Produto", "Conforme", "Executor", "Data Execução", "Obs."],
    ...["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(m => [m, "", "", "", "☐C ☐NC", "", "", ""]),
  ];
  const ws3 = createSheet(mensal, [8, 22, 25, 18, 10, 15, 14, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, "2.3 Limpeza Mensal");

  // 2.4 Limpeza de Veículos
  const veiculos = [
    ["PLANILHA 2.4 — LIMPEZA DE VEÍCULOS DE TRANSPORTE"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Placa", "Tipo Veículo", "Carga Anterior", "Limpo", "Odor", "Pragas", "Aprovado", "Responsável", "Obs."],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "☐S ☐N", "☐N ☐A", "☐Aus ☐Pres", "☐S ☐N", "", ""]),
  ];
  const ws4 = createSheet(veiculos, [10, 12, 15, 20, 10, 10, 12, 10, 15, 20]);
  XLSX.utils.book_append_sheet(wb, ws4, "2.4 Veículos");

  downloadWorkbook(wb, "PL_POP_2_Limpeza");
}

// ─── POP 3: Higiene Pessoal ───
export function gerarPL_POP_3() {
  const wb = XLSX.utils.book_new();

  const higiene = [
    ["PLANILHA 3.1 — CHECKLIST DE HIGIENE PESSOAL"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Colaborador", "Uniforme Limpo", "Sem Adornos", "Unhas Cortadas", "Barba Feita", "Mãos Lavadas", "EPI Completo", "Sem Sintomas", "Conforme", "Verificado por", "Obs."],
    ...Array.from({ length: 25 }, () => ["", "", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐C ☐NC", "", ""]),
    [""],
    ["CONTROLE DE ASOs"],
    ["Colaborador", "Cargo", "Admissão", "Último ASO", "Tipo Exame", "Apto", "Próximo ASO", "Obs."],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "☐S ☐N", "", ""]),
    [""],
    ["CONTROLE DE VISITANTES"],
    ["Data", "Nome Visitante", "Empresa", "Documento", "Motivo", "EPI Fornecido", "Orientação Bio", "Entrada", "Saída", "Acompanhante"],
    ...Array.from({ length: 10 }, () => ["", "", "", "", "", "☐", "☐", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws = createSheet(higiene, [10, 18, 12, 12, 12, 10, 12, 12, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "3.1 Higiene Pessoal");

  downloadWorkbook(wb, "PL_POP_3_Higiene_Pessoal");
}

// ─── POP 4: Água ───
export function gerarPL_POP_4() {
  const wb = XLSX.utils.book_new();

  const cloro = [
    ["PLANILHA 4.1 — CONTROLE DIÁRIO DE CLORO RESIDUAL E pH"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Ponto de Coleta", "Hora", "Cloro Residual (mg/L)", "pH", "Conforme", "Ação Corretiva", "Responsável"],
    ...Array.from({ length: 31 }, () => ["", "", "", "", "", "☐C ☐NC", "", ""]),
    [""],
    ["Referência: Cloro residual livre 0,2 a 2,0 mg/L | pH 6,0 a 9,5 (Portaria GM/MS 888/2021)"],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws1 = createSheet(cloro, [10, 20, 8, 18, 8, 10, 20, 15]);
  XLSX.utils.book_append_sheet(wb, ws1, "4.1 Cloro pH");

  const reservatorio = [
    ["PLANILHA 4.2 — HIGIENIZAÇÃO DE RESERVATÓRIO DE ÁGUA"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    ["Nº", "Item de Verificação", "Conforme", "Observação"],
    [1, "Reservatório esvaziado completamente", "☐C ☐NC", ""],
    [2, "Paredes e fundo escovados", "☐C ☐NC", ""],
    [3, "Resíduos removidos", "☐C ☐NC", ""],
    [4, "Enxágue realizado", "☐C ☐NC", ""],
    [5, "Solução clorada aplicada (200 ppm)", "☐C ☐NC", ""],
    [6, "Tempo de contato respeitado (30 min)", "☐C ☐NC", ""],
    [7, "Enxágue final realizado", "☐C ☐NC", ""],
    [8, "Tampa/cobertura em boas condições", "☐C ☐NC", ""],
    [9, "Vedação sem rachaduras", "☐C ☐NC", ""],
    [10, "Tela de proteção anti-insetos", "☐C ☐NC", ""],
    [11, "Ausência de infiltrações", "☐C ☐NC", ""],
    [12, "Identificação do reservatório", "☐C ☐NC", ""],
    [13, "Registro fotográfico antes", "☐C ☐NC", ""],
    [14, "Registro fotográfico depois", "☐C ☐NC", ""],
    [15, "Cloro residual pós-higienização medido", "☐C ☐NC", ""],
    [16, "Reservatório reabastecido", "☐C ☐NC", ""],
    [""],
    ["Executor:", "", "Supervisor:", ""],
    ["Assinatura RT:", "", "CRMV:", ""],
  ];
  const ws2 = createSheet(reservatorio, [5, 40, 10, 25]);
  XLSX.utils.book_append_sheet(wb, ws2, "4.2 Reservatório");

  const laudos = [
    ["PLANILHA 4.3 — LAUDOS LABORATORIAIS DE ÁGUA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Data Coleta", "Ponto", "Laboratório", "Nº Laudo", "Parâmetro", "Resultado", "Limite", "Conforme", "Obs."],
    ...Array.from({ length: 12 }, () => ["", "", "", "", "", "", "", "☐C ☐NC", ""]),
    [""],
    ["Frequência mínima: semestral (microbiológica) e anual (completa)"],
  ];
  const ws3 = createSheet(laudos, [12, 15, 20, 12, 18, 12, 12, 10, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, "4.3 Laudos");

  downloadWorkbook(wb, "PL_POP_4_Agua");
}

// ─── POP 5: Contaminação Cruzada ───
export function gerarPL_POP_5() {
  const wb = XLSX.utils.book_new();

  const cc = [
    ["PLANILHA 5.1 — PREVENÇÃO DE CONTAMINAÇÃO CRUZADA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Produto Anterior", "Produto Seguinte", "Flushing Realizado", "Kg Flushing", "Destino Flushing", "Limpeza Conforme", "Teste Carry-Over", "Resultado", "Responsável", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "☐S ☐N", "", "", "☐C ☐NC", "☐S ☐N/A", "", "", ""]),
    [""],
    ["Referência: IN nº 15/2009 — Contaminação Cruzada por Medicamentos"],
  ];
  const ws1 = createSheet(cc, [10, 18, 18, 14, 10, 15, 14, 14, 12, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "5.1 Contaminação Cruzada");

  const monitor = [
    ["PLANILHA 5.2 — MONITORAMENTO DE LIMPEZA DE LINHA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Linha/Equipamento", "Tipo Limpeza", "Tempo (min)", "Inspeção Visual", "Swab Realizado", "Resultado", "Aprovado", "Executor", "Obs."],
    ...Array.from({ length: 15 }, () => ["", "", "☐Seca ☐Úmida", "", "☐C ☐NC", "☐S ☐N", "", "☐S ☐N", "", ""]),
  ];
  const ws2 = createSheet(monitor, [10, 20, 16, 10, 14, 14, 12, 10, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, "5.2 Monitoramento Limpeza");

  downloadWorkbook(wb, "PL_POP_5_Contaminacao_Cruzada");
}

// ─── POP 6: Manutenção/Calibração ───
export function gerarPL_POP_6() {
  const wb = XLSX.utils.book_new();

  const crono = [
    ["PLANILHA 6.1 — CRONOGRAMA DE MANUTENÇÃO PREVENTIVA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Equipamento", "Código", "Frequência", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez", "Responsável"],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Legenda: P = Programada | R = Realizada | A = Adiada"],
  ];
  const ws1 = createSheet(crono, [20, 10, 12, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 15]);
  XLSX.utils.book_append_sheet(wb, ws1, "6.1 Cronograma Manutenção");

  const calib = [
    ["PLANILHA 6.2 — REGISTRO DE CALIBRAÇÃO DE EQUIPAMENTOS"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Equipamento", "Código", "Tipo", "Localização", "Data Calibração", "Próxima Calibração", "Nº Certificado", "Empresa Calibradora", "Resultado", "Conforme", "Responsável"],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "☐C ☐NC", ""]),
  ];
  const ws2 = createSheet(calib, [18, 10, 12, 15, 14, 16, 14, 18, 12, 10, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, "6.2 Calibração");

  const os = [
    ["PLANILHA 6.3 — ORDENS DE SERVIÇO DE MANUTENÇÃO"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Nº OS", "Data Abertura", "Equipamento", "Tipo", "Descrição", "Peças Trocadas", "Custo (R$)", "Data Conclusão", "Status", "Responsável"],
    ...Array.from({ length: 20 }, () => ["", "", "", "☐Prev ☐Corr", "", "", "", "", "", ""]),
  ];
  const ws3 = createSheet(os, [8, 14, 18, 14, 25, 18, 12, 14, 12, 15]);
  XLSX.utils.book_append_sheet(wb, ws3, "6.3 Ordens Serviço");

  const equipamentos = [
    ["PLANILHA 6.4 — LISTA DE EQUIPAMENTOS"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    ["Nº", "Equipamento", "Código/Tag", "Fabricante", "Modelo", "Nº Série", "Localização", "Data Aquisição", "Status", "Obs."],
    ...Array.from({ length: 25 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "", ""]),
  ];
  const ws4 = createSheet(equipamentos, [5, 22, 12, 15, 15, 15, 15, 14, 10, 18]);
  XLSX.utils.book_append_sheet(wb, ws4, "6.4 Equipamentos");

  downloadWorkbook(wb, "PL_POP_6_Manutencao_Calibracao");
}

// ─── POP 7: Pragas ───
export function gerarPL_POP_7() {
  const wb = XLSX.utils.book_new();

  const semanal = [
    ["PLANILHA 7.1 — MONITORAMENTO SEMANAL DE PRAGAS"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Local/Área", "Tipo Dispositivo", "Nº Dispositivo", "Praga Encontrada", "Quantidade", "Ação Tomada", "Responsável", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "", "", ""]),
    [""],
    ["Legenda: R = Roedor | I = Inseto Rasteiro | V = Inseto Voador | A = Ave"],
  ];
  const ws1 = createSheet(semanal, [10, 18, 16, 14, 16, 10, 20, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "7.1 Monitoramento Semanal");

  const mensal = [
    ["PLANILHA 7.2 — CONTROLE MENSAL DE PRAGAS"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Mês", "Empresa Controladora", "Técnico", "Produtos Utilizados", "Registro ANVISA", "Áreas Tratadas", "Pragas Alvo", "Próxima Aplicação", "Obs."],
    ...["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map(m => [m, "", "", "", "", "", "", "", ""]),
  ];
  const ws2 = createSheet(mensal, [8, 20, 15, 20, 14, 18, 15, 16, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, "7.2 Controle Mensal");

  downloadWorkbook(wb, "PL_POP_7_Pragas");
}

// ─── POP 8: Resíduos ───
export function gerarPL_POP_8() {
  const wb = XLSX.utils.book_new();

  const residuos = [
    ["PLANILHA 8.1 — CONTROLE DE RESÍDUOS E EFLUENTES"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Tipo Resíduo", "Classificação", "Origem", "Quantidade", "Unid.", "Destino Final", "Empresa Coletora", "Nº Manifesto", "Licença Ambiental", "Responsável", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Classificação: I (Perigoso) | IIA (Não Inerte) | IIB (Inerte)"],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws = createSheet(residuos, [10, 18, 14, 15, 10, 6, 18, 18, 14, 14, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "8.1 Resíduos");

  downloadWorkbook(wb, "PL_POP_8_Residuos");
}

// ─── POP 9: Rastreabilidade ───
export function gerarPL_POP_9() {
  const wb = XLSX.utils.book_new();

  const rastreio = [
    ["PLANILHA 9.1 — RASTREABILIDADE DE LOTES"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Produto", "Lote Produto", "Data Fabricação", "Matéria-Prima", "Lote MP", "Fornecedor", "Cliente Destino", "NF Venda", "Data Venda", "Quantidade", "Espécie Destino", "Obs."],
    ...Array.from({ length: 25 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
  ];
  const ws1 = createSheet(rastreio, [18, 14, 14, 18, 12, 18, 18, 12, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "9.1 Rastreabilidade");

  const recall = [
    ["PLANILHA 9.2 — REGISTRO DE RECALL / RECOLHIMENTO"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    ["Nº Recall", "Data Início", "Motivo", "Produto", "Lotes Afetados", "Qtd. Distribuída", "Clientes Notificados", "Qtd. Recolhida", "Destino", "Status", "Data Encerramento", "Responsável"],
    ...Array.from({ length: 5 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Referência: Decreto 12.031/2024 — Procedimento de Recolhimento"],
  ];
  const ws2 = createSheet(recall, [10, 14, 22, 18, 18, 14, 18, 14, 15, 12, 16, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, "9.2 Recall");

  downloadWorkbook(wb, "PL_POP_9_Rastreabilidade");
}

// ─── Formulários individuais ───
export function gerarFormRecebimentoMP() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["FORMULÁRIO — RECEBIMENTO DE MATÉRIA-PRIMA"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    ["Nº", "Data", "Fornecedor", "Matéria-Prima", "Lote", "Quantidade", "Unid.", "Validade", "Odor", "Insetos", "Umidade (%)", "Temperatura (°C)", "Cert. Análise Nº", "Aprovado", "Contraprova Retida", "Local Contraprova", "Responsável", "Obs."],
    ...Array.from({ length: 30 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "☐N ☐A", "☐Aus ☐Pres", "", "", "", "☐S ☐N", "☐S ☐N", "", "", ""]),
  ];
  const ws = createSheet(data, [5, 10, 18, 18, 10, 10, 6, 10, 10, 12, 10, 12, 14, 10, 14, 14, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Recebimento MP");
  downloadWorkbook(wb, "Form_Recebimento_MP");
}

export function gerarFormOrdemProducao() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["ORDEM DE PRODUÇÃO"],
    ["Empresa:", "", "Nº Ordem:", "", "Data:", ""],
    ["Produto:", "", "Fórmula:", "", "Lote:", ""],
    ["Quantidade Programada:", "", "Unidade:", "", "Nº Batidas:", ""],
    [""],
    ["FÓRMULA / COMPOSIÇÃO"],
    ["Nº", "Matéria-Prima", "Lote MP", "Fornecedor", "% Inclusão", "Quantidade (kg)", "Conferido"],
    ...Array.from({ length: 15 }, (_, i) => [i + 1, "", "", "", "", "", "☐"]),
    ["", "", "", "", "TOTAL:", "", ""],
    [""],
    ["REGISTRO DE BATIDAS"],
    ["Batida Nº", "Hora Início", "Hora Fim", "Tempo Mistura (min)", "Temperatura (°C)", "Operador", "Status", "Obs."],
    ...Array.from({ length: 10 }, (_, i) => [i + 1, "", "", "", "", "", "", ""]),
    [""],
    ["Assinatura Operador:", "", "Assinatura Supervisor:", "", "Assinatura RT:", ""],
  ];
  const ws = createSheet(data, [8, 18, 12, 15, 12, 14, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Ordem Produção");
  downloadWorkbook(wb, "Form_Ordem_Producao");
}

export function gerarFormValidacaoLimpeza() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["VALIDAÇÃO DE LIMPEZA DE LINHA / FLUSHING"],
    ["Empresa:", "", "Data:", "", "Linha:", ""],
    [""],
    ["Nº", "Produto Anterior", "Medicamento/Aditivo", "Produto Seguinte", "Sensível?", "Flushing Kg", "Destino Flushing", "Inspeção Visual", "Swab/Teste", "Resultado", "Aprovado", "Responsável"],
    ...Array.from({ length: 15 }, (_, i) => [i + 1, "", "", "", "☐S ☐N", "", "", "☐C ☐NC", "☐S ☐N/A", "", "☐S ☐N", ""]),
    [""],
    ["Referência: IN nº 15/2009 — Prevenção de Contaminação Cruzada por Medicamentos"],
  ];
  const ws = createSheet(data, [5, 18, 18, 18, 10, 12, 15, 14, 12, 12, 10, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Validação Limpeza");
  downloadWorkbook(wb, "Form_Validacao_Limpeza");
}

export function gerarFormMatrizSensibilidade() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["MATRIZ DE SENSIBILIDADE — SEQUENCIAMENTO DE PRODUÇÃO"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Produto Anterior ↓ / Produto Seguinte →", "Prod A", "Prod B", "Prod C", "Prod D", "Prod E", "Prod F", "Prod G", "Prod H"],
    ...["Prod A", "Prod B", "Prod C", "Prod D", "Prod E", "Prod F", "Prod G", "Prod H"].map(p => [p, "", "", "", "", "", "", "", ""]),
    [""],
    ["Legenda: 0 = Sem restrição | 1 = Requer flushing | 2 = Requer limpeza completa | X = Proibido sequenciar"],
    ["Referência: IN nº 15/2009"],
  ];
  const ws = createSheet(data, [35, 10, 10, 10, 10, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Matriz Sensibilidade");
  downloadWorkbook(wb, "Form_Matriz_Sensibilidade");
}

export function gerarFormSubstancias() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE SUBSTÂNCIAS INDESEJÁVEIS E PROIBIDAS"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Data Análise", "Matéria-Prima", "Lote", "Fornecedor", "Substância", "Tipo", "Método Análise", "Resultado", "Unidade", "Limite Máximo", "Conforme", "Ref. Normativa", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "☐Proib ☐Indesej", "", "", "", "", "☐C ☐NC", "", ""]),
  ];
  const ws = createSheet(data, [12, 18, 10, 18, 18, 16, 15, 10, 8, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Substâncias");
  downloadWorkbook(wb, "Form_Substancias");
}

export function gerarFormAnalisesLab() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["REGISTRO DE ANÁLISES LABORATORIAIS"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Data Análise", "Produto", "Lote", "Tipo Análise", "Parâmetro", "Método", "Resultado", "Unidade", "Limite Ref.", "Conforme", "Laboratório", "Nº Laudo", "Data Resultado", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "☐FQ ☐Micro ☐Bromatol", "", "", "", "", "", "☐C ☐NC", "", "", "", ""]),
  ];
  const ws = createSheet(data, [12, 18, 10, 20, 15, 12, 10, 8, 10, 10, 18, 12, 12, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Análises Lab");
  downloadWorkbook(wb, "Form_Analises_Lab");
}

export function gerarFormReclamacoes() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["REGISTRO DE RECLAMAÇÕES DE QUALIDADE / SAC"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Nº Reclamação", "Data", "Cliente", "Contato", "Produto", "Lote", "NF", "Tipo", "Descrição Problema", "Causa Raiz", "Ação Imediata", "Ação Corretiva", "Responsável", "Prazo", "Status"],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]),
  ];
  const ws = createSheet(data, [14, 10, 18, 15, 18, 10, 10, 15, 25, 20, 20, 20, 15, 12, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Reclamações SAC");
  downloadWorkbook(wb, "Form_Reclamacoes");
}

export function gerarFormSaudeManipuladores() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE SAÚDE DE MANIPULADORES"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Nº", "Colaborador", "Cargo", "Data Admissão", "Último ASO", "Tipo Exame", "Apto", "Próximo ASO", "Observações"],
    ...Array.from({ length: 25 }, (_, i) => [i + 1, "", "", "", "", "", "☐S ☐N", "", ""]),
    [""],
    ["MONITORAMENTO DIÁRIO DE SAÚDE"],
    ["Data", "Colaborador", "Sem Sintomas", "Uniforme OK", "Sem Ferimentos", "Adornos", "Conforme", "Verificador"],
    ...Array.from({ length: 20 }, () => ["", "", "☐", "☐", "☐", "☐Sem", "☐C ☐NC", ""]),
  ];
  const ws = createSheet(data, [5, 22, 15, 14, 14, 14, 10, 14, 20]);
  XLSX.utils.book_append_sheet(wb, ws, "Saúde Manipuladores");
  downloadWorkbook(wb, "Form_Saude_Manipuladores");
}

export function gerarFormVisitantes() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE VISITANTES"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Nome Visitante", "Documento", "Empresa", "Motivo", "Áreas Visitadas", "EPI Fornecido", "Orientação Biosseguridade", "Hora Entrada", "Hora Saída", "Acompanhante", "Obs."],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "☐S ☐N", "☐S ☐N", "", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "Data:", ""],
  ];
  const ws = createSheet(data, [10, 22, 14, 18, 18, 18, 14, 20, 12, 12, 18, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
  downloadWorkbook(wb, "Form_Visitantes");
}

export function gerarFormCloroDiario() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DIÁRIO DE CLORO RESIDUAL E pH"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    ["Dia", "Ponto 1 - Cloro", "Ponto 1 - pH", "Ponto 2 - Cloro", "Ponto 2 - pH", "Ponto 3 - Cloro", "Ponto 3 - pH", "Conforme", "Ação Corretiva", "Responsável"],
    ...Array.from({ length: 31 }, (_, i) => [i + 1, "", "", "", "", "", "", "☐C ☐NC", "", ""]),
    [""],
    ["Padrão: Cloro 0,2–2,0 mg/L | pH 6,0–9,5 | Portaria GM/MS 888/2021"],
  ];
  const ws = createSheet(data, [5, 14, 12, 14, 12, 14, 12, 10, 20, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Cloro Diário");
  downloadWorkbook(wb, "Form_Cloro_Diario");
}

export function gerarFormHigienizacaoReservatorio() {
  return gerarPL_POP_4(); // Reuses POP 4 which already includes the reservoir checklist
}

export function gerarFormControleASO() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE ATESTADOS DE SAÚDE OCUPACIONAL (ASO)"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Nº", "Colaborador", "Cargo/Setor", "Data Admissão", "Tipo Exame", "Data ASO", "Médico", "CRM", "Resultado", "Restrições", "Próximo ASO", "Status"],
    ...Array.from({ length: 30 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "☐Apto ☐Inapto", "", "", ""]),
    [""],
    ["Tipos: Admissional | Periódico | Retorno | Mudança Função | Demissional"],
  ];
  const ws = createSheet(data, [5, 22, 15, 14, 14, 12, 18, 10, 14, 15, 14, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Controle ASO");
  downloadWorkbook(wb, "Form_Controle_ASO");
}

export function gerarFormMonitoramentoSaude() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["MONITORAMENTO DIÁRIO DE SAÚDE DOS MANIPULADORES"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Colaborador", "Sem Febre", "Sem Diarreia", "Sem Vômito", "Sem Lesões", "Sem Secreções", "Uniforme Limpo", "Sem Adornos", "Unhas Cortadas", "Barba Feita", "EPI OK", "Conforme", "Verificador", "Obs."],
    ...Array.from({ length: 25 }, () => ["", "", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐C ☐NC", "", ""]),
  ];
  const ws = createSheet(data, [10, 20, 8, 10, 10, 10, 10, 12, 10, 10, 10, 8, 10, 14, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Monitoramento Saúde");
  downloadWorkbook(wb, "Form_Monitoramento_Saude");
}

// Map arquivo key → generator function
export const TEMPLATE_GENERATORS: Record<string, () => void> = {
  "PL_POP_1": gerarPL_POP_1,
  "PL_POP_2": gerarPL_POP_2,
  "PL_POP_3": gerarPL_POP_3,
  "PL_POP_4": gerarPL_POP_4,
  "PL_POP_5": gerarPL_POP_5,
  "PL_POP_6": gerarPL_POP_6,
  "PL_POP_7": gerarPL_POP_7,
  "PL_POP_8": gerarPL_POP_8,
  "PL_POP_9": gerarPL_POP_9,
  "Form_Recebimento_MP": gerarFormRecebimentoMP,
  "Form_Ordem_Producao": gerarFormOrdemProducao,
  "Form_Validacao_Limpeza": gerarFormValidacaoLimpeza,
  "Form_Matriz_Sensibilidade": gerarFormMatrizSensibilidade,
  "Form_Substancias": gerarFormSubstancias,
  "Form_Analises_Lab": gerarFormAnalisesLab,
  "Form_Reclamacoes": gerarFormReclamacoes,
  "Form_Saude_Manipuladores": gerarFormSaudeManipuladores,
  "Form_Visitantes": gerarFormVisitantes,
  "Form_Cloro_Diario": gerarFormCloroDiario,
  "Form_Higienizacao_Reservatorio": gerarFormHigienizacaoReservatorio,
  "Form_Controle_ASO": gerarFormControleASO,
  "Form_Monitoramento_Saude": gerarFormMonitoramentoSaude,
};
