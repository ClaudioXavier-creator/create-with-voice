import { useState } from "react";
import { Search, Package, Users, FileText, AlertTriangle, Factory, Wrench, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";

interface SearchResult {
  tipo: string;
  titulo: string;
  subtitulo: string;
  link: string;
  icon: React.ElementType;
}

export default function BuscaGlobal() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const buscar = async () => {
    if (!user || query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);

    const q = query.trim();
    const found: SearchResult[] = [];

    const [prodRes, fornRes, ncRes, rastRes, calibRes, docsRes] = await Promise.all([
      supabase.from("produtos").select("nome, classificacao, registro_mapa").eq("user_id", user.id).or(`nome.ilike.%${q}%,registro_mapa.ilike.%${q}%`).limit(10),
      supabase.from("fornecedores").select("nome, cnpj, tipo_produto").eq("user_id", user.id).or(`nome.ilike.%${q}%,cnpj.ilike.%${q}%`).limit(10),
      supabase.from("nao_conformidades").select("descricao, setor, status").eq("user_id", user.id).ilike("descricao", `%${q}%`).limit(10),
      supabase.from("rastreabilidade").select("produto, lote_produto, lote_mp, fornecedor").eq("user_id", user.id).or(`produto.ilike.%${q}%,lote_produto.ilike.%${q}%,lote_mp.ilike.%${q}%`).limit(10),
      supabase.from("calibracoes").select("equipamento, codigo, status").eq("user_id", user.id).or(`equipamento.ilike.%${q}%,codigo.ilike.%${q}%`).limit(10),
      supabase.from("documentos").select("nome, codigo, status").eq("user_id", user.id).or(`nome.ilike.%${q}%,codigo.ilike.%${q}%`).limit(10),
    ]);

    (prodRes.data || []).forEach(p => found.push({ tipo: "Produto", titulo: p.nome, subtitulo: `${p.classificacao} ${p.registro_mapa ? `| MAPA: ${p.registro_mapa}` : ""}`, link: "/produtos", icon: Package }));
    (fornRes.data || []).forEach(f => found.push({ tipo: "Fornecedor", titulo: f.nome, subtitulo: `${f.cnpj || ""} ${f.tipo_produto || ""}`, link: "/fornecedores", icon: Users }));
    (ncRes.data || []).forEach(n => found.push({ tipo: "NC", titulo: n.descricao, subtitulo: `Setor: ${n.setor} | ${n.status}`, link: "/nao-conformidades", icon: AlertTriangle }));
    (rastRes.data || []).forEach(r => found.push({ tipo: "Rastreabilidade", titulo: r.produto, subtitulo: `Lote: ${r.lote_produto || r.lote_mp || "-"} | Fornec: ${r.fornecedor || "-"}`, link: "/rastreabilidade", icon: Factory }));
    (calibRes.data || []).forEach(c => found.push({ tipo: "Calibração", titulo: c.equipamento, subtitulo: `Código: ${c.codigo || "-"} | ${c.status}`, link: "/manutencao", icon: Wrench }));
    (docsRes.data || []).forEach(d => found.push({ tipo: "Documento", titulo: d.nome, subtitulo: `${d.codigo} | ${d.status}`, link: "/documentos", icon: FileText }));

    setResults(found);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") buscar();
  };

  return (
    <>
      <PageHeader icon={Search} title="Busca Global" description="Pesquise lotes, produtos, fornecedores, NCs e documentos em todo o sistema" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite um lote, produto, fornecedor, NC..."
              className="text-base"
              autoFocus
            />
            <Button onClick={buscar} disabled={loading || query.trim().length < 2}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {!loading && searched && results.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum resultado encontrado para "{query}"</CardContent></Card>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">{results.length} resultado(s) encontrado(s)</p>
          {results.map((r, i) => (
            <Link key={i} to={r.link}>
              <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                <CardContent className="flex items-center gap-3 py-3">
                  <r.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{r.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitulo}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">{r.tipo}</Badge>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
