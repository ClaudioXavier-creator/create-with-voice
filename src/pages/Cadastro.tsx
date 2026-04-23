import { Building2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useLicense } from "@/hooks/useLicense";
import { TIER_MAX_EMPRESAS, TIER_LABEL } from "@/config/tiers";
import { toast } from "sonner";

const TIPOS = ["Ração farelada", "Ração peletizada", "Núcleo", "Premix", "Suplemento mineral", "Sal mineral"];

interface EmpresaForm {
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel_tecnico: string;
  crmv: string;
  capacidade: string;
  tipo_producao: string[];
}

const emptyForm: EmpresaForm = { nome: "", cnpj: "", endereco: "", responsavel_tecnico: "", crmv: "", capacidade: "", tipo_producao: [] };

export default function Cadastro() {
  const { user, userType } = useAuth();
  const { empresas, recarregar, setEmpresaAtiva } = useEmpresa();
  const { tier } = useLicense();
  const [form, setForm] = useState<EmpresaForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleTipo = (t: string) => {
    setForm(prev => ({
      ...prev,
      tipo_producao: prev.tipo_producao.includes(t)
        ? prev.tipo_producao.filter(x => x !== t)
        : [...prev.tipo_producao, t],
    }));
  };

  const unlimitedCompanies = userType === "consultoria";
  const MAX_EMPRESAS = unlimitedCompanies ? Number.POSITIVE_INFINITY : TIER_MAX_EMPRESAS[tier];
  const tierLabel = TIER_LABEL[tier];
  const limitReached = (empresas?.length || 0) >= MAX_EMPRESAS;

  const openNew = () => {
    if (limitReached) {
      toast.error(`Limite de ${MAX_EMPRESAS} empresa(s) do plano ${tierLabel} atingido. Faça upgrade para cadastrar mais.`);
      return;
    }
    setForm(emptyForm); setEditId(null); setOpen(true);
  };

  const openEdit = (e: any) => {
    setForm({
      nome: e.nome || "",
      cnpj: e.cnpj || "",
      endereco: e.endereco || "",
      responsavel_tecnico: e.responsavel_tecnico || "",
      crmv: e.crmv || "",
      capacidade: e.capacidade || "",
      tipo_producao: e.tipo_producao || [],
    });
    setEditId(e.id);
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error("Nome da empresa é obrigatório"); return; }
    if (!user) return;
    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("empresas").update({
          nome: form.nome, cnpj: form.cnpj, endereco: form.endereco,
          responsavel_tecnico: form.responsavel_tecnico, crmv: form.crmv,
          capacidade: form.capacidade, tipo_producao: form.tipo_producao,
        }).eq("id", editId);
        if (error) throw error;
        toast.success("Empresa atualizada!");
      } else {
        const { data, error } = await supabase.from("empresas").insert({
          user_id: user.id, nome: form.nome, cnpj: form.cnpj, endereco: form.endereco,
          responsavel_tecnico: form.responsavel_tecnico, crmv: form.crmv,
          capacidade: form.capacidade, tipo_producao: form.tipo_producao,
        }).select().single();
        if (error) throw error;
        toast.success("Empresa cadastrada!");
        if (data) setEmpresaAtiva(data as any);
      }
      await recarregar();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally { setSaving(false); }
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta empresa? Todos os dados vinculados serão removidos.")) return;
    const { error } = await supabase.from("empresas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Empresa excluída");
    await recarregar();
  };

  return (
    <>
      <PageHeader icon={Building2} title="Cadastro de Empresas" description="Gerencie múltiplas unidades fabris — dados isolados por empresa" />

      {limitReached && (
        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <span>
            Limite de <strong>{MAX_EMPRESAS} empresa(s)</strong> do plano <strong>{tierLabel}</strong> atingido. Faça upgrade para cadastrar mais unidades.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {empresas?.length || 0} / {unlimitedCompanies ? "∞" : MAX_EMPRESAS} empresas — plano {tierLabel}{unlimitedCompanies ? " · consultor" : ""}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} disabled={limitReached}><Plus className="w-4 h-4 mr-1" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: AgroNutri Rações Ltda" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, cidade, estado" />
              </div>
              <div className="space-y-2">
                <Label>Responsável Técnico</Label>
                <Input value={form.responsavel_tecnico} onChange={e => setForm(p => ({ ...p, responsavel_tecnico: e.target.value }))} placeholder="Nome do RT" />
              </div>
              <div className="space-y-2">
                <Label>CRMV</Label>
                <Input value={form.crmv} onChange={e => setForm(p => ({ ...p, crmv: e.target.value }))} placeholder="CRMV-XX 00000" />
              </div>
              <div className="space-y-2">
                <Label>Capacidade Produtiva</Label>
                <Input value={form.capacidade} onChange={e => setForm(p => ({ ...p, capacidade: e.target.value }))} placeholder="Ex: 10.000 ton/mês" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Tipo de Produção</Label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <Badge key={t} variant={form.tipo_producao.includes(t) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleTipo(t)}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2">
                <Button className="w-full" onClick={salvar} disabled={saving}>
                  {saving ? "Salvando..." : editId ? "Atualizar" : "Cadastrar Empresa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {empresas.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma empresa cadastrada</h3>
            <p className="text-muted-foreground text-sm mb-4">Cadastre sua primeira unidade fabril para começar a usar o sistema.</p>
            <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Cadastrar Empresa</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map(e => (
            <Card key={e.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{e.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => excluir(e.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {e.cnpj && <p><strong>CNPJ:</strong> {e.cnpj}</p>}
                {e.responsavel_tecnico && <p><strong>RT:</strong> {e.responsavel_tecnico} {e.crmv && `(${e.crmv})`}</p>}
                {e.endereco && <p><strong>End.:</strong> {e.endereco}</p>}
                {e.capacidade && <p><strong>Capacidade:</strong> {e.capacidade}</p>}
                {e.tipo_producao && e.tipo_producao.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.tipo_producao.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
