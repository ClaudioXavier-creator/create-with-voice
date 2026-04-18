import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, UserCheck, UserX, Loader2, RefreshCw, Building2, Search } from "lucide-react";

interface LicenseEntry {
  id: string;
  user_id: string;
  empresa_id: string | null;
  email: string;
  empresa_nome: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  liberado_admin: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial (7 dias)",
  "3_meses": "Trimestral",
  "6_meses": "Semestral",
  "1_ano": "Anual",
};

export default function AdminLicencas() {
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LicenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, string>>({});
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "list" },
      });
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar licenças: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin, fetchEntries]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGrant = async (entry: LicenseEntry) => {
    const key = entry.id;
    const dias = selectedDays[key];
    if (!dias) {
      toast.error("Selecione o período");
      return;
    }
    setActionLoading(key + "-grant");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "grant",
          licenca_id: entry.id,
          empresa_id: entry.empresa_id,
          user_id: entry.user_id,
          dias: Number(dias),
        },
      });
      if (error) throw error;
      toast.success("Licença concedida com sucesso!");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (entry: LicenseEntry) => {
    setActionLoading(entry.id + "-revoke");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "revoke", licenca_id: entry.id, empresa_id: entry.empresa_id },
      });
      if (error) throw error;
      toast.success("Acesso revogado!");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isActive = (e: LicenseEntry) =>
    (e.status === "ativa" && new Date(e.data_expiracao) > new Date()) || e.liberado_admin;

  const daysRemaining = (e: LicenseEntry) => {
    if (e.liberado_admin) return "∞";
    const diff = Math.ceil(
      (new Date(e.data_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? `${diff}d` : "0d";
  };

  const filtered = entries.filter(
    (e) =>
      e.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Painel Admin — Licenças por Empresa</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma licença encontrada.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((e) => (
              <Card key={e.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <p className="font-medium truncate">{e.empresa_nome}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="truncate">{e.email}</span>
                      <span>·</span>
                      <span>{PLAN_LABELS[e.plano] || e.plano}</span>
                      <span>·</span>
                      <span>Exp: {new Date(e.data_expiracao).toLocaleDateString("pt-BR")}</span>
                      <span>·</span>
                      <span>{daysRemaining(e)} restantes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isActive(e) ? "default" : "destructive"}>
                      {e.liberado_admin ? "Admin" : isActive(e) ? "Ativa" : e.status === "revogada" ? "Revogada" : "Expirada"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedDays[e.empresa_id || ""] || ""}
                      onValueChange={(v) =>
                        setSelectedDays((prev) => ({ ...prev, [e.empresa_id || ""]: v }))
                      }
                    >
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      size="sm"
                      onClick={() => e.empresa_id && handleGrant(e.empresa_id)}
                      disabled={!e.empresa_id || actionLoading === (e.empresa_id + "-grant")}
                    >
                      {actionLoading === (e.empresa_id + "-grant") ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-1" />
                      )}
                      Liberar
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => e.empresa_id && handleRevoke(e.empresa_id)}
                      disabled={!e.empresa_id || !isActive(e) || actionLoading === (e.empresa_id + "-revoke")}
                    >
                      {actionLoading === (e.empresa_id + "-revoke") ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserX className="w-4 h-4 mr-1" />
                      )}
                      Revogar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
