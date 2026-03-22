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
    nome: "Qualificação de Fornecedores e Controle de MP",
    descricao: "Registro de recebimento, avaliação e qualificação de fornecedores e matérias-primas.",
    periodicidades: [
      {
        key: "diario",
        label: "Recebimento Diário",
        periodos: diasDoMes(),
        areas: [
          { area: "Matéria-prima recebida" },
          { area: "Laudo/Certificado" },
          { area: "Inspeção visual" },
          { area: "Temperatura/Umidade" },
        ],
      },
    ],
  },
  {
    codigo: "POP-02",
    nome: "Limpeza e Higienização das Instalações",
    descricao: "Registro de limpeza de instalações, equipamentos e utensílios — IN 15/2009.",
    periodicidades: [
      {
        key: "diario",
        label: "Limpeza Diária — Áreas Internas",
        periodos: diasDoMes(),
        areas: [
          { area: "Escritório e anexos" },
          { area: "Vestiário/banheiros (produção)" },
          { area: "Área de produção (piso)" },
          { area: "Área de recepção de grãos (piso)" },
          { area: "Refeitório e copa" },
          { area: "Corredores de circulação" },
          { area: "Ralos e canaletas (desobstrução)" },
          { area: "Lixeiras internas (higienização)" },
        ],
      },
      {
        key: "semanal",
        label: "Limpeza Semanal — Equipamentos e Utensílios",
        periodos: semanas(),
        areas: [
          { area: "Pesagem e Misturas (Equipamentos)" },
          { area: "Pesagem e Mistura (Utensílios)" },
          { area: "Ensaque (Silos e balanças)" },
          { area: "Ensaque (Paletes)" },
          { area: "Área Externa (Pátio)" },
          { area: "Paredes e tetos (área de produção)" },
          { area: "Luminárias e proteções" },
          { area: "Portas e janelas (vedação e limpeza)" },
          { area: "Telas anti-inseto (verificação)" },
        ],
      },
      {
        key: "mensal",
        label: "Limpeza Mensal — Áreas e Estruturas",
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
        key: "quinzenal",
        label: "Limpeza Veículos (Quinzenal)",
        periodos: quinzenas(),
        areas: [
          { area: "Caminhão Entrega" },
          { area: "Empilhadeira" },
          { area: "Caçambas e contêineres" },
        ],
      },
      {
        key: "validacao",
        label: "Validação de Limpeza (IN 15/2009)",
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
  },
  {
    codigo: "POP-03",
    nome: "Higiene e Saúde do Pessoal",
    descricao: "Controle de higiene pessoal, uso de EPIs e saúde dos colaboradores (IN 04/2007 e IN 15/2009).",
    periodicidades: [
      {
        key: "diario",
        label: "Verificação Diária — Higiene Pessoal",
        periodos: diasDoMes(),
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
        ],
      },
      {
        key: "semanal",
        label: "Verificação Semanal — Instalações Sanitárias",
        periodos: semanas(),
        areas: [
          { area: "Vestiários limpos e organizados" },
          { area: "Sanitários abastecidos (sabonete, papel)" },
          { area: "Lavatórios funcionando (torneira, sabonete líquido)" },
          { area: "Lixeiras com tampa e pedal" },
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
          { area: "Programa de saúde ocupacional (PCMSO)" },
        ],
      },
    ],
  },
  {
    codigo: "POP-04",
    nome: "Potabilidade da Água",
    descricao: "Controle da potabilidade da água, laudos laboratoriais e higienização de reservatórios — POP 04 IN 04/2007.",
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
          { area: "Higienização do reservatório (semestral — registrar mês)" },
          { area: "Certificado da empresa de limpeza de reservatório" },
        ],
      },
    ],
  },
  {
    codigo: "POP-05",
    nome: "Prevenção de Contaminação Cruzada",
    descricao: "Medidas para evitar a contaminação cruzada entre produtos e matérias-primas.",
    periodicidades: [
      {
        key: "diario",
        label: "Verificação Diária",
        periodos: diasDoMes(),
        areas: [
          { area: "Sequência de produção" },
          { area: "Limpeza entre lotes" },
          { area: "Separação de ingredientes" },
          { area: "Fluxo de pessoal" },
        ],
      },
      {
        key: "semanal",
        label: "Verificação Semanal",
        periodos: semanas(),
        areas: [
          { area: "Armazenamento segregado" },
          { area: "Identificação de produtos" },
          { area: "Ventilação/exaustão" },
        ],
      },
    ],
  },
  {
    codigo: "POP-06",
    nome: "Manutenção e Calibração",
    descricao: "Controle de manutenção preventiva e calibração de equipamentos e instrumentos.",
    periodicidades: [
      {
        key: "mensal",
        label: "Manutenção Mensal",
        periodos: meses(),
        areas: [
          { area: "Misturadores" },
          { area: "Moegas/silos" },
          { area: "Transportadores" },
          { area: "Ensacadeira" },
          { area: "Costuradeira" },
        ],
      },
      {
        key: "mensal_calib",
        label: "Calibração",
        periodos: meses(),
        areas: [
          { area: "Balança rodoviária" },
          { area: "Balança de pesagem" },
          { area: "Balança de ensaque" },
          { area: "Termômetros" },
          { area: "Medidores de umidade" },
        ],
      },
    ],
  },
  {
    codigo: "POP-07",
    nome: "Controle Integrado de Pragas",
    descricao: "Monitoramento e controle de pragas nas instalações.",
    periodicidades: [
      {
        key: "semanal",
        label: "Monitoramento Semanal",
        periodos: semanas(),
        areas: [
          { area: "Armadilhas internas" },
          { area: "Armadilhas externas" },
          { area: "Portas/janelas (vedação)" },
          { area: "Telas anti-inseto" },
        ],
      },
      {
        key: "mensal",
        label: "Controle Mensal",
        periodos: meses(),
        areas: [
          { area: "Desinsetização" },
          { area: "Desratização" },
          { area: "Laudo empresa terceirizada" },
        ],
      },
    ],
  },
  {
    codigo: "POP-08",
    nome: "Controle de Resíduos e Efluentes",
    descricao: "Gerenciamento de resíduos sólidos e efluentes gerados na produção.",
    periodicidades: [
      {
        key: "diario",
        label: "Coleta Diária",
        periodos: diasDoMes(),
        areas: [
          { area: "Resíduos orgânicos" },
          { area: "Resíduos recicláveis" },
          { area: "Varredura/pó" },
        ],
      },
      {
        key: "mensal",
        label: "Controle Mensal",
        periodos: meses(),
        areas: [
          { area: "Destinação de resíduos" },
          { area: "Limpeza de caixas de gordura" },
          { area: "Controle de efluentes" },
        ],
      },
    ],
  },
  {
    codigo: "POP-09",
    nome: "Rastreabilidade e Recolhimento",
    descricao: "Registro de rastreabilidade de produtos e programa de recolhimento (recall).",
    periodicidades: [
      {
        key: "diario",
        label: "Registro Diário",
        periodos: diasDoMes(),
        areas: [
          { area: "Lote de produção" },
          { area: "MP utilizada (lotes)" },
          { area: "Destino/cliente" },
          { area: "Nota fiscal" },
        ],
      },
    ],
  },
];
