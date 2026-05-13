
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface Registro {
  id: string;
  data_execucao: string;
  setor: string;
  executor: string;
  status: string;
  observacoes?: string;
}

interface RegistrosTableProps {
  registros: Registro[];
  title?: string;
  emptyMessage?: string;
}

export const RegistrosTable = ({ 
  registros, 
  title, 
  emptyMessage = "Nenhum registro encontrado" 
}: RegistrosTableProps) => {
  if (registros.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="p-4 border-b bg-muted/30">
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Setor/Área</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="max-w-[300px]">Detalhes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {registros.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
              <TableCell className="font-medium">{r.setor}</TableCell>
              <TableCell>{r.executor}</TableCell>
              <TableCell>
                {r.status === "concluido" ? (
                  <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                ) : (
                  <Badge className="bg-destructive text-destructive-foreground">NC</Badge>
                )}
              </TableCell>
              <TableCell className="max-w-[300px] text-xs whitespace-pre-line truncate">
                {(r.observacoes || "").slice(0, 150)}
                {(r.observacoes?.length || 0) > 150 ? "…" : ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

import { CardContent } from "@/components/ui/card";
