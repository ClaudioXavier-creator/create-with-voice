import { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { gerarCarimboSync, carimboHTML } from "@/utils/carimboDocumento";
import { printElement } from "@/utils/printUtils";


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
  const { user } = useAuth();
  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<any>(null);
  // printRef no longer needed - print uses standalone HTML

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

  function formatNivel(value: any): string {
    if (value == null) return "";
    if (typeof value === "object") {
      const { min, max, unit } = value as { min?: string; max?: string; unit?: string };
      const u = unit ? ` ${unit}` : "";
      if (min && max) return `${min} – ${max}${u}`;
      if (min) return `mín. ${min}${u}`;
      if (max) return `máx. ${max}${u}`;
      return "";
    }
    return String(value);
  }

  // Safe text renderer — never lets an object reach JSX
  function s(value: any): string {
    if (value == null) return "";
    if (typeof value === "object") {
      // Try formatNivel first (handles {min,max,unit})
      const formatted = formatNivel(value);
      if (formatted) return formatted;
      try { return JSON.stringify(value); } catch { return ""; }
    }
    return String(value);
  }

  function handlePrint() {
    const niveis = (produto?.niveis_garantia as Record<string, any>) || {};
    const niveisRows = Object.entries(niveis).map(([key, value]) => [key, formatNivel(value)]).filter(([_, v]) => v).map(([key, value]) =>
      `<tr><td style="border:1px solid #999;padding:4px 8px;font-size:9pt">${NIVEIS_LABELS[key] || key}</td><td style="border:1px solid #999;padding:4px 8px;font-size:9pt;font-family:monospace">${value}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ficha Técnica - ${produto?.nome}</title>
<style>
  @page { margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #111; margin: 0; }
  h1 { font-size: 16pt; margin-bottom: 4px; text-align: center; }
  h2 { font-size: 11pt; border-bottom: 1px solid #999; padding-bottom: 3px; margin: 14px 0 6px; color: #333; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0; }
  th, td { border: 1px solid #999; padding: 4px 8px; text-align: left; font-size: 9pt; }
  th { background: #f0f0f0; font-weight: bold; width: 40%; }
  .header { text-align: center; margin-bottom: 14px; }
  .logo-text { font-size: 8pt; color: #666; }
  .footer { font-size: 7pt; color: #999; margin-top: 24px; text-align: center; }
  p { font-size: 10pt; margin: 4px 0; }
</style></head><body>
<div class="header">
  ${empresa ? `<p class="logo-text">${empresa.nome} — CNPJ: ${empresa.cnpj}</p>` : ""}
  <h1>FICHA TÉCNICA DE PRODUTO</h1>
  <p>${produto?.nome || ""}</p>
</div>

<h2>1. Identificação do Produto</h2>
<table>
  <tr><th>Nome do Produto</th><td>${produto?.nome || ""}</td></tr>
  <tr><th>Marca</th><td>${produto?.marca || ""}</td></tr>
  <tr><th>Classificação</th><td>${CLASSIFICACAO_LABELS[produto?.classificacao] || produto?.classificacao || ""}</td></tr>
  <tr><th>Espécie Alvo</th><td>${produto?.especie_alvo || ""}</td></tr>
  <tr><th>Categoria Animal</th><td>${produto?.categoria_animal || ""}</td></tr>
  <tr><th>Registro MAPA</th><td>${produto?.registro_mapa || ""}</td></tr>
  <tr><th>Forma Física</th><td>${produto?.forma_fisica || ""}</td></tr>
  <tr><th>Peso Líquido</th><td>${produto?.peso_liquido || ""} ${produto?.unidade_peso || ""}</td></tr>
  <tr><th>Embalagem</th><td>${produto?.embalagem || ""}</td></tr>
  <tr><th>Validade</th><td>${produto?.validade_meses || ""} meses</td></tr>
</table>

<h2>2. Composição</h2>
<p>${produto?.composicao || "—"}</p>

<h2>3. Níveis de Garantia</h2>
<table>
  <tr><th>Parâmetro</th><th>Valor</th></tr>
  ${niveisRows || '<tr><td colspan="2">—</td></tr>'}
</table>

<h2>4. Indicações de Uso</h2>
<p>${produto?.indicacoes || "—"}</p>

<h2>5. Modo de Uso / Preparo</h2>
<p>${produto?.modo_uso || "—"}</p>
${produto?.modo_preparo ? `<p><strong>Preparo:</strong> ${produto.modo_preparo}</p>` : ""}

<h2>6. Precauções e Restrições</h2>
<p>${produto?.precaucoes || "—"}</p>

<h2>7. Armazenamento</h2>
<p>${produto?.armazenamento || "—"}</p>

${produto?.diferenciais ? `<h2>8. Diferenciais do Produto</h2><p>${produto.diferenciais}</p>` : ""}

${empresa ? `
<h2>${produto?.diferenciais ? "9" : "8"}. Dados do Fabricante</h2>
<table>
  <tr><th>Razão Social</th><td>${empresa.nome}</td></tr>
  <tr><th>CNPJ</th><td>${empresa.cnpj}</td></tr>
  <tr><th>Endereço</th><td>${empresa.endereco}</td></tr>
  <tr><th>Resp. Técnico</th><td>${empresa.responsavel_tecnico} — CRMV: ${empresa.crmv}</td></tr>
</table>` : ""}

<p class="footer">Documento gerado pelo sistema BPF_Consult — Ficha Técnica conforme exigências MAPA</p>
${carimboHTML(gerarCarimboSync({
  documentoTipo: "Ficha Técnica de Produto",
  documentoId: produto?.nome,
  empresa: empresa?.nome,
  usuario: user?.email,
}))}
<script>window.print();window.close();</script>
</body></html>`;

    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
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
        <CardContent className="pt-6">
          <div className="header text-center mb-6">
            {empresa && <p className="text-xs text-muted-foreground">{s(empresa.nome)} — CNPJ: {s(empresa.cnpj)}</p>}
            <h1 className="text-xl font-bold text-foreground mt-1">FICHA TÉCNICA DE PRODUTO</h1>
            <p className="text-sm text-muted-foreground">{s(produto.nome)}</p>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 text-foreground">1. Identificação do Produto</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <tbody>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground w-[40%]">Nome do Produto</th><td className="px-3 py-2">{s(produto.nome)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Marca</th><td className="px-3 py-2">{s(produto.marca)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Classificação</th><td className="px-3 py-2"><Badge variant="secondary">{CLASSIFICACAO_LABELS[produto.classificacao] || s(produto.classificacao)}</Badge></td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Espécie Alvo</th><td className="px-3 py-2">{s(produto.especie_alvo)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Categoria Animal</th><td className="px-3 py-2">{s(produto.categoria_animal)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Registro MAPA</th><td className="px-3 py-2 font-mono">{s(produto.registro_mapa)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Forma Física</th><td className="px-3 py-2">{s(produto.forma_fisica)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Peso Líquido</th><td className="px-3 py-2">{s(produto.peso_liquido)} {s(produto.unidade_peso)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Embalagem</th><td className="px-3 py-2">{s(produto.embalagem)}</td></tr>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Validade</th><td className="px-3 py-2">{s(produto.validade_meses)} meses</td></tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">2. Composição</h2>
          <p className="text-sm text-foreground">{s(produto.composicao) || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">3. Níveis de Garantia</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border">
              <thead>
                <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Parâmetro</th><th className="bg-muted/50 px-3 py-2 text-foreground">Valor</th></tr>
              </thead>
              <tbody>
                {Object.entries(niveis).map(([key, value]) => [key, formatNivel(value)] as const).filter(([_, v]) => v).map(([key, value]) => (
                  <tr key={key}>
                    <td className="px-3 py-1.5">{NIVEIS_LABELS[key] || key}</td>
                    <td className="px-3 py-1.5 font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">4. Indicações de Uso</h2>
          <p className="text-sm text-foreground">{s(produto.indicacoes) || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">5. Modo de Uso / Preparo</h2>
          <p className="text-sm text-foreground">{s(produto.modo_uso) || "—"}</p>
          {produto.modo_preparo && <p className="text-sm text-foreground mt-1"><strong>Preparo:</strong> {s(produto.modo_preparo)}</p>}

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">6. Precauções e Restrições</h2>
          <p className="text-sm text-foreground">{s(produto.precaucoes) || "—"}</p>

          <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">7. Armazenamento</h2>
          <p className="text-sm text-foreground">{s(produto.armazenamento) || "—"}</p>

          {produto.diferenciais && (
            <>
              <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">8. Diferenciais do Produto</h2>
              <p className="text-sm text-foreground">{s(produto.diferenciais)}</p>
            </>
          )}

          {empresa && (
            <>
              <h2 className="text-sm font-semibold border-b border-border pb-1 mb-3 mt-6 text-foreground">9. Dados do Fabricante</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border">
                  <tbody>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground w-[40%]">Razão Social</th><td className="px-3 py-2">{s(empresa.nome)}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">CNPJ</th><td className="px-3 py-2">{s(empresa.cnpj)}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Endereço</th><td className="px-3 py-2">{s(empresa.endereco)}</td></tr>
                    <tr><th className="bg-muted/50 px-3 py-2 text-foreground">Resp. Técnico</th><td className="px-3 py-2">{s(empresa.responsavel_tecnico)} — CRMV: {s(empresa.crmv)}</td></tr>
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
