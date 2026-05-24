import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Save, RefreshCw, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useAuth } from "@/hooks/useAuth";

const WhatsAppConfig = () => {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    api_url: "",
    api_key: "",
    instance_name: "",
  });
  const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("disconnected");

  useEffect(() => {
    if (empresa?.id) {
      fetchConfig();
    }
  }, [empresa?.id]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("empresa_id", empresa?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setConfig({
          api_url: data.api_url,
          api_key: data.api_key,
          instance_name: data.instance_name || "",
        });
        checkConnection(data.api_url, data.api_key, data.instance_name);
      }
    } catch (error: any) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async (url: string, key: string, instance?: string) => {
    if (!url || !key) return;
    setStatus("checking");
    try {
      // Basic check if the API is reachable and key is valid
      // Note: Evolution API has a /version endpoint or similar
      const response = await fetch(`${url.replace(/\/$/, "")}/instance/fetchInstances`, {
        headers: {
          "apikey": key
        }
      });
      
      if (response.ok) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setStatus("disconnected");
    }
  };

  const handleSave = async () => {
    if (!empresa?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("whatsapp_config")
        .upsert({
          empresa_id: empresa.id,
          api_url: config.api_url,
          api_key: config.api_key,
          instance_name: config.instance_name,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'empresa_id' });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "As credenciais do WhatsApp foram atualizadas com sucesso.",
      });
      
      checkConnection(config.api_url, config.api_key, config.instance_name);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Configuração do WhatsApp</h1>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credenciais Evolution API</CardTitle>
            <CardDescription>
              Insira os dados da sua API Evolution para integrar o WhatsApp ao sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="api_url">URL da API</Label>
              <Input
                id="api_url"
                placeholder="https://api.seuservidor.com"
                value={config.api_url}
                onChange={(e) => setConfig({ ...config, api_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: http://{user?.email === "root" ? "seu-ip" : "185.158.133.1"}:8080
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
              <Label htmlFor="instance_name">Nome da Instância (Opcional)</Label>
              <Input
                id="instance_name"
                placeholder="Ex: MinhaEmpresa"
                value={config.instance_name}
                onChange={(e) => setConfig({ ...config, instance_name: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                {status === "checking" && (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Verificando...
                  </span>
                )}
                {status === "connected" && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" /> Conectado
                  </span>
                )}
                {status === "disconnected" && (
                  <span className="flex items-center gap-1 text-sm text-red-600">
                    <XCircle className="w-4 h-4" /> Desconectado
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => checkConnection(config.api_url, config.api_key, config.instance_name)}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Testar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              1. Acesse seu servidor via SSH.
            </p>
            <p>
              2. Certifique-se de que a Evolution API está rodando no Docker.
            </p>
            <p>
              3. Use o IP da sua VPS seguido da porta (padrão 8080) na URL da API.
            </p>
            <p>
              4. A Chave Mestra é o valor definido em <code>AUTHENTICATION_API_KEY</code> no seu arquivo <code>docker-compose.yml</code>.
            </p>
            <div className="pt-2">
              <Button variant="link" className="p-0 h-auto" asChild>
                <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  Documentação Oficial <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
