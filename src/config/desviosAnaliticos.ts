// Desvios analíticos aceitáveis - Compêndio Brasileiro de Alimentação Animal (CBAA 2017)
// Fonte: SINDIRAÇÕES - "DESVIOS ANALÍTICOS" e "INCERTEZA NAS MEDIÇÕES ANALÍTICAS"
// Estes desvios são tolerâncias estatísticas obtidas em estudos interlaboratoriais (MAPA + privados, 1987-2007)
// e devem ser aplicados ANTES de classificar um resultado como NÃO CONFORME do rótulo.

export type FormulaDesvio =
  | { tipo: "fixo"; cv_pct: number }                  // CV constante em %
  | { tipo: "linear"; a: number; b: number };         // CV (%) = a/X + b   (X = resultado obtido)

export interface DesvioAnalitico {
  /** Nome canônico do parâmetro (busca por inclusão case-insensitive). */
  nome: string;
  /** Sinônimos / aliases comuns no rótulo e em laudos. */
  aliases: string[];
  /** Unidade do intervalo de validação. */
  unidade: "g/kg" | "mg/kg" | "%" | "mg NaOH/g" | "UI/kg";
  /** Intervalo (mín-máx) em que a fórmula foi validada. */
  intervalo: [number, number];
  /** Fórmula do desvio analítico (CV em %). */
  formula: FormulaDesvio;
  /** Observação opcional (ex.: "N.S." = regressão não significativa, usa CV médio). */
  obs?: string;
}

/**
 * Tabela oficial CBAA 2017.
 * Quando um parâmetro tem 2 faixas (mg/kg e g/kg), ambas estão listadas - escolhe-se
 * pela unidade do laudo + valor do resultado.
 */
export const DESVIOS_CBAA_2017: DesvioAnalitico[] = [
  { nome: "Ácidos Graxos Totais", aliases: ["acidos graxos totais", "ácidos graxos"], unidade: "g/kg", intervalo: [874, 974], formula: { tipo: "linear", a: 21913, b: -20 } },
  { nome: "Cálcio Total", aliases: ["calcio", "cálcio", "ca"], unidade: "g/kg", intervalo: [0.6, 391], formula: { tipo: "linear", a: 22, b: 8 } },
  { nome: "Cloreto de Sódio (mg/kg)", aliases: ["cloreto de sodio", "cloreto", "nacl"], unidade: "mg/kg", intervalo: [3000, 9800], formula: { tipo: "fixo", cv_pct: 23 }, obs: "N.S." },
  { nome: "Cloreto de Sódio (g/kg)", aliases: ["cloreto de sodio", "cloreto", "nacl"], unidade: "g/kg", intervalo: [11, 794], formula: { tipo: "fixo", cv_pct: 13 }, obs: "N.S." },
  { nome: "Cobalto (mg/kg)", aliases: ["cobalto", "co"], unidade: "mg/kg", intervalo: [15, 8470], formula: { tipo: "linear", a: 467, b: 17 } },
  { nome: "Cobalto (g/kg)", aliases: ["cobalto", "co"], unidade: "g/kg", intervalo: [190, 326], formula: { tipo: "fixo", cv_pct: 5 }, obs: "N.S." },
  { nome: "Cobre (mg/kg)", aliases: ["cobre", "cu"], unidade: "mg/kg", intervalo: [173, 9775], formula: { tipo: "linear", a: 959, b: 9 } },
  { nome: "Cobre (g/kg)", aliases: ["cobre", "cu"], unidade: "g/kg", intervalo: [12, 358], formula: { tipo: "linear", a: 51, b: 2 } },
  { nome: "Digestibilidade Pepsina 0,0002%", aliases: ["digestibilidade pepsina 0,0002", "dig peps 0,0002"], unidade: "%", intervalo: [52, 85], formula: { tipo: "linear", a: 3438, b: -36 } },
  { nome: "Digestibilidade Pepsina 0,002%", aliases: ["digestibilidade pepsina 0,002", "dig peps 0,002"], unidade: "%", intervalo: [37, 95], formula: { tipo: "linear", a: 760, b: 1 } },
  { nome: "Digestibilidade Pepsina 0,02%", aliases: ["digestibilidade pepsina 0,02", "dig peps 0,02"], unidade: "%", intervalo: [35, 96], formula: { tipo: "linear", a: 623, b: 0 } },
  { nome: "Digestibilidade Pepsina 0,2%", aliases: ["digestibilidade pepsina 0,2", "dig peps 0,2"], unidade: "%", intervalo: [49, 93], formula: { tipo: "linear", a: 1273, b: -7 } },
  { nome: "Extrato Etéreo", aliases: ["extrato etereo", "ee", "gordura"], unidade: "g/kg", intervalo: [11, 237], formula: { tipo: "linear", a: 167, b: 4 } },
  { nome: "Extrato Etéreo Hidrólise Ácida", aliases: ["extrato etereo hidrolise", "ee hidrolise", "extr et hidrol ac"], unidade: "g/kg", intervalo: [41, 267], formula: { tipo: "linear", a: 346, b: 6 } },
  { nome: "FDA", aliases: ["fda", "fibra detergente acida", "fibra detergente ácida"], unidade: "g/kg", intervalo: [67, 525], formula: { tipo: "fixo", cv_pct: 9 }, obs: "N.S." },
  { nome: "FDN", aliases: ["fdn", "fibra detergente neutra"], unidade: "g/kg", intervalo: [206, 794], formula: { tipo: "fixo", cv_pct: 9 }, obs: "N.S." },
  { nome: "Ferro (mg/kg)", aliases: ["ferro", "fe"], unidade: "mg/kg", intervalo: [224, 8094], formula: { tipo: "fixo", cv_pct: 14 }, obs: "N.S." },
  { nome: "Ferro (g/kg)", aliases: ["ferro", "fe"], unidade: "g/kg", intervalo: [11, 313], formula: { tipo: "linear", a: 49, b: 7 } },
  { nome: "Fibra Bruta", aliases: ["fibra bruta", "fb"], unidade: "g/kg", intervalo: [18, 415], formula: { tipo: "linear", a: 245, b: 7 } },
  { nome: "Flúor", aliases: ["fluor", "flúor", "f"], unidade: "mg/kg", intervalo: [59, 2100], formula: { tipo: "linear", a: 2522, b: 15 } },
  { nome: "Fósforo", aliases: ["fosforo", "fósforo", "p"], unidade: "g/kg", intervalo: [1.8, 233], formula: { tipo: "linear", a: 22, b: 4 } },
  { nome: "Fósforo Sol. Ácido Cítrico 2%", aliases: ["fosforo sol", "fósforo solúvel"], unidade: "%", intervalo: [66, 96], formula: { tipo: "fixo", cv_pct: 4 }, obs: "N.S." },
  { nome: "Índice de Acidez", aliases: ["indice de acidez", "índice de acidez"], unidade: "mg NaOH/g", intervalo: [0.34, 15], formula: { tipo: "fixo", cv_pct: 31 }, obs: "N.S." },
  { nome: "Lactose", aliases: ["lactose"], unidade: "g/kg", intervalo: [87, 1004], formula: { tipo: "fixo", cv_pct: 6 }, obs: "N.S." },
  { nome: "Magnésio (mg/kg)", aliases: ["magnesio", "magnésio", "mg"], unidade: "mg/kg", intervalo: [1641, 9700], formula: { tipo: "fixo", cv_pct: 34 }, obs: "N.S." },
  { nome: "Magnésio (g/kg)", aliases: ["magnesio", "magnésio", "mg"], unidade: "g/kg", intervalo: [10, 550], formula: { tipo: "linear", a: 200, b: 5 } },
  { nome: "Manganês (mg/kg)", aliases: ["manganes", "manganês", "mn"], unidade: "mg/kg", intervalo: [117, 5535], formula: { tipo: "fixo", cv_pct: 13 }, obs: "N.S." },
  { nome: "Manganês (g/kg)", aliases: ["manganes", "manganês", "mn"], unidade: "g/kg", intervalo: [14, 621], formula: { tipo: "linear", a: 70, b: 5 } },
  { nome: "Matéria Mineral", aliases: ["materia mineral", "matéria mineral", "cinzas", "mm"], unidade: "g/kg", intervalo: [12, 990], formula: { tipo: "linear", a: 96, b: 2 } },
  { nome: "Potássio", aliases: ["potassio", "potássio", "k"], unidade: "mg/kg", intervalo: [580, 7800], formula: { tipo: "fixo", cv_pct: 31 }, obs: "N.S." },
  { nome: "Proteína Bruta", aliases: ["proteina bruta", "proteína bruta", "pb"], unidade: "g/kg", intervalo: [62, 887], formula: { tipo: "linear", a: 209, b: 1 } },
  { nome: "Sódio (mg/kg)", aliases: ["sodio", "sódio", "na"], unidade: "mg/kg", intervalo: [1513, 9687], formula: { tipo: "fixo", cv_pct: 21 }, obs: "N.S." },
  { nome: "Sódio (g/kg)", aliases: ["sodio", "sódio", "na"], unidade: "g/kg", intervalo: [11, 149], formula: { tipo: "fixo", cv_pct: 14 }, obs: "N.S." },
  { nome: "Solubilidade Proteína KOH 0,2%", aliases: ["solubilidade proteina", "solubilidade", "spk"], unidade: "%", intervalo: [77, 92], formula: { tipo: "fixo", cv_pct: 3 }, obs: "N.S." },
  { nome: "Taninos", aliases: ["taninos"], unidade: "g/kg", intervalo: [3, 21], formula: { tipo: "fixo", cv_pct: 22 }, obs: "N.S." },
  { nome: "Umidade", aliases: ["umidade", "umidade e volateis", "umidade e voláteis"], unidade: "g/kg", intervalo: [11, 150], formula: { tipo: "linear", a: 173, b: 4 } },
  { nome: "Zinco (mg/kg)", aliases: ["zinco", "zn"], unidade: "mg/kg", intervalo: [580, 9809], formula: { tipo: "fixo", cv_pct: 8 }, obs: "N.S." },
  { nome: "Zinco (g/kg)", aliases: ["zinco", "zn"], unidade: "g/kg", intervalo: [13, 794], formula: { tipo: "linear", a: 97, b: 5 } },
  // Vitaminas A e E - Diretiva CE 45/2000 (CBAA 2017): repetibilidade ≤ 15% do maior valor
  { nome: "Vitamina A", aliases: ["vitamina a", "retinol"], unidade: "UI/kg", intervalo: [2000, 1e9], formula: { tipo: "fixo", cv_pct: 15 }, obs: "Repetibilidade CE 45/2000" },
  { nome: "Vitamina E", aliases: ["vitamina e", "tocoferol", "alfa-tocoferol"], unidade: "UI/kg", intervalo: [0, 1e9], formula: { tipo: "fixo", cv_pct: 15 }, obs: "Repetibilidade CE 45/2000" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Localiza o desvio mais apropriado para um parâmetro + unidade + valor. */
export function buscarDesvio(
  parametro: string,
  unidade: string | undefined,
  valor: number | undefined,
): DesvioAnalitico | null {
  if (!parametro) return null;
  const p = normalize(parametro);
  const u = normalize(unidade || "");

  const candidatos = DESVIOS_CBAA_2017.filter((d) => {
    const nomeMatch = normalize(d.nome).includes(p) || p.includes(normalize(d.nome));
    const aliasMatch = d.aliases.some((a) => {
      const an = normalize(a);
      return an.includes(p) || p.includes(an);
    });
    return nomeMatch || aliasMatch;
  });

  if (candidatos.length === 0) return null;
  if (candidatos.length === 1) return candidatos[0];

  // Filtra por unidade
  const porUnidade = candidatos.filter((d) => normalize(d.unidade) === u);
  const lista = porUnidade.length > 0 ? porUnidade : candidatos;

  // Se temos valor, escolhe o que se encaixa no intervalo
  if (typeof valor === "number" && !isNaN(valor)) {
    const noIntervalo = lista.find((d) => valor >= d.intervalo[0] && valor <= d.intervalo[1]);
    if (noIntervalo) return noIntervalo;
  }
  return lista[0];
}

/** Calcula o CV (%) do desvio analítico aplicado ao valor X. */
export function calcularCV(desvio: DesvioAnalitico, valor: number): number {
  if (desvio.formula.tipo === "fixo") return desvio.formula.cv_pct;
  if (valor <= 0) return desvio.formula.b;
  return desvio.formula.a / valor + desvio.formula.b;
}

export interface ToleranciaCalculada {
  desvio: DesvioAnalitico;
  cv_pct: number;
  tolerancia_absoluta: number; // mesma unidade do resultado
  faixa_min: number;
  faixa_max: number;
  fora_intervalo_validacao: boolean;
}

/** Calcula a tolerância absoluta (+/-) na unidade do resultado. */
export function calcularTolerancia(
  parametro: string,
  unidade: string | undefined,
  resultado: number,
): ToleranciaCalculada | null {
  const desvio = buscarDesvio(parametro, unidade, resultado);
  if (!desvio) return null;
  const cv = calcularCV(desvio, resultado);
  const tol = (cv / 100) * resultado;
  return {
    desvio,
    cv_pct: cv,
    tolerancia_absoluta: tol,
    faixa_min: resultado - tol,
    faixa_max: resultado + tol,
    fora_intervalo_validacao: resultado < desvio.intervalo[0] || resultado > desvio.intervalo[1],
  };
}
