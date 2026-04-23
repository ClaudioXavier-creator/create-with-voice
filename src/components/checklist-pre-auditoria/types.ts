export type CheckStatus = "ok" | "alerta" | "critico";

export interface CheckItem {
  area: string;
  item: string;
  status: CheckStatus;
  detalhe: string;
  link: string;
  icon: React.ElementType;
}

export interface ChecklistMetrics {
  total: number;
  oks: number;
  alertas: number;
  criticos: number;
  pct: number;
}