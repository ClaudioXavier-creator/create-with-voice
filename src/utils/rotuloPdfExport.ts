import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ExportPdfOptions {
  /** Largura do rótulo em milímetros. */
  larguraMm: number;
  /** Altura do rótulo em milímetros. */
  alturaMm: number;
  /** Nome base do arquivo, sem extensão. */
  nomeArquivo: string;
  /** HTML do rótulo já montado (mesmo usado na impressão). */
  html: string;
}

/**
 * Gera um arquivo PDF do rótulo em tamanho real (mm), a partir do HTML de impressão.
 * Renderiza o HTML fora da tela para não interferir no layout da página.
 */
export async function exportRotuloPdf({
  larguraMm,
  alturaMm,
  nomeArquivo,
  html,
}: ExportPdfOptions): Promise<boolean> {
  if (!html?.trim()) {
    toast.error("Não há conteúdo de rótulo para exportar.");
    return false;
  }

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${larguraMm}mm`;
  container.style.minHeight = `${alturaMm}mm`;
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const orientation = larguraMm >= alturaMm ? "landscape" : "portrait";
    const pdf = new jsPDF({ orientation, unit: "mm", format: [larguraMm, alturaMm] });

    // Mantém a proporção real do conteúdo renderizado dentro da página.
    const proporcao = canvas.height / canvas.width;
    const alturaImagem = Math.min(alturaMm, larguraMm * proporcao);

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      larguraMm,
      alturaImagem,
    );
    pdf.save(`${nomeArquivo || "rotulo"}.pdf`);
    toast.success("PDF do rótulo gerado.");
    return true;
  } catch (error) {
    console.error("[rotuloPdfExport] Falha ao gerar PDF:", error);
    toast.error("Não foi possível gerar o PDF do rótulo.");
    return false;
  } finally {
    document.body.removeChild(container);
  }
}
