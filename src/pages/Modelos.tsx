import { useState } from "react";
import { Lock, Unlock, Download, FileText, BookOpen, ClipboardList, Table2, Shield, Wrench, FlaskConical, Bug, Droplets, Activity, Users, Truck, Printer, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";
import { TEMPLATE_GENERATORS } from "@/utils/excelTemplates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PrintableTemplate } from "@/components/PrintableTemplate";
import { printElement } from "@/utils/printUtils";


interface ModeloDoc {
  nome: string;
  descricao: string;
  categoria: string;
  arquivo: string;
  novo?: boolean;
}

const MODELOS: ModeloDoc[] = [
  // Manual
  { nome: "Manual BPF", descricao: "Manual de Boas Práticas de Fabricação completo (IN 04/2007)", categoria: "manual", arquivo: "Manual_BPF" },

  // POPs atualizados conforme estrutura do sistema (10 POPs)
  { nome: "POP 01 — Qualificação de Fornecedores", descricao: "Seleção, avaliação e qualificação de fornecedores de matérias-primas", categoria: "pop", arquivo: "POP-01" },
  { nome: "POP 02 — Limpeza de Instalações e Equipamentos", descricao: "Higienização de instalações, equipamentos e utensílios (IN 04/2007)", categoria: "pop", arquivo: "POP-02" },
  { nome: "POP 03 — Higiene e Saúde Pessoal", descricao: "Exames médicos, monitoramento de adornos, uniformes e EPIs (IN 04/2007)", categoria: "pop", arquivo: "POP-03" },
  { nome: "POP 04 — Potabilidade da Água", descricao: "Controle de potabilidade, cloro residual e laudos laboratoriais", categoria: "pop", arquivo: "POP-04" },
  { nome: "POP 05 — Prevenção de Contaminação Cruzada", descricao: "Sequenciamento, flushing, matriz de sensibilidade (IN 04/2007 e IN 15/2009)", categoria: "pop", arquivo: "POP-05" },
  { nome: "POP 06 — Manutenção e Calibração", descricao: "Manutenção preventiva/corretiva separada de calibração de balanças", categoria: "pop", arquivo: "POP-06" },
  { nome: "POP 07 — Controle Integrado de Pragas", descricao: "Manejo integrado de pragas e controle de expurgo de grãos", categoria: "pop", arquivo: "POP-07" },
  { nome: "POP 08 — Controle de Resíduos e Efluentes", descricao: "Destinação de resíduos, produtos avariados/vencidos e manifestos", categoria: "pop", arquivo: "POP-08" },
  { nome: "POP 09 — Rastreabilidade e Recall", descricao: "Rastreabilidade de lotes e procedimento de recolhimento", categoria: "pop", arquivo: "POP-09" },
  { nome: "POP 10 — PAC (Autocontrole)", descricao: "Programa de Autocontrole consolidado conforme MAPA", categoria: "pop", arquivo: "POP-10", novo: true },

  // Planilhas por POP
  { nome: "PL POP 1.1–1.8 — Fornecedores", descricao: "Qualificação, recebimento MP/embalagens, lotes internos e expurgo", categoria: "planilha", arquivo: "PL_POP_1" },
  { nome: "PL POP 2.1–2.4 — Limpeza", descricao: "Registros de limpeza diária, semanal, mensal e veículos", categoria: "planilha", arquivo: "PL_POP_2" },
  { nome: "PL POP 3.1 — Higiene Pessoal", descricao: "Checklist de higiene, saúde, adornos, ASOs e visitantes", categoria: "planilha", arquivo: "PL_POP_3" },
  { nome: "PL POP 4.1–4.3 — Água", descricao: "Controle de cloro, reservatórios e laudos laboratoriais", categoria: "planilha", arquivo: "PL_POP_4" },
  { nome: "PL POP 5.1–5.2 — Contaminação Cruzada", descricao: "Checklist de prevenção e monitoramento de limpeza", categoria: "planilha", arquivo: "PL_POP_5" },
  { nome: "PL POP 6.1–6.4 — Manutenção/Calibração", descricao: "Cronograma, calibrações, ordens de serviço e lista de equipamentos", categoria: "planilha", arquivo: "PL_POP_6" },
  { nome: "PL POP 7.1–7.3 — Pragas", descricao: "Monitoramento semanal, controle mensal e observação diária para chão de fábrica (presença detectada de roedores, aves e insetos)", categoria: "planilha", arquivo: "PL_POP_7" },
  { nome: "PL POP 8.1 — Resíduos", descricao: "Controle de resíduos e manifestos de transporte", categoria: "planilha", arquivo: "PL_POP_8" },
  { nome: "PL POP 9.1–9.2 — Rastreabilidade", descricao: "Rastreabilidade de lotes, testes e registro de recall", categoria: "planilha", arquivo: "PL_POP_9" },

  // Novos — funcionalidades desenvolvidas no projeto
  { nome: "Planilha — Recebimento de MP", descricao: "Recebimento com certificado de análise, temperatura e odor", categoria: "formulario", arquivo: "Form_Recebimento_MP", novo: true },
  { nome: "Planilha — Ordem de Produção", descricao: "OP com fórmula, batidas, retrabalho e sobras", categoria: "formulario", arquivo: "Form_Ordem_Producao", novo: true },
  { nome: "Planilha — Validação Limpeza de Linha", descricao: "Flushing e sequenciamento para contaminação cruzada (IN 15/2009)", categoria: "formulario", arquivo: "Form_Validacao_Limpeza", novo: true },
  { nome: "Matriz de Sensibilidade", descricao: "Matriz produto anterior × seguinte para limpeza de linha", categoria: "formulario", arquivo: "Form_Matriz_Sensibilidade", novo: true },
  { nome: "Controle de Substâncias Indesejáveis", descricao: "Monitoramento de micotoxinas, metais pesados e contaminantes", categoria: "formulario", arquivo: "Form_Substancias", novo: true },
  { nome: "Análises Laboratoriais", descricao: "Registro de análises físico-químicas e microbiológicas", categoria: "formulario", arquivo: "Form_Analises_Lab", novo: true },
  { nome: "Reclamações de Qualidade (SAC)", descricao: "Registro de reclamações com análise de causa e recolhimento", categoria: "formulario", arquivo: "Form_Reclamacoes", novo: true },
  { nome: "Saúde de Manipuladores", descricao: "Exames admissionais, periódicos e demissionais com ASO", categoria: "formulario", arquivo: "Form_Saude_Manipuladores", novo: true },
  { nome: "Controle de Visitantes", descricao: "Registro de visitantes com EPI e orientação de biosseguridade", categoria: "formulario", arquivo: "Form_Visitantes", novo: true },

  // Expedição (POP 09)
  { nome: "PL POP 9.2 — Expedição (Lista Simples)", descricao: "Modelo padrão para registro manual de expedição: data, NF, cliente, lote, produto e quantidade. Use no POP-09.", categoria: "planilha", arquivo: "Form_Expedicao_Simples", novo: true },
  { nome: "Registro de Expedição Completo (por NF)", descricao: "Modelo detalhado por nota fiscal — cliente, transporte, motorista, lotes e assinaturas. Opcional para fábricas que preferem registro completo por NF.", categoria: "formulario", arquivo: "Form_Expedicao_Completa", novo: true },

  // Potabilidade da Água (POP 04)
  { nome: "Planilha — Controle Diário de Cloro/pH", descricao: "Registro diário de cloro residual e pH por ponto de coleta (POP 04)", categoria: "formulario", arquivo: "Form_Cloro_Diario", novo: true },
  { nome: "Planilha — Higienização de Reservatório", descricao: "Checklist de 16 itens para limpeza semestral de caixas d'água", categoria: "formulario", arquivo: "Form_Higienizacao_Reservatorio", novo: true },

  // Saúde Pessoal (POP 03 - ASO)
  { nome: "Planilha — Controle de ASOs", descricao: "Cadastro de colaboradores com datas de ASO, vencimento e tipo de exame", categoria: "formulario", arquivo: "Form_Controle_ASO", novo: true },
  { nome: "Planilha — Monitoramento Diário de Saúde", descricao: "Checklist diário de sintomas, uniformes e condições de saúde dos manipuladores", categoria: "formulario", arquivo: "Form_Monitoramento_Saude", novo: true },

  // Equipamentos
  { nome: "Lista de Equipamentos", descricao: "Inventário completo de equipamentos industriais", categoria: "equipamento", arquivo: "Lista_Equipamentos" },
  { nome: "Lista de Balanças / Calibração", descricao: "Balanças com certificados e verificação intermediária", categoria: "equipamento", arquivo: "Lista_Balancas" },

  // Auditorias e Gestão
  { nome: "Checklist de Auditoria BPF", descricao: "Checklist completo conforme Decreto 12.031/2024", categoria: "auditoria", arquivo: "Checklist_Auditoria", novo: true },
  { nome: "Matriz de Risco (APPCC)", descricao: "Identificação de perigos, severidade e medidas de controle", categoria: "auditoria", arquivo: "Matriz_Risco", novo: true },
  { nome: "Não Conformidades / Plano de Ação", descricao: "Registro de NC com causa raiz e ações corretivas", categoria: "auditoria", arquivo: "NC_Plano_Acao", novo: true },
  { nome: "Planejamento Anual BPF", descricao: "Cronograma anual de atividades obrigatórias", categoria: "auditoria", arquivo: "Planejamento_Anual", novo: true },

  // Treinamentos
  { nome: "Cronograma de Treinamentos", descricao: "Calendário anual de capacitações", categoria: "treinamento", arquivo: "Cronograma_Treinamentos" },
  { nome: "Lista de Presença", descricao: "Modelo de lista de presença para treinamentos", categoria: "treinamento", arquivo: "Lista_Presenca" },

  // Produtos e Rótulos
  { nome: "Ficha Técnica de Produto", descricao: "Ficha técnica completa com níveis de garantia", categoria: "produto", arquivo: "Ficha_Tecnica_Produto", novo: true },
  { nome: "Modelo de Rótulo (Ração/Suplemento/Sal)", descricao: "Rótulo conforme IN 22/2009 e IN 12/2004", categoria: "produto", arquivo: "Modelo_Rotulo", novo: true },

  // Checklist de Registro
  { nome: "Checklist — Registro de Fábrica de Rações (MAPA)", descricao: "Checklist completo com 14 áreas para registro de estabelecimento no MAPA/SIPEAGRO", categoria: "auditoria", arquivo: "Checklist_Registro_Fabrica", novo: true },

  // Referências Técnicas Laboratoriais
  { nome: "Tabela de Desvios Analíticos — CBAA 2017", descricao: "Tolerâncias analíticas oficiais (Sindirações) para 38 parâmetros (PB, FB, minerais, vitaminas, micotoxinas). Aplicar antes de classificar não conformidade de rótulo.", categoria: "formulario", arquivo: "Tabela_Desvios_Analiticos_CBAA", novo: true },

  // Instruções de Trabalho (ITs)
  { nome: "IT-01-01 — Avaliação e Qualificação de Fornecedor", descricao: "Qualificação inicial com SIPEAGRO, documentação e nota de avaliação", categoria: "instrucao", arquivo: "IT-01-01", novo: true },
  { nome: "IT-01-02 — Recebimento de MP a Granel", descricao: "Inspeção de grãos: umidade, odor, insetos e contraprova", categoria: "instrucao", arquivo: "IT-01-02", novo: true },
  { nome: "IT-01-03 — Recebimento de MP Ensacada", descricao: "Inspeção de ensacados: embalagem, rótulo, peso e certificado", categoria: "instrucao", arquivo: "IT-01-03", novo: true },
  { nome: "IT-02-01 — Limpeza a Seco de Produção", descricao: "Varrição e aspiração de áreas produtivas por turno", categoria: "instrucao", arquivo: "IT-02-01", novo: true },
  { nome: "IT-02-02 — Limpeza Úmida e Sanitização", descricao: "Lavagem e sanitização de áreas de apoio com hipoclorito", categoria: "instrucao", arquivo: "IT-02-02", novo: true },
  { nome: "IT-02-03 — Limpeza de Silos e Transportadores", descricao: "Higienização de silos e linhas de transporte (IN 15/2009)", categoria: "instrucao", arquivo: "IT-02-03", novo: true },
  { nome: "IT-03-01 — Higiene Pessoal na Entrada", descricao: "Procedimento de entrada com lavagem de mãos, EPI e pedilúvio", categoria: "instrucao", arquivo: "IT-03-01", novo: true },
  { nome: "IT-03-02 — Controle de ASOs", descricao: "Gerenciamento de exames médicos e validade dos ASOs", categoria: "instrucao", arquivo: "IT-03-02", novo: true },
  { nome: "IT-04-01 — Coleta de Amostras de Água", descricao: "Coleta em pontos estratégicos para análise de potabilidade", categoria: "instrucao", arquivo: "IT-04-01", novo: true },
  { nome: "IT-04-02 — Higienização de Reservatórios", descricao: "Limpeza e sanitização de caixas d'água semestralmente", categoria: "instrucao", arquivo: "IT-04-02", novo: true },
  { nome: "IT-05-01 — Sequenciamento e Flushing", descricao: "Ordem de produção e flushing para prevenção de carry-over (IN 15/2009)", categoria: "instrucao", arquivo: "IT-05-01", novo: true },
  { nome: "IT-05-02 — Teste de Carry-Over", descricao: "Análise laboratorial de arraste de medicamentos pós-flushing", categoria: "instrucao", arquivo: "IT-05-02", novo: true },
  { nome: "IT-06-01 — Manutenção Preventiva", descricao: "Manutenção de moinhos, misturadores e peletizadoras", categoria: "instrucao", arquivo: "IT-06-01", novo: true },
  { nome: "IT-06-02 — Verificação de Balanças", descricao: "Verificação intermediária com pesos padrão certificados", categoria: "instrucao", arquivo: "IT-06-02", novo: true },
  { nome: "IT-07-01 — Monitoramento de Pragas", descricao: "Inspeção semanal de armadilhas, iscas e barreiras físicas", categoria: "instrucao", arquivo: "IT-07-01", novo: true },
  { nome: "IT-07-02 — Barreiras Físicas Anti-Pragas", descricao: "Inspeção e manutenção de telas, vedações e ralos", categoria: "instrucao", arquivo: "IT-07-02", novo: true },
  { nome: "IT-08-01 — Segregação e Coleta de Resíduos", descricao: "Classificação, acondicionamento e destinação de resíduos", categoria: "instrucao", arquivo: "IT-08-01", novo: true },
  { nome: "IT-08-02 — Descarte de Produtos NC", descricao: "Descarte de produtos vencidos, contaminados ou avariados", categoria: "instrucao", arquivo: "IT-08-02", novo: true },
  { nome: "IT-09-01 — Rastreabilidade de Lote", descricao: "Rastreio bidirecional: MP → Produto → Cliente", categoria: "instrucao", arquivo: "IT-09-01", novo: true },
  { nome: "IT-09-02 — Procedimento de Recall", descricao: "Recolhimento de produto com comunicação e rastreio (Decreto 12.031/2024)", categoria: "instrucao", arquivo: "IT-09-02", novo: true },
  { nome: "IT-10-01 — Auditoria Interna BPF", descricao: "Execução de auditoria semestral com checklist e relatório", categoria: "instrucao", arquivo: "IT-10-01", novo: true },
  { nome: "IT-10-02 — Análise de Indicadores", descricao: "Monitoramento mensal de KPIs e apresentação à direção", categoria: "instrucao", arquivo: "IT-10-02", novo: true },
];

const categoriaIcons: Record<string, React.ElementType> = {
  manual: BookOpen,
  pop: FileText,
  planilha: Table2,
  formulario: ClipboardList,
  equipamento: Wrench,
  treinamento: Users,
  auditoria: Shield,
  produto: FlaskConical,
  instrucao: ClipboardList,
};

const categoriaLabels: Record<string, string> = {
  manual: "Manual",
  pop: "POPs",
  planilha: "Planilhas POP",
  formulario: "Formulários",
  equipamento: "Equipamentos",
  treinamento: "Treinamentos",
  auditoria: "Auditoria/Gestão",
  produto: "Produtos/Rótulos",
  instrucao: "Instruções de Trabalho",
};

export default function Modelos() {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [senha, setSenha] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [filtro, setFiltro] = useState<string>("todos");
  const [selectedModelo, setSelectedModelo] = useState<ModeloDoc | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const verificarSenha = async () => {
    if (!senha.trim()) { toast.error("Digite a senha de acesso"); return; }
    setVerificando(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/modelos-verify-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ senha: senha.trim() }),
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setDesbloqueado(true);
        toast.success("Acesso liberado! Bem-vindo à biblioteca de modelos.");
      } else {
        toast.error(result.error || "Senha incorreta");
      }
    } catch {
      toast.error("Erro ao verificar senha");
    } finally {
      setVerificando(false);
    }
  };

  const modelosFiltrados = filtro === "todos" ? MODELOS : MODELOS.filter(m => m.categoria === filtro);
  const categorias = ["todos", ...Object.keys(categoriaLabels)];

  const handleDownload = (modelo: ModeloDoc) => {
    const generator = TEMPLATE_GENERATORS[modelo.arquivo];
    if (generator) {
      generator();
      toast.success(`${modelo.nome} — Excel gerado com sucesso!`);
    } else {
      toast.info(`${modelo.nome} — modelo em PDF será disponibilizado em breve`);
    }
  };

  const handlePreview = (modelo: ModeloDoc) => {
    setSelectedModelo(modelo);
    setShowPreview(true);
  };

  const handlePrint = () => {
    if (selectedModelo) {
      printElement("printable-area", selectedModelo.nome);
    }
  };

  // Simplified data for preview based on the template name
  const getPreviewData = (arquivo: string): (string | number | boolean | null)[][] => {
    switch (arquivo) {
      case "PL_POP_1":
        return [
          ["Nº", "Fornecedor", "CNPJ", "Registro MAPA", "Produtos", "Status"],
          ...Array.from({ length: 15 }, (_, i) => [i + 1, "", "", "", "", ""])
        ];
      case "PL_POP_2":
        return [
          ["Data", "Área/Equipamento", "Tipo Limpeza", "Produto", "Hora Início", "Hora Fim", "Conforme", "Executor"],
          ...Array.from({ length: 15 }, () => ["", "", "☐Seca ☐Úmida", "", "", "", "☐C ☐NC", ""])
        ];
      case "PL_POP_4":
        return [
          ["Data", "Ponto de Coleta", "Hora", "Cloro (mg/L)", "pH", "Conforme", "Responsável"],
          ...Array.from({ length: 15 }, () => ["", "", "", "", "", "☐C ☐NC", ""])
        ];
      case "Form_Cloro_Diario":
        return [
          ["Data", "Ponto", "Hora", "Cloro Residual", "pH", "Conforme", "Ação Corretiva", "Resp."],
          ...Array.from({ length: 20 }, () => ["", "", "", "", "", "☐", "", ""])
        ];
      default:
        return [
          ["Data", "Descrição", "Informação 1", "Informação 2", "Conforme", "Responsável"],
          ...Array.from({ length: 15 }, () => ["", "", "", "", "☐", ""])
        ];
    }
  };


  const totalNovos = MODELOS.filter(m => m.novo).length;

  if (!desbloqueado) {
    return (
      <div className="space-y-6">
        <PageHeader title="📁 Biblioteca de Modelos" description={`${MODELOS.length} documentos padrão para implantação BPF`} />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md border-primary/30 shadow-lg">
            <CardHeader className="text-center">
              <Lock className="w-16 h-16 mx-auto text-primary/40 mb-4" />
              <CardTitle className="text-xl">Área Restrita</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Biblioteca com {MODELOS.length} modelos ({totalNovos} novos) para implantação BPF.
                Acesso exclusivo para clientes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Digite a senha de acesso"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === "Enter" && verificarSenha()}
                className="text-center text-lg tracking-wider"
              />
              <Button className="w-full" onClick={verificarSenha} disabled={verificando}>
                {verificando ? "Verificando..." : "Desbloquear Acesso"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Solicite sua senha ao responsável técnico
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="📁 Biblioteca de Modelos"
        description={`${MODELOS.length} documentos — ${totalNovos} novos modelos adicionados`}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Unlock className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-primary">Acesso ativo</span>
        <span className="text-muted-foreground mx-2">|</span>
        {categorias.map(cat => (
          <Button
            key={cat}
            variant={filtro === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro(cat)}
          >
            {cat === "todos" ? `Todos (${MODELOS.length})` : categoriaLabels[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelosFiltrados.map(modelo => {
          const Icon = categoriaIcons[modelo.categoria] || FileText;
          return (
            <Card key={modelo.arquivo} className="hover:shadow-md transition-shadow border-border/50 relative">
              {modelo.novo && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                  NOVO
                </span>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight">{modelo.nome}</CardTitle>
                    <span className="text-xs text-muted-foreground mt-1 inline-block px-2 py-0.5 bg-muted rounded-full">
                      {categoriaLabels[modelo.categoria]}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{modelo.descricao}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => handleDownload(modelo)}>
                  <Download className="w-4 h-4 mr-1" /> {TEMPLATE_GENERATORS[modelo.arquivo] ? "Baixar Excel" : "Baixar PDF"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
