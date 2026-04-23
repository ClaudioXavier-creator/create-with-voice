import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NAV_ENTRIES, NavEntry, NavItem, isGroup } from "./nav-config";

const FAVORITES_KEY = "feedbpf_nav_favorites";

function flattenEntries(entries: NavEntry[]) {
  return entries.flatMap((entry) =>
    isGroup(entry)
      ? entry.items.map((item) => ({ ...item, group: entry.label }))
      : [{ ...entry, group: "Acesso direto" }],
  );
}

export function SidebarNav({
  currentPath,
  entries,
  onNavigate,
}: {
  currentPath: string;
  entries: NavEntry[];
  onNavigate?: () => void;
}) {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      entries.forEach((entry) => {
        if (isGroup(entry) && entry.items.some((item) => item.path === currentPath)) {
          next[entry.label] = true;
        }
      });
      return next;
    });
  }, [currentPath, entries]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const flatEntries = useMemo(() => flattenEntries(entries), [entries]);
  const favoriteItems = useMemo(
    () => flatEntries.filter((item) => favorites.includes(item.path)).slice(0, 6),
    [favorites, flatEntries],
  );
  const recentItems = useMemo(() => {
    const active = flatEntries.find((item) => item.path === currentPath);
    return active ? [active, ...favoriteItems.filter((item) => item.path !== active.path)].slice(0, 4) : favoriteItems.slice(0, 4);
  }, [currentPath, favoriteItems, flatEntries]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredEntries = useMemo(() => {
    if (!normalizedSearch) return entries;

    return entries
      .map((entry) => {
        if (!isGroup(entry)) {
          const haystack = `${entry.label} ${(entry.keywords || []).join(" ")}`.toLowerCase();
          return haystack.includes(normalizedSearch) ? entry : null;
        }

        const items = entry.items.filter((item) => item.label.toLowerCase().includes(normalizedSearch));
        return items.length ? { ...entry, items } : null;
      })
      .filter(Boolean) as NavEntry[];
  }, [entries, normalizedSearch]);

  const toggleFavorite = (path: string) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path].slice(-8),
    );
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLink = (item: NavItem, compact = false) => {
    const isActive = currentPath === item.path;
    const isFavorite = favorites.includes(item.path);

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          compact && "py-2",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground"
            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <button
          type="button"
          aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleFavorite(item.path);
          }}
          className={cn(
            "rounded p-1 opacity-0 transition-opacity group-hover:opacity-100",
            isFavorite && "opacity-100",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current text-accent")}/>
        </button>
      </Link>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-sidebar-border px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-sidebar-foreground/50" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar módulos"
            className="border-sidebar-border bg-sidebar-accent pl-9 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 px-3 py-4">
          {favoriteItems.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/55">Favoritos</p>
                <Badge variant="outline" className="border-sidebar-border text-sidebar-foreground/70">{favoriteItems.length}</Badge>
              </div>
              <div className="space-y-1">{favoriteItems.map((item) => renderLink(item, true))}</div>
            </section>
          )}

          {recentItems.length > 0 && (
            <section className="space-y-2">
              <div className="px-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/55">Acesso rápido</p>
              </div>
              <div className="space-y-1">{recentItems.map((item) => renderLink(item, true))}</div>
            </section>
          )}

          <section className="space-y-1">
            <div className="px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/55">Módulos</p>
            </div>
            {filteredEntries.map((entry) => {
              if (!isGroup(entry)) {
                return renderLink(entry);
              }

              const groupOpen = normalizedSearch ? true : (openGroups[entry.label] ?? false);
              const hasActive = entry.items.some((item) => item.path === currentPath);

              return (
                <div key={entry.label} className="space-y-1">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => toggleGroup(entry.label)}
                    className={cn(
                      "h-auto w-full justify-start gap-3 rounded-lg px-3 py-2.5 text-left text-sm",
                      hasActive
                        ? "bg-sidebar-primary/20 text-sidebar-primary-foreground hover:bg-sidebar-primary/25"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <entry.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 whitespace-normal">{entry.label}</span>
                    <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", groupOpen && "rotate-180")} />
                  </Button>
                  <div className={cn("overflow-hidden transition-all", groupOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0")}>
                    <div className="ml-4 space-y-1 border-l border-sidebar-border pl-3">
                      {entry.items.map((item) => renderLink(item, true))}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="rounded-lg border border-dashed border-sidebar-border px-3 py-5 text-sm text-sidebar-foreground/60">
                Nenhum módulo encontrado para “{search}”.
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}