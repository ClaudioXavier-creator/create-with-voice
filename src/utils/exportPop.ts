import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
}

/**
 * Gera um documento formatado a partir do rascunho da IA
 */
export function formatarPopDocx(popData: any) {
  // Mock de geração de documento - futuramente integrará com docx.js
  const blob = new Blob([JSON.stringify(popData, null, 2)], { type: "text/plain" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `POP-${popData.codigo || 'IA'}.txt`;
  a.click();
}
