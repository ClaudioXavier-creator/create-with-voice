import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const NIVEIS_KEYS = [
  { key: "umidade", label: "Umidade (máx.)", unit: "%" },
  { key: "proteina_bruta", label: "Proteína Bruta (mín.)", unit: "%" },
  { key: "extrato_etereo", label: "Extrato Etéreo (mín.)", unit: "%" },
  { key: "fibra_bruta", label: "Fibra Bruta (máx.)", unit: "%" },
  { key: "materia_mineral", label: "Matéria Mineral (máx.)", unit: "%" },
  { key: "calcio", label: "Cálcio (mín.-máx.)", unit: "g/kg" },
  { key: "fosforo", label: "Fósforo (mín.)", unit: "g/kg" },
  { key: "sodio", label: "Sódio", unit: "mg/kg" },
  { key: "ndt", label: "NDT", unit: "%" },
];

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
  const [niveis, setNiveis] = useState<Record<string, string>>({});

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
      setNiveis((data.niveis_garantia as Record<string, string>) || {});
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!nome || !user) return;
    setSaving(true);

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
      niveis_garantia: niveis,
    };

    const { error } = produtoId
      ? await supabase.from("produtos").update(payload).eq("id", produtoId)
      : await supabase.from("produtos").insert(payload);

    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Produto salvo!"); onSaved(); }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

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

      {/* Composição e Níveis de Garantia */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Composição e Níveis de Garantia</h3>
          <div>
            <Label>Composição (Ingredientes)</Label>
            <Textarea value={composicao} onChange={(e) => setComposicao(e.target.value)} placeholder="Milho moído, farelo de soja, calcário calcítico..." rows={3} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {NIVEIS_KEYS.map((n) => (
              <div key={n.key}>
                <Label className="text-xs">{n.label} ({n.unit})</Label>
                <Input
                  value={niveis[n.key] || ""}
                  onChange={(e) => setNiveis((prev) => ({ ...prev, [n.key]: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            ))}
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
