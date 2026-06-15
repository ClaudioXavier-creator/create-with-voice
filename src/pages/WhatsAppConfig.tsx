import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Save, RefreshCw, CheckCircle2, XCircle, ExternalLink, QrCode, LogOut, Trash2, Plus, Smartphone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useAuth } from "@/hooks/useAuth";
import { evolutionService, EvolutionInstance } from "@/services/evolutionApi";
import { QRCodeSVG } from "qrcode.react";

const WhatsAppConfig = () => {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    api_url: "",
    api_key: "",
    instance_name: "",
  });
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeText, setQrCodeText] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [qrCodeIssue, setQrCodeIssue] = useState<string | null>(null);
  const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("disconnected");
  const [testNumber, setTestNumber] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Teste de integração Evolution API.");
  const [pairingPhone, setPairingPhone] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [batchStatus, setBatchStatus] = useState<{current: number, total: number} | null>(null);

  const mainInstance = instances.find((instance) => instance.instanceName === config.instance_name) ?? instances[0];
  const mainInstanceStatus = mainInstance?.status ?? "close";
  const instanceStatusLabel = mainInstanceStatus === "open"
    ? "WhatsApp conectado"
    : mainInstanceStatus === "connecting"
      ? "WhatsApp aguardando leitura"
      : mainInstanceStatus === "disconnecting"
        ? "WhatsApp desconectando"
        : "WhatsApp desconectado";


  useEffect(() => {
    if (empresaAtiva?.id) {
      fetchConfig();
    }
  }, [empresaAtiva?.id]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("empresa_id", empresaAtiva?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setConfig({
          api_url: data.api_url,
          api_key: data.api_key,
          instance_name: data.instance_name || "",
        });
        checkConnection(data.api_url, data.api_key);
      }
    } catch (error: any) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async (url: string, key: string) => {
    if (!url || !key) return;
    setStatus("checking");
    try {
      const data = await evolutionService.fetchInstances(url, key);
      setInstances(data);
      setStatus("connected");
    } catch (error) {
      console.error("Error checking connection:", error);
      setStatus("disconnected");
      setInstances([]);
    }
  };

  const handleSave = async () => {
    if (!empresaAtiva?.id) {
      toast({
        variant: "destructive",
        title: "Nenhuma empresa ativa",
        description: "Selecione uma empresa no topo da tela antes de salvar.",
      });
      return;
    }
    if (!config.api_url || !config.api_key) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha URL da API e Chave Mestra.",
      });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .upsert({
          empresa_id: empresaAtiva.id,
          api_url: config.api_url,
          api_key: config.api_key,
          instance_name: config.instance_name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'empresa_id' })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("Não retornou linha — você precisa ter papel 'admin' nesta empresa.");

      toast({
        title: "Configuração salva",
        description: "Credenciais atualizadas com sucesso.",
      });

      await fetchConfig();
      checkConnection(config.api_url, config.api_key);
    } catch (error: any) {
      console.error("Erro ao salvar whatsapp_config:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Falha desconhecida — abra o Console (F12) para detalhes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!empresaAtiva?.id) {
      toast({
        variant: "destructive",
        title: "Nenhuma empresa ativa",
        description: "Selecione uma empresa antes de criar a instância.",
      });
      return;
    }
    if (!config.instance_name) {
      toast({
        variant: "destructive",
        title: "Nome necessário",
        description: "Por favor, defina um nome para a instância antes de criar.",
      });
      return;
    }

    setLoading(true);
    setQrCodeIssue(null);
    try {
      const createdQr = await evolutionService.connectViaBackend({
        empresaId: empresaAtiva.id,
        instanceName: config.instance_name,
        phoneNumber: pairingPhone,
        action: "create",
      });
      setQrCode(createdQr?.base64 ?? null);
      setQrCodeText(createdQr?.code ?? null);
      setPairingCode(createdQr?.pairingCode ?? null);
      toast({
        title: "Instância criada",
        description: createdQr?.base64 || createdQr?.code ? "QR Code gerado. Escaneie para conectar." : "Agora clique no ícone de QR Code para conectar seu WhatsApp.",
      });
      checkConnection(config.api_url, config.api_key);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar instância",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQrCodeOnce = async (instance: EvolutionInstance) => {
    if (empresaAtiva?.id) {
      return evolutionService.connectViaBackend({
        empresaId: empresaAtiva.id,
        instanceName: instance.instanceName,
        phoneNumber: pairingPhone,
      });
    }
    return evolutionService.getQrCode(config.api_url, config.api_key, instance.instanceName, pairingPhone);
  };

  const handleShowQrCode = async (instance: EvolutionInstance) => {
    if (instance.status === "disconnecting") {
      toast({
        variant: "destructive",
        title: "Instância ainda desconectando",
        description: "Aguarde alguns segundos e clique em Testar antes de tentar gerar o QR Code novamente.",
      });
      return;
    }
    setLoading(true);
    setQrCodeIssue(null);
    setQrCode(null);
    setQrCodeText(null);
    setPairingCode(null);
    try {
      const data = await fetchQrCodeOnce(instance);
      setQrCode(data.base64 ?? null);
      setQrCodeText(data.code ?? null);
      setPairingCode(data.pairingCode ?? null);
      if (data.base64) {
        setQrCode(data.base64);
      } else if (!data.code && !data.pairingCode) {
        const issue = data.count === 0
          ? "A API respondeu count: 0, sem QR Code. Informe o número acima para gerar código de pareamento ou ajuste QRCODE_LIMIT/SERVER_URL na Evolution."
          : `Resposta recebida, mas sem QR Code${data.state ? ` (status: ${data.state})` : ""}.`;
        setQrCodeIssue(issue);
        toast({
          variant: "destructive",
          title: "QR Code não foi gerado pela API",
          description: issue,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao buscar QR Code",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async (instanceName: string) => {
    if (!confirm("Tem certeza que deseja desconectar este WhatsApp?")) return;
    setLoading(true);
    try {
      await evolutionService.logoutInstance(config.api_url, config.api_key, instanceName);
      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso.",
      });
      checkConnection(config.api_url, config.api_key);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao desconectar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInstance = async (instanceName: string) => {
    if (!confirm("Tem certeza que deseja excluir esta instância?")) return;
    setLoading(true);
    try {
      await evolutionService.deleteInstance(config.api_url, config.api_key, instanceName);
      toast({
        title: "Instância excluída",
        description: "Instância removida com sucesso.",
      });
      checkConnection(config.api_url, config.api_key);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir instância",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (instanceName: string) => {
    if (!testNumber) {
      toast({
        variant: "destructive",
        title: "Número(s) necessário(s)",
        description: "Digite um ou mais números separados por vírgula (ex: 5511999999999, 5511888888888).",
      });
      return;
    }

    const numbers = testNumber.split(",").map(n => n.trim()).filter(n => n.length > 0);
    setSendingTest(true);
    setBatchStatus({ current: 0, total: numbers.length });
    
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      setBatchStatus({ current: i + 1, total: numbers.length });
      
      try {
        const response = await evolutionService.sendMessage(
          config.api_url,
          config.api_key,
          instanceName,
          num,
          testMessage
        );

        successCount++;

        try {
          await supabase.from("whatsapp_mensagens").insert({
            empresa_id: empresaAtiva?.id,
            to_number: num.replace(/\D/g, ""),
            body: testMessage,
            status: "sent",
            direction: "outbound",
            raw: { method: "evolution_api", instance: instanceName, response }
          });
        } catch (e) {
          console.error("Erro ao salvar no banco:", e);
        }

        if (numbers.length > 1 && i < numbers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`Erro ao enviar para ${num}:`, error);
        failCount++;
      }
    }

    setSendingTest(false);
    setBatchStatus(null);

    if (numbers.length > 1) {
      toast({
        title: "Envio em lote finalizado",
        description: `${successCount} sucessos, ${failCount} falhas.`,
      });
    } else if (successCount > 0) {
      toast({
        title: "Mensagem enviada!",
        description: "Verifique o WhatsApp de destino.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Erro no envio",
        description: "Não foi possível enviar a mensagem. Verifique a conexão.",
      });
    }
  };


  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Configuração do WhatsApp</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credenciais Evolution API</CardTitle>
              <CardDescription>
                Insira os dados da sua API Evolution para integrar o WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="api_url">URL da API</Label>
                <Input
                  id="api_url"
                  placeholder="https://evolutiondev.com.br"
                  value={config.api_url}
                  onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: https://evolutiondev.com.br
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="api_key">Chave Mestra (Global API Key)</Label>
                <Input
                  id="api_key"
                  type="password"
                  placeholder="Sua chave mestra"
                  value={config.api_key}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="instance_name">Nome da Instância Principal</Label>
                <Input
                  id="instance_name"
                  placeholder="Ex: MinhaEmpresa"
                  value={config.instance_name}
                  onChange={(e) => setConfig({ ...config, instance_name: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Servidor:</span>
                  {status === "checking" && (
                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verificando...
                    </span>
                  )}
                  {status === "connected" && (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" /> Evolution online
                    </span>
                  )}
                  {status === "disconnected" && (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <XCircle className="w-4 h-4" /> Evolution offline
                    </span>
                  )}
                </div>
                {status === "connected" && mainInstance && (
                  <div className={`text-sm ${mainInstanceStatus === "open" ? "text-green-600" : mainInstanceStatus === "connecting" || mainInstanceStatus === "disconnecting" ? "text-yellow-600" : "text-red-600"}`}>
                    Instância: {instanceStatusLabel}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => checkConnection(config.api_url, config.api_key)}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Testar
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instruções de Instalação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                1. No seu terminal, acesse a VPS: <code>ssh root@2.25.201.90</code> ou use o domínio <code>ssh root@evolutiondev.com.br</code>
              </p>
              <p>
                2. Certifique-se de que o Docker está instalado.
              </p>
              <p>
                3. Rode o comando do Docker Compose que fornecemos anteriormente.
              </p>
              <p>
                4. Após rodar, insira a URL e a Chave Mestra acima.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <Button variant="link" className="p-0 h-auto justify-start" asChild>
                  <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                    Documentação Oficial Evolution <ExternalLink className="w-3 h-3" />
                  </a>
                </Button>
                <Button variant="link" className="p-0 h-auto justify-start" onClick={() => navigate("/marketing")}>
                  <Smartphone className="w-3 h-3 mr-1" /> Tutorial Twilio Sandbox (join ...)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Instâncias</CardTitle>
                <CardDescription>
                  Gerencie suas conexões do WhatsApp.
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleCreateInstance} disabled={loading || !config.api_url || !config.api_key || !config.instance_name}>
                <Plus className="w-4 h-4 mr-2" /> Criar Nova
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {instances.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-sm text-muted-foreground">Nenhuma instância encontrada.</p>
                  </div>
                ) : (
                  instances.map((instance) => (
                    <div key={instance.instanceName} className="space-y-4 p-4 border rounded-lg bg-card">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{instance.instanceName}</p>
                          <p className={`text-xs ${instance.status === "open" ? "text-green-600" : instance.status === "connecting" || instance.status === "disconnecting" ? "text-yellow-600" : "text-red-600"}`}>
                            {instance.status === "open" ? "WhatsApp conectado" : instance.status === "connecting" ? "Aguardando leitura do QR" : instance.status === "disconnecting" ? "Desconectando — aguarde e atualize" : "WhatsApp desconectado"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {instance.status !== 'open' ? (
                            <Button size="icon" variant="outline" title="Ver QR Code" disabled={loading || instance.status === "disconnecting"} onClick={() => handleShowQrCode(instance)}>
                              <QrCode className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="outline" className="text-orange-600 border-orange-200" title="Desconectar" disabled={loading} onClick={() => handleLogout(instance.instanceName)}>
                              <LogOut className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="outline" className="text-red-600 border-red-200" title="Excluir" disabled={loading} onClick={() => handleDeleteInstance(instance.instanceName)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {instance.status === 'open' && (
                        <div className="pt-4 border-t space-y-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teste de Disparo (Múltiplos: separe por vírgula)</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Input 
                                placeholder="5511999999999, 5511888888888" 
                                className="flex-1"
                                value={testNumber}
                                onChange={(e) => setTestNumber(e.target.value)}
                                disabled={sendingTest}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => handleSendTest(instance.instanceName)}
                                disabled={sendingTest}
                              >
                                <Send className="w-4 h-4 mr-2" /> 
                                {sendingTest ? (batchStatus ? `Enviando ${batchStatus.current}/${batchStatus.total}` : "Enviando...") : "Testar"}
                              </Button>
                            </div>
                            {sendingTest && batchStatus && (
                              <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-green-500 h-full transition-all duration-300" 
                                  style={{ width: `${(batchStatus.current / batchStatus.total) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 space-y-2 rounded-lg border p-4">
                <Label htmlFor="pairing_phone">Conectar por código de pareamento</Label>
                <Input
                  id="pairing_phone"
                  placeholder="5561996757585"
                  value={pairingPhone}
                  onChange={(event) => setPairingPhone(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional: preencha antes de clicar no ícone de QR Code para receber um código numérico no lugar do QR.
                </p>
              </div>

              {(qrCode || qrCodeText || pairingCode) && (
                <div className="mt-6 flex flex-col items-center p-6 border rounded-lg bg-white">
                  {(qrCode || qrCodeText) && (
                    <>
                      <p className="text-sm font-medium mb-4 text-black">Escaneie o QR Code no seu WhatsApp</p>
                      {qrCode ? (
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                      ) : (
                        <QRCodeSVG value={qrCodeText!} size={256} />
                      )}
                    </>
                  )}
                  {pairingCode && (
                    <div className="mt-4 flex flex-col items-center gap-2 text-black">
                      <p className="text-sm font-medium">Ou conecte pelo código de pareamento:</p>
                      <p className="rounded border px-4 py-2 font-mono text-xl tracking-widest">{pairingCode}</p>
                      <p className="max-w-xs text-center text-xs text-muted-foreground">
                        No WhatsApp: Aparelhos conectados → Conectar com número de telefone → digite este código.
                      </p>
                    </div>
                  )}
                  <Button variant="link" size="sm" onClick={() => { setQrCode(null); setQrCodeText(null); setPairingCode(null); }} className="mt-4 text-black">
                    Fechar
                  </Button>
                </div>
              )}

              {qrCodeIssue && (
                <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-medium">QR Code não disponível</p>
                  <p className="mt-1">{qrCodeIssue}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
