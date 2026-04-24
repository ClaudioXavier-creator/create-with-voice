import { Badge } from "@/components/ui/badge";
import { FileEdit, FileSearch, CheckCircle2, Archive } from "lucide-react";

export type WorkflowStatus = "rascunho" | "em_revisao" | "vigente" | "obsoleto";

const config: Record<WorkflowStatus, { label: string; icon: any; className: string }> = {
  rascunho: { label: "Rascunho", icon: FileEdit, className: "bg-muted text-muted-foreground border-border" },
  em_revisao: { label: "Em Revisão", icon: FileSearch, className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  vigente: { label: "Vigente", icon: CheckCircle2, className: "bg-primary/15 text-primary border-primary/30" },
  obsoleto: { label: "Obsoleto", icon: Archive, className: "bg-destructive/10 text-destructive border-destructive/30" },
};

export function WorkflowBadge({ status }: { status?: string | null }) {
  const key = (status as WorkflowStatus) in config ? (status as WorkflowStatus) : "vigente";
  const { label, icon: Icon, className } = config[key];
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </Badge>
  );
}
