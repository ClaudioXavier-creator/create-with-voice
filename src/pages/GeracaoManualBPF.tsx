import { useState } from "react";
import { BookOpen, Download, Loader2, Building2, FileText, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { popsConfig } from "@/config/popsConfig";
import { manualBpfContent } from "@/config/manualBpfContent";

interface ManualData {
  empresa: any;
  documentos: any[];
  pops: typeof popsConfig;
  treinamentos: any[];
  calibracoes: any[];
  fornecedores: any[];
  produtos: any[];
}

export default function GeracaoManualBPF() {
  const { user } = useAuth();
  const { empresaSelecionada } = useEmpresa();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manualData, setManualData] = useState<ManualData | null>(null);

  const coletarDados = async () => {
    if (!user) return;
    setLoading(true);
    setProgress(10);

    try {
      const eqUser = (q: any) => {
        let r = q.eq("user_id", user.id);
        if (empresaSelecionada) r = r.eq("empresa_id", empresaSelecionada);
        return r;
      };

      setProgress(20);
      const [
        { data: empresa },
        { data: documentos },
        { data: treinamentos },
        { data: calibracoes },
        { data: fornecedores },
        { data: produtos },
      ] = await Promise.all([
        empresaSelecionada
          ? supabase.from("empresas").select("*").eq("id", empresaSelecionada).single()
          : supabase.from("empresas").select("*").eq("user_id", user.id).limit(1).single(),
        eqUser(supabase.from("documentos").select("*")),
        eqUser(supabase.from("treinamentos" as any).select("*")),
        eqUser(supabase.from("calibracoes").select("*")),
        eqUser(supabase.from("fornecedores").select("*").limit(50)),
        eqUser(supabase.from("produtos").select("*")),
      ]);

      setProgress(60);
      setManualData({
        empresa: empresa || {},
        documentos: documentos || [],
        pops: popsConfig,
        treinamentos: treinamentos || [],
        calibracoes: calibracoes || [],
        fornecedores: fornecedores || [],
        produtos: produtos || [],
      });
      setProgress(100);
      toast.success("Dados coletados! O manual está pronto para visualização.");
    } catch (err: any) {
      toast.error("Erro ao coletar dados: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const gerarTexto = () => {
    if (!manualData) return "";
    const e = manualData.empresa;
    const sections: string[] = [];

    sections.push("MANUAL DE BOAS PRÁTICAS DE FABRICAÇÃO (BPF)");
    sections.push(`Empresa: ${e.nome || "—"}`);
    sections.push(`CNPJ: ${e.cnpj || "—"}`);
    sections.push(`Endereço: ${e.endereco || "—"}`);
    sections.push(`RT: ${e.responsavel_tecnico || "—"} — CRMV: ${e.crmv || "—"}`);
    sections.push(`Tipo de Produção: ${(e.tipo_producao || []).join(", ") || "—"}`);
    sections.push(`Capacidade: ${e.capacidade || "—"}`);
    sections.push("");

    // Manual content sections
    manualBpfContent.forEach((section) => {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push(section.titulo.toUpperCase());
      sections.push("=".repeat(60));
      sections.push(section.conteudo);
    });

    // POPs
    sections.push(`\n${"=".repeat(60)}`);
    sections.push("PROCEDIMENTOS OPERACIONAIS PADRÃO (POPs)");
    sections.push("=".repeat(60));
    popsConfig.forEach((pop) => {
      sections.push(`\n--- ${pop.codigo} — ${pop.nome} ---`);
      sections.push(`Frequência: ${pop.frequencia}`);
      sections.push(`Áreas: ${pop.areas.join(", ")}`);
    });

    // Documentos cadastrados
    if (manualData.documentos.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("DOCUMENTOS CADASTRADOS");
      sections.push("=".repeat(60));
      manualData.documentos.forEach((d) => {
        sections.push(`• ${d.codigo} — ${d.nome} (v${d.versao}, ${d.status})`);
      });
    }

    // Fornecedores qualificados
    if (manualData.fornecedores.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("FORNECEDORES QUALIFICADOS");
      sections.push("=".repeat(60));
      manualData.fornecedores.forEach((f) => {
        sections.push(`• ${f.nome} — CNPJ: ${f.cnpj || "—"} — Status: ${f.status_qualificacao || "pendente"}`);
      });
    }

    // Produtos registrados
    if (manualData.produtos.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("PRODUTOS REGISTRADOS");
      sections.push("=".repeat(60));
      manualData.produtos.forEach((p) => {
        sections.push(`• ${p.nome} — Classificação: ${p.classificacao} — Reg. MAPA: ${p.registro_mapa || "—"}`);
      });
    }

    // Calibrações
    if (manualData.calibracoes.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("PROGRAMA DE CALIBRAÇÃO");
      sections.push("=".repeat(60));
      manualData.calibracoes.forEach((c) => {
        sections.push(`• ${c.equipamento} (${c.codigo || "—"}) — Próxima: ${c.proxima_calibracao || "—"} — Status: ${c.status}`);
      });
    }

    sections.push(`\n\n${"=".repeat(60)}`);
    sections.push("ASSINATURA DO RESPONSÁVEL TÉCNICO");
    sections.push("=".repeat(60));
    sections.push(`\nNome: ${e.responsavel_tecnico || "________________________"}`);
    sections.push(`CRMV: ${e.crmv || "________________________"}`);
    sections.push(`Data: ____/____/________`);
    sections.push(`Assinatura: ________________________`);

    return sections.join("\n");
  };

  const baixarManual = () => {
    const texto = gerarTexto();
    const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Manual_BPF_${manualData?.empresa?.nome || "empresa"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Manual baixado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geração Automática do Manual BPF"
        description="Consolidação de POPs, ITs e dados da empresa em documento único"
        icon={BookOpen}
      />

      <Card>
        <CardContent className="pt-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-4">
            Gere automaticamente o Manual de BPF consolidando os dados cadastrados: empresa, POPs, documentos, fornecedores, produtos e calibrações.
          </p>
          <Button onClick={coletarDados} disabled={loading} size="lg">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
            {loading ? "Coletando dados..." : "Gerar Manual BPF"}
          </Button>
          {loading && <Progress value={progress} className="mt-4 max-w-md mx-auto" />}
        </CardContent>
      </Card>

      {manualData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.empresa?.nome ? "✓" : "—"}</p>
                <p className="text-xs text-muted-foreground">Empresa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.documentos.length}</p>
                <p className="text-xs text-muted-foreground">Documentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <ClipboardCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{popsConfig.length}</p>
                <p className="text-xs text-muted-foreground">POPs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.fornecedores.length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Prévia do Manual</CardTitle>
                <Button onClick={baixarManual}><Download className="w-4 h-4 mr-2" /> Baixar Manual (.txt)</Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-lg max-h-96 overflow-y-auto font-mono">
                {gerarTexto().slice(0, 3000)}
                {gerarTexto().length > 3000 && "\n\n... (continua no arquivo baixado)"}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
