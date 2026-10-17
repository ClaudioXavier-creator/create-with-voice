export const AREAS = [
  "Recepção de MP",
  "Mistura",
  "Ensaque",
  "Expedição",
  "Almoxarifado",
  "Laboratório",
  "Banheiros",
  "Refeitório",
  "Área Externa",
  "Silo 01",
  "Silo 02",
  "Silo 03",
  "Silo 04",
  "Silo 05",
  "Misturador",
  "Moinho",
  "Peletizadora",
  "Extrusora",
  "Transportador / Elevador",
];

export const FREQUENCIAS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

export const CHECKLIST_PRE_OP = [
  { area: "Pisos e Ralos", itens: ["Piso limpo e seco", "Ralos desobstruídos", "Ausência de acúmulo de resíduos"] },
  { area: "Paredes e Tetos", itens: ["Sem manchas ou mofos", "Pinturas íntegras", "Sem teias de aranha"] },
  {
    area: "Equipamentos de Produção",
    itens: [
      "Misturador limpo internamente",
      "Moinho sem resíduo de MP anterior",
      "Elevadores/transportadores limpos",
      "Peletizadora/Extrusora sem obstrução",
    ],
  },
  {
    area: "Silos",
    itens: ["Silo limpo conforme cronograma", "Sem formação de crostas internas", "Bocal de carga/descarga limpo"],
  },
  {
    area: "Balanças e Dosadores",
    itens: [
      "Superfície de pesagem limpa",
      "Sem resíduo de produto anterior",
      "Balança com calibração vigente (ver POP 06)",
    ],
  },
  {
    area: "Utensílios e EPI",
    itens: ["Pás e vassouras limpas", "EPIs disponíveis e limpos", "Coletores de amostra higienizados"],
  },
  {
    area: "Instalações de Apoio",
    itens: ["Banheiros limpos e abastecidos", "Lavatórios com sabonete e papel", "Lixeiras com tampa e identificadas"],
  },
];

export const CHECKLIST_LIBERACAO_LINHA = [
  {
    area: "Misturador",
    itens: [
      "Interior do misturador limpo (sem resíduo do produto anterior)",
      "Porta de descarga sem acúmulo de material",
      "Roscas transportadoras limpas",
      "Inspeção visual satisfatória — ausência de crostas",
      "Registro de flushing/vassoura realizado (se aplicável)",
    ],
  },
  {
    area: "Silos e Moegas",
    itens: [
      "Silos de dosagem vazios ou limpos",
      "Moegas sem resíduo de lote anterior",
      "Bocais de carga/descarga sem obstrução",
      "Ausência de contaminação cruzada visível",
    ],
  },
  {
    area: "Dosadores e Balanças",
    itens: [
      "Dosadores limpos (micro-ingredientes)",
      "Balanças de pesagem zeradas e limpas",
      "Sem resíduo de pré-misturas medicamentosas",
      "Recipientes de pesagem higienizados",
    ],
  },
  {
    area: "Ensaque e Expedição",
    itens: [
      "Boca de ensaque limpa",
      "Costuradeira/seladora sem resíduo",
      "Paletes limpos e identificados",
      "Área de expedição sem produto do lote anterior",
    ],
  },
  {
    area: "Documentação",
    itens: [
      "Ordem de produção anterior encerrada",
      "Rótulos do lote anterior recolhidos",
      "Nova ordem de produção disponível",
      "Identificação do novo produto/lote afixada",
    ],
  },
  {
    area: "Medicamentos / Carry-over",
    itens: [
      "Produto anterior continha medicamento? (verificar)",
      "Flushing realizado conforme IN 15/2009",
      "Destino do material de flushing registrado",
      "Carry-over dentro do limite aceitável (< 1% ionóforos / < 3% medicados)",
    ],
  },
];

export const CHECKLIST_SILOS_TRANSPORT = [
  {
    area: "Silos de Matéria-Prima",
    itens: [
      "Silo vazio antes da troca de ingrediente",
      "Limpeza interna realizada (raspagem/aspiração)",
      "Ausência de crostas ou material aderido nas paredes",
      "Bocal de carga e descarga limpos",
      "Registro de limpeza do silo atualizado",
      "Vedação da tampa e escotilha íntegras",
    ],
  },
  {
    area: "Silos de Produto Acabado",
    itens: [
      "Silo completamente vazio antes do novo lote",
      "Inspeção visual — sem resíduo de lote anterior",
      "Limpeza registrada conforme cronograma",
      "Ausência de contaminação por medicamentos/aditivos",
    ],
  },
  {
    area: "Transportadores e Elevadores",
    itens: [
      "Rosca transportadora limpa e inspecionada",
      "Elevador de canecas sem acúmulo de material",
      "Calhas e tubulações sem obstrução",
      "Redler/corrente transportadora limpo",
      "Pontos de conexão entre equipamentos verificados",
      "Registro de flushing do transportador (se aplicável)",
    ],
  },
  {
    area: "Prevenção de Arraste — IN 15/2009",
    itens: [
      "Verificação de resíduo de medicamento no silo/transportador",
      "Flushing com inerte realizado após produto medicado",
      "Volume de flushing ≥ 50% da capacidade do equipamento",
      "Destino do material de flushing registrado (resíduo/reprocesso)",
      "Tempo de espera respeitado antes do próximo produto (se aplicável)",
      "Carry-over dentro do limite aceitável (< 1% ionóforos, < 3% medicados)",
    ],
  },
  {
    area: "Documentação e Rastreabilidade",
    itens: [
      "Cronograma de limpeza de silos atualizado",
      "Frequência de limpeza conforme classificação do ingrediente",
      "Registro de sequência silo → produto mantido para rastreabilidade",
      "Laudos de análise de arraste arquivados (quando aplicável)",
    ],
  },
];

export const CHECKLIST_SUPERFICIES = [
  {
    area: "Superfícies de Contato Direto",
    itens: [
      "Misturador — parede interna",
      "Rosca transportadora — hélice e calha",
      "Dosadores — funil e comportas",
      "Peneiras e classificadores",
      "Boca de ensaque — funil e cone",
    ],
  },
  {
    area: "Superfícies de Contato Indireto",
    itens: [
      "Piso da área de produção",
      "Paredes da área de produção (até 2m)",
      "Estruturas metálicas / passarelas",
      "Portas e cortinas de PVC",
      "Painéis elétricos (parte externa)",
    ],
  },
  {
    area: "Utensílios e Ferramentas",
    itens: [
      "Pás e conchas de dosagem",
      "Bombonas e baldes de pesagem",
      "Vassouras e rodos (área de produção)",
      "Coletores de amostra",
      "Facas de corte de embalagens",
    ],
  },
  {
    area: "Método de Verificação",
    itens: [
      "Inspeção visual realizada",
      "Swab de superfície coletado (se programado)",
      "Teste de água de enxágue (se aplicável)",
      "Bioluminescência ATP (se disponível)",
      "Resultado registrado e conforme",
    ],
  },
];

export const TIPOS_VALIDACAO = [
  { value: "visual", label: "Inspeção Visual" },
  { value: "swab", label: "Swab / Teste de Superfície" },
  { value: "laboratorial", label: "Análise Laboratorial" },
  { value: "rinse", label: "Água de Enxágue" },
  { value: "homogeneidade", label: "Teste de Homogeneidade (CV%)" },
  { value: "carryover", label: "Teste de Carry-Over / Arraste" },
  { value: "tempo_mistura", label: "Validação Tempo de Mistura" },
  { value: "flushing", label: "Flushing / Limpeza de Linha" },
];
