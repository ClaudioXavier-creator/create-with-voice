import { FileText, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";

const POPS = [
  { codigo: "POP-001", nome: "Limpeza da área de produção", versao: "03", data: "2026-01-10", responsavel: "Dr. Cláudio", status: "ativo" },
  { codigo: "POP-002", nome: "Controle de pragas", versao: "02", data: "2025-11-20", responsavel: "Dr. Cláudio", status: "ativo" },
  { codigo: "POP-003", nome: "Recebimento de matérias-primas", versao: "04", data: "2026-02-05", responsavel: "Maria Santos", status: "ativo" },
  { codigo: "POP-004", nome: "Operação do misturador", versao: "02", data: "2025-09-15", responsavel: "Carlos Ferreira", status: "em_revisao" },
  { codigo: "POP-005", nome: "Controle de flushing", versao: "01", data: "2026-03-01", responsavel: "Dr. Cláudio", status: "ativo" },
  { codigo: "POP-006", nome: "Rastreabilidade de lotes", versao: "03", data: "2025-12-10", responsavel: "Ana Costa", status: "ativo" },
  { codigo: "POP-007", nome: "Coleta de amostras", versao: "02", data: "2025-10-08", responsavel: "Dr. Cláudio", status: "obsoleto" },
];

const statusBadge: Record<string, string> = {
  ativo: "bg-primary text-primary-foreground",
  em_revisao: "bg-warning text-accent-foreground",
  obsoleto: "bg-muted text-muted-foreground",
};

export default function Documentos() {
  return (
    <>
      <PageHeader icon={FileText} title="Documentos e POPs" description="Controle de procedimentos, manuais e instruções de trabalho" />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Procedimentos Operacionais</CardTitle>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo POP</Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Revisão</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {POPS.map((p) => (
                <TableRow key={p.codigo}>
                  <TableCell className="font-mono text-sm">{p.codigo}</TableCell>
                  <TableCell>{p.nome}</TableCell>
                  <TableCell>{p.versao}</TableCell>
                  <TableCell>{p.data}</TableCell>
                  <TableCell>{p.responsavel}</TableCell>
                  <TableCell><Badge className={statusBadge[p.status]}>{p.status === "em_revisao" ? "Em revisão" : p.status.charAt(0).toUpperCase() + p.status.slice(1)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
