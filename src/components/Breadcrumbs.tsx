import { useLocation, Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { NAV_ENTRIES, isGroup } from "@/components/layout/nav-config";

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  if (pathnames.length === 0 || location.pathname === "/" || location.pathname === "/dashboard") return null;

  const findLabel = (path: string) => {
    for (const entry of NAV_ENTRIES) {
      if (isGroup(entry)) {
        const item = entry.items.find((i) => i.path === path);
        if (item) return item.label;
      } else {
        if (entry.path === path) return entry.label;
      }
    }
    // Formata o pathname se não encontrar no nav-config
    return path.replace("/", "").charAt(0).toUpperCase() + path.slice(2).replace(/-/g, " ");
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
      <Link 
        to="/dashboard" 
        className="flex items-center gap-1 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1"
      >
        <Home className="w-3 h-3" />
        <span className="sr-only">Início</span>
      </Link>
      
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;
        const label = findLabel(to);

        return (
          <div key={to} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
            {last ? (
              <span className="font-semibold text-primary/80 truncate max-w-[150px] sm:max-w-[300px]" aria-current="page">
                {label}
              </span>
            ) : (
              <Link 
                to={to} 
                className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded px-1 truncate max-w-[100px] sm:max-w-[200px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
