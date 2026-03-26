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
        periodos: diasDoMes(),
        areas: [
          { area: "Matéria-prima recebida" },
          { area: "Fornecedor" },
          { area: "Lote / NF" },
          { area: "Certificado de análise" },
          { area: "Inspeção visual (odor, cor, embalagem)" },
          { area: "Temperatura / Umidade" },
          { area: "Aprovado / Rejeitado" },
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
        label: "PL POP 1.5 — Medição de Umidade dos Silos",
        periodos: diasDoMes(),
        areas: [
          { area: "Silo 1" },
          { area: "Silo 2" },
          { area: "Silo 3" },
          { area: "Silo 4" },
          { area: "Silo 5" },
        ],
      },
      {
        key: "recebimento_embalagens",
        label: "PL POP 1.6 — Recebimento de Embalagens",
        periodos: diasDoMes(),
        areas: [
          { area: "Embalagem recebida" },
          { area: "Conferência NF" },
          { area: "Condições higiênico-sanitárias" },
          { area: "Quantidades conferidas" },
        ],
      },
      {
        key: "lotes_internos",
        label: "PL POP 1.7 — Controle de Lotes Internos",
        periodos: diasDoMes(),
        areas: [
          { area: "Matéria-prima / Embalagem" },
          { area: "Lote do fornecedor" },
          { area: "Lote interno atribuído" },
          { area: "Data de entrada" },
          { area: "FIFO/PEPS verificado" },
        ],
      },
      {
        key: "expurgo",
        label: "PL POP 1.8 — Controle de Expurgo",
        periodos: meses(),
        areas: [
          { area: "Produto expurgado" },
          { area: "Data do expurgo" },
          { area: "Produto utilizado" },
          { area: "Dosagem / Concentração" },
          { area: "Tempo de carência" },
          { area: "Responsável" },
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
          { area: "Área Externa da Fábrica (Pátio)" },
          { area: "Paredes em alvenaria" },
          { area: "Piso queimado e balança rodoviária" },
          { area: "Paredes e tetos (área de produção)" },
          { area: "Luminárias e proteções" },
          { area: "Portas e janelas (vedação e limpeza)" },
          { area: "Telas anti-inseto (verificação)" },
          { area: "Pesagem e Misturas (Equipamentos)" },
          { area: "Ensaque (Silos e balanças)" },
        ],
      },
      {
        key: "mensal",
        label: "PL POP 2.3 — Registro de Limpeza Mensal",
        periodos: ["Mês"],
        areas: [
          { area: "Recepção de grãos" },
          { area: "Pesagem e misturas (MP)" },
          { area: "Estocagem de insumos" },
          { area: "Embalagens" },
          { area: "Expedição" },
          { area: "Pátio" },
          { area: "Caixa d'água / reservatório" },
          { area: "Sistema de exaustão / ventilação" },
          { area: "Caixa de gordura / esgoto" },
        ],
      },
      {
        key: "veiculos",
        label: "PL POP 2.4 — Registro de Limpeza Veículos Mensal",
        periodos: ["Mês"],
        areas: [
          { area: "Caminhão Baú (Parte externa)" },
          { area: "Caminhão Baú (Cabine)" },
          { area: "Caminhão Baú (Carroceria)" },
          { area: "Empilhadeira" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Registro de Limpeza Diária – PL POP 2.1",
      "ANEXO 2: Registro de Limpeza Semanal – PL POP 2.2",
      "ANEXO 3: Registro de Limpeza Mensal – PL POP 2.3",
      "ANEXO 4: Registro de Limpeza Veículos Mensal – PL POP 2.4",
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
        key: "mensal",
        label: "Manutenção Preventiva Mensal",
        periodos: meses(),
        areas: [
          { area: "Misturadores" },
          { area: "Moegas / Silos" },
          { area: "Transportadores (roscas, elevadores)" },
          { area: "Ensacadeira" },
          { area: "Costuradeira" },
          { area: "Moinho / Triturador" },
          { area: "Peletizadora (se aplicável)" },
          { area: "Compressor de ar" },
        ],
      },
      {
        key: "calibracao",
        label: "Calibração de Instrumentos",
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
    ],
    anexos: [
      "ANEXO 1: Cronograma de Manutenção Preventiva",
      "ANEXO 2: Planilha de Calibração de Instrumentos",
      "ANEXO 3: Registro de Verificação Intermediária",
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
