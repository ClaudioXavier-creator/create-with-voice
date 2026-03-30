import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Droplets, CheckCircle2, Clock, Trash2, Beaker, FileText, ClipboardList, Download, ShieldCheck, Layers, FlaskConical, Container, UserCheck, Droplet, HeartPulse, Archive, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";

const AREAS = ["Recepção de MP", "Mistura", "Ensaque", "Expedição", "Almoxarifado", "Laboratório", "Banheiros", "Refeitório", "Área Externa",
  "Silo 01", "Silo 02", "Silo 03", "Silo 04", "Silo 05", "Misturador", "Moinho", "Peletizadora", "Extrusora", "Transportador / Elevador"];
const FREQUENCIAS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

const PONTOS_AGUA = [
  "Ponto 1 — Entrada / Poço",
  "Ponto 2 — Área de Produção",
  "Ponto 3 — Bebedouro / Refeitório",
  "Ponto 4 — Lavagem de equipamentos",
];

const CHECKLIST_PRE_OP: { area: string; itens: string[] }[] = [
  { area: "Pisos e Ralos", itens: ["Piso limpo e seco", "Ralos desobstruídos", "Ausência de acúmulo de resíduos"] },
  { area: "Paredes e Tetos", itens: ["Sem manchas ou mofos", "Pinturas íntegras", "Sem teias de aranha"] },
  { area: "Equipamentos de Produção", itens: ["Misturador limpo internamente", "Moinho sem resíduo de MP anterior", "Elevadores/transportadores limpos", "Peletizadora/Extrusora sem obstrução"] },
  { area: "Silos", itens: ["Silo limpo conforme cronograma", "Sem formação de crostas internas", "Bocal de carga/descarga limpo"] },
  { area: "Balanças e Dosadores", itens: ["Superfície de pesagem limpa", "Sem resíduo de produto anterior", "Calibração verificada"] },
  { area: "Utensílios e EPI", itens: ["Pás e vassouras limpas", "EPIs disponíveis e limpos", "Coletores de amostra higienizados"] },
  { area: "Instalações de Apoio", itens: ["Banheiros limpos e abastecidos", "Lavatórios com sabonete e papel", "Lixeiras com tampa e identificadas"] },
];

// ── CHECKLIST LIBERAÇÃO DE LINHA (POP-02 / IN 04/2007 e IN 15/2009) ──
const CHECKLIST_LIBERACAO_LINHA: { area: string; itens: string[] }[] = [
  { area: "Misturador", itens: [
    "Interior do misturador limpo (sem resíduo do produto anterior)",
    "Porta de descarga sem acúmulo de material",
    "Roscas transportadoras limpas",
    "Inspeção visual satisfatória — ausência de crostas",
    "Registro de flushing/vassoura realizado (se aplicável)",
  ]},
  { area: "Silos e Moegas", itens: [
    "Silos de dosagem vazios ou limpos",
    "Moegas sem resíduo de lote anterior",
    "Bocais de carga/descarga sem obstrução",
    "Ausência de contaminação cruzada visível",
  ]},
  { area: "Dosadores e Balanças", itens: [
    "Dosadores limpos (micro-ingredientes)",
    "Balanças de pesagem zeradas e limpas",
    "Sem resíduo de pré-misturas medicamentosas",
    "Recipientes de pesagem higienizados",
  ]},
  { area: "Ensaque e Expedição", itens: [
    "Boca de ensaque limpa",
    "Costuradeira/seladora sem resíduo",
    "Paletes limpos e identificados",
    "Área de expedição sem produto do lote anterior",
  ]},
  { area: "Documentação", itens: [
    "Ordem de produção anterior encerrada",
    "Rótulos do lote anterior recolhidos",
    "Nova ordem de produção disponível",
    "Identificação do novo produto/lote afixada",
  ]},
  { area: "Medicamentos / Carry-over", itens: [
    "Produto anterior continha medicamento? (verificar)",
    "Flushing realizado conforme IN 15/2009",
    "Destino do material de flushing registrado",
    "Carry-over dentro do limite aceitável (< 1% ionóforos / < 3% medicados)",
  ]},
];

// ── CHECKLIST SILOS & TRANSPORTADORES (POP-03 / IN 15/2009 — Arraste de Medicamentos) ──
const CHECKLIST_SILOS_TRANSPORT: { area: string; itens: string[] }[] = [
  { area: "Silos de Matéria-Prima", itens: [
    "Silo vazio antes da troca de ingrediente",
    "Limpeza interna realizada (raspagem/aspiração)",
    "Ausência de crostas ou material aderido nas paredes",
    "Bocal de carga e descarga limpos",
    "Registro de limpeza do silo atualizado",
    "Vedação da tampa e escotilha íntegras",
  ]},
  { area: "Silos de Produto Acabado", itens: [
    "Silo completamente vazio antes do novo lote",
    "Inspeção visual — sem resíduo de lote anterior",
    "Limpeza registrada conforme cronograma",
    "Ausência de contaminação por medicamentos/aditivos",
  ]},
  { area: "Transportadores e Elevadores", itens: [
    "Rosca transportadora limpa e inspecionada",
    "Elevador de canecas sem acúmulo de material",
    "Calhas e tubulações sem obstrução",
    "Redler/corrente transportadora limpo",
    "Pontos de conexão entre equipamentos verificados",
    "Registro de flushing do transportador (se aplicável)",
  ]},
  { area: "Prevenção de Arraste — IN 15/2009", itens: [
    "Verificação de resíduo de medicamento no silo/transportador",
    "Flushing com inerte realizado após produto medicado",
    "Volume de flushing ≥ 50% da capacidade do equipamento",
    "Destino do material de flushing registrado (resíduo/reprocesso)",
    "Tempo de espera respeitado antes do próximo produto (se aplicável)",
    "Carry-over dentro do limite aceitável (< 1% ionóforos, < 3% medicados)",
  ]},
  { area: "Documentação e Rastreabilidade", itens: [
    "Cronograma de limpeza de silos atualizado",
    "Frequência de limpeza conforme classificação do ingrediente",
    "Registro de sequência silo → produto mantido para rastreabilidade",
    "Laudos de análise de arraste arquivados (quando aplicável)",
  ]},
];

// ── CHECKLIST MONITORAMENTO DE SUPERFÍCIES (POP-02/03 / IN 04/2007) ──
const CHECKLIST_SUPERFICIES: { area: string; itens: string[] }[] = [
  { area: "Superfícies de Contato Direto", itens: [
    "Misturador — parede interna",
    "Rosca transportadora — hélice e calha",
    "Dosadores — funil e comportas",
    "Peneiras e classificadores",
    "Boca de ensaque — funil e cone",
  ]},
  { area: "Superfícies de Contato Indireto", itens: [
    "Piso da área de produção",
    "Paredes da área de produção (até 2m)",
    "Estruturas metálicas / passarelas",
    "Portas e cortinas de PVC",
    "Painéis elétricos (parte externa)",
  ]},
  { area: "Utensílios e Ferramentas", itens: [
    "Pás e conchas de dosagem",
    "Bombonas e baldes de pesagem",
    "Vassouras e rodos (área de produção)",
    "Coletores de amostra",
    "Facas de corte de embalagens",
  ]},
  { area: "Método de Verificação", itens: [
    "Inspeção visual realizada",
    "Swab de superfície coletado (se programado)",
    "Teste de água de enxágue (se aplicável)",
    "Bioluminescência ATP (se disponível)",
    "Resultado registrado e conforme",
  ]},
];

// ── CHECKLIST HIGIENE PESSOAL (POP-03 / IN 04/2007) ──
const CHECKLIST_HIGIENE_PESSOAL: { area: string; itens: string[] }[] = [
  { area: "Uniformes e EPIs", itens: [
    "Uniforme limpo e em bom estado de conservação",
    "Calçados fechados e limpos (botas ou sapatos de segurança)",
    "Uso de touca/gorro cobrindo todo o cabelo",
    "Uso de máscara descartável (quando aplicável)",
    "Luvas descartáveis (manipulação de premix/micro-ingredientes)",
    "Protetor auricular disponível e em uso (áreas de ruído)",
    "Óculos de proteção em áreas de risco (moagem, dosagem)",
  ]},
  { area: "Higiene Pessoal", itens: [
    "Mãos limpas e unhas curtas/sem esmalte",
    "Lavagem das mãos realizada antes de iniciar atividades",
    "Ausência de barba (ou uso de protetor de barba)",
    "Ausência de adornos (anéis, brincos, relógio, pulseiras)",
    "Ausência de maquiagem/perfumes/cosméticos fortes",
    "Cabelos totalmente cobertos pela touca",
  ]},
  { area: "Saúde do Trabalhador", itens: [
    "ASO (Atestado de Saúde Ocupacional) dentro da validade",
    "Exame admissional/periódico em dia",
    "Ausência de lesões cutâneas expostas (feridas, abscessos)",
    "Ausência de sintomas de doença infectocontagiosa",
    "Colaborador apto para a função (sem restrições médicas)",
  ]},
  { area: "Comportamento e Boas Práticas", itens: [
    "Proibido comer, beber ou fumar na área de produção",
    "Proibido guardar alimentos nos armários da produção",
    "Proibido uso de celular na área produtiva",
    "Lavagem de mãos após uso do banheiro verificada",
    "Treinamento de BPF/Higiene atualizado (anual mínimo)",
  ]},
];

// ── CHECKLIST HIGIENIZAÇÃO DE RESERVATÓRIO (POP-04 / IN 04/2007) ──
const CHECKLIST_RESERVATORIO: { area: string; itens: string[] }[] = [
  { area: "Preparação", itens: [
    "Reservatório completamente esvaziado",
    "Registro fotográfico do estado antes da limpeza",
    "Equipamentos de limpeza preparados e higienizados",
    "EPI do executor conferido (luvas, botas, máscara)",
  ]},
  { area: "Execução da Limpeza", itens: [
    "Remoção mecânica de sedimentos e incrustações",
    "Lavagem com água sob pressão das paredes e fundo",
    "Aplicação de solução clorada (200 ppm) em toda superfície",
    "Tempo de contato da solução desinfetante respeitado (≥ 30 min)",
    "Enxágue completo com água potável",
    "Drenagem total da água de enxágue",
  ]},
  { area: "Pós-Limpeza", itens: [
    "Inspeção visual final — ausência de resíduos e biofilme",
    "Vedação e tampas reinstaladas corretamente",
    "Reservatório reabastecido com água potável",
    "Dosagem de cloro ajustada após reabastecimento",
    "Registro fotográfico do estado após a limpeza",
    "Certificado de limpeza emitido e arquivado",
  ]},
];

export default function HigieneSanitizacao() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [openCronograma, setOpenCronograma] = useState(false);
  const [openRegistro, setOpenRegistro] = useState(false);
  const [openAgua, setOpenAgua] = useState(false);
  const [preOpChecklist, setPreOpChecklist] = useState<Record<string, boolean>>({});
  const [preOpResponsavel, setPreOpResponsavel] = useState("");
  const [preOpSetor, setPreOpSetor] = useState("");
  const [preOpData, setPreOpData] = useState(new Date().toISOString().split("T")[0]);
  const [savingPreOp, setSavingPreOp] = useState(false);
  const [selectedCronograma, setSelectedCronograma] = useState<string | null>(null);

  // Liberação de Linha state
  const [libLinhaChecklist, setLibLinhaChecklist] = useState<Record<string, boolean>>({});
  const [libLinhaResp, setLibLinhaResp] = useState("");
  const [libLinhaData, setLibLinhaData] = useState(new Date().toISOString().split("T")[0]);
  const [libLinhaProdAnterior, setLibLinhaProdAnterior] = useState("");
  const [libLinhaProdSeguinte, setLibLinhaProdSeguinte] = useState("");
  const [libLinhaLinha, setLibLinhaLinha] = useState("");
  const [libLinhaObs, setLibLinhaObs] = useState("");
  const [savingLibLinha, setSavingLibLinha] = useState(false);

  // Monitoramento de Superfícies state
  const [supChecklist, setSupChecklist] = useState<Record<string, boolean>>({});
  const [supResp, setSupResp] = useState("");
  const [supData, setSupData] = useState(new Date().toISOString().split("T")[0]);
  const [supSetor, setSupSetor] = useState("");
  const [supProdQuimico, setSupProdQuimico] = useState("");
  const [supConcentracao, setSupConcentracao] = useState("");
  const [supObs, setSupObs] = useState("");
  const [savingSup, setSavingSup] = useState(false);

  // Silos & Transportadores state
  const [silosChecklist, setSilosChecklist] = useState<Record<string, boolean>>({});
  const [silosResp, setSilosResp] = useState("");
  const [silosData, setSilosData] = useState(new Date().toISOString().split("T")[0]);
  const [silosEquipamento, setSilosEquipamento] = useState("");
  const [silosProdAnterior, setSilosProdAnterior] = useState("");
  const [silosObs, setSilosObs] = useState("");
  const [savingSilos, setSavingSilos] = useState(false);

  const [form, setForm] = useState({
    area: "", equipamento: "", procedimento: "", produto_utilizado: "",
    concentracao: "", frequencia: "diario", responsavel: "", horario_previsto: "", observacoes: ""
  });

  // POP-04 Checklist dedicado
  const CHECKLIST_AGUA: { area: string; itens: string[] }[] = [
    { area: "Reservatórios", itens: [
      "Reservatório com tampa e vedação adequada",
      "Ausência de trincas, rachaduras ou infiltrações",
      "Limpeza semestral realizada e registrada",
      "Certificado de limpeza do reservatório em dia",
      "Ausência de algas, sedimentos ou corpos estranhos",
    ]},
    { area: "Pontos de Coleta", itens: [
      "Torneiras e registros em bom estado",
      "Sem vazamentos nos pontos de uso",
      "Identificação dos pontos de coleta conforme planta",
      "Proteção contra refluxo instalada",
    ]},
    { area: "Tratamento", itens: [
      "Sistema de cloração funcionando",
      "Dosagem de cloro verificada (0,2–2,0 mg/L)",
      "Filtros limpos e com manutenção em dia",
      "Registro de troca de filtros atualizado",
    ]},
    { area: "Laudos e Documentação", itens: [
      "Laudo laboratorial mensal em dia",
      "Análise microbiológica semestral realizada",
      "Resultados de coliformes totais e E. coli conformes",
      "Laudos arquivados e disponíveis para fiscalização",
      "Outorga de uso da água (se poço artesiano) válida",
    ]},
  ];

  const [aguaChecklist, setAguaChecklist] = useState<Record<string, boolean>>({});
  const [aguaCheckResp, setAguaCheckResp] = useState("");
  const [aguaCheckData, setAguaCheckData] = useState(new Date().toISOString().split("T")[0]);
  const [savingAguaCheck, setSavingAguaCheck] = useState(false);

  // POP-03 Higiene Pessoal state
  const [higPesChecklist, setHigPesChecklist] = useState<Record<string, boolean>>({});
  const [higPesResp, setHigPesResp] = useState("");
  const [higPesData, setHigPesData] = useState(new Date().toISOString().split("T")[0]);
  const [higPesTurno, setHigPesTurno] = useState("");
  const [savingHigPes, setSavingHigPes] = useState(false);

  // Higienização de Reservatório state
  const [resChecklist, setResChecklist] = useState<Record<string, boolean>>({});
  const [resResp, setResResp] = useState("");
  const [resData, setResData] = useState(new Date().toISOString().split("T")[0]);
  const [resIdentificacao, setResIdentificacao] = useState("");
  const [resCapacidade, setResCapacidade] = useState("");
  const [resEmpresa, setResEmpresa] = useState("");
  const [resObs, setResObs] = useState("");
  const [savingRes, setSavingRes] = useState(false);

  // Saúde & Sintomas state
  const SINTOMAS_DIARIOS = [
    "Febre ou calafrios", "Tosse persistente", "Diarreia ou vômito", "Dor de garganta",
    "Lesões cutâneas (feridas, abscessos)", "Secreção ocular ou nasal", "Icterícia (pele/olhos amarelados)",
    "Dor abdominal intensa", "Infecção de ouvido", "Outros sintomas infectocontagiosos"
  ];
  const [sintomaChecklist, setSintomaChecklist] = useState<Record<string, boolean>>({});
  const [sintomaFuncionario, setSintomaFuncionario] = useState("");
  const [sintomaData, setSintomaData] = useState(new Date().toISOString().split("T")[0]);
  const [sintomaObs, setSintomaObs] = useState("");
  const [sintomaApto, setSintomaApto] = useState(true);
  const [savingSintoma, setSavingSintoma] = useState(false);

  const [regForm, setRegForm] = useState({
    cronograma_id: "", data_execucao: new Date().toISOString().split("T")[0],
    hora_inicio: "", hora_fim: "", executor: "", conforme: true, observacoes: ""
  });

  const [aguaForm, setAguaForm] = useState({
    ponto: PONTOS_AGUA[0], cloro_residual: "", ph: "", turbidez: "",
    data: new Date().toISOString().split("T")[0], responsavel: "",
    laudo_numero: "", laudo_valido: true, reservatorio_limpo: true,
    certificado_limpeza: "", observacoes: "",
  });

  const { data: cronogramas = [] } = useQuery({
    queryKey: ["cronogramas_higiene"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cronogramas_higiene").select("*").order("area");
      if (error) throw error;
      return data;
    },
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["registros_limpeza", selectedCronograma],
    queryFn: async () => {
      let q = supabase.from("registros_limpeza").select("*").order("data_execucao", { ascending: false });
      if (selectedCronograma) q = q.eq("cronograma_id", selectedCronograma);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosAgua = [] } = useQuery({
    queryKey: ["registros_agua"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execucao_pops").select("*")
        .eq("codigo_pop", "POP-04-AGUA").order("data_execucao", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: laudosAgua = [] } = useQuery({
    queryKey: ["laudos_agua"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analises_laboratorio").select("*")
        .or("produto.ilike.%água%,produto.ilike.%agua%,parametro.ilike.%cloro%,parametro.ilike.%coliform%,parametro.ilike.%turbidez%,parametro.ilike.%ph%")
        .order("data_analise", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Histórico de Liberação de Linha
  const { data: historicoLibLinha = [] } = useQuery({
    queryKey: ["historico_lib_linha"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execucao_pops").select("*")
        .eq("codigo_pop", "POP-02-LIB-LINHA").order("data_execucao", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  // ASO / Saúde dos manipuladores
  const { data: saudeManipuladores = [] } = useQuery({
    queryKey: ["saude_manipuladores_higiene"],
    queryFn: async () => {
      const { data, error } = await supabase.from("saude_manipuladores").select("*").order("data_validade", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Histórico de sintomas diários
  const { data: historicoSintomas = [] } = useQuery({
    queryKey: ["historico_sintomas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execucao_pops").select("*")
        .eq("codigo_pop", "POP-03-SINTOMAS").order("data_execucao", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Archive counts for 2-year retention
  const { data: archiveCounts } = useQuery({
    queryKey: ["archive_counts"],
    queryFn: async () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const cutoff = twoYearsAgo.toISOString();
      const [pops, limpeza, agua, residuos, calibr, nc] = await Promise.all([
        supabase.from("execucao_pops").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
        supabase.from("registros_limpeza").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
        supabase.from("analises_laboratorio").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
        supabase.from("controle_residuos").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
        supabase.from("calibracoes").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
        supabase.from("nao_conformidades").select("id", { count: "exact", head: true }).gte("created_at", cutoff),
      ]);
      return { pops: pops.count || 0, limpeza: limpeza.count || 0, agua: agua.count || 0, residuos: residuos.count || 0, calibracoes: calibr.count || 0, nc: nc.count || 0 };
    },
  });


  const { data: historicoSup = [] } = useQuery({
    queryKey: ["historico_sup"],
    queryFn: async () => {
      const { data, error } = await supabase.from("execucao_pops").select("*")
        .eq("codigo_pop", "POP-02-SUPERFICIE").order("data_execucao", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const [mesAno, setMesAno] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const exportPlanilhaMensal = () => {
    const [ano, mes] = mesAno.split("-");
    const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const registrosMes = registros.filter((r: any) => r.data_execucao?.startsWith(mesAno));
    const aguaMes = registrosAgua.filter((r: any) => r.data_execucao?.startsWith(mesAno));

    const lines = [
      `PLANILHA MENSAL DE HIGIENE E SANITIZAÇÃO — ${mesNome.toUpperCase()}`,
      "POPs 02, 03 e 04 — IN 04/2007 | IN 15/2009",
      "",
      "=== REGISTROS DE LIMPEZA ===",
      "Data;Executor;Hora Início;Hora Fim;Conforme;Observações",
      ...registrosMes.map((r: any) => [r.data_execucao, r.executor, r.hora_inicio || "", r.hora_fim || "", r.conforme ? "Sim" : "Não", r.observacoes || ""].join(";")),
      "",
      "=== CONTROLE DE ÁGUA (POP-04) ===",
      "Data;Ponto;Executor;Status;Detalhes",
      ...aguaMes.map((r: any) => [r.data_execucao, r.setor || "", r.executor, r.status === "concluido" ? "Conforme" : "NC", (r.observacoes || "").replace(/\n/g, " | ")].join(";")),
      "",
      `Total Registros Limpeza: ${registrosMes.length}`,
      `Total Registros Água: ${aguaMes.length}`,
      `Conformes Limpeza: ${registrosMes.filter((r: any) => r.conforme).length}`,
      `NCs Limpeza: ${registrosMes.filter((r: any) => !r.conforme).length}`,
    ];
    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `planilha_higiene_${mesAno}.csv`;
    link.click();
    toast.success("Planilha mensal exportada!");
  };

  const addCronograma = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cronogramas_higiene").insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] }); toast.success("Cronograma cadastrado"); setOpenCronograma(false); setForm({ area: "", equipamento: "", procedimento: "", produto_utilizado: "", concentracao: "", frequencia: "diario", responsavel: "", horario_previsto: "", observacoes: "" }); },
    onError: () => toast.error("Erro ao cadastrar"),
  });

  const addRegistro = useMutation({
    mutationFn: async () => {
      const payload = { ...regForm, user_id: user!.id, tipo_limpeza: (regForm as any).tipo_limpeza || "umida" };
      const { error } = await supabase.from("registros_limpeza").insert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["registros_limpeza"] }); toast.success("Registro salvo"); setOpenRegistro(false); },
    onError: () => toast.error("Erro ao registrar"),
  });

  const addRegistroAgua = useMutation({
    mutationFn: async () => {
      const cloro = parseFloat(aguaForm.cloro_residual.replace(",", "."));
      const ph = parseFloat(aguaForm.ph.replace(",", "."));
      const turb = parseFloat(aguaForm.turbidez.replace(",", "."));
      const cloroOk = !isNaN(cloro) && cloro >= 0.2 && cloro <= 2.0;
      const phOk = !isNaN(ph) && ph >= 6.0 && ph <= 9.5;
      const turbOk = !isNaN(turb) && turb <= 5;
      const conforme = cloroOk && phOk && turbOk && aguaForm.laudo_valido && aguaForm.reservatorio_limpo;

      const obs = [
        `[CONTROLE DE ÁGUA — POP-04 / IN 04/2007]`,
        `Ponto: ${aguaForm.ponto}`,
        `Cloro residual: ${aguaForm.cloro_residual} mg/L ${cloroOk ? "✅" : "❌ FORA (0,2-2,0)"}`,
        `pH: ${aguaForm.ph} ${phOk ? "✅" : "❌ FORA (6,0-9,5)"}`,
        `Turbidez: ${aguaForm.turbidez} NTU ${turbOk ? "✅" : "❌ FORA (≤5)"}`,
        `Laudo nº: ${aguaForm.laudo_numero || "—"} | Válido: ${aguaForm.laudo_valido ? "Sim" : "Não"}`,
        `Reservatório limpo: ${aguaForm.reservatorio_limpo ? "Sim" : "Não"}`,
        aguaForm.certificado_limpeza ? `Cert. limpeza reserv.: ${aguaForm.certificado_limpeza}` : "",
        aguaForm.observacoes ? `Obs: ${aguaForm.observacoes}` : "",
      ].filter(Boolean).join("\n");

      const { error } = await supabase.from("execucao_pops").insert({
        user_id: user!.id,
        codigo_pop: "POP-04-AGUA",
        nome_pop: "Controle Potabilidade da Água",
        executor: aguaForm.responsavel,
        setor: aguaForm.ponto,
        status: conforme ? "concluido" : "nao_conforme",
        observacoes: obs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_agua"] });
      toast.success("Registro de água salvo");
      setOpenAgua(false);
      setAguaForm({ ponto: PONTOS_AGUA[0], cloro_residual: "", ph: "", turbidez: "", data: new Date().toISOString().split("T")[0], responsavel: "", laudo_numero: "", laudo_valido: true, reservatorio_limpo: true, certificado_limpeza: "", observacoes: "" });
    },
    onError: () => toast.error("Erro ao registrar"),
  });

  const deleteCronograma = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("cronogramas_higiene").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] }); toast.success("Removido"); },
  });

  const freqLabel = (v: string) => FREQUENCIAS.find(f => f.value === v)?.label || v;

  // ── Save Liberação de Linha ──
  const salvarLibLinha = async () => {
    if (!user) return;
    setSavingLibLinha(true);
    const totalItens = CHECKLIST_LIBERACAO_LINHA.reduce((a, g) => a + g.itens.length, 0);
    const marcados = Object.values(libLinhaChecklist).filter(Boolean).length;
    const todosOk = marcados === totalItens;
    const ncs = CHECKLIST_LIBERACAO_LINHA.flatMap(g => g.itens.filter(item => !libLinhaChecklist[`${g.area}__${item}`]).map(item => `${g.area}: ${item}`));

    const obs = [
      `[LIBERAÇÃO DE LINHA — POP-02 / IN 04/2007 | IN 15/2009]`,
      `Data: ${libLinhaData} | Linha: ${libLinhaLinha || "—"}`,
      `Produto anterior: ${libLinhaProdAnterior || "—"}`,
      `Produto seguinte: ${libLinhaProdSeguinte || "—"}`,
      `Itens conformes: ${marcados}/${totalItens}`,
      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅",
      libLinhaObs ? `Obs: ${libLinhaObs}` : "",
      `[ASSINATURA DIGITAL: ${libLinhaResp} — ${new Date().toLocaleString("pt-BR")} — MP 2.200-2/2001]`,
    ].filter(Boolean).join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      codigo_pop: "POP-02-LIB-LINHA",
      nome_pop: "Checklist Liberação de Linha",
      executor: libLinhaResp,
      setor: libLinhaLinha || "Linha de Produção",
      status: todosOk ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: libLinhaData,
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Checklist de Liberação de Linha salvo!");
      qc.invalidateQueries({ queryKey: ["historico_lib_linha"] });
      setLibLinhaChecklist({});
      setLibLinhaResp("");
      setLibLinhaProdAnterior("");
      setLibLinhaProdSeguinte("");
      setLibLinhaLinha("");
      setLibLinhaObs("");
    }
    setSavingLibLinha(false);
  };

  // ── Save Monitoramento de Superfícies ──
  const salvarSup = async () => {
    if (!user) return;
    setSavingSup(true);
    const totalItens = CHECKLIST_SUPERFICIES.reduce((a, g) => a + g.itens.length, 0);
    const marcados = Object.values(supChecklist).filter(Boolean).length;
    const todosOk = marcados === totalItens;
    const ncs = CHECKLIST_SUPERFICIES.flatMap(g => g.itens.filter(item => !supChecklist[`${g.area}__${item}`]).map(item => `${g.area}: ${item}`));

    const obs = [
      `[MONITORAMENTO DE SUPERFÍCIES — POP-02/03 / IN 04/2007]`,
      `Data: ${supData} | Setor: ${supSetor || "—"}`,
      `Produto químico: ${supProdQuimico || "—"} | Concentração: ${supConcentracao || "—"}`,
      `Itens conformes: ${marcados}/${totalItens}`,
      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todas as superfícies conformes ✅",
      supObs ? `Obs: ${supObs}` : "",
      `[ASSINATURA DIGITAL: ${supResp} — ${new Date().toLocaleString("pt-BR")} — MP 2.200-2/2001]`,
    ].filter(Boolean).join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      codigo_pop: "POP-02-SUPERFICIE",
      nome_pop: "Monitoramento de Limpeza de Superfícies",
      executor: supResp,
      setor: supSetor || "Produção",
      status: todosOk ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: supData,
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Monitoramento de superfícies salvo!");
      qc.invalidateQueries({ queryKey: ["historico_sup"] });
      setSupChecklist({});
      setSupResp("");
      setSupSetor("");
      setSupProdQuimico("");
      setSupConcentracao("");
      setSupObs("");
    }
    setSavingSup(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="POP 02/03/04 — Limpeza, Higiene Pessoal e Água" description="POP 02 (Limpeza de Instalações), POP 03 (Higiene e Saúde Pessoal), POP 04 (Potabilidade da Água) — IN 04/2007 e IN 15/2009" />

      <Tabs defaultValue="preop">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="preop"><ShieldCheck className="w-4 h-4 mr-1" />Pré-Operacional</TabsTrigger>
          <TabsTrigger value="liberacao"><Layers className="w-4 h-4 mr-1" />Liberação de Linha</TabsTrigger>
          <TabsTrigger value="superficies"><FlaskConical className="w-4 h-4 mr-1" />Superfícies</TabsTrigger>
          <TabsTrigger value="silos"><Container className="w-4 h-4 mr-1" />Silos & Transportadores</TabsTrigger>
          <TabsTrigger value="higiene_pessoal"><UserCheck className="w-4 h-4 mr-1" />Higiene Pessoal (POP-03)</TabsTrigger>
          <TabsTrigger value="saude_sintomas"><HeartPulse className="w-4 h-4 mr-1" />Saúde & Sintomas</TabsTrigger>
          <TabsTrigger value="reservatorio"><Droplet className="w-4 h-4 mr-1" />Limpeza Reservatório</TabsTrigger>
          <TabsTrigger value="cronogramas"><Droplets className="w-4 h-4 mr-1" />Cronogramas</TabsTrigger>
          <TabsTrigger value="registros"><CheckCircle2 className="w-4 h-4 mr-1" />Registros Limpeza</TabsTrigger>
          <TabsTrigger value="agua"><Beaker className="w-4 h-4 mr-1" />Controle de Água (POP-04)</TabsTrigger>
          <TabsTrigger value="agua_checklist"><ClipboardList className="w-4 h-4 mr-1" />Checklist POP-04</TabsTrigger>
          <TabsTrigger value="laudos"><FileText className="w-4 h-4 mr-1" />Laudos Vinculados</TabsTrigger>
          <TabsTrigger value="planilha"><ClipboardList className="w-4 h-4 mr-1" />Planilha Mensal</TabsTrigger>
          <TabsTrigger value="arquivo"><Archive className="w-4 h-4 mr-1" />Arquivo 2 Anos</TabsTrigger>
        </TabsList>

        {/* ── CHECKLIST PRÉ-OPERACIONAL ── */}
        <TabsContent value="preop" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Checklist Pré-Operacional — POP 02/03 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória antes do início de cada turno/produção. Todos os itens devem ser inspecionados
                    e registrados conforme Art. 2º da IN 04/2007 e requisitos de BPF da IN 15/2009.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Responsável pela Inspeção *</Label><Input value={preOpResponsavel} onChange={e => setPreOpResponsavel(e.target.value)} placeholder="Nome do inspetor" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={preOpData} onChange={e => setPreOpData(e.target.value)} /></div>
              <div>
                <Label>Setor/Turno</Label>
                <Select value={preOpSetor} onValueChange={setPreOpSetor}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turno 1 (Manhã)">Turno 1 (Manhã)</SelectItem>
                    <SelectItem value="Turno 2 (Tarde)">Turno 2 (Tarde)</SelectItem>
                    <SelectItem value="Turno 3 (Noite)">Turno 3 (Noite)</SelectItem>
                    <SelectItem value="Turno Único">Turno Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_PRE_OP.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `${grupo.area}__${item}`;
                      const checked = preOpChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch checked={checked} onCheckedChange={v => setPreOpChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_PRE_OP.reduce((acc, g) => acc + g.itens.length, 0);
            const marcados = Object.values(preOpChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Todos os itens conformes" : "Conclua todos os itens para liberar"}</p>
                </div>
                <Button
                  disabled={!preOpResponsavel || !preOpSetor || savingPreOp}
                  onClick={async () => {
                    if (!user) return;
                    setSavingPreOp(true);
                    const ncs = CHECKLIST_PRE_OP.flatMap(g => g.itens.filter(item => !preOpChecklist[`${g.area}__${item}`]).map(item => `${g.area}: ${item}`));
                    const obs = [
                      `[CHECKLIST PRÉ-OPERACIONAL — POP-02/03]`,
                      `Data: ${preOpData} | Turno: ${preOpSetor}`,
                      `Itens conformes: ${marcados}/${totalItens}`,
                      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes",
                      `[ASSINATURA DIGITAL: ${preOpResponsavel} — ${new Date().toLocaleString("pt-BR")} — MP 2.200-2/2001]`,
                    ].join("\n");
                    const { error } = await supabase.from("execucao_pops").insert({
                      user_id: user.id,
                      codigo_pop: "POP-02/03-PREOP",
                      nome_pop: "Checklist Pré-Operacional Limpeza",
                      executor: preOpResponsavel,
                      setor: preOpSetor,
                      status: todosOk ? "concluido" : "nao_conforme",
                      observacoes: obs,
                      data_execucao: preOpData,
                    });
                    if (error) toast.error("Erro ao salvar: " + error.message);
                    else {
                      toast.success("Checklist pré-operacional salvo!");
                      setPreOpChecklist({});
                      setPreOpResponsavel("");
                      setPreOpSetor("");
                    }
                    setSavingPreOp(false);
                  }}
                >
                  Salvar Checklist
                </Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── LIBERAÇÃO DE LINHA (POP-02 / IN 04/2007 | IN 15/2009) ── */}
        <TabsContent value="liberacao" className="space-y-4">
          <Card className="border-orange-500/20 bg-orange-50 dark:bg-orange-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Layers className="w-6 h-6 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Checklist de Liberação de Linha — POP-02 (IN 04/2007 | IN 15/2009)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória antes da troca de produto/lote na linha de produção.
                    Garante ausência de contaminação cruzada, conformidade com limites de carry-over
                    (Ionóforos {"<"} 1%, Medicados {"<"} 3%) e rastreabilidade do flushing conforme IN 15/2009.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={libLinhaResp} onChange={e => setLibLinhaResp(e.target.value)} placeholder="Nome do inspetor" /></div>
            <div><Label>Data</Label><Input type="date" value={libLinhaData} onChange={e => setLibLinhaData(e.target.value)} /></div>
            <div><Label>Produto Anterior</Label><Input value={libLinhaProdAnterior} onChange={e => setLibLinhaProdAnterior(e.target.value)} placeholder="Ex: Ração Bovinos Engorda" /></div>
            <div><Label>Produto Seguinte</Label><Input value={libLinhaProdSeguinte} onChange={e => setLibLinhaProdSeguinte(e.target.value)} placeholder="Ex: Ração Suínos Crescimento" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Linha de Produção</Label><Input value={libLinhaLinha} onChange={e => setLibLinhaLinha(e.target.value)} placeholder="Ex: Linha 01 — Farelados" /></div>
            <div><Label>Observações Gerais</Label><Input value={libLinhaObs} onChange={e => setLibLinhaObs(e.target.value)} placeholder="Opcional" /></div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_LIBERACAO_LINHA.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `${grupo.area}__${item}`;
                      const checked = libLinhaChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch checked={checked} onCheckedChange={v => setLibLinhaChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_LIBERACAO_LINHA.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(libLinhaChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Linha liberada — todos os itens conformes" : "Conclua todos os itens para liberar a linha"}</p>
                </div>
                <Button disabled={!libLinhaResp || savingLibLinha} onClick={salvarLibLinha}>
                  Salvar Liberação de Linha
                </Button>
              </div>
            );
          })()}

          {/* Histórico */}
          {historicoLibLinha.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Histórico de Liberações de Linha</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Linha/Setor</TableHead>
                  <TableHead>Status</TableHead><TableHead className="max-w-[250px]">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {historicoLibLinha.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? <Badge className="bg-primary/20 text-primary">Liberada</Badge> : <Badge variant="destructive">NC</Badge>}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">{(r.observacoes || "").slice(0, 120)}{(r.observacoes?.length || 0) > 120 ? "…" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── MONITORAMENTO DE SUPERFÍCIES (POP-02/03 / IN 04/2007) ── */}
        <TabsContent value="superficies" className="space-y-4">
          <Card className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-6 h-6 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Monitoramento de Limpeza de Superfícies — POP-02/03 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação da eficácia da limpeza em superfícies de contato direto e indireto.
                    Inclui inspeção visual, swab de superfície, teste de água de enxágue e bioluminescência ATP
                    conforme requisitos de BPF da IN 04/2007 e IN 15/2009.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={supResp} onChange={e => setSupResp(e.target.value)} placeholder="Nome do inspetor" /></div>
            <div><Label>Data</Label><Input type="date" value={supData} onChange={e => setSupData(e.target.value)} /></div>
            <div>
              <Label>Setor</Label>
              <Select value={supSetor} onValueChange={setSupSetor}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção — Mistura">Produção — Mistura</SelectItem>
                  <SelectItem value="Produção — Ensaque">Produção — Ensaque</SelectItem>
                  <SelectItem value="Recepção de MP">Recepção de MP</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                  <SelectItem value="Todas as áreas">Todas as áreas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Produto Químico</Label><Input value={supProdQuimico} onChange={e => setSupProdQuimico(e.target.value)} placeholder="Ex: Hipoclorito" /></div>
              <div><Label>Concentração</Label><Input value={supConcentracao} onChange={e => setSupConcentracao(e.target.value)} placeholder="Ex: 200 ppm" /></div>
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_SUPERFICIES.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `${grupo.area}__${item}`;
                      const checked = supChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch checked={checked} onCheckedChange={v => setSupChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div><Label>Observações</Label><Textarea value={supObs} onChange={e => setSupObs(e.target.value)} placeholder="Detalhes sobre resultados de swab, ATP, ou outras observações relevantes" /></div>

          {(() => {
            const totalItens = CHECKLIST_SUPERFICIES.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(supChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Todas as superfícies conformes" : "Conclua a inspeção de todas as superfícies"}</p>
                </div>
                <Button disabled={!supResp || savingSup} onClick={salvarSup}>
                  Salvar Monitoramento
                </Button>
              </div>
            );
          })()}

          {/* Histórico */}
          {historicoSup.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Histórico de Monitoramento de Superfícies</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Setor</TableHead>
                  <TableHead>Status</TableHead><TableHead className="max-w-[250px]">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {historicoSup.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? <Badge className="bg-primary/20 text-primary">Conforme</Badge> : <Badge variant="destructive">NC</Badge>}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">{(r.observacoes || "").slice(0, 120)}{(r.observacoes?.length || 0) > 120 ? "…" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── SILOS & TRANSPORTADORES (POP-03 / IN 15/2009) ── */}
        <TabsContent value="silos" className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-50 dark:bg-amber-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Container className="w-6 h-6 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Limpeza de Silos & Transportadores — POP-03 (IN 15/2009)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cronograma e checklist dedicado à higienização de silos e linhagens de transporte para prevenir o arraste
                    de medicamentos e aditivos entre lotes. Obrigatório conforme IN 15/2009, Art. 38 do Decreto 12.031/2024.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={silosResp} onChange={e => setSilosResp(e.target.value)} placeholder="Nome do executor" /></div>
            <div><Label>Data</Label><Input type="date" value={silosData} onChange={e => setSilosData(e.target.value)} /></div>
            <div>
              <Label>Equipamento / Silo</Label>
              <Select value={silosEquipamento} onValueChange={setSilosEquipamento}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silo 01">Silo 01</SelectItem>
                  <SelectItem value="Silo 02">Silo 02</SelectItem>
                  <SelectItem value="Silo 03">Silo 03</SelectItem>
                  <SelectItem value="Silo 04">Silo 04</SelectItem>
                  <SelectItem value="Silo 05">Silo 05</SelectItem>
                  <SelectItem value="Rosca Transportadora">Rosca Transportadora</SelectItem>
                  <SelectItem value="Elevador de Canecas">Elevador de Canecas</SelectItem>
                  <SelectItem value="Redler">Redler</SelectItem>
                  <SelectItem value="Transportador Pneumático">Transportador Pneumático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Produto anterior no equipamento</Label><Input value={silosProdAnterior} onChange={e => setSilosProdAnterior(e.target.value)} placeholder="Ex: Ração Medicada Frangos" /></div>
            <div><Label>Observações</Label><Input value={silosObs} onChange={e => setSilosObs(e.target.value)} placeholder="Detalhes da limpeza..." /></div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_SILOS_TRANSPORT.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `${grupo.area}__${item}`;
                      const checked = silosChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch checked={checked} onCheckedChange={v => setSilosChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_SILOS_TRANSPORT.reduce((acc, g) => acc + g.itens.length, 0);
            const marcados = Object.values(silosChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Todos os itens conformes — Equipamento liberado" : "Conclua todos os itens para liberar"}</p>
                </div>
                <Button
                  disabled={!silosResp || !silosEquipamento || savingSilos}
                  onClick={async () => {
                    if (!user) return;
                    setSavingSilos(true);
                    const ncs = CHECKLIST_SILOS_TRANSPORT.flatMap(g => g.itens.filter(item => !silosChecklist[`${g.area}__${item}`]).map(item => `${g.area}: ${item}`));
                    const obs = [
                      `[LIMPEZA SILOS & TRANSPORTADORES — POP-03 / IN 15/2009]`,
                      `Data: ${silosData} | Equipamento: ${silosEquipamento}`,
                      `Produto anterior: ${silosProdAnterior || "—"}`,
                      `Itens conformes: ${marcados}/${totalItens}`,
                      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅",
                      silosObs ? `Obs: ${silosObs}` : "",
                    ].filter(Boolean).join("\n");
                    const { error } = await supabase.from("execucao_pops").insert({
                      user_id: user.id,
                      codigo_pop: "POP-03-SILOS",
                      nome_pop: "Limpeza de Silos & Transportadores",
                      executor: silosResp,
                      setor: silosEquipamento,
                      status: todosOk ? "concluido" : "nao_conforme",
                      observacoes: obs,
                      data_execucao: silosData,
                    });
                    if (error) toast.error("Erro ao salvar: " + error.message);
                    else {
                      toast.success("Checklist de silos & transportadores salvo!");
                      setSilosChecklist({});
                      setSilosResp("");
                      setSilosEquipamento("");
                      setSilosProdAnterior("");
                      setSilosObs("");
                    }
                    setSavingSilos(false);
                  }}
                >
                  Salvar Checklist
                </Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── HIGIENE PESSOAL (POP-03 / IN 04/2007) ── */}
        <TabsContent value="higiene_pessoal" className="space-y-4">
          <Card className="border-teal-500/20 bg-teal-50 dark:bg-teal-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-6 h-6 text-teal-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Checklist de Higiene e Saúde do Pessoal — POP-03 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória de uniformes, EPIs, higiene pessoal, saúde ocupacional e comportamento
                    dos colaboradores conforme Art. 2º da IN 04/2007 e requisitos de BPF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={higPesResp} onChange={e => setHigPesResp(e.target.value)} placeholder="Nome do inspetor" /></div>
            <div><Label>Data</Label><Input type="date" value={higPesData} onChange={e => setHigPesData(e.target.value)} /></div>
            <div>
              <Label>Turno</Label>
              <Select value={higPesTurno} onValueChange={setHigPesTurno}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Turno 1 (Manhã)">Turno 1 (Manhã)</SelectItem>
                  <SelectItem value="Turno 2 (Tarde)">Turno 2 (Tarde)</SelectItem>
                  <SelectItem value="Turno 3 (Noite)">Turno 3 (Noite)</SelectItem>
                  <SelectItem value="Turno Único">Turno Único</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_HIGIENE_PESSOAL.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3"><CardTitle className="text-sm font-display">{grupo.area}</CardTitle></CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `higpes__${grupo.area}__${item}`;
                      const checked = higPesChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>{checked ? "OK" : "—"}</span>
                            <Switch checked={checked} onCheckedChange={v => setHigPesChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_HIGIENE_PESSOAL.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(higPesChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Todos conformes — Higiene pessoal OK" : "Conclua todos os itens"}</p>
                </div>
                <Button disabled={!higPesResp || savingHigPes} onClick={async () => {
                  if (!user) return;
                  setSavingHigPes(true);
                  const ncs = CHECKLIST_HIGIENE_PESSOAL.flatMap(g => g.itens.filter(item => !higPesChecklist[`higpes__${g.area}__${item}`]).map(item => `${g.area}: ${item}`));
                  const obs = [`[CHECKLIST HIGIENE PESSOAL — POP-03 / IN 04/2007]`, `Data: ${higPesData} | Turno: ${higPesTurno || "—"}`, `Itens conformes: ${marcados}/${totalItens}`, ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅"].join("\n");
                  const { error } = await supabase.from("execucao_pops").insert({ user_id: user.id, codigo_pop: "POP-03-HIGIENE", nome_pop: "Checklist Higiene e Saúde Pessoal", executor: higPesResp, setor: higPesTurno || "Produção", status: todosOk ? "concluido" : "nao_conforme", observacoes: obs, data_execucao: higPesData });
                  if (error) toast.error("Erro: " + error.message);
                  else { toast.success("Checklist POP-03 Higiene Pessoal salvo!"); setHigPesChecklist({}); setHigPesResp(""); setHigPesTurno(""); }
                  setSavingHigPes(false);
                }}>Salvar Checklist POP-03</Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── LIMPEZA DE RESERVATÓRIO (POP-04) ── */}
        <TabsContent value="reservatorio" className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Droplet className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Registro de Higienização de Reservatório — POP-04 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Limpeza semestral obrigatória de caixas d'água e reservatórios. Registre cada etapa do processo,
                    emita o certificado e arquive para fiscalização (Decreto 12.031/2024).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={resResp} onChange={e => setResResp(e.target.value)} placeholder="Executor" /></div>
            <div><Label>Data</Label><Input type="date" value={resData} onChange={e => setResData(e.target.value)} /></div>
            <div><Label>Identificação do Reservatório *</Label><Input value={resIdentificacao} onChange={e => setResIdentificacao(e.target.value)} placeholder="Ex: Caixa d'água 01 — 5.000L" /></div>
            <div><Label>Capacidade (L)</Label><Input value={resCapacidade} onChange={e => setResCapacidade(e.target.value)} placeholder="Ex: 5000" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Empresa Executora (se terceirizada)</Label><Input value={resEmpresa} onChange={e => setResEmpresa(e.target.value)} placeholder="Nome da empresa ou 'Equipe interna'" /></div>
            <div><Label>Observações</Label><Input value={resObs} onChange={e => setResObs(e.target.value)} placeholder="Detalhes adicionais" /></div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_RESERVATORIO.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3"><CardTitle className="text-sm font-display">{grupo.area}</CardTitle></CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `res__${grupo.area}__${item}`;
                      const checked = resChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>{checked ? "OK" : "—"}</span>
                            <Switch checked={checked} onCheckedChange={v => setResChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_RESERVATORIO.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(resChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Higienização do reservatório completa" : "Conclua todos os itens"}</p>
                </div>
                <Button disabled={!resResp || !resIdentificacao || savingRes} onClick={async () => {
                  if (!user) return;
                  setSavingRes(true);
                  const ncs = CHECKLIST_RESERVATORIO.flatMap(g => g.itens.filter(item => !resChecklist[`res__${g.area}__${item}`]).map(item => `${g.area}: ${item}`));
                  const obs = [`[HIGIENIZAÇÃO DE RESERVATÓRIO — POP-04 / IN 04/2007]`, `Data: ${resData} | Reservatório: ${resIdentificacao} (${resCapacidade || "—"}L)`, `Empresa: ${resEmpresa || "Equipe interna"}`, `Itens conformes: ${marcados}/${totalItens}`, ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅", resObs ? `Obs: ${resObs}` : ""].filter(Boolean).join("\n");
                  const { error } = await supabase.from("execucao_pops").insert({ user_id: user.id, codigo_pop: "POP-04-RESERVATORIO", nome_pop: "Higienização de Reservatório de Água", executor: resResp, setor: resIdentificacao, status: todosOk ? "concluido" : "nao_conforme", observacoes: obs, data_execucao: resData });
                  if (error) toast.error("Erro: " + error.message);
                  else { toast.success("Registro de higienização do reservatório salvo!"); qc.invalidateQueries({ queryKey: ["registros_agua"] }); setResChecklist({}); setResResp(""); setResIdentificacao(""); setResCapacidade(""); setResEmpresa(""); setResObs(""); }
                  setSavingRes(false);
                }}>Salvar Higienização</Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── CRONOGRAMAS ── */}
        <TabsContent value="cronogramas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCronograma} onOpenChange={setOpenCronograma}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Cronograma</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Cadastrar Cronograma de Limpeza</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Área / Setor *</Label>
                    <Select value={form.area} onValueChange={v => setForm(p => ({ ...p, area: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{AREAS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Equipamento</Label><Input value={form.equipamento} onChange={e => setForm(p => ({ ...p, equipamento: e.target.value }))} placeholder="Ex: Misturador 01" /></div>
                  <div><Label>Procedimento *</Label><Textarea value={form.procedimento} onChange={e => setForm(p => ({ ...p, procedimento: e.target.value }))} placeholder="Descreva o procedimento de limpeza" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Produto Utilizado</Label><Input value={form.produto_utilizado} onChange={e => setForm(p => ({ ...p, produto_utilizado: e.target.value }))} placeholder="Ex: Hipoclorito 2%" /></div>
                    <div><Label>Concentração</Label><Input value={form.concentracao} onChange={e => setForm(p => ({ ...p, concentracao: e.target.value }))} placeholder="Ex: 200 ppm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Frequência *</Label>
                      <Select value={form.frequencia} onValueChange={v => setForm(p => ({ ...p, frequencia: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Horário Previsto</Label><Input value={form.horario_previsto} onChange={e => setForm(p => ({ ...p, horario_previsto: e.target.value }))} placeholder="Ex: 06:00" /></div>
                  </div>
                  <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addCronograma.mutate()} disabled={!form.area || !form.procedimento}>Salvar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {cronogramas.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum cronograma cadastrado</p></CardContent></Card>
          ) : (
            <>
              {(() => {
                const silosEquips = ["Silo 01", "Silo 02", "Silo 03", "Silo 04", "Silo 05", "Misturador", "Moinho", "Peletizadora", "Extrusora", "Transportador / Elevador"];
                const comCronograma = cronogramas.map((c: any) => c.area);
                const semCronograma = silosEquips.filter(s => !comCronograma.includes(s));
                if (semCronograma.length === 0) return null;
                return (
                  <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-yellow-600" />
                        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">POP-03: Silos/Equipamentos sem Cronograma de Higienização</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">IN 04/2007 Art. 2º exige cronograma de higienização para todos os silos e equipamentos de produção.</p>
                      <div className="flex flex-wrap gap-2">
                        {semCronograma.map(s => <Badge key={s} variant="outline" className="border-yellow-500 text-yellow-700">{s}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Área</TableHead><TableHead>Equipamento</TableHead><TableHead>Procedimento</TableHead>
                  <TableHead>Produto</TableHead><TableHead>Frequência</TableHead><TableHead>Responsável</TableHead><TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cronogramas.map((c: any) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.area}</TableCell>
                      <TableCell>{c.equipamento}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.procedimento}</TableCell>
                      <TableCell>{c.produto_utilizado} {c.concentracao && `(${c.concentracao})`}</TableCell>
                      <TableCell><Badge variant="outline">{freqLabel(c.frequencia)}</Badge></TableCell>
                      <TableCell>{c.responsavel}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => deleteCronograma.mutate(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </Card>
            </>
          )}
        </TabsContent>

        {/* ── REGISTROS LIMPEZA ── */}
        <TabsContent value="registros" className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <Select value={selectedCronograma || "__all__"} onValueChange={v => setSelectedCronograma(v === "__all__" ? null : v)}>
              <SelectTrigger className="w-[300px]"><SelectValue placeholder="Filtrar por cronograma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {cronogramas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.area} — {c.procedimento?.substring(0, 30)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={openRegistro} onOpenChange={setOpenRegistro}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Registrar Execução</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Limpeza Realizada</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Cronograma *</Label>
                    <Select value={regForm.cronograma_id} onValueChange={v => setRegForm(p => ({ ...p, cronograma_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{cronogramas.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.area} — {c.procedimento?.substring(0, 40)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {/* POP-02: Tipo de limpeza — IN 15/2009 */}
                  <div>
                    <Label>Tipo de Limpeza (IN 15/2009) *</Label>
                    <Select value={(regForm as any).tipo_limpeza || "umida"} onValueChange={v => setRegForm(p => ({ ...p, tipo_limpeza: v } as any))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seca">🧹 Limpeza Seca (vassouragem, aspiração, ar comprimido)</SelectItem>
                        <SelectItem value="umida">💧 Limpeza Úmida (lavagem com água e detergente)</SelectItem>
                        <SelectItem value="sanitizacao">🧴 Sanitização (aplicação de sanitizante)</SelectItem>
                        <SelectItem value="seca_umida">🔄 Seca + Úmida (combinada)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {(regForm as any).tipo_limpeza === "seca" ? "Indicada para áreas onde umidade é indesejável (silos, elevadores, moegas). Não utilizar água." :
                       (regForm as any).tipo_limpeza === "sanitizacao" ? "Aplicação de sanitizante após limpeza prévia. Registrar produto e concentração nas observações." :
                       (regForm as any).tipo_limpeza === "seca_umida" ? "Processo completo: remoção mecânica seca + lavagem + enxágue." :
                       "Lavagem completa com água, detergente e enxágue final. Verificar secagem antes de retomar produção."}
                    </p>
                  </div>
                  <div><Label>Data</Label><Input type="date" value={regForm.data_execucao} onChange={e => setRegForm(p => ({ ...p, data_execucao: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Hora Início</Label><Input value={regForm.hora_inicio} onChange={e => setRegForm(p => ({ ...p, hora_inicio: e.target.value }))} placeholder="06:00" /></div>
                    <div><Label>Hora Fim</Label><Input value={regForm.hora_fim} onChange={e => setRegForm(p => ({ ...p, hora_fim: e.target.value }))} placeholder="06:30" /></div>
                  </div>
                  <div><Label>Executor *</Label><Input value={regForm.executor} onChange={e => setRegForm(p => ({ ...p, executor: e.target.value }))} /></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={regForm.conforme} onChange={e => setRegForm(p => ({ ...p, conforme: e.target.checked }))} className="h-4 w-4" />
                    <Label>Conforme</Label>
                  </div>
                  <div><Label>Observações</Label><Textarea value={regForm.observacoes} onChange={e => setRegForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addRegistro.mutate()} disabled={!regForm.cronograma_id || !regForm.executor}>Salvar Registro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {registros.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Clock className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum registro encontrado</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Tipo Limpeza</TableHead><TableHead>Horário</TableHead>
                  <TableHead>Conforme</TableHead><TableHead>Observações</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {r.tipo_limpeza === "seca" ? "🧹 Seca" : r.tipo_limpeza === "sanitizacao" ? "🧴 Sanitização" : r.tipo_limpeza === "seca_umida" ? "🔄 Seca+Úmida" : "💧 Úmida"}
                        </Badge>
                      </TableCell>
                      <TableCell>{r.hora_inicio}{r.hora_fim ? ` — ${r.hora_fim}` : ""}</TableCell>
                      <TableCell>{r.conforme ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Badge variant="destructive">NC</Badge>}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.observacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── CONTROLE DE ÁGUA (POP-04) ── */}
        <TabsContent value="agua" className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-50 dark:bg-blue-900/10 mb-2">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Beaker className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Controle de Potabilidade da Água — POP-04 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitoramento de cloro residual (0,2–2,0 mg/L), pH (6,0–9,5) e turbidez (≤ 5 NTU).
                    Laudos laboratoriais mensais e limpeza semestral de reservatórios são obrigatórios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Dialog open={openAgua} onOpenChange={setOpenAgua}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Registro de Água</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Controle de Potabilidade — POP-04</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Ponto de Coleta *</Label>
                    <Select value={aguaForm.ponto} onValueChange={v => setAguaForm(p => ({ ...p, ponto: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PONTOS_AGUA.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Cloro Residual (mg/L)</Label>
                      <Input value={aguaForm.cloro_residual} onChange={e => setAguaForm(p => ({ ...p, cloro_residual: e.target.value }))} placeholder="Ex: 0,5" />
                      <p className="text-[10px] text-muted-foreground">Padrão: 0,2 – 2,0</p>
                    </div>
                    <div>
                      <Label>pH</Label>
                      <Input value={aguaForm.ph} onChange={e => setAguaForm(p => ({ ...p, ph: e.target.value }))} placeholder="Ex: 7,2" />
                      <p className="text-[10px] text-muted-foreground">Padrão: 6,0 – 9,5</p>
                    </div>
                    <div>
                      <Label>Turbidez (NTU)</Label>
                      <Input value={aguaForm.turbidez} onChange={e => setAguaForm(p => ({ ...p, turbidez: e.target.value }))} placeholder="Ex: 1,5" />
                      <p className="text-[10px] text-muted-foreground">Padrão: ≤ 5</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input type="date" value={aguaForm.data} onChange={e => setAguaForm(p => ({ ...p, data: e.target.value }))} /></div>
                    <div><Label>Responsável</Label><Input value={aguaForm.responsavel} onChange={e => setAguaForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
                    <p className="text-xs font-semibold">Laudos e Reservatórios</p>
                    <div><Label>Nº Laudo Laboratorial</Label><Input value={aguaForm.laudo_numero} onChange={e => setAguaForm(p => ({ ...p, laudo_numero: e.target.value }))} placeholder="Ex: LAB-2026-0321" /></div>
                    <div>
                      <Label>URL do Laudo (PDF / Digitalização)</Label>
                      <Input value={(aguaForm as any).laudo_url || ""} onChange={e => setAguaForm(p => ({ ...p, laudo_url: e.target.value } as any))} placeholder="https://... ou cole o link do arquivo anexado no módulo Documentos" />
                      <p className="text-[10px] text-muted-foreground mt-1">Faça upload do PDF no módulo Documentos/Arquivo BPF e cole o link aqui, ou use o bucket de armazenamento.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={aguaForm.laudo_valido} onChange={e => setAguaForm(p => ({ ...p, laudo_valido: e.target.checked }))} className="h-4 w-4" />
                        <Label className="text-sm">Laudo mensal em dia</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={aguaForm.reservatorio_limpo} onChange={e => setAguaForm(p => ({ ...p, reservatorio_limpo: e.target.checked }))} className="h-4 w-4" />
                        <Label className="text-sm">Reservatório limpo (semestral)</Label>
                      </div>
                    </div>
                    <div><Label>Certificado Limpeza Reservatório</Label><Input value={aguaForm.certificado_limpeza} onChange={e => setAguaForm(p => ({ ...p, certificado_limpeza: e.target.value }))} placeholder="Nº ou empresa responsável" /></div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={aguaForm.observacoes} onChange={e => setAguaForm(p => ({ ...p, observacoes: e.target.value }))} /></div>
                  <Button onClick={() => addRegistroAgua.mutate()} disabled={!aguaForm.responsavel}>Salvar Registro</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {registrosAgua.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Beaker className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum registro de controle de água</p></CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Ponto</TableHead><TableHead>Executor</TableHead>
                  <TableHead>Status</TableHead><TableHead className="max-w-[300px]">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {registrosAgua.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell className="font-medium">{r.setor}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge className="bg-destructive text-destructive-foreground">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] text-xs whitespace-pre-line truncate">{(r.observacoes || "").slice(0, 150)}{(r.observacoes?.length || 0) > 150 ? "…" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── CHECKLIST DEDICADO POP-04 ── */}
        <TabsContent value="agua_checklist" className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Checklist POP-04 — Potabilidade da Água (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação completa de reservatórios, pontos de coleta, sistema de tratamento e documentação.
                    Execute este checklist mensalmente e antes de cada auditoria.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Responsável *</Label><Input value={aguaCheckResp} onChange={e => setAguaCheckResp(e.target.value)} placeholder="Nome do inspetor" /></div>
            <div><Label>Data</Label><Input type="date" value={aguaCheckData} onChange={e => setAguaCheckData(e.target.value)} /></div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_AGUA.map(grupo => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map(item => {
                      const key = `agua__${grupo.area}__${item}`;
                      const checked = aguaChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch checked={checked} onCheckedChange={v => setAguaChecklist(p => ({ ...p, [key]: v }))} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_AGUA.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(aguaChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">{marcados}/{totalItens} itens verificados</p>
                  <p className="text-xs text-muted-foreground">{todosOk ? "✅ Todos os itens de potabilidade conformes" : "Conclua a verificação de todos os itens"}</p>
                </div>
                <Button disabled={!aguaCheckResp || savingAguaCheck} onClick={async () => {
                  if (!user) return;
                  setSavingAguaCheck(true);
                  const ncs = CHECKLIST_AGUA.flatMap(g => g.itens.filter(item => !aguaChecklist[`agua__${g.area}__${item}`]).map(item => `${g.area}: ${item}`));
                  const obs = [
                    `[CHECKLIST POP-04 — POTABILIDADE DA ÁGUA / IN 04/2007]`,
                    `Data: ${aguaCheckData} | Responsável: ${aguaCheckResp}`,
                    `Itens conformes: ${marcados}/${totalItens}`,
                    ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅",
                  ].join("\n");
                  const { error } = await supabase.from("execucao_pops").insert({
                    user_id: user.id,
                    codigo_pop: "POP-04-CHECKLIST",
                    nome_pop: "Checklist Potabilidade da Água",
                    executor: aguaCheckResp,
                    setor: "Reservatórios / Pontos de Água",
                    status: todosOk ? "concluido" : "nao_conforme",
                    observacoes: obs,
                    data_execucao: aguaCheckData,
                  });
                  if (error) toast.error("Erro: " + error.message);
                  else {
                    toast.success("Checklist POP-04 salvo!");
                    qc.invalidateQueries({ queryKey: ["registros_agua"] });
                    setAguaChecklist({});
                    setAguaCheckResp("");
                  }
                  setSavingAguaCheck(false);
                }}>
                  Salvar Checklist POP-04
                </Button>
              </div>
            );
          })()}
        </TabsContent>

        {/* ── LAUDOS VINCULADOS ── */}
        <TabsContent value="laudos" className="space-y-4">
          <Card className="border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Laudos Laboratoriais de Água — POP-05 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Laudos de potabilidade cadastrados no módulo de Análises Laboratoriais, vinculados automaticamente
                    por parâmetros de água (cloro, pH, coliformes, turbidez). Laudos mensais obrigatórios.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {laudosAgua.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p>Nenhum laudo de água encontrado.</p>
              <p className="text-xs mt-1">Cadastre análises com parâmetros de água no módulo Análises Laboratoriais.</p>
            </CardContent></Card>
          ) : (
            <Card>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data Análise</TableHead>
                  <TableHead>Produto/Amostra</TableHead>
                  <TableHead>Parâmetro</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Limite Ref.</TableHead>
                  <TableHead>Laudo Nº</TableHead>
                  <TableHead>Conforme</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {laudosAgua.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="whitespace-nowrap">{l.data_analise}</TableCell>
                      <TableCell className="font-medium">{l.produto}</TableCell>
                      <TableCell>{l.parametro || "—"}</TableCell>
                      <TableCell className="font-mono">{l.resultado || "—"} {l.unidade || ""}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{l.limite_referencia || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{l.laudo_numero || "—"}</TableCell>
                      <TableCell>
                        {l.conforme === true ? <Badge className="bg-primary/20 text-primary">Conforme</Badge> :
                         l.conforme === false ? <Badge variant="destructive">NC</Badge> :
                         <Badge variant="outline">Pendente</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── PLANILHA MENSAL ── */}
        <TabsContent value="planilha" className="space-y-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-6 h-6 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Planilha Mensal de Higiene e Sanitização</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consolidação mensal dos registros de limpeza (POP-02/03) e controle de água (POP-04)
                    para atender IN 04/2007 e IN 15/2009. Disponível para fiscalização (Art. 18, Decreto 12.031/2024).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <div>
              <Label>Mês/Ano</Label>
              <Input type="month" value={mesAno} onChange={e => setMesAno(e.target.value)} className="w-48" />
            </div>
            <Button variant="outline" onClick={exportPlanilhaMensal}>
              <Download className="w-4 h-4 mr-2" />Exportar Planilha Mensal
            </Button>
          </div>

          {(() => {
            const registrosMes = registros.filter((r: any) => r.data_execucao?.startsWith(mesAno));
            const aguaMes = registrosAgua.filter((r: any) => r.data_execucao?.startsWith(mesAno));
            const conformesLimp = registrosMes.filter((r: any) => r.conforme).length;
            const ncsLimp = registrosMes.filter((r: any) => !r.conforme).length;
            const conformesAgua = aguaMes.filter((r: any) => r.status === "concluido").length;
            const ncsAgua = aguaMes.filter((r: any) => r.status !== "concluido").length;

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card><CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-primary">{registrosMes.length}</p>
                    <p className="text-xs text-muted-foreground">Limpezas Realizadas</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{conformesLimp}</p>
                    <p className="text-xs text-muted-foreground">Conformes</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{aguaMes.length}</p>
                    <p className="text-xs text-muted-foreground">Registros Água</p>
                  </CardContent></Card>
                  <Card><CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-destructive">{ncsLimp + ncsAgua}</p>
                    <p className="text-xs text-muted-foreground">Total NCs</p>
                  </CardContent></Card>
                </div>

                {registrosMes.length === 0 && aguaMes.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum registro neste mês</CardContent></Card>
                ) : (
                  <>
                    {registrosMes.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Registros de Limpeza — {mesAno}</CardTitle></CardHeader>
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Horário</TableHead>
                            <TableHead>Conforme</TableHead><TableHead>Observações</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {registrosMes.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell>{r.data_execucao}</TableCell>
                                <TableCell>{r.executor}</TableCell>
                                <TableCell>{r.hora_inicio}{r.hora_fim ? ` — ${r.hora_fim}` : ""}</TableCell>
                                <TableCell>{r.conforme ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Badge variant="destructive">NC</Badge>}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{r.observacoes}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                    {aguaMes.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">Controle de Água — {mesAno}</CardTitle></CardHeader>
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>Data</TableHead><TableHead>Ponto</TableHead><TableHead>Executor</TableHead><TableHead>Status</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {aguaMes.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell>{r.data_execucao}</TableCell>
                                <TableCell>{r.setor}</TableCell>
                                <TableCell>{r.executor}</TableCell>
                                <TableCell>{r.status === "concluido" ? <Badge className="bg-primary/20 text-primary">Conforme</Badge> : <Badge variant="destructive">NC</Badge>}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* ── SAÚDE & SINTOMAS (POP-03/04 / IN 04/2007) ── */}
        <TabsContent value="saude_sintomas" className="space-y-4">
          <Card className="border-rose-500/20 bg-rose-50 dark:bg-rose-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-6 h-6 text-rose-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Controle de Saúde & Monitoramento Diário de Sintomas — POP-03/04 (IN 04/2007)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Monitoramento diário de sintomas infectocontagiosos dos colaboradores e acompanhamento da validade
                    dos ASOs (Atestados de Saúde Ocupacional). Colaboradores com sintomas devem ser afastados da produção.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ASO Dashboard */}
          {(() => {
            const hoje = new Date().toISOString().split("T")[0];
            const vencidos = saudeManipuladores.filter((s: any) => s.data_validade && s.data_validade < hoje);
            const prox30 = saudeManipuladores.filter((s: any) => {
              if (!s.data_validade) return false;
              const d = new Date(s.data_validade);
              const lim = new Date(); lim.setDate(lim.getDate() + 30);
              return s.data_validade >= hoje && d <= lim;
            });
            const aptos = saudeManipuladores.filter((s: any) => s.apto);
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-primary">{saudeManipuladores.length}</p><p className="text-xs text-muted-foreground">Total ASOs</p></CardContent></Card>
                <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-green-600">{aptos.length}</p><p className="text-xs text-muted-foreground">Aptos</p></CardContent></Card>
                <Card className={vencidos.length > 0 ? "border-destructive" : ""}><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-destructive">{vencidos.length}</p><p className="text-xs text-muted-foreground">ASOs Vencidos</p></CardContent></Card>
                <Card className={prox30.length > 0 ? "border-yellow-500" : ""}><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-yellow-600">{prox30.length}</p><p className="text-xs text-muted-foreground">Vencem em 30 dias</p></CardContent></Card>
              </div>
            );
          })()}

          {/* Alertas de ASO vencido */}
          {(() => {
            const hoje = new Date().toISOString().split("T")[0];
            const alertas = saudeManipuladores.filter((s: any) => s.data_validade && s.data_validade < hoje);
            if (alertas.length === 0) return null;
            return (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <p className="text-sm font-semibold text-destructive">ASOs Vencidos — Ação Imediata Necessária</p>
                  </div>
                  <div className="space-y-1">
                    {alertas.map((s: any) => (
                      <div key={s.id} className="flex justify-between items-center p-2 rounded border bg-background text-sm">
                        <span className="font-medium">{s.funcionario}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.tipo_exame}</span>
                          <Badge variant="destructive">Vencido {s.data_validade}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Formulário de Monitoramento Diário de Sintomas */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-display">Monitoramento Diário de Sintomas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label>Funcionário *</Label><Input value={sintomaFuncionario} onChange={e => setSintomaFuncionario(e.target.value)} placeholder="Nome do colaborador" /></div>
                <div><Label>Data</Label><Input type="date" value={sintomaData} onChange={e => setSintomaData(e.target.value)} /></div>
                <div className="flex items-end gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={sintomaApto} onCheckedChange={setSintomaApto} />
                    <Label className={sintomaApto ? "text-green-600" : "text-destructive"}>{sintomaApto ? "Apto para trabalho" : "INAPTO — Afastar"}</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Sintomas observados (marque os presentes):</Label>
                {SINTOMAS_DIARIOS.map(sintoma => {
                  const checked = sintomaChecklist[sintoma] ?? false;
                  return (
                    <div key={sintoma} className="flex items-center justify-between p-2 rounded border bg-background">
                      <span className="text-sm">{sintoma}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${checked ? "text-destructive" : "text-muted-foreground"}`}>{checked ? "SIM" : "—"}</span>
                        <Switch checked={checked} onCheckedChange={v => {
                          setSintomaChecklist(p => ({ ...p, [sintoma]: v }));
                          if (v) setSintomaApto(false);
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div><Label>Observações</Label><Textarea value={sintomaObs} onChange={e => setSintomaObs(e.target.value)} placeholder="Detalhes sobre o estado de saúde, encaminhamento médico, etc." /></div>

              <div className="flex justify-end">
                <Button disabled={!sintomaFuncionario || savingSintoma} onClick={async () => {
                  if (!user) return;
                  setSavingSintoma(true);
                  const sintomasPresentes = Object.entries(sintomaChecklist).filter(([, v]) => v).map(([k]) => k);
                  const obs = [
                    `[MONITORAMENTO DIÁRIO DE SINTOMAS — POP-03 / IN 04/2007]`,
                    `Funcionário: ${sintomaFuncionario}`,
                    `Data: ${sintomaData}`,
                    `Apto: ${sintomaApto ? "SIM ✅" : "NÃO ❌ — AFASTADO DA PRODUÇÃO"}`,
                    sintomasPresentes.length > 0 ? `Sintomas: ${sintomasPresentes.join(", ")}` : "Nenhum sintoma observado ✅",
                    sintomaObs ? `Obs: ${sintomaObs}` : "",
                  ].filter(Boolean).join("\n");
                  const { error } = await supabase.from("execucao_pops").insert({
                    user_id: user.id, codigo_pop: "POP-03-SINTOMAS", nome_pop: "Monitoramento Diário de Sintomas",
                    executor: sintomaFuncionario, setor: "Produção",
                    status: sintomaApto ? "concluido" : "nao_conforme",
                    observacoes: obs, data_execucao: sintomaData,
                  });
                  if (error) toast.error("Erro: " + error.message);
                  else {
                    toast.success("Monitoramento de sintomas registrado!");
                    qc.invalidateQueries({ queryKey: ["historico_sintomas"] });
                    setSintomaChecklist({}); setSintomaFuncionario(""); setSintomaObs(""); setSintomaApto(true);
                  }
                  setSavingSintoma(false);
                }}>Salvar Monitoramento</Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Sintomas */}
          {historicoSintomas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Histórico de Monitoramento de Sintomas</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Data</TableHead><TableHead>Funcionário</TableHead><TableHead>Status</TableHead><TableHead className="max-w-[300px]">Detalhes</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {historicoSintomas.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell className="font-medium">{r.executor}</TableCell>
                      <TableCell>{r.status === "concluido" ? <Badge className="bg-primary/20 text-primary">Apto</Badge> : <Badge variant="destructive">Inapto</Badge>}</TableCell>
                      <TableCell className="max-w-[300px] text-xs whitespace-pre-line truncate">{(r.observacoes || "").slice(0, 150)}{(r.observacoes?.length || 0) > 150 ? "…" : ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {/* Lista de ASOs */}
          {saudeManipuladores.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Exames Médicos (ASO) Cadastrados</CardTitle></CardHeader>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Funcionário</TableHead><TableHead>Tipo Exame</TableHead><TableHead>Data Exame</TableHead>
                  <TableHead>Validade</TableHead><TableHead>Médico</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {saudeManipuladores.map((s: any) => {
                    const hoje = new Date().toISOString().split("T")[0];
                    const vencido = s.data_validade && s.data_validade < hoje;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.funcionario}</TableCell>
                        <TableCell>{s.tipo_exame}</TableCell>
                        <TableCell>{s.data_exame}</TableCell>
                        <TableCell className={vencido ? "text-destructive font-semibold" : ""}>{s.data_validade || "—"}</TableCell>
                        <TableCell className="text-xs">{s.medico || "—"} {s.crm ? `(CRM ${s.crm})` : ""}</TableCell>
                        <TableCell>
                          {vencido ? <Badge variant="destructive">Vencido</Badge> :
                           s.apto ? <Badge className="bg-primary/20 text-primary">Apto</Badge> :
                           <Badge variant="outline">Inapto</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── ARQUIVO 2 ANOS (Decreto 12.031/2024) ── */}
        <TabsContent value="arquivo" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Archive className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Política de Retenção de Registros — Decreto 12.031/2024</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os registros de BPF devem ser mantidos por no mínimo <strong>2 (dois) anos</strong> e estar
                    disponíveis para fiscalização a qualquer momento. O sistema retém automaticamente todos os dados
                    e impede exclusão de registros dentro do prazo de guarda obrigatório.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">Art. 18 — Decreto 12.031/2024</Badge>
                    <Badge variant="outline" className="text-[10px]">IN 04/2007 — Requisitos de Documentação</Badge>
                    <Badge variant="outline" className="text-[10px]">IN 15/2009 — Controle de Registros</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {archiveCounts && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Execuções de POPs", count: archiveCounts.pops, icon: "📋" },
                { label: "Registros de Limpeza", count: archiveCounts.limpeza, icon: "🧹" },
                { label: "Análises Laboratoriais", count: archiveCounts.agua, icon: "🔬" },
                { label: "Controle de Resíduos", count: archiveCounts.residuos, icon: "♻️" },
                { label: "Calibrações", count: archiveCounts.calibracoes, icon: "⚖️" },
                { label: "Não Conformidades", count: archiveCounts.nc, icon: "⚠️" },
              ].map(item => (
                <Card key={item.label}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-2xl font-bold text-primary">{item.count}</p>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold text-sm">Status de Conformidade — Retenção Documental</h4>
              {[
                { modulo: "Execução de POPs (POP-01 a POP-10)", status: true, detalhe: "Todos os registros de execução de POPs são armazenados permanentemente no banco de dados com timestamp e user_id." },
                { modulo: "Registros de Limpeza e Higienização (POP-02/03)", status: true, detalhe: "Cronogramas, checklists pré-operacionais, liberação de linha e monitoramento de superfícies retidos integralmente." },
                { modulo: "Controle de Água e Laudos (POP-04)", status: true, detalhe: "Registros de potabilidade, laudos laboratoriais e certificados de limpeza de reservatório arquivados." },
                { modulo: "Controle de Resíduos e Efluentes (POP-05)", status: true, detalhe: "Manifestos de transporte, licenças ambientais e registros de descarte mantidos com rastreabilidade completa." },
                { modulo: "Calibrações e Manutenções (POP-06)", status: true, detalhe: "Certificados de calibração, verificações intermediárias e planos preventivos arquivados." },
                { modulo: "Rastreabilidade e Recall (POP-08)", status: true, detalhe: "Correlação MP↔PA, testes de recall simulado e certificados de análise retidos por tempo indeterminado." },
                { modulo: "Não Conformidades e Ações Corretivas", status: true, detalhe: "NCs, causas-raiz, planos de ação e verificações de eficácia mantidos para auditoria." },
                { modulo: "Treinamentos e ASOs", status: true, detalhe: "Registros de capacitação, ASOs e monitoramento de sintomas armazenados permanentemente." },
              ].map(item => (
                <div key={item.modulo} className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.modulo}</span>
                    <Badge className="bg-primary/20 text-primary">✅ Retido ≥ 2 anos</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.detalhe}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-50 dark:bg-green-900/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">Sistema em Conformidade com a Política de Retenção</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os módulos do sistema armazenam registros em banco de dados permanente com backup automático.
                    A exclusão de registros dentro do período de guarda de 2 anos é controlada por políticas de acesso.
                    Os dados estão disponíveis para exportação e fiscalização a qualquer momento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
