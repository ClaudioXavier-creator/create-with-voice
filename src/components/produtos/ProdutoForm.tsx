import { useState, useEffect } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NutrientDef {
  key: string;
  label: string;
  unit: string;
  category: "macro" | "mineral" | "vitamin" | "aminoacido" | "custom";
  minMax?: boolean; // true = has min and max fields
}

const MACRO_NUTRIENTS: NutrientDef[] = [
  { key: "umidade", label: "Umidade", unit: "g/kg", category: "macro", minMax: true },
  { key: "proteina_bruta", label: "Proteína Bruta", unit: "g/kg", category: "macro", minMax: true },
  { key: "extrato_etereo", label: "Extrato Etéreo", unit: "g/kg", category: "macro", minMax: true },
  { key: "fibra_bruta", label: "Fibra Bruta", unit: "g/kg", category: "macro", minMax: true },
  { key: "materia_mineral", label: "Matéria Mineral", unit: "g/kg", category: "macro", minMax: true },
  { key: "fda", label: "FDA", unit: "g/kg", category: "macro", minMax: true },
  { key: "materia_fibrosa", label: "Matéria Fibrosa", unit: "g/kg", category: "macro", minMax: true },
  { key: "ndt", label: "NDT", unit: "g/kg", category: "macro", minMax: true },
  { key: "nnp_eq_proteina", label: "NNP Equiv. Proteína", unit: "g/kg", category: "macro", minMax: true },
  { key: "fluor", label: "Flúor", unit: "mg/kg", category: "macro", minMax: true },
  { key: "monensina_sodica", label: "Monensina Sódica", unit: "mg/kg", category: "macro", minMax: true },
  { key: "consumo_pb", label: "Consumo em PB", unit: "g/dia", category: "macro" },
  { key: "consumo_ndt", label: "Consumo em NDT", unit: "g/dia", category: "macro" },
];

const MINERAL_NUTRIENTS: NutrientDef[] = [
  { key: "calcio", label: "Cálcio", unit: "g/kg", category: "mineral", minMax: true },
  { key: "fosforo", label: "Fósforo", unit: "g/kg", category: "mineral", minMax: true },
  { key: "sodio", label: "Sódio", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "magnesio", label: "Magnésio", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "enxofre", label: "Enxofre", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "potassio", label: "Potássio", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "cobalto", label: "Cobalto", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "cobre", label: "Cobre", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "iodo", label: "Iodo", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "manganes", label: "Manganês", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "selenio", label: "Selênio", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "zinco", label: "Zinco", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "ferro", label: "Ferro", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "cloro", label: "Cloro", unit: "mg/kg", category: "mineral", minMax: true },
  { key: "cromo", label: "Cromo", unit: "mg/kg", category: "mineral", minMax: true },
];

const VITAMIN_NUTRIENTS: NutrientDef[] = [
  { key: "vitamina_a", label: "Vitamina A", unit: "UI/kg", category: "vitamin", minMax: true },
  { key: "vitamina_d3", label: "Vitamina D3", unit: "UI/kg", category: "vitamin", minMax: true },
  { key: "vitamina_e", label: "Vitamina E", unit: "UI/kg", category: "vitamin", minMax: true },
  { key: "vitamina_k3", label: "Vitamina K3", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "vitamina_b1", label: "Vitamina B1", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "vitamina_b2", label: "Vitamina B2", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "vitamina_b6", label: "Vitamina B6", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "vitamina_b12", label: "Vitamina B12", unit: "mcg/kg", category: "vitamin", minMax: true },
  { key: "vitamina_c", label: "Vitamina C", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "niacina", label: "Niacina", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "acido_folico", label: "Ácido Fólico", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "biotina", label: "Biotina", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "colina", label: "Colina", unit: "mg/kg", category: "vitamin", minMax: true },
  { key: "acido_pantotenico", label: "Ácido Pantotênico", unit: "mg/kg", category: "vitamin", minMax: true },
];

const AMINOACID_NUTRIENTS: NutrientDef[] = [
  { key: "lisina", label: "Lisina", unit: "g/kg", category: "aminoacido", minMax: true },
  { key: "metionina", label: "Metionina", unit: "g/kg", category: "aminoacido", minMax: true },
  { key: "treonina", label: "Treonina", unit: "g/kg", category: "aminoacido", minMax: true },
  { key: "triptofano", label: "Triptofano", unit: "g/kg", category: "aminoacido", minMax: true },
];

const ALL_DEFAULT_NUTRIENTS = [...MACRO_NUTRIENTS, ...MINERAL_NUTRIENTS, ...VITAMIN_NUTRIENTS, ...AMINOACID_NUTRIENTS];

interface NutrientValue {
  min?: string;
  max?: string;
  value?: string;
  unit: string;
}

interface Props {
  produtoId: string | null;
  onSaved: () => void;
}

export default function ProdutoForm({ produtoId, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!produtoId);

  const [nome, setNome] = useState("");
  const [marca, setMarca] = useState("");
  const [classificacao, setClassificacao] = useState("racao");
  const [especieAlvo, setEspecieAlvo] = useState("");
  const [categoriaAnimal, setCategoriaAnimal] = useState("");
  const [registroMapa, setRegistroMapa] = useState("");
  const [pesoLiquido, setPesoLiquido] = useState("");
  const [unidadePeso, setUnidadePeso] = useState("kg");
  const [validadeMeses, setValidadeMeses] = useState("6");
  const [formaFisica, setFormaFisica] = useState("");
  const [armazenamento, setArmazenamento] = useState("");
  const [modoUso, setModoUso] = useState("");
  const [precaucoes, setPrecaucoes] = useState("");
  const [indicacoes, setIndicacoes] = useState("");
  const [composicao, setComposicao] = useState("");
  const [diferenciais, setDiferenciais] = useState("");
  const [modoPreparo, setModoPreparo] = useState("");
  const [embalagem, setEmbalagem] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Nutrient state: { key: { min, max, value, unit } }
  const [activeNutrients, setActiveNutrients] = useState<Set<string>>(new Set());
  const [nutrientValues, setNutrientValues] = useState<Record<string, NutrientValue>>({});
  const [customNutrients, setCustomNutrients] = useState<NutrientDef[]>([]);
  const [newNutrientName, setNewNutrientName] = useState("");
  const [newNutrientUnit, setNewNutrientUnit] = useState("mg/kg");

  useEffect(() => {
    if (produtoId) loadProduto();
  }, [produtoId]);

  async function loadProduto() {
    const { data } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    if (data) {
      setNome(data.nome);
      setMarca(data.marca || "");
      setClassificacao(data.classificacao);
      setEspecieAlvo(data.especie_alvo || "");
      setCategoriaAnimal(data.categoria_animal || "");
      setRegistroMapa(data.registro_mapa || "");
      setPesoLiquido(data.peso_liquido || "");
      setUnidadePeso(data.unidade_peso || "kg");
      setValidadeMeses(String(data.validade_meses || 6));
      setFormaFisica(data.forma_fisica || "");
      setArmazenamento(data.armazenamento || "");
      setModoUso(data.modo_uso || "");
      setPrecaucoes(data.precaucoes || "");
      setIndicacoes(data.indicacoes || "");
      setComposicao(data.composicao || "");
      setDiferenciais(data.diferenciais || "");
      setModoPreparo(data.modo_preparo || "");
      setEmbalagem(data.embalagem || "");
      setObservacoes(data.observacoes || "");

      // Parse saved niveis_garantia
      const saved = (data.niveis_garantia as Record<string, any>) || {};
      const active = new Set<string>();
      const vals: Record<string, NutrientValue> = {};
      const customs: NutrientDef[] = [];

      Object.entries(saved).forEach(([key, val]) => {
        active.add(key);
        if (typeof val === "object" && val !== null) {
          vals[key] = val as NutrientValue;
        } else {
          // Legacy: plain string value
          const def = ALL_DEFAULT_NUTRIENTS.find(n => n.key === key);
          vals[key] = { min: String(val || ""), unit: def?.unit || "mg/kg" };
        }
        // If not in defaults, it's a custom nutrient
        if (!ALL_DEFAULT_NUTRIENTS.find(n => n.key === key)) {
          const v = vals[key];
          customs.push({ key, label: key, unit: v.unit || "mg/kg", category: "custom", minMax: true });
        }
      });

      setActiveNutrients(active);
      setNutrientValues(vals);
      setCustomNutrients(customs);
    }
    setLoading(false);
  }

  function toggleNutrient(key: string, checked: boolean) {
    setActiveNutrients(prev => {
      const next = new Set(prev);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
    if (!checked) {
      setNutrientValues(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function updateNutrientVal(key: string, field: "min" | "max" | "value", val: string, unit: string) {
    setNutrientValues(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: val, unit }
    }));
  }

  function addCustomNutrient() {
    if (!newNutrientName.trim()) return;
    const key = newNutrientName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (ALL_DEFAULT_NUTRIENTS.find(n => n.key === key) || customNutrients.find(n => n.key === key)) {
      toast.error("Nutriente já existe!");
      return;
    }
    const def: NutrientDef = { key, label: newNutrientName.trim(), unit: newNutrientUnit, category: "custom", minMax: true };
    setCustomNutrients(prev => [...prev, def]);
    setActiveNutrients(prev => new Set(prev).add(key));
    setNewNutrientName("");
    setNewNutrientUnit("mg/kg");
  }

  function removeCustomNutrient(key: string) {
    setCustomNutrients(prev => prev.filter(n => n.key !== key));
    toggleNutrient(key, false);
  }

  async function handleSave() {
    if (!nome || !user) return;
    setSaving(true);

    // Build niveis_garantia from active nutrients
    const niveis: Record<string, NutrientValue> = {};
    activeNutrients.forEach(key => {
      if (nutrientValues[key]) {
        niveis[key] = nutrientValues[key];
      }
    });

    const payload = {
      user_id: user.id,
      nome, marca, classificacao,
      especie_alvo: especieAlvo,
      categoria_animal: categoriaAnimal,
      registro_mapa: registroMapa,
      peso_liquido: pesoLiquido,
      unidade_peso: unidadePeso,
      validade_meses: parseInt(validadeMeses) || 6,
      forma_fisica: formaFisica,
      armazenamento, modo_uso: modoUso,
      precaucoes, indicacoes, composicao,
      diferenciais, modo_preparo: modoPreparo,
      embalagem, observacoes,
      niveis_garantia: niveis as any,
    };

    const { error } = produtoId
      ? await supabase.from("produtos").update(payload as any).eq("id", produtoId)
      : await supabase.from("produtos").insert(payload as any);

    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Produto salvo!"); onSaved(); }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  function renderNutrientCategory(title: string, nutrients: NutrientDef[]) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {nutrients.map((n) => {
            const isActive = activeNutrients.has(n.key);
            const val = nutrientValues[n.key] || {};
            return (
              <div key={n.key} className={`border rounded-lg p-2.5 transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border"}`}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`nut-${n.key}`}
                    checked={isActive}
                    onCheckedChange={(c) => toggleNutrient(n.key, !!c)}
                  />
                  <label htmlFor={`nut-${n.key}`} className="text-sm font-medium cursor-pointer flex-1">
                    {n.label}
                  </label>
                  <span className="text-xs text-muted-foreground">{n.unit}</span>
                  {n.category === "custom" && (
                    <button onClick={() => removeCustomNutrient(n.key)} className="text-destructive hover:text-destructive/80 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isActive && (
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Mín.</Label>
                      <Input
                        className="h-7 text-xs"
                        value={val.min || ""}
                        onChange={(e) => updateNutrientVal(n.key, "min", e.target.value, n.unit)}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px] text-muted-foreground">Máx.</Label>
                      <Input
                        className="h-7 text-xs"
                        value={val.max || ""}
                        onChange={(e) => updateNutrientVal(n.key, "max", e.target.value, n.unit)}
                        placeholder="0,00"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome do Produto *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ração Bovinos Engorda 22%" /></div>
            <div><Label>Marca Comercial</Label><Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: NutriMax" /></div>
            <div>
              <Label>Classificação *</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="racao">Ração</SelectItem>
                  <SelectItem value="suplemento">Suplemento</SelectItem>
                  <SelectItem value="premix">Premix</SelectItem>
                  <SelectItem value="nucleo">Núcleo</SelectItem>
                  <SelectItem value="aditivo">Aditivo</SelectItem>
                  <SelectItem value="sal_mineral">Sal Mineral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Espécie Alvo</Label><Input value={especieAlvo} onChange={(e) => setEspecieAlvo(e.target.value)} placeholder="Ex: Bovinos" /></div>
            <div><Label>Categoria Animal</Label><Input value={categoriaAnimal} onChange={(e) => setCategoriaAnimal(e.target.value)} placeholder="Ex: Engorda, Cria, Lactação" /></div>
            <div><Label>Registro MAPA</Label><Input value={registroMapa} onChange={(e) => setRegistroMapa(e.target.value)} placeholder="Nº registro" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso Líquido</Label><Input value={pesoLiquido} onChange={(e) => setPesoLiquido(e.target.value)} placeholder="Ex: 40" /></div>
              <div><Label>Unidade</Label>
                <Select value={unidadePeso} onValueChange={setUnidadePeso}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="t">ton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Forma Física</Label><Input value={formaFisica} onChange={(e) => setFormaFisica(e.target.value)} placeholder="Ex: Farelado, Peletizado, Extrusado" /></div>
            <div><Label>Validade (meses)</Label><Input type="number" value={validadeMeses} onChange={(e) => setValidadeMeses(e.target.value)} /></div>
            <div><Label>Embalagem</Label><Input value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} placeholder="Ex: Saco de ráfia 40kg" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Composição */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Composição Básica (Ingredientes)</h3>
          <Textarea value={composicao} onChange={(e) => setComposicao(e.target.value)} placeholder="Milho moído, farelo de soja, calcário calcítico, cloreto de sódio..." rows={3} />
        </CardContent>
      </Card>

      {/* Níveis de Garantia */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground">Níveis de Garantia por kg do Produto</h3>
            <p className="text-xs text-muted-foreground mt-1">Marque os nutrientes que compõem o produto e preencha os valores mínimo/máximo.</p>
          </div>

          {renderNutrientCategory("Macronutrientes / Análise Bromatológica", MACRO_NUTRIENTS)}
          {renderNutrientCategory("Macrominerais e Microminerais", MINERAL_NUTRIENTS)}
          {renderNutrientCategory("Vitaminas", VITAMIN_NUTRIENTS)}
          {renderNutrientCategory("Aminoácidos", AMINOACID_NUTRIENTS)}

          {customNutrients.length > 0 && renderNutrientCategory("Nutrientes Personalizados", customNutrients)}

          {/* Add custom */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Adicionar Nutriente Personalizado</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Nome</Label>
                <Input value={newNutrientName} onChange={(e) => setNewNutrientName(e.target.value)} placeholder="Ex: Fosfatidilcolina" className="h-8 text-sm" />
              </div>
              <div className="w-28">
                <Label className="text-xs">Unidade</Label>
                <Select value={newNutrientUnit} onValueChange={setNewNutrientUnit}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="g/kg">g/kg</SelectItem>
                    <SelectItem value="mg/kg">mg/kg</SelectItem>
                    <SelectItem value="mcg/kg">mcg/kg</SelectItem>
                    <SelectItem value="UI/kg">UI/kg</SelectItem>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="g/dia">g/dia</SelectItem>
                    <SelectItem value="mg/dia">mg/dia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="h-8" onClick={addCustomNutrient} disabled={!newNutrientName.trim()}>
                <Plus className="w-3 h-3 mr-1" />Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uso e Armazenamento */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Uso, Armazenamento e Comercial</h3>
          <div><Label>Indicações de Uso</Label><Textarea value={indicacoes} onChange={(e) => setIndicacoes(e.target.value)} rows={2} /></div>
          <div><Label>Modo de Uso</Label><Textarea value={modoUso} onChange={(e) => setModoUso(e.target.value)} rows={2} /></div>
          <div><Label>Modo de Preparo</Label><Textarea value={modoPreparo} onChange={(e) => setModoPreparo(e.target.value)} rows={2} /></div>
          <div><Label>Precauções e Restrições</Label><Textarea value={precaucoes} onChange={(e) => setPrecaucoes(e.target.value)} rows={2} /></div>
          <div><Label>Armazenamento</Label><Input value={armazenamento} onChange={(e) => setArmazenamento(e.target.value)} placeholder="Local seco, arejado..." /></div>
          <div><Label>Diferenciais do Produto</Label><Textarea value={diferenciais} onChange={(e) => setDiferenciais(e.target.value)} rows={2} /></div>
          <div><Label>Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || !nome} className="w-full md:w-auto">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {produtoId ? "Atualizar Produto" : "Cadastrar Produto"}
      </Button>
    </div>
  );
}
