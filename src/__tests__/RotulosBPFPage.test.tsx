
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RotulosBPFPage from "../pages/RotulosBPFPage";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

// Mock das dependências
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do window.scrollTo
window.scrollTo = vi.fn();

const renderWithRouter = (ui: React.ReactElement, { route = "/rotulos" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(ui, { wrapper: BrowserRouter });
};

describe("RotulosBPFPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ session: null });
  });

  it("deve renderizar a página inicial corretamente", () => {
    renderWithRouter(<RotulosBPFPage />);
    
    expect(screen.getByText(/Nutri_Agro/i)).toBeInTheDocument();
    expect(screen.getByText(/Labels/i)).toBeInTheDocument();
    expect(screen.getByText(/Acessar Gerador Nutri_Agro Labels/i)).toBeInTheDocument();
  });

  it("deve exibir toast de sucesso quando o checkout for bem-sucedido", () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=success&tipo=grupo10&plano=mensal" });
    
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Pagamento confirmado"), expect.any(Object));
    expect(screen.getByText(/Bem-vindo ao Nutri_Agro Labels/i)).toBeInTheDocument();
    expect(screen.getByText(/Grupo 10 empresas/i)).toBeInTheDocument();
  });

  it("deve exibir card de erro quando o checkout for cancelado", () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=canceled" });
    
    expect(toast.error).toHaveBeenCalledWith("Checkout cancelado", expect.any(Object));
    expect(screen.getByText(/Você cancelou o pagamento/i)).toBeInTheDocument();
  });

  it("deve chamar a função de checkout ao clicar em um plano", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { url: "https://stripe.com/checkout" },
      error: null,
    });
    
    // Mock do window.open
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderWithRouter(<RotulosBPFPage />);
    
    // Encontrar o botão do plano mensal no Grupo 10
    // O botão está dentro do card de planos
    const buttons = screen.getAllByRole("button", { name: /Assinar/i });
    fireEvent.click(buttons[0]); // Primeiro botão de "Assinar" (Grupo 10 Mensal)

    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith("create-checkout-nutriagrolabels", {
        body: { tipo: "grupo10", plano: "mensal" },
      });
      expect(windowOpenSpy).toHaveBeenCalledWith("https://stripe.com/checkout", "_blank");
    });
  });

  it("deve exibir erro se a função de checkout falhar", async () => {
    (supabase.functions.invoke as any).mockResolvedValue({
      data: null,
      error: { message: "Erro na API" },
    });

    renderWithRouter(<RotulosBPFPage />);
    
    const buttons = screen.getAllByRole("button", { name: /Assinar/i });
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao iniciar checkout", expect.objectContaining({
        description: "Erro na API"
      }));
    });
  });

  it("deve limpar o status da URL ao clicar em 'Fechar'", async () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=success" });
    
    const closeButton = screen.getByText("Fechar");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(window.location.search).not.toContain("checkout=success");
    });
  });
});
