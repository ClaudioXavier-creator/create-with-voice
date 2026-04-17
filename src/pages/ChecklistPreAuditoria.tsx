import { useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, ArrowRight, RefreshCw, FileText, Wrench, GraduationCap, ClipboardCheck, Package, Search, Droplets } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

interface CheckItem {
  area: string;
  item: string;
  status: "ok" | "alerta" | "critico";
  detalhe: string;
  link: string;
  icon: React.ElementType;
}

export default function ChecklistPreAuditoria() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    if (!user) return;
    setLoading(true);

    const [docsRes, popsRes, calibRes, treinRes, checklistRes, ncRes, rastrRes, higieneRes] = await Promise.all([
      supabase.from("documentos").select("codigo, nome, status, proxima_revisao, validade_revisao").eq("user_id", user.id).then(r => { if (empresaAtiva) { return { ...r, data: r.data?.filter((d: any) => !d.empresa_id || d.empresa_id === empresaAtiva.id) || null }; } return r; }),
      supabase.from("pop_planilhas").select("pop_codigo, pop_nome, status, mes, ano").eq("user_id", user.id),
      supabase.from("calibracoes").select("equipamento, proxima_calibracao, status").eq("user_id", user.id),
      supabase.from("treinamentos").select("funcionario, treinamento, validade").eq("user_id", user.id),
      supabase.from("checklist_items").select("area, conforme").eq("user_id", user.id),
      supabase.from("nao_conformidades").select("status").eq("user_id", user.id),
      supabase.from("rastreabilidade").select("id").eq("user_id", user.id).limit(1),
      supabase.from("cronogramas_higiene").select("id, status").eq("user_id", user.id),
    ]);

    const hoje = new Date();
    const result: CheckItem[] = [];

    // 1. Documentos com revisão vencida
    const docs = docsRes.data || [];
    const docsVencidos = docs.filter(d => {
      const ref = d.proxima_revisao || d.validade_revisao;
      return ref && differenceInDays(parseISO(ref), hoje) < 0;
    });
    result.push({
      area: "Documentos",
      item: "POPs e documentos com revisão em dia",
      status: docsVencidos.length === 0 ? "ok" : "critico",
      detalhe: docsVencidos.length === 0 ? "Todos os documentos estão atualizados" : `${docsVencidos.length} documento(s) com revisão vencida`,
      link: "/documentos",
      icon: FileText,
    });

    // 2. Planilhas de POPs preenchidas no mês atual
    const pops = popsRes.data || [];
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();
    const planilhasMesAtual = pops.filter(p => p.mes === mesAtual && p.ano === anoAtual);
    const popsCodigos = ["POP-001", "POP-002", "POP-003", "POP-004", "POP-005", "POP-006", "POP-007", "POP-008", "POP-009", "POP-010"];
    const popsPreenchidos = new Set(planilhasMesAtual.map(p => p.pop_codigo));
    const popsFaltantes = popsCodigos.filter(c => !popsPreenchidos.has(c));
    result.push({
      area: "Planilhas POP",
      item: "Planilhas de POPs preenchidas neste mês",
      status: popsFaltantes.length === 0 ? "ok" : popsFaltantes.length <= 3 ? "alerta" : "critico",
      detalhe: popsFaltantes.length === 0 ? "Todos os 10 POPs preenchidos" : `${popsFaltantes.length} POP(s) sem planilha: ${popsFaltantes.join(", ")}`,
      link: "/planilhas-pop",
      icon: ClipboardCheck,
    });

    // 3. Calibrações em dia
    const calibracoes = calibRes.data || [];
    const calibVencidas = calibracoes.filter(c => c.proxima_calibracao && differenceInDays(parseISO(c.proxima_calibracao), hoje) < 0);
    result.push({
      area: "Calibração",
      item: "Equipamentos com calibração em dia",
      status: calibVencidas.length === 0 ? "ok" : "critico",
      detalhe: calibVencidas.length === 0 ? `${calibracoes.length} equipamento(s) calibrados` : `${calibVencidas.length} equipamento(s) com calibração vencida`,
      link: "/manutencao",
      icon: Wrench,
    });

    // 4. Treinamentos válidos
    const treinamentos = treinRes.data || [];
    const treinVencidos = treinamentos.filter(t => t.validade && differenceInDays(parseISO(t.validade), hoje) < 0);
    result.push({
      area: "Treinamentos",
      item: "Treinamentos dos colaboradores em dia",
      status: treinVencidos.length === 0 ? "ok" : treinVencidos.length <= 2 ? "alerta" : "critico",
      detalhe: treinVencidos.length === 0 ? "Todos os treinamentos estão válidos" : `${treinVencidos.length} treinamento(s) vencido(s)`,
      link: "/treinamentos",
      icon: GraduationCap,
    });

    // 5. NCs abertas
    const ncs = ncRes.data || [];
    const ncsAbertas = ncs.filter(nc => nc.status === "aberta" || nc.status === "em_andamento").length;
    result.push({
      area: "Não Conformidades",
      item: "Não conformidades com tratativa",
      status: ncsAbertas === 0 ? "ok" : ncsAbertas <= 2 ? "alerta" : "critico",
      detalhe: ncsAbertas === 0 ? "Nenhuma NC aberta" : `${ncsAbertas} NC(s) em aberto aguardando tratativa`,
      link: "/nao-conformidades",
      icon: AlertTriangle,
    });

    // 6. Auditoria realizada
    const checklistData = checklistRes.data || [];
    result.push({
      area: "Auditoria",
      item: "Pelo menos uma auditoria BPF realizada",
      status: checklistData.length > 0 ? "ok" : "critico",
      detalhe: checklistData.length > 0 ? `${checklistData.length} item(ns) de checklist registrados` : "Nenhuma auditoria BPF realizada",
      link: "/auditoria",
      icon: ClipboardCheck,
    });

    // 7. Rastreabilidade configurada
    const rastreabilidade = rastrRes.data || [];
    result.push({
      area: "Rastreabilidade",
      item: "Registros de rastreabilidade cadastrados",
      status: rastreabilidade.length > 0 ? "ok" : "alerta",
      detalhe: rastreabilidade.length > 0 ? "Rastreabilidade ativa" : "Nenhum registro de rastreabilidade encontrado",
      link: "/rastreabilidade",
      icon: Search,
    });

    // 8. Cronograma de higiene
    const higiene = higieneRes.data || [];
    result.push({
      area: "Higiene",
      item: "Cronograma de higienização cadastrado",
      status: higiene.length > 0 ? "ok" : "alerta",
      detalhe: higiene.length > 0 ? `${higiene.length} cronograma(s) ativos` : "Nenhum cronograma de higiene cadastrado",
      link: "/higiene",
      icon: Droplets,
    });

    setItems(result);
    setLoading(false);
  };

  useEffect(() => { runCheck(); }, [user]);

  const total = items.length;
  const oks = items.filter(i => i.status === "ok").length;
  const pct = total > 0 ? Math.round((oks / total) * 100) : 0;

  const statusIcon = (s: string) => {
    if (s === "ok") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    if (s === "alerta") return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <>
      <PageHeader icon={ShieldCheck} title="Checklist Pré-Auditoria" description="Verificação automática de conformidade antes de auditorias do MAPA"
        orientacaoModuloId="checklist-pre-auditoria" />

      {/* Resumo */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold font-display">{pct}% Preparado</h3>
              <p className="text-sm text-muted-foreground">{oks} de {total} verificações aprovadas</p>
            </div>
            <Button variant="outline" size="sm" onClick={runCheck} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
          <Progress value={loading ? 0 : pct} className="h-3" />
          <div className="flex gap-4 mt-3 text-xs">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {items.filter(i => i.status === "ok").length} OK</span>
            <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-yellow-500" /> {items.filter(i => i.status === "alerta").length} Alertas</span>
            <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-destructive" /> {items.filter(i => i.status === "critico").length} Críticos</span>
          </div>
        </CardContent>
      </Card>

      {/* Itens */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)
        ) : (
          items.map((item, i) => (
            <Card key={i} className={`border-l-4 ${item.status === "ok" ? "border-l-emerald-500" : item.status === "alerta" ? "border-l-yellow-500" : "border-l-destructive"}`}>
              <CardContent className="flex items-center gap-4 py-4">
                {statusIcon(item.status)}
                <item.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.item}</p>
                  <p className="text-xs text-muted-foreground">{item.detalhe}</p>
                </div>
                <Badge variant={item.status === "ok" ? "default" : item.status === "alerta" ? "secondary" : "destructive"} className="shrink-0">
                  {item.area}
                </Badge>
                <Link to={item.link}>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
