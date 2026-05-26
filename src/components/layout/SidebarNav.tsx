import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, Search, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NavEntry, NavItem, isGroup } from "./nav-config";

const FAVORITES_KEY = "feedbpf_nav_favorites";

function flattenEntries(entries: NavEntry[]) {
  return entries.flatMap((entry) =>
    isGroup(entry)
      ? entry.items.map((item) => ({ ...item, group: entry.label }))
      : [{ ...entry, group: "Acesso direto" }],
  );
}

export const SidebarNav = React.memo(({
  currentPath,
  entries,
  onNavigate,
  userRoles = [],
  userEmail = "",
}: {
  currentPath: string;
  entries: NavEntry[];
  onNavigate?: () => void;
  userRoles?: string[];
  userEmail?: string;
}) => {
  const { product } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const filteredByRole = useMemo(() => {
    return entries.filter((entry) => {
      if (isGroup(entry)) {
        const visibleItems = entry.items.filter((item) => {
          if (item.requiredRoles && !item.requiredRoles.some(r => userRoles.includes(r))) {
             if (item.requiredEmail) {
                const emails = Array.isArray(item.requiredEmail) ? item.requiredEmail : [item.requiredEmail];
                if (emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                   return true;
                }
             }
             return false;
          }
          if (item.requiredEmail) {
             const emails = Array.isArray(item.requiredEmail) ? item.requiredEmail : [item.requiredEmail];
             if (!emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                return false;
             }
          }
          return true;
        });
        return visibleItems.length > 0;
      } else {
        if (entry.requiredRoles && !entry.requiredRoles.some(r => userRoles.includes(r))) {
            if (entry.requiredEmail) {
                const emails = Array.isArray(entry.requiredEmail) ? entry.requiredEmail : [entry.requiredEmail];
                if (emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                   return true;
                }
            }
            return false;
        }
        if (entry.requiredEmail) {
            const emails = Array.isArray(entry.requiredEmail) ? entry.requiredEmail : [entry.requiredEmail];
            if (!emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                return false;
            }
        }
        return true;
      }
    }).map(entry => {
      if (isGroup(entry)) {
        return {
          ...entry,
          items: entry.items.filter(item => {
            if (item.requiredRoles && !item.requiredRoles.some(r => userRoles.includes(r))) {
               if (item.requiredEmail) {
                  const emails = Array.isArray(item.requiredEmail) ? item.requiredEmail : [item.requiredEmail];
                  if (emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                     return true;
                  }
               }
               return false;
            }
            if (item.requiredEmail) {
               const emails = Array.isArray(item.requiredEmail) ? item.requiredEmail : [item.requiredEmail];
               if (!emails.some(e => e.toLowerCase() === userEmail.toLowerCase())) {
                  return false;
               }
            }
            return true;
          })
        };
      }
      return entry;
    });
  }, [entries, userRoles, userEmail]);

  useEffect(() => {
    if (searchQuery) {
      const nextOpen = { ...openGroups };
      filteredByRole.forEach((entry) => {
        if (isGroup(entry)) {
          const hasMatch = entry.items.some(item => 
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (hasMatch) nextOpen[entry.label] = true;
        }
      });
      setOpenGroups(nextOpen);
    }
  }, [searchQuery, filteredByRole]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      filteredByRole.forEach((entry) => {
        if (isGroup(entry) && entry.items.some((item) => item.path === currentPath)) {
          next[entry.label] = true;
        }
      });
      return next;
    });
  }, [currentPath, filteredByRole]);

  const searchedEntries = useMemo(() => {
    if (!searchQuery) return filteredByRole;
    
    const query = searchQuery.toLowerCase();
    return filteredByRole.map(entry => {
      if (isGroup(entry)) {
        const matchingItems = entry.items.filter(item => 
          item.label.toLowerCase().includes(query) || 
          (item.keywords && item.keywords.some(k => k.toLowerCase().includes(query)))
        );
        
        if (matchingItems.length > 0) {
          return { ...entry, items: matchingItems };
        }
        
        if (entry.label.toLowerCase().includes(query)) {
          return entry;
        }
        
        return null;
      } else {
        const matches = entry.label.toLowerCase().includes(query) || 
                       (entry.keywords && entry.keywords.some(k => k.toLowerCase().includes(query)));
        return matches ? entry : null;
      }
    }).filter(Boolean) as NavEntry[];
  }, [filteredByRole, searchQuery]);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const flatEntries = useMemo(() => flattenEntries(filteredByRole), [filteredByRole]);
  const favoriteItems = useMemo(
    () => flatEntries.filter((item) => favorites.includes(item.path)).slice(0, 8),
    [favorites, flatEntries],
  );

  const toggleFavorite = (path: string) => {
    setFavorites((prev) =>
      prev.includes(path) ? prev.filter((item) => item !== path) : [...prev, path].slice(-8),
    );
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLink = (item: NavItem, isSubItem = false) => {
    const isActive = currentPath === item.path || currentPath === `/${product}${item.path}`;
    const isFavorite = favorites.includes(item.path);
    const isExternal = item.external;
    const targetPath = isExternal ? item.path : (product && !item.path.startsWith(`/${product}`) ? `/${product}${item.path}` : item.path);

    return (
      <div key={item.path} className="group relative">
        <Link
          to={isExternal ? "#" : targetPath}
          onClick={(e) => {
            if (isExternal) {
              e.preventDefault();
              window.open(targetPath, "_blank", "noopener,noreferrer");
            }
            onNavigate?.();
          }}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 sm:px-3 sm:py-2 text-sm transition-all duration-300 overflow-hidden min-h-[44px] sm:min-h-0",
            isActive
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-semibold"
              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground active:scale-[0.98]",
            isSubItem && !isActive && "ml-2"
          )}
        >
          {item.logo ? (
            <img src={item.logo} alt="" className={cn("h-6 w-6 sm:h-5 sm:w-5 shrink-0 transition-transform group-hover:scale-110 duration-300 rounded bg-white p-0.5 shadow-sm")} />
          ) : (
            <item.icon aria-hidden="true" className={cn("h-5 w-5 sm:h-4 sm:w-4 shrink-0 transition-transform group-hover:scale-110 duration-300", isActive ? "text-white" : "text-sidebar-foreground/40")} />
          )}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-white/50 rounded-r-full animate-in slide-in-from-left-full duration-500" />
          )}
        </Link>
        
        <button
          type="button"
          aria-label={isFavorite ? `Remover ${item.label} dos favoritos` : `Adicionar ${item.label} aos favoritos`}
          onClick={() => toggleFavorite(item.path)}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 z-10",
            "opacity-0 group-hover:opacity-100",
            isFavorite && "opacity-100",
            isActive ? "text-white/40 hover:text-white hover:bg-white/10" : "hover:bg-sidebar-accent/50 text-sidebar-foreground/30 hover:text-sidebar-foreground"
          )}
        >
          <Star aria-hidden="true" className={cn("h-3.5 w-3.5", isFavorite && "fill-accent text-accent")}/>
        </button>
      </div>
    );
  };

  return (
    <ScrollArea className="flex-1 px-3">
      <div className="space-y-6 py-4">
        {/* Busca Local */}
        <div className="px-3 pb-2 sticky top-0 bg-sidebar/95 backdrop-blur-sm z-20">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/30 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Localizar no menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sidebar-accent/50 border border-sidebar-border/50 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-sidebar-accent transition-all placeholder:text-sidebar-foreground/30"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-sidebar-foreground/30 hover:text-sidebar-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {favoriteItems.length > 0 && !searchQuery && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-3 mb-1">
              <div className="flex items-center gap-2">
                <Sparkles aria-hidden="true" className="h-3 w-3 text-accent" />
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">Favoritos</p>
              </div>
              <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono border-sidebar-border text-sidebar-foreground/40 bg-sidebar/50">{favoriteItems.length}</Badge>
            </div>
            <div className="space-y-0.5">{favoriteItems.map((item) => renderLink(item))}</div>
          </section>
        )}

        <section className="space-y-1">
          <div className="px-3 mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/30">
              {searchQuery ? `Resultados (${searchedEntries.length})` : "Módulos do Sistema"}
            </p>
          </div>
          <div className="space-y-0.5">
            {searchedEntries.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-xs text-sidebar-foreground/40">Nenhum item encontrado.</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-primary"
                >
                  Limpar busca
                </Button>
              </div>
            ) : (
              searchedEntries.map((entry) => {
                if (!isGroup(entry)) {
                  return renderLink(entry);
                }

                const groupOpen = openGroups[entry.label] ?? false;
                const hasActive = entry.items.some((item) => item.path === currentPath);

                return (
                  <div key={entry.label} className="space-y-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => toggleGroup(entry.label)}
                      aria-expanded={groupOpen}
                      className={cn(
                        "h-auto w-full justify-start gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all duration-200",
                        hasActive && !groupOpen
                          ? "bg-sidebar-primary/20 text-sidebar-primary-foreground border border-sidebar-border/30 shadow-sm"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      {entry.logo ? (
                        <img src={entry.logo} alt="" className={cn("h-5 w-5 shrink-0 transition-transform duration-200 rounded bg-white p-0.5 shadow-sm")} />
                      ) : (
                        <entry.icon aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-colors duration-200", hasActive ? "text-sidebar-primary" : "text-sidebar-foreground/30")} />
                      )}
                      <span className="flex-1 whitespace-normal leading-snug">{entry.label}</span>
                      <ChevronDown aria-hidden="true" className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-300 opacity-30", (groupOpen || searchQuery) && "rotate-180 opacity-60")} />
                    </Button>
                    
                    {(groupOpen || searchQuery) && (
                      <div className="mt-0.5 space-y-0.5 animate-in slide-in-from-top-1 duration-200">
                        {entry.items.map((item) => renderLink(item, true))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </ScrollArea>
  );
});