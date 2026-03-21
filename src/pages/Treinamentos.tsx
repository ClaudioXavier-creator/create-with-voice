import { GraduationCap, Plus, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useTreinamentos } from "@/store/feedbpf-store";

export default function Treinamentos() {
  const [items] = useTreinamentos();

  const isVencido = (validade: string) => new Date(validade) < new Date();
  const isProximo = (validade: string) => {
    const d = new Date(validade);
    const now = new Date();
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  };

  return (
    <>
      <PageHeader icon={GraduationCap} title="Treinamentos" description="Controle de capacitação dos colaboradores" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registro de Treinamentos</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Treinamento</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Treinamento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.funcionario}</TableCell>
                  <TableCell>{t.treinamento}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.data}</TableCell>
                  <TableCell>{t.instrutor}</TableCell>
                  <TableCell className="whitespace-nowrap">{t.validade}</TableCell>
                  <TableCell>
                    {isVencido(t.validade) ? (
                      <Badge className="bg-destructive text-destructive-foreground gap-1"><AlertCircle className="w-3 h-3" /> Vencido</Badge>
                    ) : isProximo(t.validade) ? (
                      <Badge className="bg-warning text-accent-foreground">Próximo</Badge>
                    ) : (
                      <Badge className="bg-primary text-primary-foreground">Válido</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
