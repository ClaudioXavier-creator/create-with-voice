import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, Calendar, Truck, User, Info } from "lucide-react";
import { printElement } from "@/utils/printUtils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MapaExpedicaoProps {
  expedicoes: any[];
  empresa: any;
  dataInicio?: string;
  dataFim?: string;
}

export function MapaExpedicaoDigital({ expedicoes, empresa, dataInicio, dataFim }: MapaExpedicaoProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    printElement("mapa-expedicao-print-area", {
      title: `Mapa_Expedicao_${new Date().toISOString().split('T')[0]}`,
      landscape: true
    });
  };

  // Flatten expeditions with items for the report
  const rows = expedicoes.flatMap(exp => {
    const items = exp.itens || [];
    if (items.length === 0) {
      return [{
        ...exp,
        produto: "—",
        lote: "—",
        quantidade: 0,
        unidade: "—",
        sacos: "—"
      }];
    }
    return items.map((item: any) => ({
      ...exp,
      produto: item.produto,
      lote: item.lote_produto || "NÃO INFORMADO",
      quantidade: item.quantidade,
      unidade: item.unidade,
      sacos: item.quantidade_sacos || "—"
    }));
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">Visualização Digital do Mapa</h3>
            <p className="text-xs text-muted-foreground">Formato compatível com exigências do MAPA para auditoria</p>
          </div>
        </div>
        <Button onClick={handlePrint} size="sm">
          <Printer className="h-4 w-4 mr-2" /> Imprimir / PDF
        </Button>
      </div>

      <div id="mapa-expedicao-print-area" ref={printRef} className="bg-white p-6 text-black border rounded-md min-h-[500px]">
        {/* Header do Relatório (Apenas Impressão ou Preview) */}
        <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-start">
          <div className="space-y-1">
            <h1 className="text-xl font-bold uppercase">Mapa de Expedição e Saída de Produtos</h1>
            <p className="text-sm font-semibold">{empresa?.nome || "Empresa Não Identificada"}</p>
            <p className="text-xs">CNPJ: {empresa?.cnpj || "—"} | I.E: {empresa?.inscricao_estadual || "—"}</p>
            <p className="text-xs">Endereço: {empresa?.endereco || "—"}, {empresa?.cidade || "—"}/{empresa?.uf || "—"}</p>
          </div>
          <div className="text-right text-xs space-y-1">
            <p className="font-bold">RELATÓRIO DE FISCALIZAÇÃO</p>
            <p>Período: {dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : "Início"} até {dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : "Hoje"}</p>
            <p>Emissão: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <Table className="border border-black">
          <TableHeader className="bg-gray-100">
            <TableRow className="border-black hover:bg-transparent">
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">DATA</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">NF</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">CLIENTE / DESTINATÁRIO</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">CIDADE/UF</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">PRODUTO</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">LOTE</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">QUANT.</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">UN</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">SACOS</TableHead>
              <TableHead className="text-black font-bold border-r border-black h-8 px-2 text-[10px]">TRANSPORTE</TableHead>
              <TableHead className="text-black font-bold h-8 px-2 text-[10px]">PLACA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx} className="border-black hover:bg-transparent">
                <TableCell className="border-r border-black py-1 px-2 text-[10px] whitespace-nowrap">{row.data_saida || row.data_emissao || "—"}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] font-bold">{row.numero_nf}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] leading-tight">
                  <div className="font-bold uppercase">{row.cliente_nome}</div>
                  <div className="text-[9px]">{row.cliente_cnpj}</div>
                </TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px]">{row.cliente_cidade}/{row.cliente_uf}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] font-medium leading-tight">{row.produto}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] font-bold">
                  {row.lote === "NÃO INFORMADO" ? (
                    <span className="text-red-600 font-black">LOTE NÃO INFORMADO</span>
                  ) : row.lote}
                </TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] text-right">{row.quantidade}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] text-center uppercase">{row.unidade}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] text-center">{row.sacos}</TableCell>
                <TableCell className="border-r border-black py-1 px-2 text-[10px] leading-tight">
                  <div className="uppercase">{row.transportadora_nome || "—"}</div>
                  <div className="text-[9px]">{row.motorista_nome || "—"}</div>
                </TableCell>
                <TableCell className="py-1 px-2 text-[10px] text-center font-bold">{row.veiculo_placa || "—"}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground italic">
                  Nenhum registro encontrado para o período.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="mt-12 grid grid-cols-2 gap-12 text-center">
          <div className="border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Responsável Técnico</p>
            <p className="text-[10px] text-muted-foreground">(Nome e Assinatura)</p>
          </div>
          <div className="border-t border-black pt-2">
            <p className="text-xs font-bold uppercase">Encarregado de Expedição</p>
            <p className="text-[10px] text-muted-foreground">(Nome e Assinatura)</p>
          </div>
        </div>

        <div className="mt-8 text-[9px] text-gray-500 italic text-center border-t pt-4">
          Este documento atende aos requisitos de rastreabilidade do MAPA (Ministério da Agricultura e Pecuária).
          Gerado pelo sistema POP 5 Digital.
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3 print:hidden">
        <Info className="h-5 w-5 text-blue-500 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold">Dica para o RT / Gestor:</p>
          <p>O MAPA exige que todas as saídas tenham identificação de lote. Linhas marcadas com <span className="font-bold text-red-600 uppercase">Lote Não Informado</span> devem ser revisadas para garantir a conformidade na auditoria.</p>
        </div>
      </div>
    </div>
  );
}
