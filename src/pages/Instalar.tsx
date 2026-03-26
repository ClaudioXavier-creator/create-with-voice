import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Share, MoreVertical, Plus, ArrowUp, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Instalar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <Smartphone className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Feed_BPF</h1>
          <p className="text-white/70 text-sm">
            Sistema de Gestão de Boas Práticas de Fabricação
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-5">
          {isInstalled ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-semibold text-white">App Instalado!</h2>
              <p className="text-white/70 text-sm">
                O Feed_BPF já está instalado no seu dispositivo. Abra-o pela tela inicial.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white text-center">
                Instalar no Celular
              </h2>

              {/* Android / Desktop — botão direto */}
              {deferredPrompt && (
                <Button
                  onClick={handleInstall}
                  className="w-full h-14 text-base gap-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl"
                >
                  <Download className="w-5 h-5" />
                  Instalar Agora
                </Button>
              )}

              {/* iOS instructions */}
              {isIOS && !deferredPrompt && (
                <div className="space-y-4">
                  <p className="text-white/80 text-sm text-center">
                    No iPhone/iPad, siga estes passos:
                  </p>
                  <div className="space-y-3">
                    <Step
                      number={1}
                      icon={<Share className="w-5 h-5" />}
                      text="Toque no botão Compartilhar"
                      sub="(ícone de seta para cima na barra do Safari)"
                    />
                    <Step
                      number={2}
                      icon={<Plus className="w-5 h-5" />}
                      text='Selecione "Adicionar à Tela Inicial"'
                      sub="Role para baixo se necessário"
                    />
                    <Step
                      number={3}
                      icon={<ArrowUp className="w-5 h-5" />}
                      text='Toque em "Adicionar"'
                      sub="O app aparecerá na sua tela inicial"
                    />
                  </div>
                </div>
              )}

              {/* Android sem prompt (navegador não suporta) */}
              {!isIOS && !deferredPrompt && (
                <div className="space-y-4">
                  <p className="text-white/80 text-sm text-center">
                    No Android, siga estes passos:
                  </p>
                  <div className="space-y-3">
                    <Step
                      number={1}
                      icon={<MoreVertical className="w-5 h-5" />}
                      text="Abra o menu do navegador"
                      sub="(3 pontos no canto superior direito)"
                    />
                    <Step
                      number={2}
                      icon={<Download className="w-5 h-5" />}
                      text='Selecione "Instalar aplicativo"'
                      sub='Ou "Adicionar à tela inicial"'
                    />
                    <Step
                      number={3}
                      icon={<CheckCircle2 className="w-5 h-5" />}
                      text='Confirme tocando em "Instalar"'
                      sub="O app será instalado automaticamente"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs">
          Feed_BPF by CLXN • v1.0
        </p>
      </div>
    </div>
  );
};

function Step({
  number,
  icon,
  text,
  sub,
}: {
  number: number;
  icon: React.ReactNode;
  text: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 text-white font-medium text-sm">
          {icon}
          {text}
        </div>
        <p className="text-white/50 text-xs mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default Instalar;
