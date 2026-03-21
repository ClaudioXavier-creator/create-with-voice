import { Factory, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useProducao } from "@/store/feedbpf-store";

export default function Producao() {
  const [items] = useProducao();

  return (
    <>
      <PageHeader icon={Factory} title="Controle de Produção" description="Registro de fabricação de rações e suplementos" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros de Produção</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Operador</TableHead>
                <TableHead>Tempo Mistura</TableHead>
                <TableHead>Quantidade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                  <TableCell>{p.produto}</TableCell>
                  <TableCell className="font-mono text-sm">{p.lote}</TableCell>
                  <TableCell>{p.operador}</TableCell>
                  <TableCell>{p.tempoMistura}</TableCell>
                  <TableCell>{p.quantidade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
