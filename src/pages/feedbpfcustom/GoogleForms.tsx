import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, RefreshCcw, ExternalLink, FileText, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

const WEBHOOK_URL = "https://uyrcxfypdzasdminxizq.supabase.co/functions/v1/google-forms-webhook";

interface Modelo {
  id: string;
  nome: string;
  pop_codigo: string | null;
  webhook_token: string | null;
  ativo: boolean;
}

export default function GoogleForms() {
  const { empresaAtiva } = useEmpresa();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selecionado, setSelecionado] = useState<string>("");
  const [copiado, setCopiado] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ ok: boolean; msg: string } | null>(null);

  const modelo = modelos.find((m) => m.id === selecionado);

  useEffect(() => {
    if (!empresaAtiva?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("modelos_empresa")
        .select("id, nome, pop_codigo, webhook_token, ativo")
        .eq("empresa_id", empresaAtiva.id)
        .eq("ativo", true)
        .order("nome");
      if (error) toast.error("Erro ao carregar modelos");
      setModelos((data as Modelo[]) ?? []);
      setLoading(false);
    })();
  }, [empresaAtiva?.id]);

  const copiar = async (texto: string, chave: string) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(chave);
    toast.success("Copiado!");
    setTimeout(() => setCopiado(""), 2000);
  };

  const rotacionar = async () => {
    if (!modelo) return;
    if (!confirm("Rotacionar o token invalidará o webhook atual em todos os Google Forms conectados. Continuar?")) return;
    const novo = crypto.randomUUID();
    const { error } = await supabase
      .from("modelos_empresa")
      .update({ webhook_token: novo })
      .eq("id", modelo.id);
    if (error) return toast.error("Erro ao rotacionar token");
    setModelos((prev) => prev.map((m) => (m.id === modelo.id ? { ...m, webhook_token: novo } : m)));
    toast.success("Token rotacionado com sucesso");
  };

  const token = modelo?.webhook_token ?? "";
  const urlCompleta = token ? `${WEBHOOK_URL}?token=${token}` : WEBHOOK_URL;

  /**
   * Envia um payload de teste ao webhook para validar a integração
   * sem depender de um envio real no Google Forms.
   */
  const testarWebhook = async () => {
    if (!modelo || !token) return;
    setTestando(true);
    setResultadoTeste(null);
    try {
      const res = await fetch(urlCompleta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          form_title: `[TESTE] ${modelo.nome}`,
          submitted_at: new Date().toISOString(),
          respostas: {
            "Responsável": "Teste automático do sistema",
            "Observação": "Registro gerado pelo botão Testar Webhook.",
          },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? `HTTP ${res.status}`;
        setResultadoTeste({ ok: false, msg });
        toast.error(`Falha no teste: ${msg}`);
        return;
      }
      setResultadoTeste({
        ok: true,
        msg: `Registro de teste criado (id: ${(json as { registro_id?: string }).registro_id ?? "—"}). Confira em Registros Digitais.`,
      });
      toast.success("Webhook funcionando!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setResultadoTeste({ ok: false, msg });
      toast.error(`Falha no teste: ${msg}`);
    } finally {
      setTestando(false);
    }
  };


  const appsScript = `// Cole este código em Extensões > Apps Script do seu Google Form
// Depois: Gatilhos (relógio) > Adicionar Gatilho > onFormSubmit > No envio do formulário
const WEBHOOK_URL = "${WEBHOOK_URL}";
const TOKEN = "${token || 'COLE_SEU_TOKEN_AQUI'}";

function onFormSubmit(e) {
  const respostas = {};
  e.response.getItemResponses().forEach(r => {
    respostas[r.getItem().getTitle()] = r.getResponse();
  });

  const payload = {
    token: TOKEN,
    form_title: e.source.getTitle(),
    submitted_at: new Date().toISOString(),
    respostas: respostas
  };

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}`;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/feedbpf-custom/tutorial"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600" /> Integração Google Forms
          </h1>
          <p className="text-muted-foreground mt-1">
            Cada resposta enviada no Google Forms vira automaticamente um Registro Digital assinado com hash SHA-256.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Escolha o modelo que receberá as respostas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando modelos…</p>
          ) : modelos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum modelo ativo. Crie um em <Link to="/feedbpf-custom/modelos" className="text-emerald-600 underline">Meus Modelos</Link> antes de conectar o Google Forms.
            </div>
          ) : (
            <Select value={selecionado} onValueChange={setSelecionado}>
              <SelectTrigger><SelectValue placeholder="Selecione um modelo…" /></SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.pop_codigo ? <Badge variant="secondary" className="mr-2">{m.pop_codigo}</Badge> : null}
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {modelo && (
        <>
          <AssistenteGoogleForms
            webhookUrl={WEBHOOK_URL}
            modelo={modelo}
            onTokenRotacionado={(novo) =>
              setModelos((prev) => prev.map((m) => (m.id === modelo.id ? { ...m, webhook_token: novo } : m)))
            }
          />


          <Card>
            <CardHeader><CardTitle>4. Dicas importantes</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Os títulos das perguntas do Form viram as chaves dos dados salvos — use nomes idênticos aos campos do seu Modelo para melhor rastreabilidade.</p>
              <p>• Inclua uma pergunta chamada <strong>Responsável</strong> no Form para preencher automaticamente esse campo no registro.</p>
              <p>• Cada envio gera um hash SHA-256 imutável (Decreto 12.031/2024).</p>
              <p>• Você pode conectar vários Forms ao mesmo modelo — todos usam o mesmo token.</p>
              <a href="https://script.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                Abrir Google Apps Script <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
