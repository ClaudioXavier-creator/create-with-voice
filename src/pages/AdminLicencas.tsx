import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, UserCheck, UserX, Loader2, RefreshCw } from "lucide-react";

const ADMIN_EMAIL = "claudiolx.nunes@gmail.com";

interface LicenseUser {
  id: string;
  user_id: string;
  email: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial (30 dias)",
  "3_meses": "Trimestral",
  "6_meses": "Semestral",
  "1_ano": "Anual",
};

export default function AdminLicencas() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<LicenseUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, string>>({});

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "list" },
      });
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchUsers();
  }, [user, fetchUsers]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGrant = async (userId: string) => {
    const dias = selectedDays[userId];
    if (!dias) {
      toast.error("Selecione o período");
      return;
    }
    setActionLoading(userId + "-grant");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "grant", user_id: userId, dias: Number(dias) },
      });
      if (error) throw error;
      toast.success("Licença concedida com sucesso!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (userId: string) => {
    setActionLoading(userId + "-revoke");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "revoke", user_id: userId },
      });
      if (error) throw error;
      toast.success("Acesso revogado!");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isActive = (u: LicenseUser) =>
    u.status === "ativa" && new Date(u.data_expiracao) > new Date();

  const daysRemaining = (u: LicenseUser) => {
    const diff = Math.ceil(
      (new Date(u.data_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : 0;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold">Painel Admin — Licenças</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <Card key={u.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col md:flex-row md:items-center gap-4">
                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>{PLAN_LABELS[u.plano] || u.plano}</span>
                      <span>·</span>
                      <span>Exp: {new Date(u.data_expiracao).toLocaleDateString("pt-BR")}</span>
                      {isActive(u) && (
                        <>
                          <span>·</span>
                          <span>{daysRemaining(u)}d restantes</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge
                    variant={isActive(u) ? "default" : "destructive"}
                    className="self-start md:self-center"
                  >
                    {isActive(u) ? "Ativa" : u.status === "revogada" ? "Revogada" : "Expirada"}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedDays[u.user_id] || ""}
                      onValueChange={(v) =>
                        setSelectedDays((prev) => ({ ...prev, [u.user_id]: v }))
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
                      onClick={() => handleGrant(u.user_id)}
                      disabled={actionLoading === u.user_id + "-grant"}
                    >
                      {actionLoading === u.user_id + "-grant" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4 mr-1" />
                      )}
                      Liberar
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRevoke(u.user_id)}
                      disabled={!isActive(u) || actionLoading === u.user_id + "-revoke"}
                    >
                      {actionLoading === u.user_id + "-revoke" ? (
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
