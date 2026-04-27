import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutriCrm from "@/assets/logo-nutricrm.png";
import logoAgroGestao from "@/assets/logo-agrogestao.png";
import logoAgroRc from "@/assets/logo-agrorc.png";

import previewFeed from "@/assets/feedbpf-dashboard-preview.jpg";
import previewAudits from "@/assets/auditsbpf-dashboard-preview.jpg";
import previewNutri from "@/assets/nutricrm-dashboard-preview.jpg";

interface Slide {
  title: string;
  description: string;
  image: string;
}

interface DemoConfig {
  key: string;
  productSlug: string;
  brand: string;
  tagline: string;
  logo: string;
  accent: string;
  ctaTrialLabel: string;
  slides: Slide[];
}

const DEMOS: Record<string, DemoConfig> = {
  feedbpf: {
    key: "feedbpf",
    productSlug: "feedbpf",
    brand: "Feed_BPF",
    tagline: "Boas Práticas de Fabricação para Nutrição Animal",
    logo: logoFeedBpf,
    accent: "from-emerald-500 to-emerald-700",
    ctaTrialLabel: "Iniciar trial de 7 dias",
    slides: [
      {
        title: "Dashboard de Conformidade",
        description:
          "Visão consolidada dos 10 POPs obrigatórios da IN 04/2007, com alertas automáticos de vencimento, KPIs de produção e status de auditoria.",
        image: previewFeed,
      },
      {
        title: "Execução digital de POPs",
        description:
          "Planilhas digitais com assinatura, anexos de fotos/laudos e trilha de auditoria SHA-256 — prontas para fiscalização do MAPA.",
        image: previewFeed,
      },
      {
        title: "Rastreabilidade e Recall",
        description:
          "Árvore visual de rastreabilidade do lote, simulação anual de recall (Decreto 12.031/2024) e alertas de espécies restritas (IN 34/2008).",
        image: previewFeed,
      },
    ],
  },
  auditsbpf: {
    key: "auditsbpf",
    productSlug: "auditsbpf",
    brand: "Audits_BPF",
    tagline: "Auditoria interna BPF para nutrição animal",
    logo: logoAuditsBpf,
    accent: "from-blue-500 to-blue-700",
    ctaTrialLabel: "Iniciar trial Audits_BPF",
    slides: [
      {
        title: "Checklists baseados no Decreto 12.031/2024",
        description:
          "Modelos prontos cobrindo as 14 áreas regulatórias, com pontuação automática e plano de ação 5W2H.",
        image: previewAudits,
      },
      {
        title: "Sala do Auditor",
        description:
          "Portal independente para auditores externos consultarem documentos vigentes sem acessar a operação.",
        image: previewAudits,
      },
      {
        title: "Relatórios profissionais",
        description:
          "Exportação em PDF com identidade da consultoria, gráficos de evolução e classificação de risco.",
        image: previewAudits,
      },
    ],
  },
  nutricrm: {
    key: "nutricrm",
    productSlug: "nutricrm",
    brand: "NutriCRM",
    tagline: "CRM especializado em nutrição animal",
    logo: logoNutriCrm,
    accent: "from-orange-500 to-rose-600",
    ctaTrialLabel: "Iniciar trial NutriCRM",
    slides: [
      {
        title: "Carteira do representante",
        description:
          "Cada representante visualiza apenas seus clientes — privacidade total entre carteiras.",
        image: previewNutri,
      },
      {
        title: "Pipeline comercial",
        description:
          "Acompanhe propostas, visitas técnicas, amostragens e fechamentos em um funil dedicado ao agro.",
        image: previewNutri,
      },
      {
        title: "Indicadores de performance",
        description:
          "KPIs de conversão, ticket médio por espécie e ranking de representantes.",
        image: previewNutri,
      },
    ],
  },
  agrogestao: {
    key: "agrogestao",
    productSlug: "agrogestao",
    brand: "AgroGestão CRM",
    tagline: "Gestão comercial agrícola por região",
    logo: logoAgroGestao,
    accent: "from-lime-500 to-green-700",
    ctaTrialLabel: "Iniciar trial AgroGestão",
    slides: [
      {
        title: "Mapa de regiões",
        description:
          "Distribuição de carteira por região, com indicadores de cobertura e performance.",
        image: previewNutri,
      },
      {
        title: "Acompanhamento de safra",
        description:
          "Histórico de visitas, recomendações técnicas e produtos vendidos por propriedade.",
        image: previewNutri,
      },
      {
        title: "Relatórios gerenciais",
        description:
          "Exporte relatórios de vendas, metas e produtividade por consultor.",
        image: previewNutri,
      },
    ],
  },
  agrorc: {
    key: "agrorc",
    productSlug: "agrorc",
    brand: "Agro RC CRM",
    tagline: "CRM de relacionamento e cobrança no agro",
    logo: logoAgroRc,
    accent: "from-amber-500 to-orange-700",
    ctaTrialLabel: "Iniciar trial Agro RC",
    slides: [
      {
        title: "Painel de relacionamento",
        description:
          "Acompanhe interações, status de pagamento e histórico financeiro de cada cliente.",
        image: previewNutri,
      },
      {
        title: "Régua de cobrança",
        description:
          "Automação de mensagens (WhatsApp/e-mail) por estágio de inadimplência.",
        image: previewNutri,
      },
      {
        title: "Indicadores de carteira",
        description:
          "Aging, recuperação e conversão consolidados em um único dashboard.",
        image: previewNutri,
      },
    ],
  },
};

const ALIASES: Record<string, string> = {
  "feed-bpf": "feedbpf",
  "audits-bpf": "auditsbpf",
  "nutri-crm": "nutricrm",
  "agro-gestao": "agrogestao",
  "agro-rc": "agrorc",
};

export default function DemoPage() {
  const { produto } = useParams<{ produto: string }>();
  const navigate = useNavigate();
  const key = (produto && (ALIASES[produto] || produto)) || "feedbpf";
  const config = DEMOS[key];

  const [index, setIndex] = useState(0);

  const totalSlides = config?.slides.length ?? 0;
  const slide = useMemo(() => config?.slides[index], [config, index]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl font-bold">Demo não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O produto solicitado não possui demo disponível.
            </p>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goPrev = () => setIndex((i) => (i - 1 + totalSlides) % totalSlides);
  const goNext = () => setIndex((i) => (i + 1) % totalSlides);

  const handleTrial = () => {
    navigate(`/auth?mode=signup&product=${config.productSlug}&redirect=/dashboard`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
            <img src={config.logo} alt={config.brand} className="h-10 w-10 object-contain" />
            <div>
              <div className="font-bold text-foreground">{config.brand}</div>
              <div className="text-xs text-muted-foreground">{config.tagline}</div>
            </div>
          </Link>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            <Sparkles className="h-3 w-3 mr-1" /> Demonstração
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className={`bg-gradient-to-br ${config.accent} text-white`}>
        <div className="container mx-auto px-4 py-10 sm:py-14 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Conheça o {config.brand} em poucos cliques
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            Esta é uma navegação guiada com telas reais do produto. Para usar com seus dados,
            inicie um trial gratuito de 7 dias.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" variant="secondary" onClick={handleTrial}>
              {config.ctaTrialLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/")}
            >
              Ver todos os produtos
            </Button>
          </div>
        </div>
      </section>

      {/* Tour */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Tela {index + 1} de {totalSlides}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Próxima">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="relative bg-muted">
            <img
              src={slide!.image}
              alt={slide!.title}
              className="w-full h-auto object-cover max-h-[520px]"
              loading="eager"
            />
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/60 hover:bg-black/60 text-white border-none">
                <Lock className="h-3 w-3 mr-1" /> Modo demonstração
              </Badge>
            </div>
          </div>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-xl font-semibold">{slide!.title}</h2>
            <p className="text-muted-foreground">{slide!.description}</p>
          </CardContent>
        </Card>

        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {config.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"
              }`}
              aria-label={`Ir para tela ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-4">
            <h2 className="text-2xl font-bold">Gostou do que viu?</h2>
            <p className="text-muted-foreground">
              Crie sua conta e teste o {config.brand} com seus próprios dados por 7 dias —
              sem cobrança e sem cartão de crédito.
            </p>
            <Button size="lg" onClick={handleTrial}>
              {config.ctaTrialLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
