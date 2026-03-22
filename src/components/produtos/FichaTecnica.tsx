import { useState, useEffect, useRef } from "react";
import { Loader2, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const CLASSIFICACAO_LABELS: Record<string, string> = {
  racao: "Ração", suplemento: "Suplemento", premix: "Premix",
  aditivo: "Aditivo", sal_mineral: "Sal Mineral",
};

const NIVEIS_LABELS: Record<string, string> = {
  umidade: "Umidade (máx.)", proteina_bruta: "Proteína Bruta (mín.)",
  extrato_etereo: "Extrato Etéreo (mín.)", fibra_bruta: "Fibra Bruta (máx.)",
  materia_mineral: "Matéria Mineral (máx.)", calcio: "Cálcio",
  fosforo: "Fósforo (mín.)", sodio: "Sódio", ndt: "NDT",
};

interface Props {
  produtoId: string;
}

export default function FichaTecnica({ produtoId }: Props) {
  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, [produtoId]);

  async function loadData() {
    const [{ data: prod }, { data: emp }] = await Promise.all([
      supabase.from("produtos").select("*").eq("id", produtoId).single(),
      supabase.from("empresas").select("*").limit(1).maybeSingle(),
    ]);
    setProduto(prod);
    setEmpresa(emp);
    setLoading(false);
  }

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Ficha Técnica - ${produto?.nome}</title>
      <style>
        @page { margin: 15mm; }
        body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; margin: 0; }
        h1 { font-size: 16pt; margin-bottom: 4px; }
        h2 { font-size: 12pt; border-bottom: 1px solid #999; padding-bottom: 3px; margin: 12px 0 6px; color: #333; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; }
        th, td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; font-size: 9pt; }
        th { background: #f5f5f5; font-weight: bold; width: 40%; }
        .header { text-align: center; margin-bottom: 12px; }
        .logo-text { font-size: 8pt; color: #666; }
        .footer { font-size: 7pt; color: #999; margin-top: 20px; text-align: center; }
      </style></head><body>
      ${el.innerHTML}
      <script>window.print();window.close();</script>
      </body></html>
    `);
    w.document.close();
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!produto) return <p className="text-muted-foreground text-center py-8">Produto não encontrado.</p>;

  const niveis = (produto.niveis_garantia as Record<string, string>) || {};

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Imprimir Ficha Técnica
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6" ref={printRef}>
          <div className="header text-center mb-6">
            {empresa && <p className="text-xs text-muted-foreground">{empresa.nome} — CNPJ: {empresa.cnpj}</p>}
            <h1 className="text-xl font-bold text-foreground mt-1">FICHA TÉCNICA DE PRODUTO</h1>
            <p className="text-sm text-muted-foreground">{produto.nome}</p>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 text-foreground">1. Identificação do Produto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <tbody>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground w-[40%]">Nome do Produto</th><td className="px-3 py-2">{produto.nome}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Marca</th><td className="px-3 py-2">{produto.marca}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Classificação</th><td className="px-3 py-2"><Badge variant="secondary">{CLASSIFICACAO_LABELS[produto.classificacao] || produto.classificacao}</Badge></td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Espécie Alvo</th><td className="px-3 py-2">{produto.especie_alvo}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Categoria Animal</th><td className="px-3 py-2">{produto.categoria_animal}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Registro MAPA</th><td className="px-3 py-2 font-mono">{produto.registro_mapa}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Forma Física</th><td className="px-3 py-2">{produto.forma_fisica}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Peso Líquido</th><td className="px-3 py-2">{produto.peso_liquido} {produto.unidade_peso}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Embalagem</th><td className="px-3 py-2">{produto.embalagem}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Validade</th><td className="px-3 py-2">{produto.validade_meses} meses</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">2. Composição</h2>
          <p className="text-sm text-foreground">{produto.composicao || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">3. Níveis de Garantia</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Parâmetro</th><th className="bg-muted/50 px-3 py-2 text-foreground">Valor</th></tr>
              </thead>
              <tbody>
                {Object.entries(niveis).filter(([_, v]) => v).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-3 py-1.5">{NIVEIS_LABELS[key] || key}</td>
                    <td className="px-3 py-1.5 font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">4. Indicações de Uso</h2>
          <p className="text-sm text-foreground">{produto.indicacoes || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">5. Modo de Uso / Preparo</h2>
          <p className="text-sm text-foreground">{produto.modo_uso || "—"}</p>
          {produto.modo_preparo && <p className="text-sm text-foreground mt-1"><strong>Preparo:</strong> {produto.modo_preparo}</p>}

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">6. Precauções e Restrições</h2>
          <p className="text-sm text-foreground">{produto.precaucoes || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">7. Armazenamento</h2>
          <p className="text-sm text-foreground">{produto.armazenamento || "—"}</p>

          {produto.diferenciais && (
            <>
              <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">8. Diferenciais do Produto</h2>
              <p className="text-sm text-foreground">{produto.diferenciais}</p>
            </>
          )}

          {empresa && (
            <>
              <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">9. Dados do Fabricante</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border">
                  <tbody>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground w-[40%]">Razão Social</th><td className="px-3 py-2">{empresa.nome}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">CNPJ</th><td className="px-3 py-2">{empresa.cnpj}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Endereço</th><td className="px-3 py-2">{empresa.endereco}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Resp. Técnico</th><td className="px-3 py-2">{empresa.responsavel_tecnico} — CRMV: {empresa.crmv}</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          <p className="text-xs text-muted-foreground mt-8 text-center footer">
            Documento gerado pelo sistema Feed_BPF — Ficha Técnica conforme exigências MAPA
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
