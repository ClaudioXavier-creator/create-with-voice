export interface PopAreaConfig {
  area: string;
}

export interface PopPeriodicidade {
  key: string;
  label: string;
  periodos: string[]; // labels dos períodos (dias, semanas, etc.)
  areas: PopAreaConfig[];
}

export interface PopConfig {
  codigo: string;
  nome: string;
  descricao: string;
  periodicidades: PopPeriodicidade[];
  anexos?: string[];
}

function diasDoMes(): string[] {
  return Array.from({ length: 31 }, (_, i) => String(i + 1));
}

function semanas(): string[] {
  return ["1ª", "2ª", "3ª", "4ª", "5ª"];
}

function quinzenas(): string[] {
  return ["1ª Quinzena", "2ª Quinzena"];
}

function meses(): string[] {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
}

export const POPS_CONFIG: PopConfig[] = [
  {
    codigo: "POP-01",
    nome: "Qualificação de Fornecedores e Controle de Matérias-Primas e Embalagens",
    descricao: "Procedimentos para qualificação de fornecedores, especificação e controle de matérias-primas e embalagens conforme IN 04/2007.",
    periodicidades: [
      {
        key: "recebimento_mp",
        label: "PL POP 1.2 — Recebimento de Matéria-Prima",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Fornecedor (Nome)" },
          { area: "Data" },
          { area: "Nº Nota Fiscal" },
          { area: "Nº Lote" },
          { area: "Nº Laudo / Lote Fornecedor" },
          { area: "Placa do Caminhão" },
          { area: "Condições Higiênicas do Produto (C/NC/NA)" },
          { area: "Condições Higiênicas do Veículo (C/NC/NA)" },
          { area: "Presença de Laudo (C/NC/NA)" },
          { area: "Produto" },
          { area: "Quantidade (Kg)" },
          { area: "Umidade lida — Medidor (%)" },
          { area: "Resultado (%)" },
          { area: "Aprovado / Reprovado / Aprovado c/ Restrição (secagem)" },
          { area: "Ocorrência" },
          { area: "Ação Corretiva" },
          { area: "Medida Preventiva" },
          { area: "Novo Monitoramento Após Secagem" },
        ],
      },
      {
        key: "controle_entrada_mp",
        label: "PL POP 1.3 — Controle de Entrada de Matéria-Prima",
        periodos: diasDoMes(),
        areas: [
          { area: "Data" },
          { area: "Matéria-prima" },
          { area: "Fornecedor" },
          { area: "Lote" },
          { area: "Nota Fiscal" },
          { area: "C/NC" },
          { area: "Responsável" },
          { area: "Função" },
        ],
      },
      {
        key: "controle_entrada_embalagens",
        label: "PL POP 1.4 — Entrada de Embalagens",
        periodos: diasDoMes(),
        areas: [
          { area: "Data" },
          { area: "Tipo de embalagem" },
          { area: "Fornecedor" },
          { area: "Nota Fiscal" },
          { area: "Quantidade" },
          { area: "Inspeção visual" },
          { area: "C/NC" },
          { area: "Responsável" },
        ],
      },
      {
        key: "umidade_silos",
        label: "PL POP 1.5 — Medição de Umidade de Grãos nos Silos",
        periodos: semanas(),
        areas: [
          { area: "Local (Silo)" },
          { area: "Produto" },
          { area: "% Umidade" },
          { area: "C/NC" },
        ],
      },
      {
        key: "recebimento_embalagens",
        label: "PL POP 1.6 — Recebimento de Embalagens",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Fornecedor (Nome)" },
          { area: "Data" },
          { area: "Nota Fiscal / Quantidade" },
          { area: "Lote" },
          { area: "Placa do Veículo" },
          { area: "Condições Higiênicas (C/NC)" },
          { area: "Condições Físicas (C/NC)" },
          { area: "Forração (C/NC)" },
          { area: "Ausência de Odores / Prod. Químicos (C/NC)" },
          { area: "Tipos de Embalagens — Capacidade" },
          { area: "Tipos de Embalagens — Tipo" },
          { area: "Tipos de Embalagens — Quantidade" },
          { area: "Nº Amostras Coletadas" },
          { area: "Empilhamento (C/NC)" },
          { area: "Higiene (C/NC)" },
          { area: "Impressão (C/NC)" },
          { area: "Tamanho (C/NC)" },
          { area: "Integridade (C/NC)" },
          { area: "Não Conformidade" },
          { area: "Ação Corretiva" },
          { area: "Medida Preventiva" },
          { area: "Aprovado / Reprovado / Aprovado c/ Restrição (RNC)" },
        ],
      },
      {
        key: "lotes_internos",
        label: "PL POP 1.7 — Controle de Lotes Internos MP/Embalagens",
        periodos: ["Anual"],
        areas: [
          { area: "Milho em Grãos (Lotes 1–110)" },
          { area: "Soja (Lotes 1–110)" },
          { area: "Quirera (Lotes 1–110)" },
          { area: "Sal (Lotes 1–110)" },
          { area: "Embalagens (Lotes 1–110)" },
        ],
      },
      {
        key: "expurgo",
        label: "PL POP 1.8 — Controle de Expurgo",
        periodos: meses(),
        areas: [
          { area: "Tipo de produto" },
          { area: "Local (Silo / Estoque)" },
          { area: "Lote" },
          { area: "Quantidade de produto" },
          { area: "Tratamento — Data inicial" },
          { area: "Tratamento — Data final" },
          { area: "Produto químico — Nome" },
          { area: "Produto químico — Quantidade" },
          { area: "Eficácia (C/NC)" },
          { area: "Responsável monitoramento" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Lista de Fornecedores – PL POP 1.1",
      "ANEXO 2: Recebimento de MP – PL POP 1.2",
      "ANEXO 3: Controle de entrada de MP – PL POP 1.3",
      "ANEXO 4: Controle de entrada de embalagens – PL POP 1.4",
      "ANEXO 5: Medição da umidade dos silos – PL POP 1.5",
      "ANEXO 6: Recebimento de Embalagens – PL POP 1.6",
      "ANEXO 7: Controle dos lotes internos – PL POP 1.7",
      "ANEXO 8: Controle de expurgo – PL POP 1.8",
    ],
  },
  {
    codigo: "POP-02",
    nome: "Limpeza de Instalações, Equipamentos e Utensílios",
    descricao: "Procedimentos de limpeza e higienização de todas as áreas, equipamentos e utensílios da fábrica conforme IN 04/2007 e IN 15/2009.",
    periodicidades: [
      {
        key: "diario",
        label: "PL POP 2.1 — Registro de Limpeza Diária",
        periodos: diasDoMes(),
        areas: [
          { area: "Escritório e anexos" },
          { area: "Vestiários / Banheiros da Produção" },
          { area: "Área de Produção (Piso)" },
          { area: "Área de Recepção de Grãos (Moega)" },
          { area: "Área de Pesagem e Mistura (MP)" },
          { area: "Área de Ensaque" },
          { area: "Área de Embalagens" },
          { area: "Área de Expedição" },
          { area: "Refeitório e copa" },
          { area: "Ralos e canaletas" },
          { area: "Lixeiras internas" },
        ],
      },
      {
        key: "semanal",
        label: "PL POP 2.2 — Registro de Limpeza Semanal",
        periodos: semanas(),
        areas: [
          { area: "Área de Pesagem e Misturas (Equipamentos)" },
          { area: "Área de Pesagem e Mistura (Utensílios: Conchas, Bombonas, Balanças)" },
          { area: "Área de Ensaque (Silos e balanças — farelada)" },
          { area: "Área de Ensaque (Paletes)" },
          { area: "Área Externa (Pátio)" },
        ],
      },
      {
        key: "mensal",
        label: "PL POP 2.3 — Registro de Limpeza Mensal",
        periodos: meses(),
        areas: [
          { area: "Área de Recepção de Grãos" },
          { area: "Área de Pesagem e Misturas (MP)" },
          { area: "Área de Estocagem de Insumos" },
          { area: "Área de Embalagens" },
          { area: "Área de Expedição" },
        ],
      },
      {
        key: "veiculos",
        label: "PL POP 2.4 — Registro de Limpeza Veículos (Quinzenal)",
        periodos: quinzenas(),
        areas: [
          { area: "Caminhão Entrega" },
          { area: "Limpeza Empilhadeira" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Registro de Limpeza Diária – PL POP 2.1",
      "ANEXO 2: Registro de Limpeza Semanal – PL POP 2.2",
      "ANEXO 3: Registro de Limpeza Mensal – PL POP 2.3",
      "ANEXO 4: Registro de Limpeza Veículos Quinzenal – PL POP 2.4",
    ],
  },
  {
    codigo: "POP-03",
    nome: "Higiene e Saúde do Pessoal",
    descricao: "Procedimentos de higiene pessoal, saúde dos colaboradores, uso de EPIs e comportamento nas áreas de produção conforme IN 04/2007.",
    periodicidades: [
      {
        key: "semanal",
        label: "PL POP 3.1 — Registro de Higiene e Saúde do Pessoal",
        periodos: semanas(),
        areas: [
          { area: "Uniforme limpo e adequado" },
          { area: "Uso de EPIs (luvas, botas, touca)" },
          { area: "Higiene das mãos (lavagem correta)" },
          { area: "Ausência de adornos (anéis, relógio, brincos)" },
          { area: "Unhas curtas e sem esmalte" },
          { area: "Barba aparada / protegida" },
          { area: "Ausência de ferimentos expostos" },
          { area: "Condições de saúde (sintomas visíveis)" },
          { area: "Uso de perfume/maquiagem (proibido)" },
          { area: "Comportamento adequado (não comer, fumar, etc.)" },
          { area: "Vestiários limpos e organizados" },
          { area: "Sanitários abastecidos (sabonete, papel)" },
          { area: "Lavatórios funcionando" },
          { area: "Cartazes de orientação afixados" },
        ],
      },
      {
        key: "mensal",
        label: "Controle Mensal — Saúde e Documentação",
        periodos: meses(),
        areas: [
          { area: "ASO em dia (todos os colaboradores)" },
          { area: "Exames periódicos atualizados" },
          { area: "Treinamento de higiene realizado" },
          { area: "Registro de visitantes (higiene)" },
          { area: "Controle de atestados médicos" },
          { area: "PCMSO atualizado" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Registro de Higiene e Saúde do Pessoal – PL POP 3.1",
    ],
  },
  {
    codigo: "POP-04",
    nome: "Potabilidade da Água e Higienização de Reservatório",
    descricao: "Procedimentos de controle da potabilidade da água e higienização dos reservatórios conforme IN 04/2007 e Portaria de Potabilidade.",
    periodicidades: [
      {
        key: "diario",
        label: "Controle Diário de Cloro Residual",
        periodos: diasDoMes(),
        areas: [
          { area: "Ponto 1 — Entrada / Poço" },
          { area: "Ponto 2 — Área de Produção" },
          { area: "Ponto 3 — Bebedouro / Refeitório" },
          { area: "Ponto 4 — Lavagem de equipamentos" },
          { area: "Registro de pH" },
          { area: "Registro de turbidez" },
        ],
      },
      {
        key: "semanal",
        label: "Verificação Semanal — Reservatórios e Rede",
        periodos: semanas(),
        areas: [
          { area: "Inspeção visual da caixa d'água" },
          { area: "Verificação de tampa/vedação do reservatório" },
          { area: "Estado das tubulações (vazamentos)" },
          { area: "Filtros de água (limpeza/troca)" },
        ],
      },
      {
        key: "mensal",
        label: "Análise Mensal — Laudos e Manutenção",
        periodos: meses(),
        areas: [
          { area: "Análise microbiológica (coliformes totais e E. coli)" },
          { area: "Análise físico-química (pH, cloro, turbidez, cor)" },
          { area: "Envio de amostra ao laboratório" },
          { area: "Recebimento e arquivo do laudo" },
          { area: "Higienização do reservatório (semestral)" },
          { area: "Certificado da empresa de limpeza" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Planilha de Controle de Cloro Residual",
      "ANEXO 2: Planilha de Higienização do Reservatório",
    ],
  },
  {
    codigo: "POP-05",
    nome: "Prevenção de Contaminação Cruzada",
    descricao: "Procedimentos para prevenção da contaminação cruzada no fluxo produtivo, armazenamento e identificação de matérias-primas conforme IN 04/2007.",
    periodicidades: [
      {
        key: "semanal",
        label: "PL POP 5.1 — Checklist de Prevenção da Contaminação Cruzada",
        periodos: semanas(),
        areas: [
          { area: "Sequência de produção conforme matriz" },
          { area: "Limpeza entre lotes / flushing realizado" },
          { area: "Separação de ingredientes (com/sem medicamento)" },
          { area: "Identificação correta de MPs (granel)" },
          { area: "Identificação correta de MPs (ensacadas)" },
          { area: "Armazenamento segregado" },
          { area: "Fluxo de pessoal adequado" },
          { area: "Ventilação / exaustão" },
          { area: "Embalagens íntegras e fechadas" },
          { area: "Produto acabado identificado corretamente" },
        ],
      },
      {
        key: "mensal_monitoramento",
        label: "PL POP 5.2 — Monitoramento de Limpeza do Sistema",
        periodos: meses(),
        areas: [
          { area: "Swab de superfície — equipamentos" },
          { area: "Teste água de enxágue — misturador" },
          { area: "Inspeção visual pós-limpeza — produção" },
          { area: "Registro de produtos químicos utilizados" },
          { area: "Verificação de concentração de soluções" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Checklist de Prevenção da Contaminação Cruzada – PL POP 5.1",
      "ANEXO 2: Monitoramento de Limpeza do Sistema – PL POP 5.2",
    ],
  },
  {
    codigo: "POP-06",
    nome: "Manutenção e Calibração de Equipamentos e Instrumentos",
    descricao: "Procedimentos de manutenção preventiva e calibração dos equipamentos e instrumentos de medição conforme IN 04/2007 e IN 15/2009.",
    periodicidades: [
      {
        key: "cronograma_manutencao",
        label: "PL POP 6.1 — Cronograma de Manutenção Preventiva",
        periodos: meses(),
        areas: [
          { area: "Recepção de Grãos — Chupins" },
          { area: "Pesagem e Mistura — Chupins" },
          { area: "Pesagem e Mistura — Peneira Pré-Limpeza" },
          { area: "Pesagem e Mistura — Trituradores" },
          { area: "Pesagem e Mistura — Silos Pulmão/Caixas" },
          { area: "Pesagem e Mistura — Balanças MP" },
          { area: "Pesagem e Mistura — Misturadores" },
          { area: "Pesagem e Mistura — Roscas Transportadoras" },
          { area: "Ensaque — Silos de Ensaque" },
          { area: "Ensaque — Balanças de Ensaque" },
          { area: "Ensaque — Chupins Ensaque" },
          { area: "Silos de Armazenamento" },
          { area: "Máquinas de Levantamento de Sacos" },
          { area: "Empilhadeiras" },
        ],
      },
      {
        key: "calibracao",
        label: "PL POP 6.2 — Calibração de Instrumentos",
        periodos: meses(),
        areas: [
          { area: "Balança rodoviária" },
          { area: "Balança de pesagem (MP)" },
          { area: "Balança de ensaque" },
          { area: "Termômetros" },
          { area: "Medidores de umidade" },
          { area: "Verificação intermediária" },
        ],
      },
      {
        key: "ordem_servico",
        label: "PL POP 6.3 — Ordem de Serviço de Manutenção",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Unidade" },
          { area: "Setor" },
          { area: "Data" },
          { area: "Tipo de Serviço (Mecânica/Elétrica/Civil)" },
          { area: "Tipo de Manutenção (Preventiva/Corretiva/Reforma)" },
          { area: "Condições de Operação" },
          { area: "Problema / Solicitação" },
          { area: "Diagnóstico de Causas" },
          { area: "Executante / Responsável" },
          { area: "Data Inicial / Previsão Final" },
          { area: "Serviços Executados / Peças Substituídas" },
          { area: "Parecer do Solicitante" },
          { area: "Concluído (Sim/Não)" },
        ],
      },
      {
        key: "lista_equipamentos",
        label: "PL POP 6.4 — Lista de Equipamentos e Instrumentos",
        periodos: ["Registro"],
        areas: [
          { area: "Nº" },
          { area: "Equipamento (Descrição)" },
          { area: "Nº Controle" },
          { area: "Identificação" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Cronograma de Manutenção Preventiva – PL POP 6.1",
      "ANEXO 2: Calibração de Instrumentos – PL POP 6.2",
      "ANEXO 3: Ordem de Serviço de Manutenção – PL POP 6.3",
      "ANEXO 4: Lista de Equipamentos e Instrumentos – PL POP 6.4",
    ],
  },
  {
    codigo: "POP-07",
    nome: "Controle Integrado de Pragas",
    descricao: "Procedimentos de manejo integrado de pragas (medidas preventivas, corretivas e de eliminação) conforme IN 04/2007.",
    periodicidades: [
      {
        key: "semanal",
        label: "Monitoramento Semanal de Pragas",
        periodos: semanas(),
        areas: [
          { area: "Armadilhas internas (inspeção)" },
          { area: "Armadilhas externas (inspeção)" },
          { area: "Portas e janelas (vedação)" },
          { area: "Telas anti-inseto (integridade)" },
          { area: "Indícios de roedores" },
          { area: "Indícios de insetos" },
          { area: "Indícios de pássaros" },
        ],
      },
      {
        key: "mensal",
        label: "Controle Mensal — Aplicações e Laudos",
        periodos: meses(),
        areas: [
          { area: "Desinsetização realizada" },
          { area: "Desratização realizada" },
          { area: "Laudo empresa terceirizada" },
          { area: "Mapa de iscas atualizado" },
          { area: "Registro de produtos aplicados" },
          { area: "Destino de pragas mortas" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Planilha de Monitoramento Semanal de Pragas",
      "ANEXO 2: Registro de Aplicações Mensais",
      "ANEXO 3: Mapa de Iscas",
    ],
  },
  {
    codigo: "POP-08",
    nome: "Controle de Resíduos e Efluentes",
    descricao: "Procedimentos de coleta, segregação, transporte e destinação de resíduos sólidos e efluentes conforme Decreto 12.031/2024.",
    periodicidades: [
      {
        key: "diario",
        label: "Coleta Diária de Resíduos",
        periodos: diasDoMes(),
        areas: [
          { area: "Resíduos de varrição (pó, farelo)" },
          { area: "Resíduos recicláveis (papel, plástico)" },
          { area: "Resíduos orgânicos" },
          { area: "Embalagens descartadas" },
          { area: "Sacarias danificadas" },
        ],
      },
      {
        key: "mensal",
        label: "Controle Mensal — Destinação e Efluentes",
        periodos: meses(),
        areas: [
          { area: "Destinação de resíduos (empresa coletora)" },
          { area: "Manifesto de transporte (MTR)" },
          { area: "Limpeza de caixas de gordura" },
          { area: "Controle de efluentes" },
          { area: "Licença ambiental vigente" },
          { area: "Frequência de coleta cumprida" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Planilha de Coleta Diária de Resíduos",
      "ANEXO 2: Registro de Destinação Final e MTR",
    ],
  },
  {
    codigo: "POP-09",
    nome: "Programa de Rastreabilidade e Recolhimento de Produtos (Recall)",
    descricao: "Procedimentos de rastreabilidade de produtos, controle de não conformidades e programa de recolhimento (recall) conforme IN 04/2007.",
    periodicidades: [
      {
        key: "ordem_producao",
        label: "PL POP 9.1 — Ordem Diária de Produção",
        periodos: diasDoMes(),
        areas: [
          { area: "Produto / Fórmula" },
          { area: "Lote de produção" },
          { area: "Quantidade programada" },
          { area: "MP utilizadas (lotes)" },
          { area: "Operador responsável" },
          { area: "Tempo de mistura" },
          { area: "Observações" },
        ],
      },
      {
        key: "expedicao",
        label: "PL POP 9.2 — Expedição por Cliente e Produto",
        periodos: diasDoMes(),
        areas: [
          { area: "Cliente / Destino" },
          { area: "Produto" },
          { area: "Lote(s) expedido(s)" },
          { area: "Quantidade" },
          { area: "Nota fiscal / DANFE" },
          { area: "Conferente" },
        ],
      },
      {
        key: "formula_mp",
        label: "PL POP 9.3 — Fórmula e Inclusão de MP",
        periodos: diasDoMes(),
        areas: [
          { area: "Matéria-prima" },
          { area: "Lote da MP" },
          { area: "Fornecedor" },
          { area: "Quantidade utilizada" },
          { area: "Número da batida" },
          { area: "Tempo de mistura" },
        ],
      },
      {
        key: "recall",
        label: "PL POP 9.4 — Produtos Recolhidos (Recall)",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Produto recolhido" },
          { area: "Lote(s) afetado(s)" },
          { area: "Motivo do recall" },
          { area: "Clientes notificados" },
          { area: "Quantidade recolhida" },
          { area: "Destino do produto recolhido" },
          { area: "Status do recolhimento" },
          { area: "Data início / fim" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Ordem diária de Produção – PL POP 9.1",
      "ANEXO 2: Expedição por cliente e produto – PL POP 9.2",
      "ANEXO 3: Fórmula e Inclusão de MP – PL POP 9.3",
      "ANEXO 4: Produtos Recolhidos (Recall) – PL POP 9.4",
    ],
  },
];
