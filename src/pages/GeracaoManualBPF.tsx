import { useState, useEffect, useMemo } from "react";
import { BookOpen, Download, Loader2, Building2, FileText, ClipboardCheck, History, Save, Trash2, ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { POPS_CONFIG } from "@/config/popsConfig";
import { MANUAL_BPF_SECTIONS } from "@/config/manualBpfContent";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import { AssinarManualDialog, PapelAssinatura } from "@/components/manual-bpf/AssinarManualDialog";

interface ManualData {
  empresa: any;
  documentos: any[];
  popsVigentes: any[];
  treinamentos: any[];
  calibracoes: any[];
  fornecedores: any[];
  produtos: any[];
}

interface ManualSalvo {
  id: string;
  versao: number;
  titulo: string;
  arquivo_path: string | null;
  arquivo_nome: string | null;
  hash_sha256: string;
  total_pops: number;
  total_its: number;
  total_documentos: number;
  total_fornecedores: number;
  total_produtos: number;
  total_calibracoes: number;
  created_at: string;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface ValidacaoIssue {
  nivel: "erro" | "aviso";
  categoria: string;
  mensagem: string;
}

function validarManual(md: ManualData | null): ValidacaoIssue[] {
  const issues: ValidacaoIssue[] = [];
  if (!md) {
    issues.push({ nivel: "erro", categoria: "Dados", mensagem: "Nenhum dado coletado." });
    return issues;
  }

  // 1. Empresa — campos obrigatórios
  const e = md.empresa || {};
  const camposEmpresa: Array<[string, string]> = [
    ["nome", "Nome da empresa"],
    ["cnpj", "CNPJ"],
    ["endereco", "Endereço"],
    ["responsavel_tecnico", "Responsável Técnico"],
    ["crmv", "CRMV"],
  ];
  camposEmpresa.forEach(([k, label]) => {
    if (!e[k] || String(e[k]).trim() === "") {
      issues.push({ nivel: "erro", categoria: "Empresa", mensagem: `${label} não preenchido. Complete em Cadastro da Empresa.` });
    }
  });
  if (!Array.isArray(e.tipo_producao) || e.tipo_producao.length === 0) {
    issues.push({ nivel: "aviso", categoria: "Empresa", mensagem: "Tipo de produção não definido." });
  }
  if (!e.capacidade || String(e.capacidade).trim() === "") {
    issues.push({ nivel: "aviso", categoria: "Empresa", mensagem: "Capacidade produtiva não informada." });
  }

  // 2. POPs vigentes — todos os 10 obrigatórios da IN 04/2007
  const codigosVigentes = new Set(
    md.popsVigentes.map((p: any) => String(p.codigo || "").toUpperCase().trim())
  );
  POPS_CONFIG.forEach((pop) => {
    const cod = pop.codigo.toUpperCase();
    if (!codigosVigentes.has(cod)) {
      issues.push({
        nivel: "erro",
        categoria: "POPs",
        mensagem: `${pop.codigo} (${pop.nome}) não possui versão vigente aprovada. Acesse Documentos e aprove uma versão.`,
      });
    }
  });

  // 3. POPs vigentes — consistência de campos
  md.popsVigentes.forEach((p: any) => {
    if (!p.versao || String(p.versao).trim() === "") {
      issues.push({ nivel: "erro", categoria: "POPs", mensagem: `${p.codigo}: versão em branco.` });
    }
    if (!p.aprovado_em) {
      issues.push({ nivel: "erro", categoria: "POPs", mensagem: `${p.codigo}: data de aprovação ausente.` });
    }
    if (!p.aprovador_nome || String(p.aprovador_nome).trim() === "") {
      issues.push({ nivel: "erro", categoria: "POPs", mensagem: `${p.codigo}: nome do aprovador ausente.` });
    }
    if (!p.aprovacao_hash) {
      issues.push({ nivel: "aviso", categoria: "POPs", mensagem: `${p.codigo}: hash de aprovação ausente.` });
    }
    // Validade vencida
    if (p.proxima_revisao) {
      const prox = new Date(p.proxima_revisao);
      if (!isNaN(prox.getTime()) && prox < new Date()) {
        issues.push({
          nivel: "aviso",
          categoria: "POPs",
          mensagem: `${p.codigo}: revisão vencida em ${prox.toLocaleDateString("pt-BR")}.`,
        });
      }
    }
  });

  // 4. Instruções de Trabalho — consistência por POP
  POPS_CONFIG.forEach((pop) => {
    const its = INSTRUCOES_TRABALHO.filter((it) => it.popCodigo === pop.codigo);
    its.forEach((it) => {
      if (!it.titulo || it.titulo.trim() === "") {
        issues.push({ nivel: "erro", categoria: "ITs", mensagem: `IT ${it.id}: título ausente.` });
      }
      if (!it.frequencia || it.frequencia.trim() === "") {
        issues.push({ nivel: "aviso", categoria: "ITs", mensagem: `IT ${it.id} (${pop.codigo}): frequência não definida.` });
      }
    });
    // POP vigente sem nenhuma IT vinculada (apenas aviso — nem todo POP exige IT)
    if (codigosVigentes.has(pop.codigo.toUpperCase()) && its.length === 0) {
      issues.push({
        nivel: "aviso",
        categoria: "ITs",
        mensagem: `${pop.codigo} vigente, mas sem Instruções de Trabalho vinculadas.`,
      });
    }
  });

  // 5. Avisos gerais
  if (md.fornecedores.length === 0) {
    issues.push({ nivel: "aviso", categoria: "Fornecedores", mensagem: "Nenhum fornecedor cadastrado." });
  }
  if (md.produtos.length === 0) {
    issues.push({ nivel: "aviso", categoria: "Produtos", mensagem: "Nenhum produto registrado." });
  }
  if (md.calibracoes.length === 0) {
    issues.push({ nivel: "aviso", categoria: "Calibração", mensagem: "Programa de calibração vazio." });
  }

  return issues;
}

export default function GeracaoManualBPF() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [progress, setProgress] = useState(0);
  const [manualData, setManualData] = useState<ManualData | null>(null);
  const [historico, setHistorico] = useState<ManualSalvo[]>([]);

  const validacao = useMemo(() => validarManual(manualData), [manualData]);
  const erros = validacao.filter((v) => v.nivel === "erro");
  const avisos = validacao.filter((v) => v.nivel === "aviso");

  const carregarHistorico = async () => {
    if (!user) return;
    let q = supabase.from("manuais_bpf").select("*").eq("user_id", user.id);
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q.order("created_at", { ascending: false }).limit(20);
    setHistorico((data as ManualSalvo[]) || []);
  };

  useEffect(() => {
    carregarHistorico();
  }, [user, empresaAtiva]);

  const coletarDados = async () => {
    if (!user) return;
    setLoading(true);
    setProgress(10);

    try {
      const eqUser = (q: any) => {
        let r = q.eq("user_id", user.id);
        if (empresaAtiva) r = r.eq("empresa_id", empresaAtiva.id);
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
        empresaAtiva
          ? supabase.from("empresas").select("*").eq("id", empresaAtiva.id).single()
          : supabase.from("empresas").select("*").eq("user_id", user.id).limit(1).single(),
        eqUser(supabase.from("documentos").select("*")),
        eqUser(supabase.from("treinamentos" as any).select("*")),
        eqUser(supabase.from("calibracoes").select("*")),
        eqUser(supabase.from("fornecedores").select("*").limit(50)),
        eqUser(supabase.from("produtos").select("*")),
      ]);

      setProgress(60);
      // Filtra apenas POPs vigentes (workflow_status='vigente') cadastrados pelo cliente
      const docsAll = documentos || [];
      const popsVigentes = docsAll.filter(
        (d: any) => d.workflow_status === "vigente" && (d.codigo || "").toUpperCase().startsWith("POP")
      );

      setManualData({
        empresa: empresa || {},
        documentos: docsAll,
        popsVigentes,
        treinamentos: treinamentos || [],
        calibracoes: calibracoes || [],
        fornecedores: fornecedores || [],
        produtos: produtos || [],
      });
      setProgress(100);
      toast.success("Dados coletados! Pronto para salvar/baixar.");
    } catch (err: any) {
      toast.error("Erro ao coletar dados: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const gerarTexto = (md: ManualData | null = manualData) => {
    if (!md) return "";
    const e = md.empresa;
    const sections: string[] = [];

    sections.push("MANUAL DE BOAS PRÁTICAS DE FABRICAÇÃO (BPF)");
    sections.push(`Empresa: ${e.nome || "—"}`);
    sections.push(`CNPJ: ${e.cnpj || "—"}`);
    sections.push(`Endereço: ${e.endereco || "—"}`);
    sections.push(`RT: ${e.responsavel_tecnico || "—"} — CRMV: ${e.crmv || "—"}`);
    sections.push(`Tipo de Produção: ${(e.tipo_producao || []).join(", ") || "—"}`);
    sections.push(`Capacidade: ${e.capacidade || "—"}`);
    sections.push(`Data de Geração: ${new Date().toLocaleString("pt-BR")}`);
    sections.push("");

    MANUAL_BPF_SECTIONS.forEach((section) => {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push(`${section.numero}. ${section.titulo.toUpperCase()}`);
      sections.push("=".repeat(60));
      sections.push(section.conteudo.join("\n"));
    });

    // POPs — vigentes do cliente + estrutura padrão
    sections.push(`\n${"=".repeat(60)}`);
    sections.push("PROCEDIMENTOS OPERACIONAIS PADRÃO (POPs)");
    sections.push("=".repeat(60));
    POPS_CONFIG.forEach((pop) => {
      const vigente = md.popsVigentes.find(
        (d: any) => (d.codigo || "").toUpperCase() === pop.codigo.toUpperCase()
      );
      sections.push(`\n--- ${pop.codigo} — ${pop.nome} ---`);
      sections.push(`Descrição: ${pop.descricao}`);
      if (vigente) {
        sections.push(`✓ POP VIGENTE NA EMPRESA — Versão: ${vigente.versao} | Aprovado em: ${vigente.aprovado_em ? new Date(vigente.aprovado_em).toLocaleDateString("pt-BR") : "—"} | Por: ${vigente.aprovador_nome || "—"}`);
        if (vigente.aprovacao_hash) sections.push(`  Hash: ${vigente.aprovacao_hash.slice(0, 32)}...`);
      } else {
        sections.push(`⚠ Nenhum POP vigente cadastrado para este código.`);
      }

      // Instruções de Trabalho vinculadas
      const its = INSTRUCOES_TRABALHO.filter((it) => it.popCodigo === pop.codigo);
      if (its.length > 0) {
        sections.push(`\n  Instruções de Trabalho (${its.length}):`);
        its.forEach((it) => {
          sections.push(`  • ${it.id} — ${it.titulo}`);
          sections.push(`    Frequência: ${it.frequencia}`);
        });
      }
    });

    if (md.documentos.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("DOCUMENTOS CADASTRADOS");
      sections.push("=".repeat(60));
      md.documentos.forEach((d) => {
        sections.push(`• ${d.codigo} — ${d.nome} (v${d.versao}, ${d.workflow_status || d.status})`);
      });
    }

    if (md.fornecedores.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("FORNECEDORES QUALIFICADOS");
      sections.push("=".repeat(60));
      md.fornecedores.forEach((f) => {
        sections.push(`• ${f.nome} — CNPJ: ${f.cnpj || "—"} — Status: ${f.status_qualificacao || "pendente"}`);
      });
    }

    if (md.produtos.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("PRODUTOS REGISTRADOS");
      sections.push("=".repeat(60));
      md.produtos.forEach((p) => {
        sections.push(`• ${p.nome} — Classificação: ${p.classificacao} — Reg. MAPA: ${p.registro_mapa || "—"}`);
      });
    }

    if (md.calibracoes.length > 0) {
      sections.push(`\n${"=".repeat(60)}`);
      sections.push("PROGRAMA DE CALIBRAÇÃO");
      sections.push("=".repeat(60));
      md.calibracoes.forEach((c) => {
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

  const salvarManual = async () => {
    if (!manualData || !user) return;
    const erros = validacao.filter((v) => v.nivel === "erro");
    if (erros.length > 0) {
      toast.error(`Não é possível salvar: ${erros.length} erro(s) de validação. Corrija antes de prosseguir.`);
      return;
    }
    setSalvando(true);
    try {
      const texto = gerarTexto();
      const hash = await sha256Hex(texto);
      const proximaVersao = (historico[0]?.versao || 0) + 1;
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const arquivoNome = `Manual_BPF_v${proximaVersao}_${ts}.txt`;
      const arquivoPath = `manuais/${user.id}/${arquivoNome}`;

      // Upload para Storage
      const blob = new Blob([texto], { type: "text/plain;charset=utf-8" });
      const { error: upErr } = await supabase.storage
        .from("documentos-bpf")
        .upload(arquivoPath, blob, { contentType: "text/plain;charset=utf-8", upsert: false });
      if (upErr) throw upErr;

      // Insere registro
      const totalIts = INSTRUCOES_TRABALHO.length;
      const { error: insErr } = await supabase.from("manuais_bpf").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        versao: proximaVersao,
        titulo: `Manual BPF — ${manualData.empresa?.nome || "Empresa"} — v${proximaVersao}`,
        arquivo_path: arquivoPath,
        arquivo_nome: arquivoNome,
        conteudo: texto,
        hash_sha256: hash,
        total_pops: manualData.popsVigentes.length,
        total_its: totalIts,
        total_documentos: manualData.documentos.length,
        total_fornecedores: manualData.fornecedores.length,
        total_produtos: manualData.produtos.length,
        total_calibracoes: manualData.calibracoes.length,
        gerado_por_nome: user.email || "",
      });
      if (insErr) throw insErr;

      toast.success(`Manual v${proximaVersao} salvo com hash de auditoria.`);
      await carregarHistorico();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + (err.message || ""));
    } finally {
      setSalvando(false);
    }
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
  };

  const baixarSalvo = async (m: ManualSalvo) => {
    if (!m.arquivo_path) return;
    const { data, error } = await supabase.storage
      .from("documentos-bpf")
      .createSignedUrl(m.arquivo_path, 60);
    if (error || !data) {
      toast.error("Erro ao gerar link: " + (error?.message || ""));
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const excluirSalvo = async (m: ManualSalvo) => {
    if (!confirm(`Excluir Manual v${m.versao}?`)) return;
    try {
      if (m.arquivo_path) {
        await supabase.storage.from("documentos-bpf").remove([m.arquivo_path]);
      }
      const { error } = await supabase.from("manuais_bpf").delete().eq("id", m.id);
      if (error) throw error;
      toast.success("Manual removido.");
      await carregarHistorico();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || ""));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Geração Automática do Manual BPF"
        description="Consolidação de POPs vigentes, ITs e dados da empresa em documento único, com persistência e hash de auditoria"
        icon={BookOpen}
      />

      <Card>
        <CardContent className="pt-6 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-4">
            Coleta dados cadastrados (POPs vigentes, ITs, documentos, fornecedores, produtos, calibrações) e consolida em um Manual BPF versionado, com hash SHA-256 para auditoria MAPA.
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.empresa?.nome ? "✓" : "—"}</p>
                <p className="text-xs text-muted-foreground">Empresa</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <ClipboardCheck className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.popsVigentes.length}/{POPS_CONFIG.length}</p>
                <p className="text-xs text-muted-foreground">POPs vigentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <FileText className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{INSTRUCOES_TRABALHO.length}</p>
                <p className="text-xs text-muted-foreground">ITs</p>
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
                <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{manualData.fornecedores.length}</p>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </CardContent>
            </Card>
          </div>

          {/* Painel de validação */}
          {erros.length === 0 && avisos.length === 0 ? (
            <Alert className="border-primary/40">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <AlertTitle>Validação OK</AlertTitle>
              <AlertDescription>Todos os POPs vigentes, ITs e dados da empresa estão completos e consistentes.</AlertDescription>
            </Alert>
          ) : (
            <Card className={erros.length > 0 ? "border-destructive" : "border-yellow-500"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {erros.length > 0 ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  )}
                  Validação pré-salvamento
                  {erros.length > 0 && <Badge variant="destructive">{erros.length} erro(s)</Badge>}
                  {avisos.length > 0 && <Badge variant="secondary">{avisos.length} aviso(s)</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {erros.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-destructive mb-2">Erros — bloqueiam o salvamento:</p>
                    <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                      {erros.map((iss, i) => (
                        <li key={`e-${i}`} className="flex gap-2">
                          <Badge variant="outline" className="shrink-0 text-xs">{iss.categoria}</Badge>
                          <span>{iss.mensagem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {avisos.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-500 mb-2">Avisos — recomendado revisar:</p>
                    <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
                      {avisos.map((iss, i) => (
                        <li key={`a-${i}`} className="flex gap-2">
                          <Badge variant="outline" className="shrink-0 text-xs">{iss.categoria}</Badge>
                          <span className="text-muted-foreground">{iss.mensagem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Prévia do Manual</CardTitle>
                <div className="flex gap-2">
                  <Button
                    onClick={salvarManual}
                    disabled={salvando || erros.length > 0}
                    variant="default"
                    title={erros.length > 0 ? "Corrija os erros de validação para salvar" : "Salvar nova versão"}
                  >
                    {salvando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar versão
                  </Button>
                  <Button onClick={baixarManual} variant="outline">
                    <Download className="w-4 h-4 mr-2" /> Baixar (.txt)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs bg-muted p-4 rounded-lg max-h-96 overflow-y-auto font-mono">
                {gerarTexto().slice(0, 3000)}
                {gerarTexto().length > 3000 && "\n\n... (continua no arquivo completo)"}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" /> Histórico de Manuais Gerados
            <Badge variant="secondary">{historico.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum manual salvo ainda. Gere e clique em "Salvar versão".
            </p>
          ) : (
            <div className="space-y-2">
              {historico.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>v{m.versao}</Badge>
                      <span className="font-medium truncate">{m.titulo}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                      <span>{new Date(m.created_at).toLocaleString("pt-BR")}</span>
                      <span>POPs: {m.total_pops} • ITs: {m.total_its} • Docs: {m.total_documentos} • Forn.: {m.total_fornecedores}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {m.hash_sha256.slice(0, 24)}...
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => baixarSalvo(m)} disabled={!m.arquivo_path}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => excluirSalvo(m)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
