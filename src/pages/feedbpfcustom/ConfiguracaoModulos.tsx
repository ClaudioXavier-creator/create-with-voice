import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ToggleRight, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { MODULOS_CUSTOM, GRUPOS_LABEL, type ModuloCustom } from "@/config/modulosCustom";

type EstadoModulos = Record<string, boolean>;

export default function ConfiguracaoModulosCustom() {
  const { empresa } = useEmpresa();
  const [estado, setEstado] = useState<EstadoModulos>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!empresa?.id) return;
    void carregar();
  }, [empresa?.id]);

  async function carregar() {
    if (!empresa?.id) return;
    setLoading(true);
    const { data, error } = await (supabase.from as any)("empresa_modulos_custom")
      .select("modulo_codigo, ativo")
      .eq("empresa_id", empresa.id);

    if (error) {
      toast.error("Erro ao carregar módulos", { description: error.message });
      setLoading(false);
      return;
    }

    // Merge com padrões: se ainda não existir linha, usa padrao_ativo do catálogo
    const salvos = new Map<string, boolean>((data || []).map((r: any) => [r.modulo_codigo, r.ativo]));
    const inicial: EstadoModulos = {};
    for (const m of MODULOS_CUSTOM) {
      inicial[m.codigo] = salvos.has(m.codigo) ? !!salvos.get(m.codigo) : m.padrao_ativo;
    }
    setEstado(inicial);
    setDirty(false);
    setLoading(false);
  }

  function toggle(codigo: string, valor: boolean) {
    setEstado((prev) => ({ ...prev, [codigo]: valor }));
    setDirty(true);
  }

  async function salvar() {
    if (!empresa?.id) return;
    setSaving(true);
    const rows = MODULOS_CUSTOM.map((m) => ({
      empresa_id: empresa.id,
      modulo_codigo: m.codigo,
      ativo: !!estado[m.codigo],
      ativado_por: (supabase.auth as any)?._currentUser?.id ?? null,
    }));

    const { error } = await (supabase.from as any)("empresa_modulos_custom")
      .upsert(rows, { onConflict: "empresa_id,modulo_codigo" });

    setSaving(false);
    if (error) {
      toast.error("Falha ao salvar", { description: error.message });
      return;
    }
    toast.success("Módulos atualizados", { description: "As alterações aparecem na próxima navegação." });
    setDirty(false);
  }

  function resetPadroes() {
    const padrao: EstadoModulos = {};
    for (const m of MODULOS_CUSTOM) padrao[m.codigo] = m.padrao_ativo;
    setEstado(padrao);
    setDirty(true);
  }

  const grupos = Object.keys(GRUPOS_LABEL) as ModuloCustom["grupo"][];
  const totalAtivos = Object.values(estado).filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ToggleRight className="w-7 h-7 text-emerald-600" />
            Configuração de Módulos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ative apenas o que sua fábrica usa. Módulos desativados ficam ocultos na sidebar.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {totalAtivos} de {MODULOS_CUSTOM.length} ativos
        </Badge>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={salvar} disabled={!dirty || saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar alterações
        </Button>
        <Button onClick={resetPadroes} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" /> Restaurar padrões
        </Button>
      </div>

      {grupos.map((g) => {
        const modulos = MODULOS_CUSTOM.filter((m) => m.grupo === g);
        return (
          <Card key={g}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{GRUPOS_LABEL[g]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {modulos.map((m) => (
                <div
                  key={m.codigo}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`m-${m.codigo}`} className="font-semibold cursor-pointer">
                      {m.nome}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.descricao}</p>
                  </div>
                  <Switch
                    id={`m-${m.codigo}`}
                    checked={!!estado[m.codigo]}
                    onCheckedChange={(v) => toggle(m.codigo, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {dirty && (
        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={salvar} disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar alterações
          </Button>
        </div>
      )}
    </div>
  );
}
