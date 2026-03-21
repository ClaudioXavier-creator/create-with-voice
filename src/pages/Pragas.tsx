import { Bug, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const DATA = [
  { id: "1", data: "2026-03-15", local: "Depósito MP", tipoPraga: "Roedores", acao: "Reposição de iscas", responsavel: "Empresa ControlPrag" },
  { id: "2", data: "2026-03-10", local: "Área externa", tipoPraga: "Insetos", acao: "Desinsetização geral", responsavel: "Empresa ControlPrag" },
  { id: "3", data: "2026-03-05", local: "Expedição", tipoPraga: "Aves", acao: "Vedação de aberturas", responsavel: "Manutenção interna" },
];

export default function Pragas() {
  return (
    <>
      <PageHeader icon={Bug} title="Controle de Pragas" description="Monitoramento e controle de pragas na fábrica" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Tipo de Praga</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DATA.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                  <TableCell>{r.local}</TableCell>
                  <TableCell>{r.tipoPraga}</TableCell>
                  <TableCell>{r.acao}</TableCell>
                  <TableCell>{r.responsavel}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
