import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { useState } from "react";

const DATA = [
  { id: "1", produto: "Ração Bovino Engorda", loteProduto: "RBE-0320-01", materiaPrima: "Milho grão", loteMP: "MC-2026-041", fornecedor: "AgroCorp" },
  { id: "2", produto: "Ração Bovino Engorda", loteProduto: "RBE-0320-01", materiaPrima: "Farelo de soja", loteMP: "FS-2026-088", fornecedor: "NutriMax" },
  { id: "3", produto: "Suplemento Mineral", loteProduto: "SM-0320-01", materiaPrima: "Fosfato bicálcico", loteMP: "FB-2026-012", fornecedor: "MineralBras" },
  { id: "4", produto: "Suplemento Mineral", loteProduto: "SM-0320-01", materiaPrima: "Sal comum", loteMP: "SC-2026-055", fornecedor: "SalNorte" },
];

export default function Rastreabilidade() {
  const [busca, setBusca] = useState("");
  const filtered = DATA.filter((d) =>
    Object.values(d).some((v) => v.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <>
      <PageHeader icon={Search} title="Rastreabilidade" description="Rastreie do produto final até a matéria-prima e fornecedor" />
      <Card>
        <CardHeader>
          <CardTitle className="font-display">Busca de Rastreabilidade</CardTitle>
          <Input placeholder="Buscar por produto, lote, matéria-prima ou fornecedor..." value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-2" />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Lote Produto</TableHead>
                <TableHead>Matéria-Prima</TableHead>
                <TableHead>Lote MP</TableHead>
                <TableHead>Fornecedor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.produto}</TableCell>
                  <TableCell className="font-mono text-sm">{r.loteProduto}</TableCell>
                  <TableCell>{r.materiaPrima}</TableCell>
                  <TableCell className="font-mono text-sm">{r.loteMP}</TableCell>
                  <TableCell>{r.fornecedor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
