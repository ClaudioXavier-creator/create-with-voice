import { useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronRight, BookOpen, FileText, Droplets, Users,
  ShieldCheck, Wrench, Bug, Recycle, Search, Beaker, ClipboardCheck,
  Upload, ListChecks, Hammer, ShieldAlert, Clock, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { POP_TEXTOS } from "@/config/popTextos";
import { POPS_CONFIG } from "@/config/popsConfig";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import { DOCUMENTOS_ATIVACAO_CHECKLIST } from "@/config/documentosAtivacaoChecklist";

interface GuiaSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  content: React.ReactNode;
}

function AccordionCard({ section, isOpen, onToggle }: { section: GuiaSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;
  return (
    <Card className="border border-border transition-shadow hover:shadow-md">
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="flex flex-row items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              {section.badge && <Badge variant="secondary" className="text-xs">{section.badge}</Badge>}
            </div>
          </div>
          {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
        </CardHeader>
      </button>
      <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0")}>
        <CardContent className="pt-0 space-y-4">{section.content}</CardContent>
      </div>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-foreground/80">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex gap-2 items-start">
      <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

const POP_ICONS: Record<string, React.ElementType> = {
  "POP-01": Users, "POP-02": Droplets, "POP-03": ClipboardCheck, "POP-04": Beaker,
  "POP-05": ShieldCheck, "POP-06": Wrench, "POP-07": Bug, "POP-08": Recycle, "POP-09": Search,
  "POP-10": FileText,
};

function PopContent({ codigo }: { codigo: string }) {
  const texto = POP_TEXTOS.find(p => p.codigo === codigo);
  const config = POPS_CONFIG.find(p => p.codigo === codigo);
  if (!texto) return null;

  return (
    <div className="space-y-5">
      <div><h4 className="text-sm font-semibold mb-1">1. Objetivo</h4><p className="text-sm text-muted-foreground">{texto.objetivo}</p></div>
      <div><h4 className="text-sm font-semibold mb-1">2. Campo de Aplicação</h4><p className="text-sm text-muted-foreground">{texto.campoAplicacao}</p></div>
      <div>
        <h4 className="text-sm font-semibold mb-1">3. Documentos de Referência</h4>
        <ul className="list-disc list-inside space-y-0.5">{texto.documentosReferencia.map((doc, i) => <li key={i} className="text-sm text-muted-foreground">{doc}</li>)}</ul>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">4. Definições</h4>
        <div className="space-y-1.5">{texto.definicoes.map((def, i) => <div key={i} className="text-sm"><span className="font-medium text-foreground">{def.termo}:</span> <span className="text-muted-foreground">{def.definicao}</span></div>)}</div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">5. Procedimentos</h4>
        <div className="space-y-1.5">{texto.procedimentos.map((proc, i) => <div key={i} className="flex gap-2 text-sm"><span className="text-primary font-bold shrink-0">•</span><span className="text-muted-foreground">{proc}</span></div>)}</div>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">6. Monitoramento</h4>
        <Table><TableBody>
          <TableRow><TableCell className="font-medium text-sm w-32">Controle</TableCell><TableCell className="text-sm text-muted-foreground">{texto.monitoramento.controle}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Frequência</TableCell><TableCell className="text-sm text-muted-foreground">{texto.monitoramento.frequencia}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Registro</TableCell><TableCell className="text-sm text-muted-foreground">{texto.monitoramento.registro}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Responsável</TableCell><TableCell className="text-sm text-muted-foreground">{texto.monitoramento.responsavel}</TableCell></TableRow>
        </TableBody></Table>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">7. Verificação</h4>
        <Table><TableBody>
          <TableRow><TableCell className="font-medium text-sm w-32">Controle</TableCell><TableCell className="text-sm text-muted-foreground">{texto.verificacao.controle}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Frequência</TableCell><TableCell className="text-sm text-muted-foreground">{texto.verificacao.frequencia}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Registro</TableCell><TableCell className="text-sm text-muted-foreground">{texto.verificacao.registro}</TableCell></TableRow>
          <TableRow><TableCell className="font-medium text-sm">Responsável</TableCell><TableCell className="text-sm text-muted-foreground">{texto.verificacao.responsavel}</TableCell></TableRow>
        </TableBody></Table>
        <Tip>O verificador nunca pode ser o mesmo que monitora e vice-versa.</Tip>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">8. Ações Corretivas</h4>
        <Table>
          <TableHeader><TableRow><TableHead className="w-[40%]">Não Conformidade</TableHead><TableHead>Ação Corretiva</TableHead></TableRow></TableHeader>
          <TableBody>{texto.acoesCorretivas.map((ac, i) => <TableRow key={i}><TableCell className="text-sm">{ac.naoConformidade}</TableCell><TableCell className="text-sm text-muted-foreground">{ac.acao}</TableCell></TableRow>)}</TableBody>
        </Table>
      </div>
      <div className="bg-muted/50 rounded-lg p-3"><p className="text-sm"><span className="font-medium">Tempo de retenção dos registros:</span> <span className="text-muted-foreground">{texto.tempoRetencao}</span></p></div>
      {config?.anexos && config.anexos.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2">9. Anexos — Planilhas de Controle</h4>
          <ul className="space-y-1">{config.anexos.map((anexo, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary">📋</span> {anexo}</li>)}</ul>
        </div>
      )}

      {/* ── Instruções de Trabalho (ITs) ── */}
      {(() => {
        const its = INSTRUCOES_TRABALHO.filter(it => it.popCodigo === codigo);
        if (its.length === 0) return null;
        return (
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              10. Instruções de Trabalho (ITs) — exclusivas do {codigo}
              <Badge variant="secondary" className="text-xs">{its.length} IT(s)</Badge>
            </h4>
            <p className="text-[11px] text-muted-foreground mb-3">
              Todas as instruções abaixo pertencem exclusivamente a <strong>{codigo}</strong>. ITs de outros POPs aparecem nas abas correspondentes.
            </p>
            <div className="space-y-4">
              {its.map((it) => (
                <div key={it.id} className="border-l-4 border-primary rounded-lg p-4 bg-muted/20 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-2 flex-wrap">
                        <Badge className="bg-primary text-primary-foreground text-[10px]">{it.popCodigo}</Badge>
                        <Badge variant="outline" className="text-xs font-mono">{it.id}</Badge>
                        {it.titulo}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{it.objetivo}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{it.frequencia}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    {it.materiais.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold flex items-center gap-1 mb-1">
                          <Package className="w-3 h-3 text-primary" /> Materiais
                        </p>
                        <ul className="space-y-0.5">
                          {it.materiais.map((m, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-primary">•</span>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {it.epis.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold flex items-center gap-1 mb-1">
                          <ShieldAlert className="w-3 h-3 text-destructive" /> EPIs Necessários
                        </p>
                        <ul className="space-y-0.5">
                          {it.epis.map((e, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-destructive">•</span>{e}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold mb-1">Passo a Passo:</p>
                    <div className="space-y-1.5">
                      {it.passos.map((p, i) => (
                        <div key={i} className="flex gap-2 items-start text-xs">
                          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                          <span className="text-muted-foreground">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                      <Hammer className="w-3 h-3 text-primary" /> Critérios de Aceitação:
                    </p>
                    <ul className="space-y-0.5">
                      {it.criteriosAceitacao.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex gap-1"><span className="text-primary">✓</span>{c}</li>
                      ))}
                    </ul>
                  </div>

                  {it.registroVinculado && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Registro vinculado: <span className="font-medium">{it.registroVinculado}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Seções do Guia ──

const fluxoGeralSection: GuiaSection = {
  id: "fluxo-geral",
  title: "Fluxo Geral: Preenchimento → Verificação → Arquivamento",
  icon: FileText,
  badge: "Início",
  content: (
    <div className="space-y-6">
      <div><h4 className="text-sm font-semibold mb-3">Passo 1 — Criar Planilha Mensal</h4><div className="space-y-2"><Step n={1}>Acesse o módulo <b>Planilhas POP</b> no menu lateral.</Step><Step n={2}>Clique em <b>Nova Planilha</b>.</Step><Step n={3}>Selecione o POP, a periodicidade, mês e ano.</Step><Step n={4}>O sistema gera automaticamente a planilha com as áreas e períodos configurados.</Step></div></div>
      <div><h4 className="text-sm font-semibold mb-3">Passo 2 — Preencher Registros (Digital)</h4><div className="space-y-2"><Step n={1}>Clique em <b>Adicionar Registro</b> na planilha.</Step><Step n={2}>Selecione a área e o período.</Step><Step n={3}>Marque como <b>Conforme (C)</b> ou <b>Não Conforme (NC)</b>.</Step><Step n={4}>Informe o responsável e a função.</Step><Step n={5}>Adicione observações quando houver NC.</Step><Step n={6}>Clique em <b>Salvar</b>.</Step></div></div>
      <div><h4 className="text-sm font-semibold mb-3">Passo 2A — Preencher Registros (Físico/Impresso)</h4><div className="space-y-2"><Step n={1}>Imprima a planilha mensal.</Step><Step n={2}>Preencha manualmente em letra legível.</Step><Step n={3}>Use caneta azul ou preta. <b>Não use lápis.</b></Step><Step n={4}>Em caso de erro, risque com um traço único e rubrique.</Step><Step n={5}><b>Não use corretivo</b> em hipótese alguma.</Step></div></div>
      <div><h4 className="text-sm font-semibold mb-3">Passo 3 — Assinaturas</h4><div className="space-y-2"><Step n={1}>O <b>executor</b> assina ao final de cada turno.</Step><Step n={2}>O <b>supervisor</b> verifica e assina ao final do período.</Step><Step n={3}>O <b>RT</b> assina com CRMV ao final do mês.</Step></div></div>
      <Tip>Formas de registro aceitas: <b>Digital</b>, <b>Físico</b> (impresso + digitalizado), ou <b>Híbrido</b>.</Tip>
    </div>
  ),
};

const docsRegistradosSection: GuiaSection = {
  id: "docs-registrados",
  title: "Tutorial: Aba Docs Registrados — Controle de Versão de Documentos",
  icon: FileText,
  badge: "Tutorial",
  content: (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-2">O que é esta aba?</h4>
        <p className="text-sm text-muted-foreground">
          A aba <b>Docs Registrados</b> serve para registrar e controlar as versões formais dos documentos do sistema de qualidade:
          POPs, Instruções de Trabalho (ITs) e Manual BPF. Ela <b>não registra dados operacionais</b> (como recebimento de matéria-prima).
          É o registro que o auditor consulta para saber qual a versão vigente de cada procedimento.
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Quando usar?</h4>
        <div className="space-y-2">
          <Step n={1}>Quando um POP é <b>criado pela primeira vez</b> — registre como versão 01.</Step>
          <Step n={2}>Quando um POP sofre <b>revisão</b> — registre a nova versão (02, 03...) e altere o status da anterior para "Obsoleto".</Step>
          <Step n={3}>Quando o <b>Manual BPF</b> ou uma <b>IT</b> é atualizado — aplique o mesmo controle de versão.</Step>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Passo a passo do preenchimento</h4>
        <div className="space-y-2">
          <Step n={1}>Clique em <b>"Novo Documento"</b>.</Step>
          <Step n={2}><b>Código:</b> Selecione o POP (POP-01 a POP-10), IT ou MANUAL-BPF na lista.</Step>
          <Step n={3}><b>Nome/Título:</b> O sistema preenche automaticamente ao selecionar um POP. Para ITs, digite o título manualmente.</Step>
          <Step n={4}><b>Versão:</b> Informe o número da versão (ex: 01, 02, 03). A primeira versão é sempre 01.</Step>
          <Step n={5}><b>Responsável:</b> Nome do responsável técnico ou quem elaborou/revisou o documento.</Step>
          <Step n={6}><b>Validade da Revisão:</b> Data até a qual esta versão do documento é considerada válida.</Step>
          <Step n={7}><b>Próxima Revisão:</b> Data programada para a próxima revisão do documento (normalmente 12 meses).</Step>
          <Step n={8}>Clique em <b>Salvar</b>.</Step>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Campos da tabela de registros</h4>
        <Table>
          <TableHeader><TableRow><TableHead>Campo</TableHead><TableHead>Descrição</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell className="font-medium">Código</TableCell><TableCell className="text-sm text-muted-foreground">Identificador do documento (POP-01, IT-001, MANUAL-BPF)</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Nome</TableCell><TableCell className="text-sm text-muted-foreground">Título descritivo do procedimento</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Versão</TableCell><TableCell className="text-sm text-muted-foreground">Número sequencial da versão (01, 02, 03...)</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Revisão</TableCell><TableCell className="text-sm text-muted-foreground">Data em que a revisão foi realizada</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Validade</TableCell><TableCell className="text-sm text-muted-foreground">Data limite de validade da versão atual. Aparece em vermelho se vencida.</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Próx. Revisão</TableCell><TableCell className="text-sm text-muted-foreground">Data programada para a próxima revisão. Aparece em amarelo se nos próximos 30 dias.</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Responsável</TableCell><TableCell className="text-sm text-muted-foreground">Quem elaborou ou revisou o documento</TableCell></TableRow>
            <TableRow><TableCell className="font-medium">Status</TableCell><TableCell className="text-sm text-muted-foreground">Ativo (versão vigente), Em Revisão (sendo atualizado), Obsoleto (versão antiga)</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Boas práticas</h4>
        <div className="space-y-2">
          <Step n={1}>Nunca delete uma versão antiga — marque como <b>"Obsoleto"</b> para manter o histórico.</Step>
          <Step n={2}>A cada nova versão, incremente o número (01 → 02 → 03).</Step>
          <Step n={3}>Programe a próxima revisão com <b>12 meses</b> de intervalo ou conforme exigência do MAPA.</Step>
          <Step n={4}>Monitore as datas de validade e próxima revisão para evitar documentos vencidos.</Step>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">Checklist exato para ativar planilhas físicas e digitais</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Versão</TableHead>
              <TableHead>Revisão</TableHead>
              <TableHead>Próx. revisão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Responsável</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {DOCUMENTOS_ATIVACAO_CHECKLIST.map((item) => (
              <TableRow key={item.codigo}>
                <TableCell className="font-medium">{item.codigo}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.nome}</TableCell>
                <TableCell>{item.versao}</TableCell>
                <TableCell>{item.dataRevisao}</TableCell>
                <TableCell>{item.proximaRevisao}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{item.responsavel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Tip>
        O auditor do MAPA sempre verifica se os POPs estão na versão vigente, com data de revisão e responsável registrados.
        Manter esta aba atualizada é essencial para aprovação em auditorias.
      </Tip>
    </div>
  ),
};

const digitalizacaoSection: GuiaSection = {
  id: "digitalizacao",
  title: "Digitalização e Arquivamento",
  icon: Upload,
  badge: "Processo",
  content: (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Padrão de Nomenclatura de Arquivos</h4>
        <Table>
          <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Padrão</TableHead><TableHead>Exemplo</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell>Planilha POP</TableCell><TableCell className="font-mono text-xs">POP-XX_AAAA-MM_periodicidade.pdf</TableCell><TableCell className="text-xs">POP-02_2026-03_diario.pdf</TableCell></TableRow>
            <TableRow><TableCell>Laudo laboratorial</TableCell><TableCell className="font-mono text-xs">LAUDO_produto_AAAA-MM-DD.pdf</TableCell><TableCell className="text-xs">LAUDO_racao-corte_2026-03-15.pdf</TableCell></TableRow>
            <TableRow><TableCell>Certificado calibração</TableCell><TableCell className="font-mono text-xs">CALIB_equipamento_AAAA.pdf</TableCell><TableCell className="text-xs">CALIB_balanca-pesagem_2026.pdf</TableCell></TableRow>
          </TableBody>
        </Table>
      </div>
      <Tip>Mantenha cópias digitalizadas de todas as planilhas físicas para backup e auditorias.</Tip>
    </div>
  ),
};

// Seções dos POPs na ordem correta (POP-01 a POP-10)
const popSections: GuiaSection[] = POP_TEXTOS.map((pop) => ({
  id: pop.codigo.toLowerCase().replace("-", ""),
  title: `${pop.codigo.replace("-", " ")} — ${pop.nome}`,
  icon: POP_ICONS[pop.codigo] || FileText,
  badge: pop.codigo,
  content: <PopContent codigo={pop.codigo} />,
}));

// Ordem final: Fluxo Geral → POP 01 a POP 10 → Tutoriais auxiliares
const sections: GuiaSection[] = [
  fluxoGeralSection,
  ...popSections,
  docsRegistradosSection,
  digitalizacaoSection,
];

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function GuiaPops() {
  const [activeTab, setActiveTab] = useState(sections[0].id);

  return (
    <>
      <PageHeader 
        icon={BookOpen} 
        title="Guia dos POPs — IN 04/2007" 
        description="Textos procedimentais completos dos 10 POPs obrigatórios com Instruções de Trabalho, orientações de preenchimento e digitalização" 
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max h-auto p-1 bg-muted/50">
            {sections.map((section) => (
              <TabsTrigger 
                key={section.id} 
                value={section.id}
                className="px-4 py-2.5 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
              >
                <div className="flex flex-col items-center gap-1">
                  <section.icon className="w-4 h-4" />
                  <span>{section.badge || section.title.split(" — ")[0]}</span>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-0 focus-visible:outline-none focus-visible:ring-0">
            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center gap-3 bg-muted/30 border-b border-border/50">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                  <section.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">{section.title}</CardTitle>
                  {section.badge && <Badge variant="secondary" className="mt-1">{section.badge}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {section.content}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
