import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Gift, TrendingUp, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function IndicacoesPanel() {
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from("indicacoes").select("*").order("criado_em", { ascending: false }).limit(200);
    setIndicacoes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const converter = async (id: string) => {
    const { error } = await supabase.from("indicacoes").update({
      status: "convertido",
      converteu_em: new Date().toISOString(),
    }).eq("id", id);
    if (error) return toast.error("Erro");
    toast.success("Marcada como convertida");
    load();
  };

  const creditar = async (id: string) => {
    const { error } = await supabase.from("indicacoes").update({ recompensa_creditada: true }).eq("id", id);
    if (error) return toast.error("Erro");
    toast.success("Recompensa creditada");
    load();
  };

  const simular = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return toast.error("Não autenticado");
    const codigo = `REF-TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data: ins, error: e1 } = await supabase.from("indicacoes").insert({
      indicador_user_id: uid,
      codigo_referral: codigo,
      indicado_email: `teste-${Date.now()}@simulacao.local`,
      status: "cadastrado",
      cadastrou_em: new Date().toISOString(),
      recompensa_valor: 50,
      observacoes: "[simulação de conversão]",
    }).select("id").single();
    if (e1 || !ins) return toast.error("Falha ao criar indicação: " + e1?.message);

    const { error: e2 } = await supabase.from("indicacoes").update({
      status: "convertido",
      converteu_em: new Date().toISOString(),
      recompensa_creditada: true,
    }).eq("id", ins.id);
    if (e2) return toast.error("Falha ao converter: " + e2.message);



    toast.success("Fluxo simulado: pendente → cadastrado → convertido → creditado");
    load();
  };

  const stats = {
    total: indicacoes.length,
    cadastrados: indicacoes.filter((i) => i.status === "cadastrado" || i.status === "convertido").length,
    convertidos: indicacoes.filter((i) => i.status === "convertido").length,
    pago: indicacoes.filter((i) => i.recompensa_creditada).reduce((s, i) => s + Number(i.recompensa_valor ?? 0), 0),
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Gift className="w-8 h-8 text-primary" /><div><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">Indicações</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-blue-500" /><div><div className="text-2xl font-bold">{stats.cadastrados}</div><div className="text-xs text-muted-foreground">Cadastrados</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><TrendingUp className="w-8 h-8 text-green-600" /><div><div className="text-2xl font-bold">{stats.convertidos}</div><div className="text-xs text-muted-foreground">Convertidos</div></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><DollarSign className="w-8 h-8 text-yellow-600" /><div><div className="text-2xl font-bold">R$ {stats.pago.toFixed(0)}</div><div className="text-xs text-muted-foreground">Pago</div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Programa de Indicações</CardTitle>
          <Button size="sm" variant="outline" onClick={simular}>Simular conversão</Button>
        </CardHeader>
        <CardContent>
          {loading ? <p>Carregando...</p> : (
            <div className="space-y-2">
              {indicacoes.map((i) => (
                <div key={i.id} className="flex items-center justify-between border rounded p-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs">{i.codigo_referral}</div>
                    <div className="text-xs text-muted-foreground">{i.indicado_email ?? "—"} · R$ {Number(i.recompensa_valor ?? 0).toFixed(2)}</div>
                  </div>
                  <Badge variant={i.status === "convertido" ? "default" : i.status === "cadastrado" ? "secondary" : "outline"}>{i.status}</Badge>
                  <div className="flex gap-1 ml-2">
                    {i.status === "cadastrado" && <Button size="sm" variant="outline" onClick={() => converter(i.id)}>Converter</Button>}
                    {i.status === "convertido" && !i.recompensa_creditada && <Button size="sm" onClick={() => creditar(i.id)}>Creditar</Button>}
                    {i.recompensa_creditada && <Badge variant="default" className="bg-green-600">✓ Pago</Badge>}
                  </div>
                </div>
              ))}
              {indicacoes.length === 0 && <p className="text-center text-muted-foreground py-4">Nenhuma indicação ainda</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
