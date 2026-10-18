import { Scale, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getBaseLegal, type AssuntoBaseLegal } from "@/config/baseLegal";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface BaseLegalBadgeProps {
  assunto: AssuntoBaseLegal;
  className?: string;
}

export function BaseLegalBadge({ assunto, className }: BaseLegalBadgeProps) {
  const base = getBaseLegal(assunto);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className={cn("h-7 px-2 text-xs text-muted-foreground shrink-0", className)}>
          <Scale aria-hidden="true" className="h-3.5 w-3.5" />
          Base legal
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-w-[calc(100vw-2rem)] space-y-3 text-sm break-words">
        <p className="font-semibold">{base.norma}</p>
        {base.artigo && <p>{base.artigo}</p>}
        {base.citacao !== [base.norma, base.artigo].filter(Boolean).join(", ") && base.citacao !== base.norma && (
          <p className="text-muted-foreground">{base.citacao}</p>
        )}
        {base.observacao && <p className="text-muted-foreground">{base.observacao}</p>}
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/legislacao">Consultar legislação <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}