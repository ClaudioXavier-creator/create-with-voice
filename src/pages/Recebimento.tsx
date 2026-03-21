import { Package, Plus, CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { useRecebimentos } from "@/store/feedbpf-store";

export default function Recebimento() {
  const [items] = useRecebimentos();

  return (
    <>
      <PageHeader icon={Package} title="Recebimento de Matérias-Primas" description="Controle de qualidade no recebimento de insumos" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros de Recebimento</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Recebimento</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Matéria-Prima</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Odor</TableHead>
                <TableHead>Umidade</TableHead>
                <TableHead>Insetos</TableHead>
                <TableHead>Aprovado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                  <TableCell>{r.fornecedor}</TableCell>
                  <TableCell>{r.materiaPrima}</TableCell>
                  <TableCell className="font-mono text-sm">{r.lote}</TableCell>
                  <TableCell><Badge variant={r.odor === "normal" ? "default" : "destructive"}>{r.odor}</Badge></TableCell>
                  <TableCell>{r.umidade}</TableCell>
                  <TableCell><Badge variant={r.insetos === "ausente" ? "default" : "destructive"}>{r.insetos}</Badge></TableCell>
                  <TableCell>{r.aprovado ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-destructive" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
