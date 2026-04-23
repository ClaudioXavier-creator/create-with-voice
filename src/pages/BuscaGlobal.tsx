import { useEffect, useMemo, useState } from "react";
import { Search, Package, Users, FileText, AlertTriangle, Factory, Wrench, ArrowRight, Clock3, SlidersHorizontal, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";

const SEARCH_HISTORY_KEY = "feedbpf-global-search-history";

interface SearchResult {
  tipo: string;
  titulo: string;
  subtitulo: string;
  link: string;
  icon: React.ElementType;
  categoria: string;
  score: number;
}

const FILTERS = ["Todos", "Produto", "Fornecedor", "NC", "Rastreabilidade", "Calibração", "Documento"] as const;

export default function BuscaGlobal() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<(typeof FILTERS)[number]>("Todos");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    }
  }, []);

  const persistRecentSearch = (term: string) => {
    const normalized = term.trim();
    if (!normalized) return;

    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 6);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const scoreResult = (value: string, term: string) => {
    const normalizedValue = value.toLowerCase();
    const normalizedTerm = term.toLowerCase();

    if (normalizedValue === normalizedTerm) return 100;
    if (normalizedValue.startsWith(normalizedTerm)) return 75;
    if (normalizedValue.includes(normalizedTerm)) return 50;
    return 10;
  };

  const buscar = async (term = query) => {
    if (!user || term.trim().length < 2) return;
    setLoading(true);
    setSearched(true);

    const q = term.trim();
    const found: SearchResult[] = [];

    const addEmpresa = (qb: any) => empresaAtiva ? qb.eq("empresa_id", empresaAtiva.id) : qb;

    const [prodRes, fornRes, ncRes, rastRes, calibRes, docsRes] = await Promise.all([
      addEmpresa(supabase.from("produtos").select("nome, classificacao, registro_mapa").eq("user_id", user.id).or(`nome.ilike.%${q}%,registro_mapa.ilike.%${q}%`)).limit(10),
      addEmpresa(supabase.from("fornecedores").select("nome, cnpj, tipo_produto").eq("user_id", user.id).or(`nome.ilike.%${q}%,cnpj.ilike.%${q}%`)).limit(10),
      addEmpresa(supabase.from("nao_conformidades").select("descricao, setor, status").eq("user_id", user.id).ilike("descricao", `%${q}%`)).limit(10),
      addEmpresa(supabase.from("rastreabilidade").select("produto, lote_produto, lote_mp, fornecedor").eq("user_id", user.id).or(`produto.ilike.%${q}%,lote_produto.ilike.%${q}%,lote_mp.ilike.%${q}%`)).limit(10),
      addEmpresa(supabase.from("calibracoes").select("equipamento, codigo, status").eq("user_id", user.id).or(`equipamento.ilike.%${q}%,codigo.ilike.%${q}%`)).limit(10),
      addEmpresa(supabase.from("documentos").select("nome, codigo, status").eq("user_id", user.id).or(`nome.ilike.%${q}%,codigo.ilike.%${q}%`)).limit(10),
    ]);

    (prodRes.data || []).forEach((p) => found.push({ tipo: "Produto", categoria: "Produto", titulo: p.nome, subtitulo: `${p.classificacao} ${p.registro_mapa ? `| MAPA: ${p.registro_mapa}` : ""}`.trim(), link: "/produtos", icon: Package, score: Math.max(scoreResult(p.nome, q), scoreResult(p.registro_mapa || "", q)) }));
    (fornRes.data || []).forEach((f) => found.push({ tipo: "Fornecedor", categoria: "Fornecedor", titulo: f.nome, subtitulo: `${f.cnpj || ""} ${f.tipo_produto || ""}`.trim(), link: "/fornecedores", icon: Users, score: Math.max(scoreResult(f.nome, q), scoreResult(f.cnpj || "", q)) }));
    (ncRes.data || []).forEach((n) => found.push({ tipo: "NC", categoria: "NC", titulo: n.descricao, subtitulo: `Setor: ${n.setor} | ${n.status}`, link: "/nao-conformidades", icon: AlertTriangle, score: scoreResult(n.descricao, q) }));
    (rastRes.data || []).forEach((r) => found.push({ tipo: "Rastreabilidade", categoria: "Rastreabilidade", titulo: r.produto, subtitulo: `Lote: ${r.lote_produto || r.lote_mp || "-"} | Fornec: ${r.fornecedor || "-"}`, link: "/rastreabilidade", icon: Factory, score: Math.max(scoreResult(r.produto, q), scoreResult(r.lote_produto || r.lote_mp || "", q)) }));
    (calibRes.data || []).forEach((c) => found.push({ tipo: "Calibração", categoria: "Calibração", titulo: c.equipamento, subtitulo: `Código: ${c.codigo || "-"} | ${c.status}`, link: "/manutencao", icon: Wrench, score: Math.max(scoreResult(c.equipamento, q), scoreResult(c.codigo || "", q)) }));
    (docsRes.data || []).forEach((d) => found.push({ tipo: "Documento", categoria: "Documento", titulo: d.nome, subtitulo: `${d.codigo} | ${d.status}`, link: "/documentos", icon: FileText, score: Math.max(scoreResult(d.nome, q), scoreResult(d.codigo || "", q)) }));

    const ordered = found.sort((a, b) => b.score - a.score || a.titulo.localeCompare(b.titulo));
    setQuery(q);
    setResults(ordered);
    persistRecentSearch(q);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") buscar();
  };

  const filteredResults = useMemo(() => {
    if (selectedFilter === "Todos") return results;
    return results.filter((result) => result.categoria === selectedFilter);
  }, [results, selectedFilter]);

  const countsByCategory = useMemo(
    () => FILTERS.reduce<Record<string, number>>((acc, filter) => {
      acc[filter] = filter === "Todos" ? results.length : results.filter((result) => result.categoria === filter).length;
      return acc;
    }, {}),
    [results],
  );

  const clearRecent = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setRecentSearches([]);
  };

  return (
    <>
      <PageHeader icon={Search} title="Busca Global" description="Pesquise produtos, lotes, fornecedores, NCs e documentos em um só lugar" />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Digite um lote, produto, fornecedor, NC ou código..."
                  className="pl-9 pr-10 text-base"
                  autoFocus
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    onClick={() => setQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={() => buscar()} disabled={loading || query.trim().length < 2}>
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5">
                <SlidersHorizontal className="h-4 w-4" />
                Filtre por tipo
              </span>
              {FILTERS.map((filter) => (
                <Button
                  key={filter}
                  type="button"
                  size="sm"
                  variant={selectedFilter === filter ? "default" : "outline"}
                  onClick={() => setSelectedFilter(filter)}
                  className="gap-2"
                >
                  <span>{filter}</span>
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {countsByCategory[filter] ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>

            {recentSearches.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock3 className="h-4 w-4" />
                      Buscas recentes
                    </span>
                    {recentSearches.map((item) => (
                      <Button key={item} variant="outline" size="sm" onClick={() => buscar(item)}>
                        {item}
                      </Button>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearRecent}>
                    Limpar histórico
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      )}

      {!loading && searched && filteredResults.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhum resultado encontrado para "{query}"</CardContent></Card>
      )}

      {!loading && filteredResults.length > 0 && (
        <div className="space-y-2">
          <p className="mb-2 text-sm text-muted-foreground">
            {filteredResults.length} resultado(s) encontrado(s)
            {selectedFilter !== "Todos" ? ` em ${selectedFilter}` : ""}
          </p>
          {filteredResults.map((r, i) => (
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
