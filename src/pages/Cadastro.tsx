import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { useState } from "react";

const TIPOS = ["Ração farelada", "Ração peletizada", "Núcleo", "Premix", "Suplemento mineral"];

export default function Cadastro() {
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>(["Ração farelada"]);

  const toggleTipo = (t: string) => {
    setTiposSelecionados((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <>
      <PageHeader icon={Building2} title="Cadastro da Fábrica" description="Informações gerais da unidade produtora" />
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Dados da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da Empresa</Label>
            <Input placeholder="Ex: AgroNutri Rações Ltda" />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input placeholder="00.000.000/0000-00" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Endereço</Label>
            <Input placeholder="Rua, número, cidade, estado" />
          </div>
          <div className="space-y-2">
            <Label>Responsável Técnico</Label>
            <Input placeholder="Nome do responsável" />
          </div>
          <div className="space-y-2">
            <Label>CRMV</Label>
            <Input placeholder="CRMV-XX 00000" />
          </div>
          <div className="space-y-2">
            <Label>Capacidade Produtiva</Label>
            <Input placeholder="Ex: 10.000 ton/mês" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <Label>Tipo de Produção</Label>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <Badge
                  key={t}
                  variant={tiposSelecionados.includes(t) ? "default" : "outline"}
                  className="cursor-pointer select-none"
                  onClick={() => toggleTipo(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <Button className="w-full sm:w-auto">Salvar Cadastro</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
