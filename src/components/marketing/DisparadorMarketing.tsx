import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Loader2, 
  Send, 
  Mail, 
  MessageCircle, 
  Users, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getProductLabel } from "@/utils/productUtils";
import { useAuth } from "@/hooks/useAuth";
import { sendWhatsApp } from "@/lib/evolutionWhatsapp";

interface Recipient {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  origem: string;
  produto?: string;
  etapa?: string;
  selected: boolean;
}

export default function DisparadorMarketing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [leads, setLeads] = useState<Recipient[]>([]);
  const [tab, setTab] = useState<"leads" | "crm">("leads");
  
  // Filtros
  const [filterProduto, setFilterProduto] = useState("all");
  const [filterEtapa, setFilterEtapa] = useState("all");
  
  // Template
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [whatsappMsg, setWhatsappMsg] = useState("");
  const [senderName, setSenderName] = useState("Equipe BPF Consult");

  useEffect(() => {
    void loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === "leads") {
        const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setLeads(data.map(l => ({
          id: l.id,
          nome: l.nome,
          email: l.email,
          telefone: l.telefone,
          origem: l.origem || "Site",
          produto: l.produto_interesse,
          selected: false
        })));
      } else {
        const { data, error } = await supabase.from("crm_pipeline").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        setLeads(data.map(l => ({
          id: l.id,
          nome: l.nome,
          email: l.email,
          telefone: l.telefone,
          origem: l.lead_origem,
          produto: l.produto_interesse,
          etapa: l.etapa,
          selected: false
        })));
      }
    } catch (e: any) {
      toast.error("Erro ao carregar dados: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      const matchProd = filterProduto === "all" || l.produto === filterProduto;
      const matchEtapa = filterEtapa === "all" || l.etapa === filterEtapa;
      return matchProd && matchEtapa;
    });
  }, [leads, filterProduto, filterEtapa]);

  const selectedCount = filteredLeads.filter(l => l.selected).length;

  const toggleAll = (val: boolean) => {
    setLeads(prev => prev.map(l => {
      const isVisible = filteredLeads.find(f => f.id === l.id);
      return isVisible ? { ...l, selected: val } : l;
    }));
  };

  const toggleOne = (id: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, selected: !l.selected } : l));
  };

  const handleSendEmail = async () => {
    const selected = leads.filter(l => l.selected);
    if (selected.length === 0) return toast.error("Selecione pelo menos um destinatário");
    if (!emailSubject || !emailBody) return toast.error("Preencha assunto e corpo do e-mail");

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("marketing-bulk-send", {
        body: {
          channel: "email",
          recipients: selected.map(s => ({
            nome: s.nome,
            email: s.email,
            pipeline_id: tab === "crm" ? s.id : null
          })),
          emailSubject,
          emailBodyHtml: emailBody.replace(/\n/g, "<br/>"),
          senderName
        }
      });

      if (error) throw error;
      toast.success(`${selected.length} e-mails enviados para a fila de processamento!`);
    } catch (e: any) {
      toast.error("Erro ao disparar: " + e.message);
    } finally {
      setSending(false);
    }
  };

  const openWhatsApp = (l: Recipient) => {
    if (!l.telefone) return;
    const msg = whatsappMsg.replace("{{nome}}", l.nome || "Cliente");
    const digits = l.telefone.replace(/\D/g, "");
    const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
    const url = `https://wa.me/${withCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    
    // Registrar interação se for CRM
    if (tab === "crm" && user) {
      void supabase.from("crm_interacoes").insert([{
        pipeline_id: l.id,
        tipo: "whatsapp",
        descricao: `[Marketing] WhatsApp iniciado: ${msg.substring(0, 50)}...`,
        autor_id: user.id,
        autor_nome: senderName
      }]);
    }
  };

  const handleSendWhatsappBulk = async () => {
    const selected = leads.filter(l => l.selected && l.telefone);
    if (selected.length === 0) return toast.error("Selecione contatos com telefone");
    if (!whatsappMsg.trim()) return toast.error("Escreva a mensagem do WhatsApp");
    if (!confirm(`Disparar ${selected.length} mensagens via Evolution API agora? (Use com moderação para evitar bloqueios)`)) return;

    setSending(true);
    let ok = 0, fail = 0;
    for (const l of selected) {
      try {
        const msg = whatsappMsg.replace(/\{\{nome\}\}/g, l.nome || "Cliente");
        await sendWhatsApp({
          to: l.telefone,
          message: msg,
          modulo: "portal",
          tipo: "marketing",
          metadata: { nome: l.nome, produto: l.produto, origem: l.origem },
        });
        ok++;
        if (tab === "crm" && user) {
          await supabase.from("crm_interacoes").insert([{
            pipeline_id: l.id,
            tipo: "whatsapp",
            descricao: `[Evolution Bulk] ${msg.substring(0, 200)}`,
            autor_id: user.id,
            autor_nome: senderName,
          }]);
        }
        // Pequeno delay anti-flood (1.5s entre envios)
        await new Promise(r => setTimeout(r, 1500));
      } catch (e: any) {
        fail++;
        console.error("Falha envio WhatsApp:", l.nome, e);
      }
    }
    setSending(false);
    toast.success(`Disparo concluído: ${ok} enviados, ${fail} falhas.`);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Disparador de Marketing</h2>
          <p className="text-muted-foreground text-sm">Envie campanhas via E-mail e WhatsApp para seus contatos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Seleção de Contatos */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" /> Contatos
            </CardTitle>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant={tab === "leads" ? "default" : "outline"} className="flex-1" onClick={() => setTab("leads")}>Leads</Button>
              <Button size="sm" variant={tab === "crm" ? "default" : "outline"} className="flex-1" onClick={() => setTab("crm")}>CRM</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium">Filtrar por Programa</label>
              <Select value={filterProduto} onValueChange={setFilterProduto}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  <SelectItem value="audits-bpf">Audits BPF</SelectItem>
                  <SelectItem value="agrorc">Agro RC</SelectItem>
                  <SelectItem value="nutri-agrolabels">Nutri AgroLabels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center gap-2">
                <Checkbox checked={selectedCount > 0 && selectedCount === filteredLeads.length} onCheckedChange={(v) => toggleAll(!!v)} />
                <span className="text-xs font-medium">Selecionar Todos ({filteredLeads.length})</span>
              </div>
              <Badge variant="secondary">{selectedCount} selecionados</Badge>
            </div>

            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : filteredLeads.map(l => (
                <div key={l.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 border text-xs">
                  <Checkbox checked={l.selected} onCheckedChange={() => toggleOne(l.id)} className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{l.nome}</div>
                    <div className="text-muted-foreground truncate">{l.email}</div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[9px] px-1">{getProductLabel(l.produto)}</Badge>
                      {l.etapa && <Badge variant="secondary" className="text-[9px] px-1 capitalize">{l.etapa}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground text-xs">Nenhum contato encontrado.</div>}
            </div>
          </CardContent>
        </Card>

        {/* Coluna 2: Configuração da Mensagem */}
        <Card className="lg:col-span-2">
          <Tabs defaultValue="email">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Configurar Campanha</CardTitle>
                <TabsList>
                  <TabsTrigger value="email" className="gap-2">
                    <Mail className="h-4 w-4" /> Email
                  </TabsTrigger>
                  <TabsTrigger value="whatsapp" className="gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="email" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assunto do E-mail</label>
                  <Input 
                    placeholder="Ex: Convite especial para {{nome}}" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Dica: Use {"{{nome}}"} para personalizar com o nome do cliente.</p>
                </div>
                <div className="flex flex-wrap gap-2 py-2">
                  <span className="text-[10px] font-medium text-muted-foreground w-full">Inserir variável ou link:</span>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEmailBody(p => p + " {{nome}}")}>Nome do Cliente</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEmailBody(p => p + " https://www.bpfconsult.com.br/admin/plano-vendas.html")}>Plano de Vendas</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEmailBody(p => p + " https://www.bpfconsult.com.br/agrorc")}>Link AgroRC</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEmailBody(p => p + " https://www.bpfconsult.com.br/audits-bpf")}>Link AuditsBPF</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Corpo do E-mail (HTML permitido)</label>
                  <Textarea 
                    placeholder="Escreva sua proposta comercial aqui..."
                    className="min-h-[250px]"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Remetente</label>
                  <Input 
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>
                
                <div className="pt-4 flex items-center justify-between border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3 w-3" />
                    Os e-mails serão enviados em fila.
                  </div>
                  <Button onClick={handleSendEmail} disabled={sending || selectedCount === 0} className="gap-2">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Disparar {selectedCount} E-mails
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="whatsapp" className="space-y-4 mt-0">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <strong>Atenção:</strong> O disparo em massa no WhatsApp pode bloquear sua conta se feito de forma totalmente automática. 
                    Por segurança, você deve clicar em "Enviar" para cada contato selecionado abaixo.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 py-2">
                  <span className="text-[10px] font-medium text-muted-foreground w-full">Inserir variável ou link:</span>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setWhatsappMsg(p => p + " {{nome}}")}>Nome do Cliente</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setWhatsappMsg(p => p + " https://www.bpfconsult.com.br/admin/plano-vendas.html")}>Plano de Vendas</Button>
                  <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setWhatsappMsg(p => p + " https://www.bpfconsult.com.br/agrorc")}>Link AgroRC</Button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensagem do WhatsApp</label>
                  <Textarea 
                    placeholder="Olá {{nome}}, tudo bem? Gostaria de apresentar..."
                    className="min-h-[150px]"
                    value={whatsappMsg}
                    onChange={(e) => setWhatsappMsg(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">Use {"{{nome}}"} para personalizar. Use *texto* para negrito.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Contatos Selecionados ({selectedCount})</label>
                  <div className="border rounded-md divide-y overflow-hidden">
                    {leads.filter(l => l.selected).slice(0, 10).map(l => (
                      <div key={l.id} className="flex items-center justify-between p-3 text-sm bg-card">
                        <div>
                          <span className="font-medium">{l.nome}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{l.telefone}</span>
                        </div>
                        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openWhatsApp(l)}>
                          Enviar <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {selectedCount > 10 && (
                      <div className="p-2 text-center text-xs text-muted-foreground bg-muted">
                        Exibindo os primeiros 10 de {selectedCount}.
                      </div>
                    )}
                    {selectedCount === 0 && (
                      <div className="p-8 text-center text-muted-foreground">Selecione contatos na coluna à esquerda.</div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
