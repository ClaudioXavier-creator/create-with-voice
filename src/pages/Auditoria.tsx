import { ClipboardCheck, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { useChecklistItems } from "@/store/feedbpf-store";
import { cn } from "@/lib/utils";

export default function Auditoria() {
  const [items, setItems] = useChecklistItems();

  const total = items.length;
  const conformes = items.filter((i) => i.conforme === true).length;
  const naoConformes = items.filter((i) => i.conforme === false).length;
  const pendentes = items.filter((i) => i.conforme === null).length;
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0;

  const toggleItem = (id: string, value: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, conforme: item.conforme === value ? null : value } : item))
    );
  };

  const updateObs = (id: string, obs: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, observacao: obs } : item)));
  };

  const areas = [...new Set(items.map((i) => i.area))];

  return (
    <>
      <PageHeader icon={ClipboardCheck} title="Auditoria BPF" description="Checklist de inspeção conforme normas do MAPA" />

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{pct}%</p>
          <p className="text-xs text-muted-foreground">Conformidade</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-success">{conformes}</p>
          <p className="text-xs text-muted-foreground">Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoConformes}</p>
          <p className="text-xs text-muted-foreground">Não conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{pendentes}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
      </div>

      <Progress value={pct} className="h-3 mb-6" />

      {/* Checklist por área */}
      {areas.map((area) => (
        <Card key={area} className="mb-4">
          <CardHeader><CardTitle className="font-display text-base">{area}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items.filter((i) => i.area === area).map((item) => (
              <div key={item.id} className={cn("flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border", item.conforme === false ? "border-destructive/30 bg-destructive/5" : item.conforme === true ? "border-primary/30 bg-primary/5" : "border-border")}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.item}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={item.conforme === true ? "default" : "outline"} onClick={() => toggleItem(item.id, true)} className="gap-1">
                    <CheckCircle2 className="w-4 h-4" /> C
                  </Button>
                  <Button size="sm" variant={item.conforme === false ? "destructive" : "outline"} onClick={() => toggleItem(item.id, false)} className="gap-1">
                    <XCircle className="w-4 h-4" /> NC
                  </Button>
                  <Input placeholder="Observação" value={item.observacao} onChange={(e) => updateObs(item.id, e.target.value)} className="w-40 text-xs" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </>
  );
}
