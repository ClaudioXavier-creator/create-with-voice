import { useEffect, useState, useMemo } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Search, Download, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { canAccessLeadsAdmin } from "@/config/adminAccess";

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  produto_interesse: string | null;
  origem: string | null;
  notificado: boolean;
  user_id: string | null;
  created_at: string;
}

const PRODUTO_LABEL: Record<string, string> = {
  feedbpf: "Feed_BPF",
  feed_bpf: "Feed_BPF",
  auditsbpf: "Audits BPF",
  audits_bpf: "Audits BPF",
  nutricrm: "NutriCRM",
  agrogestao: "AgroGestão",
  agro_rc: "Agro RC",
  "agro-rc": "Agro RC",
  agro_rc_crm: "Agro RC CRM",
  rotulos: "Nutri_Agro Labels",
  plataforma: "Plataforma",
};

function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export default function AdminLeads({ isTab = false }: { isTab?: boolean }) {
  const { user, roles, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar leads: " + error.message);
    } else {
      setLeads((data ?? []) as Lead[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && user && canAccessLeadsAdmin(roles, user.email)) {
      void load();
    }
  }, [authLoading, user, roles]);

  const HIDDEN_PRODUCTS = new Set(["nutricrm", "agrogestao"]);
  const visibleLeads = useMemo(
    () => leads.filter((l) => !HIDDEN_PRODUCTS.has((l.produto_interesse ?? "").toLowerCase())),
    [leads],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleLeads;
    return visibleLeads.filter((l) =>
      [l.nome, l.email, l.telefone, l.produto_interesse ?? "", l.origem ?? ""]
        .some((v) => v.toLowerCase().includes(q)),
    );
  }, [visibleLeads, search]);

  const exportCsv = () => {
    const header = ["Data", "Nome", "Email", "Telefone", "Produto", "Origem", "Notificado"];
    const rows = filtered.map((l) => [
      formatDate(l.created_at),
      l.nome,
      l.email,
      l.telefone,
      l.produto_interesse ?? "",
      l.origem ?? "",
      l.notificado ? "sim" : "não",
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !canAccessLeadsAdmin(roles, user.email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={isTab ? "space-y-6" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className={isTab ? "space-y-6" : "max-w-7xl mx-auto space-y-6"}>
        {!isTab && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Leads capturados</h1>
              <p className="text-muted-foreground">
                Cadastros gerados pelo trial e formulários públicos.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/admin-licencas">Licenças</Link>
              </Button>
              <Button variant="outline" onClick={load} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button onClick={exportCsv} disabled={!filtered.length}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        )}

        {isTab && (
          <div className="flex justify-end gap-2">
             <Button variant="outline" size="sm" onClick={load} disabled={loading}>
               <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
               Atualizar
             </Button>
             <Button size="sm" onClick={exportCsv} disabled={!filtered.length}>
               <Download className="h-4 w-4 mr-2" />
               Exportar
             </Button>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <span>{filtered.length} lead(s)</span>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, telefone, produto..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                Nenhum lead encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((lead) => {
                      const produtoLabel =
                        (lead.produto_interesse &&
                          (PRODUTO_LABEL[lead.produto_interesse] ?? lead.produto_interesse)) ||
                        "—";
                      return (
                        <TableRow key={lead.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {formatDate(lead.created_at)}
                          </TableCell>
                          <TableCell className="font-medium text-sm">{lead.nome}</TableCell>
                          <TableCell>
                            <div className="flex flex-col text-xs">
                              <span className="font-mono">{lead.email}</span>
                              <span className="text-muted-foreground">{lead.telefone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">{produtoLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {lead.origem ?? "—"}
                          </TableCell>
                          <TableCell>
                            {lead.notificado ? (
                              <Badge className="text-[10px]">Notificado</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Pendente</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" asChild>
                                <a
                                  href={whatsappLink(lead.telefone)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Abrir WhatsApp"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button size="sm" variant="ghost" asChild>
                                <a href={`mailto:${lead.email}`} title="Enviar e-mail">
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
