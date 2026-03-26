import { useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronRight, BookOpen, FileText, Droplets, Users,
  ShieldCheck, Wrench, Bug, Recycle, Search, Beaker, ClipboardCheck,
  Upload
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { POP_TEXTOS } from "@/config/popTextos";
import { POPS_CONFIG } from "@/config/popsConfig";

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
    </div>
  );
}

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

const popSections: GuiaSection[] = POP_TEXTOS.map((pop) => ({
  id: pop.codigo.toLowerCase().replace("-", ""),
  title: `${pop.codigo.replace("-", " ")} — ${pop.nome}`,
  icon: POP_ICONS[pop.codigo] || FileText,
  badge: pop.codigo,
  content: <PopContent codigo={pop.codigo} />,
}));

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

const sections: GuiaSection[] = [fluxoGeralSection, ...popSections, digitalizacaoSection];

export default function GuiaPops() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const toggleSection = (id: string) => setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  const expandAll = () => { const all: Record<string, boolean> = {}; sections.forEach((s) => (all[s.id] = true)); setOpenSections(all); };
  const collapseAll = () => setOpenSections({});

  return (
    <>
      <PageHeader icon={BookOpen} title="Guia dos POPs — IN 04/2007" description="Textos procedimentais completos dos 9 POPs obrigatórios com orientações de preenchimento" />
      <div className="flex gap-2 mb-6">
        <button onClick={expandAll} className="text-sm text-primary hover:underline font-medium">Expandir tudo</button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-sm text-primary hover:underline font-medium">Recolher tudo</button>
      </div>
      <div className="space-y-3">
        {sections.map((section) => (
          <AccordionCard key={section.id} section={section} isOpen={openSections[section.id] ?? false} onToggle={() => toggleSection(section.id)} />
        ))}
      </div>
    </>
  );
}
