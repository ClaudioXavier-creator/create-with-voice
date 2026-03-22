import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Plus, Download, Check, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { POPS_CONFIG, type PopConfig, type PopPeriodicidade } from "@/config/popsConfig";
import PopPlanilhaForm from "@/components/pop/PopPlanilhaForm";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function PlanilhasPop() {
  const { user } = useAuth();
  const [selectedPop, setSelectedPop] = useState<PopConfig>(POPS_CONFIG[1]); // POP-02 default
  const [selectedPeriodicidade, setSelectedPeriodicidade] = useState<PopPeriodicidade | null>(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [planilhaId, setPlanilhaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (selectedPop.periodicidades.length > 0) {
      setSelectedPeriodicidade(selectedPop.periodicidades[0]);
    }
  }, [selectedPop]);

  const loadOrCreatePlanilha = useCallback(async (per?: PopPeriodicidade) => {
    const target = per || selectedPeriodicidade;
    if (!user || !target) return;
    setLoading(true);

    const { data: existing } = await supabase
      .from("pop_planilhas")
      .select("id")
      .eq("user_id", user.id)
      .eq("pop_codigo", selectedPop.codigo)
      .eq("periodicidade", target.key)
      .eq("mes", mes)
      .eq("ano", ano)
      .maybeSingle();

    if (existing) {
      setPlanilhaId(existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("pop_planilhas")
        .insert({
          user_id: user.id,
          pop_codigo: selectedPop.codigo,
          pop_nome: selectedPop.nome,
          periodicidade: target.key,
          mes,
          ano,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Erro ao criar planilha: " + error.message);
        setLoading(false);
        return;
      }
      setPlanilhaId(created.id);
    }

    setLoading(false);
    setShowForm(true);
  }, [user, selectedPop, selectedPeriodicidade, mes, ano]);

  const exportToExcel = async () => {
    if (!planilhaId || !selectedPeriodicidade) return;

    const { data: itens } = await supabase
      .from("pop_planilha_itens")
      .select("*")
      .eq("planilha_id", planilhaId);

    const rows = itens || [];
    const periodos = selectedPeriodicidade.periodos;
    const areas = selectedPeriodicidade.areas;

    // Build CSV
    let csv = `${selectedPop.codigo} - ${selectedPop.nome}\n`;
    csv += `${selectedPeriodicidade.label} - ${MESES[mes - 1]}/${ano}\n\n`;
    csv += `Período,${areas.map((a) => a.area).join(",")},Responsável,Função\n`;

    for (const p of periodos) {
      const cells = areas.map((a) => {
        const item = rows.find((r) => r.periodo_label === p && r.area === a.area);
        if (!item || item.conforme === null) return "-";
        return item.conforme ? "C" : "NC";
      });
      const resp = rows.find((r) => r.periodo_label === p)?.responsavel || "";
      const func = rows.find((r) => r.periodo_label === p)?.funcao || "";
      csv += `${p},${cells.join(",")},${resp},${func}\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedPop.codigo}_${selectedPeriodicidade.key}_${MESES[mes - 1]}_${ano}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Planilha exportada com sucesso!");
  };

  if (showForm && planilhaId && selectedPeriodicidade) {
    return (
      <>
        <PageHeader icon={ClipboardList} title={`${selectedPop.codigo} - ${selectedPeriodicidade.label}`} description={`${MESES[mes - 1]} / ${ano}`} />
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
            ← Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
        </div>
        <PopPlanilhaForm
          planilhaId={planilhaId}
          periodicidade={selectedPeriodicidade}
          userId={user!.id}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader icon={ClipboardList} title="Planilhas de POPs" description="Registros específicos por atividade conforme IN 04/2007" />

      {/* Seleção de POP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">POP</label>
          <Select
            value={selectedPop.codigo}
            onValueChange={(v) => {
              const pop = POPS_CONFIG.find((p) => p.codigo === v);
              if (pop) setSelectedPop(pop);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {POPS_CONFIG.map((p) => (
                <SelectItem key={p.codigo} value={p.codigo}>
                  {p.codigo} - {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Mês</label>
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Ano</label>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descrição do POP */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{selectedPop.codigo} - {selectedPop.nome}</CardTitle>
          <CardDescription>{selectedPop.descricao}</CardDescription>
        </CardHeader>
      </Card>

      {/* Periodicidades disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedPop.periodicidades.map((per) => (
          <Card
            key={per.key}
            className="border border-border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedPeriodicidade(per);
              loadOrCreatePlanilha();
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{per.label}</CardTitle>
                <Badge variant="secondary" className="text-xs">{per.periodos.length} períodos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {per.areas.slice(0, 4).map((a) => (
                  <p key={a.area} className="text-xs text-muted-foreground">• {a.area}</p>
                ))}
                {per.areas.length > 4 && (
                  <p className="text-xs text-muted-foreground font-medium">+ {per.areas.length - 4} áreas</p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPeriodicidade(per);
                  setTimeout(loadOrCreatePlanilha, 0);
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Abrir Planilha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
