import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, BookOpen, PlayCircle, RotateCcw, Lightbulb, Scale, Sparkles } from "lucide-react";
import type { ModuloOrientacao } from "@/config/orientacoesConfig";
import { Link } from "react-router-dom";

interface Props {
  modulo: ModuloOrientacao;
  showRouteLink?: boolean;
}

export function OrientacaoModulo({ modulo, showRouteLink = true }: Props) {
  const initialState = modulo.campos_simulacao.reduce((acc, c) => {
    acc[c.nome] = "";
    return acc;
  }, {} as Record<string, any>);

  const [valores, setValores] = useState<Record<string, any>>(initialState);
  const [salvo, setSalvo] = useState(false);

  const preencherExemplo = () => {
    const exemplo = modulo.campos_simulacao.reduce((acc, c) => {
      acc[c.nome] = c.exemplo;
      return acc;
    }, {} as Record<string, any>);
    setValores(exemplo);
    setSalvo(false);
  };

  const limpar = () => {
    setValores(initialState);
    setSalvo(false);
  };

  const simularSalvar = () => {
    setSalvo(true);
  };

  const renderCampo = (campo: typeof modulo.campos_simulacao[0]) => {
    const valor = valores[campo.nome];

    switch (campo.tipo) {
      case "textarea":
        return (
          <Textarea
            value={valor || ""}
            onChange={(e) => setValores({ ...valores, [campo.nome]: e.target.value })}
            placeholder={String(campo.exemplo)}
            rows={3}
          />
        );
      case "select":
        return (
          <Select value={String(valor || "")} onValueChange={(v) => setValores({ ...valores, [campo.nome]: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {campo.opcoes?.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={!!valor}
              onCheckedChange={(c) => setValores({ ...valores, [campo.nome]: c })}
            />
            <span className="text-sm text-muted-foreground">{valor ? "Sim" : "Não"}</span>
          </div>
        );
      case "number":
        return (
          <Input
            type="number"
            value={valor || ""}
            onChange={(e) => setValores({ ...valores, [campo.nome]: e.target.value })}
            placeholder={String(campo.exemplo)}
          />
        );
      case "date":
        return (
          <Input
            type="date"
            value={valor || ""}
            onChange={(e) => setValores({ ...valores, [campo.nome]: e.target.value })}
          />
        );
      default:
        return (
          <Input
            value={valor || ""}
            onChange={(e) => setValores({ ...valores, [campo.nome]: e.target.value })}
            placeholder={String(campo.exemplo)}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="outline">{modulo.codigo}</Badge>
                {modulo.base_legal.map((l) => (
                  <Badge key={l} variant="secondary" className="text-xs">
                    <Scale className="w-3 h-3 mr-1" />{l}
                  </Badge>
                ))}
              </div>
              <CardTitle>{modulo.titulo}</CardTitle>
              <CardDescription className="mt-1">{modulo.descricao}</CardDescription>
            </div>
            {showRouteLink && (
              <Button asChild variant="outline" size="sm">
                <Link to={modulo.rota}>Ir ao módulo →</Link>
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tutorial" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="tutorial" className="gap-2">
            <BookOpen className="w-4 h-4" />Tutorial
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="gap-2">
            <PlayCircle className="w-4 h-4" />Simulação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutorial" className="mt-4 space-y-3">
          {modulo.passos.map((passo, idx) => (
            <Card key={idx}>
              <CardContent className="pt-5">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-base">{passo.titulo}</h4>
                    <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                    {passo.dica && (
                      <Alert className="mt-2 bg-accent/30 border-accent">
                        <Lightbulb className="h-4 w-4" />
                        <AlertDescription className="text-xs">{passo.dica}</AlertDescription>
                      </Alert>
                    )}
                    {passo.base_legal && (
                      <Badge variant="outline" className="text-xs">
                        <Scale className="w-3 h-3 mr-1" />{passo.base_legal}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="sandbox" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Modo Sandbox — Treinamento Seguro
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Preencha com dados fictícios. <strong>Nada é salvo no banco.</strong>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={preencherExemplo}>
                    <Sparkles className="w-4 h-4 mr-1" />Preencher Exemplo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={limpar}>
                    <RotateCcw className="w-4 h-4 mr-1" />Limpar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modulo.campos_simulacao.map((campo) => (
                  <div key={campo.nome} className="space-y-1.5">
                    <Label className="text-sm">{campo.label}</Label>
                    {renderCampo(campo)}
                    {campo.ajuda && <p className="text-xs text-muted-foreground">{campo.ajuda}</p>}
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={simularSalvar}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />Simular Gravação
                </Button>
              </div>

              {salvo && (
                <Alert className="bg-primary/5 border-primary/30">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-primary">Simulação concluída ✓</AlertTitle>
                  <AlertDescription className="text-sm mt-2">
                    {modulo.exemplo_resultado || "Em uso real, este registro seria salvo no banco com carimbo SHA-256 anti-fraude."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
