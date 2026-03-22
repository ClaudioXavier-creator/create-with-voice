import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, Download, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  produtoId: string;
  produtoNome: string;
}

interface RotuloData {
  id?: string;
  tipo_rotulo: string;
  nome_comercial: string;
  classificacao_label: string;
  especie_categoria: string;
  composicao_ingredientes: string;
  niveis_garantia_texto: string;
  indicacoes_uso: string;
  modo_usar: string;
  precaucoes_restricoes: string;
  peso_liquido: string;
  prazo_validade: string;
  armazenamento: string;
  lote_placeholder: string;
  fabricacao_placeholder: string;
  registro_mapa: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  rt_nome: string;
  rt_crmv: string;
  sac_contato: string;
  largura_mm: number;
  altura_mm: number;
}

const EMPTY_ROTULO: RotuloData = {
  tipo_rotulo: "racao",
  nome_comercial: "", classificacao_label: "", especie_categoria: "",
  composicao_ingredientes: "", niveis_garantia_texto: "",
  indicacoes_uso: "", modo_usar: "", precaucoes_restricoes: "",
  peso_liquido: "", prazo_validade: "", armazenamento: "",
  lote_placeholder: "LOTE: ___________",
  fabricacao_placeholder: "FAB: ___/___/______",
  registro_mapa: "", razao_social: "", cnpj: "", endereco: "",
  rt_nome: "", rt_crmv: "", sac_contato: "",
  largura_mm: 100, altura_mm: 75,
};

export default function RotuloEditor({ produtoId, produtoNome }: Props) {
  const { user } = useAuth();
  const [rotulo, setRotulo] = useState<RotuloData>({ ...EMPTY_ROTULO, nome_comercial: produtoNome });
  const [rotuloId, setRotuloId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadRotulo(); }, [produtoId]);

  async function loadRotulo() {
    setLoading(true);
    const { data } = await supabase
      .from("rotulos")
      .select("*")
      .eq("produto_id", produtoId)
      .maybeSingle();

    if (data) {
      setRotuloId(data.id);
      setRotulo({
        tipo_rotulo: data.tipo_rotulo || "racao",
        nome_comercial: data.nome_comercial || produtoNome,
        classificacao_label: data.classificacao_label || "",
        especie_categoria: data.especie_categoria || "",
        composicao_ingredientes: data.composicao_ingredientes || "",
        niveis_garantia_texto: data.niveis_garantia_texto || "",
        indicacoes_uso: data.indicacoes_uso || "",
        modo_usar: data.modo_usar || "",
        precaucoes_restricoes: data.precaucoes_restricoes || "",
        peso_liquido: data.peso_liquido || "",
        prazo_validade: data.prazo_validade || "",
        armazenamento: data.armazenamento || "",
        lote_placeholder: data.lote_placeholder || "LOTE: ___________",
        fabricacao_placeholder: data.fabricacao_placeholder || "FAB: ___/___/______",
        registro_mapa: data.registro_mapa || "",
        razao_social: data.razao_social || "",
        cnpj: data.cnpj || "",
        endereco: data.endereco || "",
        rt_nome: data.rt_nome || "",
        rt_crmv: data.rt_crmv || "",
        sac_contato: data.sac_contato || "",
        largura_mm: data.largura_mm || 100,
        altura_mm: data.altura_mm || 75,
      });
    } else {
      // Pre-fill from produto data
      const { data: prod } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
      if (prod) {
        const niveisObj = (prod.niveis_garantia as Record<string, string>) || {};
        const niveisText = Object.entries(niveisObj)
          .filter(([_, v]) => v)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");

        setRotulo((prev) => ({
          ...prev,
          nome_comercial: prod.nome,
          classificacao_label: prod.classificacao,
          especie_categoria: `${prod.especie_alvo || ""} ${prod.categoria_animal || ""}`.trim(),
          composicao_ingredientes: prod.composicao || "",
          niveis_garantia_texto: niveisText,
          indicacoes_uso: prod.indicacoes || "",
          modo_usar: prod.modo_uso || "",
          precaucoes_restricoes: prod.precaucoes || "",
          peso_liquido: `${prod.peso_liquido || ""} ${prod.unidade_peso || "kg"}`.trim(),
          prazo_validade: `${prod.validade_meses || 6} meses`,
          armazenamento: prod.armazenamento || "",
          registro_mapa: prod.registro_mapa || "",
        }));
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      produto_id: produtoId,
      ...rotulo,
    };

    const { error } = rotuloId
      ? await supabase.from("rotulos").update(payload).eq("id", rotuloId)
      : await supabase.from("rotulos").insert(payload).select("id").single().then(({ data, error }) => {
          if (data) setRotuloId(data.id);
          return { error };
        });

    if (error) toast.error("Erro: " + error.message);
    else toast.success("Rótulo salvo!");
    setSaving(false);
  }

  function generateZPL(): string {
    const w = rotulo.largura_mm;
    const h = rotulo.altura_mm;
    const dotsW = w * 8; // 203 dpi ≈ 8 dots/mm
    const dotsH = h * 8;

    let zpl = `^XA\n^PW${dotsW}\n^LL${dotsH}\n`;
    zpl += `^CF0,28\n`;

    let y = 30;
    const lineH = 32;
    const x = 20;

    // Product name (bold, larger)
    zpl += `^FO${x},${y}^A0N,36,36^FD${rotulo.nome_comercial}^FS\n`;
    y += 44;

    // Classification & species
    zpl += `^FO${x},${y}^A0N,24,24^FD${rotulo.classificacao_label} - ${rotulo.especie_categoria}^FS\n`;
    y += lineH;

    // Separator
    zpl += `^FO${x},${y}^GB${dotsW - 40},2,2^FS\n`;
    y += 10;

    // Composition (truncated for label)
    const compShort = rotulo.composicao_ingredientes.substring(0, 120);
    zpl += `^FO${x},${y}^A0N,18,18^FB${dotsW - 40},3,,^FDCOMP: ${compShort}^FS\n`;
    y += 58;

    // Níveis de garantia (first 4 lines)
    const niveisLines = rotulo.niveis_garantia_texto.split("\n").filter(Boolean).slice(0, 4);
    if (niveisLines.length > 0) {
      zpl += `^FO${x},${y}^A0N,18,18^FDNIVEIS DE GARANTIA:^FS\n`;
      y += 22;
      niveisLines.forEach((line) => {
        zpl += `^FO${x + 10},${y}^A0N,16,16^FD${line}^FS\n`;
        y += 20;
      });
    }

    // Separator
    zpl += `^FO${x},${y}^GB${dotsW - 40},1,1^FS\n`;
    y += 8;

    // Peso, Lote, Fab, Validade
    zpl += `^FO${x},${y}^A0N,20,20^FDPESO LIQ: ${rotulo.peso_liquido}^FS\n`;
    zpl += `^FO${dotsW / 2},${y}^A0N,20,20^FDVAL: ${rotulo.prazo_validade}^FS\n`;
    y += 26;
    zpl += `^FO${x},${y}^A0N,20,20^FD${rotulo.lote_placeholder}^FS\n`;
    zpl += `^FO${dotsW / 2},${y}^A0N,20,20^FD${rotulo.fabricacao_placeholder}^FS\n`;
    y += 26;

    // Reg MAPA
    if (rotulo.registro_mapa) {
      zpl += `^FO${x},${y}^A0N,18,18^FDREG. MAPA: ${rotulo.registro_mapa}^FS\n`;
      y += 24;
    }

    // Company info
    zpl += `^FO${x},${y}^A0N,16,16^FD${rotulo.razao_social} - CNPJ: ${rotulo.cnpj}^FS\n`;
    y += 20;
    if (rotulo.endereco) {
      zpl += `^FO${x},${y}^A0N,14,14^FD${rotulo.endereco}^FS\n`;
      y += 18;
    }

    // RT
    if (rotulo.rt_nome) {
      zpl += `^FO${x},${y}^A0N,16,16^FDRT: ${rotulo.rt_nome} - CRMV: ${rotulo.rt_crmv}^FS\n`;
      y += 20;
    }

    zpl += `^XZ`;
    return zpl;
  }

  function downloadZPL() {
    const zpl = generateZPL();
    const blob = new Blob([zpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rotulo_${rotulo.nome_comercial.replace(/\s+/g, "_")}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo ZPL baixado para impressora Zebra!");
  }

  function handlePrint() {
    const el = printRef.current;
    if (!el) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Rótulo - ${rotulo.nome_comercial}</title>
      <style>
        @page { size: ${rotulo.largura_mm}mm ${rotulo.altura_mm}mm; margin: 2mm; }
        body { font-family: Arial, sans-serif; font-size: 8pt; margin: 0; padding: 2mm; }
        .label { width: ${rotulo.largura_mm - 4}mm; }
        h2 { font-size: 12pt; margin: 0 0 2mm; }
        h3 { font-size: 9pt; margin: 2mm 0 1mm; }
        p { margin: 0.5mm 0; font-size: 7pt; line-height: 1.3; }
        .small { font-size: 6pt; }
        hr { border: none; border-top: 0.5pt solid #000; margin: 1.5mm 0; }
        .row { display: flex; justify-content: space-between; }
      </style></head><body>
      <div class="label">${el.innerHTML}</div>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  }

  const updateField = (field: keyof RotuloData, value: any) => {
    setRotulo((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="preview">Visualizar Rótulo</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          {/* Editor fields */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Identificação do Produto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome Comercial</Label><Input value={rotulo.nome_comercial} onChange={(e) => updateField("nome_comercial", e.target.value)} /></div>
                <div>
                  <Label className="text-xs">Tipo de Rótulo (IN 22)</Label>
                  <Select value={rotulo.tipo_rotulo} onValueChange={(v) => updateField("tipo_rotulo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="racao">Ração</SelectItem>
                      <SelectItem value="suplemento">Suplemento</SelectItem>
                      <SelectItem value="premix">Premix</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                      <SelectItem value="sal_mineral">Sal Mineral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Classificação</Label><Input value={rotulo.classificacao_label} onChange={(e) => updateField("classificacao_label", e.target.value)} placeholder="Ex: Ração completa para bovinos" /></div>
                <div><Label className="text-xs">Espécie / Categoria</Label><Input value={rotulo.especie_categoria} onChange={(e) => updateField("especie_categoria", e.target.value)} /></div>
                <div><Label className="text-xs">Peso Líquido</Label><Input value={rotulo.peso_liquido} onChange={(e) => updateField("peso_liquido", e.target.value)} /></div>
                <div><Label className="text-xs">Prazo de Validade</Label><Input value={rotulo.prazo_validade} onChange={(e) => updateField("prazo_validade", e.target.value)} /></div>
                <div><Label className="text-xs">Registro MAPA</Label><Input value={rotulo.registro_mapa} onChange={(e) => updateField("registro_mapa", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Composição e Garantias</h3>
              <div><Label className="text-xs">Composição (Ingredientes)</Label><Textarea value={rotulo.composicao_ingredientes} onChange={(e) => updateField("composicao_ingredientes", e.target.value)} rows={3} /></div>
              <div><Label className="text-xs">Níveis de Garantia</Label><Textarea value={rotulo.niveis_garantia_texto} onChange={(e) => updateField("niveis_garantia_texto", e.target.value)} rows={4} placeholder="Umidade (máx.): 13%&#10;Proteína Bruta (mín.): 22%" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Uso e Precauções</h3>
              <div><Label className="text-xs">Indicações de Uso</Label><Textarea value={rotulo.indicacoes_uso} onChange={(e) => updateField("indicacoes_uso", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Modo de Usar</Label><Textarea value={rotulo.modo_usar} onChange={(e) => updateField("modo_usar", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Precauções / Restrições</Label><Textarea value={rotulo.precaucoes_restricoes} onChange={(e) => updateField("precaucoes_restricoes", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Armazenamento</Label><Input value={rotulo.armazenamento} onChange={(e) => updateField("armazenamento", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dados do Fabricante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Razão Social</Label><Input value={rotulo.razao_social} onChange={(e) => updateField("razao_social", e.target.value)} /></div>
                <div><Label className="text-xs">CNPJ</Label><Input value={rotulo.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} /></div>
                <div className="md:col-span-2"><Label className="text-xs">Endereço</Label><Input value={rotulo.endereco} onChange={(e) => updateField("endereco", e.target.value)} /></div>
                <div><Label className="text-xs">RT (Nome)</Label><Input value={rotulo.rt_nome} onChange={(e) => updateField("rt_nome", e.target.value)} /></div>
                <div><Label className="text-xs">CRMV</Label><Input value={rotulo.rt_crmv} onChange={(e) => updateField("rt_crmv", e.target.value)} /></div>
                <div><Label className="text-xs">SAC / Contato</Label><Input value={rotulo.sac_contato} onChange={(e) => updateField("sac_contato", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dimensões da Etiqueta (Zebra ZD220)</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Largura (mm)</Label><Input type="number" value={rotulo.largura_mm} onChange={(e) => updateField("largura_mm", parseInt(e.target.value) || 100)} /></div>
                <div><Label className="text-xs">Altura (mm)</Label><Input type="number" value={rotulo.altura_mm} onChange={(e) => updateField("altura_mm", parseInt(e.target.value) || 75)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Padrão ZD220: 100x75mm (203 dpi). Ajuste conforme o rolo de etiquetas utilizado.</p>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar Rótulo
            </Button>
            <Button variant="outline" onClick={downloadZPL}>
              <Download className="w-4 h-4 mr-1" /> Exportar ZPL (Zebra)
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir Rótulo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader><CardTitle className="text-sm">Pré-visualização do Rótulo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={downloadZPL}>
                  <Download className="w-4 h-4 mr-1" /> ZPL (Zebra)
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimir
                </Button>
              </div>

              <div className="border-2 border-foreground p-3 bg-background mx-auto" style={{ maxWidth: `${rotulo.largura_mm * 3.78}px` }} ref={printRef}>
                <h2 style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "4px", textAlign: "center" }}>
                  {rotulo.nome_comercial || "NOME DO PRODUTO"}
                </h2>
                <p style={{ fontSize: "10px", textAlign: "center", marginBottom: "4px" }}>
                  {rotulo.classificacao_label} — {rotulo.especie_categoria}
                </p>
                <hr style={{ borderTop: "1px solid black", margin: "4px 0" }} />

                {rotulo.composicao_ingredientes && (
                  <>
                    <p style={{ fontSize: "8px", fontWeight: "bold" }}>COMPOSIÇÃO:</p>
                    <p style={{ fontSize: "7px", lineHeight: "1.3" }}>{rotulo.composicao_ingredientes}</p>
                  </>
                )}

                {rotulo.niveis_garantia_texto && (
                  <>
                    <p style={{ fontSize: "8px", fontWeight: "bold", marginTop: "3px" }}>NÍVEIS DE GARANTIA:</p>
                    {rotulo.niveis_garantia_texto.split("\n").map((line, i) => (
                      <p key={i} style={{ fontSize: "7px" }}>{line}</p>
                    ))}
                  </>
                )}

                <hr style={{ borderTop: "1px solid black", margin: "4px 0" }} />

                {rotulo.indicacoes_uso && <p style={{ fontSize: "7px" }}><strong>INDICAÇÕES:</strong> {rotulo.indicacoes_uso}</p>}
                {rotulo.modo_usar && <p style={{ fontSize: "7px" }}><strong>MODO DE USAR:</strong> {rotulo.modo_usar}</p>}
                {rotulo.precaucoes_restricoes && <p style={{ fontSize: "7px" }}><strong>PRECAUÇÕES:</strong> {rotulo.precaucoes_restricoes}</p>}
                {rotulo.armazenamento && <p style={{ fontSize: "7px" }}><strong>ARMAZENAMENTO:</strong> {rotulo.armazenamento}</p>}

                <hr style={{ borderTop: "0.5px solid black", margin: "3px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px" }}>
                  <span><strong>PESO LÍQ:</strong> {rotulo.peso_liquido}</span>
                  <span><strong>VAL:</strong> {rotulo.prazo_validade}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px" }}>
                  <span>{rotulo.lote_placeholder}</span>
                  <span>{rotulo.fabricacao_placeholder}</span>
                </div>

                {rotulo.registro_mapa && <p style={{ fontSize: "7px", marginTop: "2px" }}><strong>REG. MAPA Nº:</strong> {rotulo.registro_mapa}</p>}

                <hr style={{ borderTop: "0.5px solid black", margin: "3px 0" }} />
                <p style={{ fontSize: "6px" }}>{rotulo.razao_social} — CNPJ: {rotulo.cnpj}</p>
                {rotulo.endereco && <p style={{ fontSize: "6px" }}>{rotulo.endereco}</p>}
                {rotulo.rt_nome && <p style={{ fontSize: "6px" }}>RT: {rotulo.rt_nome} — CRMV: {rotulo.rt_crmv}</p>}
                {rotulo.sac_contato && <p style={{ fontSize: "6px" }}>SAC: {rotulo.sac_contato}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
