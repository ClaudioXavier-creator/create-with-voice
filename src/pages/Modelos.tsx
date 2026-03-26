import { useState } from "react";
import { Lock, Unlock, Download, FileText, BookOpen, ClipboardList, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/PageHeader";

interface ModeloDoc {
  nome: string;
  descricao: string;
  categoria: "manual" | "pop" | "planilha" | "equipamento" | "treinamento";
  arquivo: string;
}

const MODELOS: ModeloDoc[] = [
  { nome: "Manual BPF", descricao: "Manual de Boas Práticas de Fabricação completo", categoria: "manual", arquivo: "Manual_BPF" },
  { nome: "POP 01 — Higienização", descricao: "Procedimento operacional padrão de higienização de instalações e equipamentos", categoria: "pop", arquivo: "POP-01" },
  { nome: "POP 02 — Potabilidade da Água", descricao: "Controle da potabilidade da água de abastecimento", categoria: "pop", arquivo: "POP-02" },
  { nome: "POP 03 — Higiene Pessoal", descricao: "Higiene e saúde dos colaboradores", categoria: "pop", arquivo: "POP-03" },
  { nome: "POP 04 — Manejo de Resíduos", descricao: "Manejo e destino de resíduos industriais", categoria: "pop", arquivo: "POP-04" },
  { nome: "POP 05 — Manutenção", descricao: "Manutenção preventiva e calibração de equipamentos", categoria: "pop", arquivo: "POP-05" },
  { nome: "POP 06 — Controle de Pragas", descricao: "Prevenção e controle integrado de pragas", categoria: "pop", arquivo: "POP-06" },
  { nome: "POP 07 — Controle de MP", descricao: "Recebimento e armazenamento de matérias-primas", categoria: "pop", arquivo: "POP-07" },
  { nome: "POP 08 — Rastreabilidade e Recall", descricao: "Rastreabilidade de produtos e procedimento de recolhimento", categoria: "pop", arquivo: "POP-08" },
  { nome: "POP 09 — Treinamentos / Educação Sanitária", descricao: "Programa de capacitação e educação sanitária", categoria: "pop", arquivo: "POP-09" },
  { nome: "POP 10 — PAC Programa de Autocontrole", descricao: "Programa de autocontrole consolidado conforme MAPA", categoria: "pop", arquivo: "POP-10" },
  { nome: "Planilhas POP 01 (1.1 a 1.4)", descricao: "Planilhas de controle de higienização", categoria: "planilha", arquivo: "Planilhas/PL_POP_1" },
  { nome: "Planilhas POP 02 (2.1 a 2.3)", descricao: "Planilhas de controle da água", categoria: "planilha", arquivo: "Planilhas/PL_POP_2" },
  { nome: "Planilhas POP 03 (3.1 a 3.3)", descricao: "Planilhas de higiene pessoal e saúde", categoria: "planilha", arquivo: "Planilhas/PL_POP_3" },
  { nome: "Planilhas POP 04 (4.1 a 4.2)", descricao: "Planilhas de controle de resíduos", categoria: "planilha", arquivo: "Planilhas/PL_POP_4" },
  { nome: "Planilhas POP 05 (5.1 a 5.3)", descricao: "Planilhas de manutenção e calibração", categoria: "planilha", arquivo: "Planilhas/PL_POP_5" },
  { nome: "Planilhas POP 06 (6.1 a 6.3)", descricao: "Planilhas de controle de pragas", categoria: "planilha", arquivo: "Planilhas/PL_POP_6" },
  { nome: "Planilhas POP 07 (7.1 a 7.2)", descricao: "Planilhas de recebimento de MP", categoria: "planilha", arquivo: "Planilhas/PL_POP_7" },
  { nome: "Planilhas POP 08 (8.1 a 8.2)", descricao: "Planilhas de rastreabilidade", categoria: "planilha", arquivo: "Planilhas/PL_POP_8" },
  { nome: "Planilhas POP 09 (9.1 a 9.6)", descricao: "Planilhas de treinamentos e educação sanitária", categoria: "planilha", arquivo: "Planilhas/PL_POP_9" },
  { nome: "Lista de Equipamentos", descricao: "Inventário completo de equipamentos industriais", categoria: "equipamento", arquivo: "Equipamentos/Lista_Equipamentos" },
  { nome: "Lista de Balanças", descricao: "Relação de balanças com calibração", categoria: "equipamento", arquivo: "Equipamentos/Lista_Balancas" },
  { nome: "Cronograma de Treinamentos", descricao: "Calendário anual de capacitações", categoria: "treinamento", arquivo: "Treinamentos/Cronograma" },
  { nome: "Lista de Presença", descricao: "Modelo de lista de presença para treinamentos", categoria: "treinamento", arquivo: "Treinamentos/Lista_Presenca" },
];

const categoriaIcons: Record<string, React.ElementType> = {
  manual: BookOpen,
  pop: FileText,
  planilha: Table2,
  equipamento: ClipboardList,
  treinamento: ClipboardList,
};

const categoriaLabels: Record<string, string> = {
  manual: "Manual",
  pop: "POPs",
  planilha: "Planilhas",
  equipamento: "Equipamentos",
  treinamento: "Treinamentos",
};

export default function Modelos() {
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [senha, setSenha] = useState("");
  const [verificando, setVerificando] = useState(false);
  const [filtro, setFiltro] = useState<string>("todos");

  const verificarSenha = async () => {
    if (!senha.trim()) { toast.error("Digite a senha de acesso"); return; }
    setVerificando(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/modelos-verify-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ senha: senha.trim() }),
        }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setDesbloqueado(true);
        toast.success("Acesso liberado! Bem-vindo à biblioteca de modelos.");
      } else {
        toast.error(result.error || "Senha incorreta");
      }
    } catch {
      toast.error("Erro ao verificar senha");
    } finally {
      setVerificando(false);
    }
  };

  const modelosFiltrados = filtro === "todos" ? MODELOS : MODELOS.filter(m => m.categoria === filtro);

  const categorias = ["todos", "manual", "pop", "planilha", "equipamento", "treinamento"];

  if (!desbloqueado) {
    return (
      <div className="space-y-6">
        <PageHeader title="📁 Biblioteca de Modelos" description="Documentos padrão para implantação industrial BPF" />
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md border-primary/30 shadow-lg">
            <CardHeader className="text-center">
              <Lock className="w-16 h-16 mx-auto text-primary/40 mb-4" />
              <CardTitle className="text-xl">Área Restrita</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Esta biblioteca contém modelos de documentos para implantação BPF.
                O acesso é exclusivo para clientes do serviço de desenvolvimento.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Digite a senha de acesso"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && verificarSenha()}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <Button
                className="w-full"
                onClick={verificarSenha}
                disabled={verificando}
              >
                {verificando ? "Verificando..." : "Desbloquear Acesso"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Solicite sua senha ao responsável técnico
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="📁 Biblioteca de Modelos"
        description="Documentos padrão para implantação industrial BPF — Acesso liberado"
      />

      <div className="flex items-center gap-2 flex-wrap">
        <Unlock className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-primary">Acesso ativo</span>
        <span className="text-muted-foreground mx-2">|</span>
        {categorias.map(cat => (
          <Button
            key={cat}
            variant={filtro === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setFiltro(cat)}
          >
            {cat === "todos" ? "Todos" : categoriaLabels[cat]}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelosFiltrados.map(modelo => {
          const Icon = categoriaIcons[modelo.categoria] || FileText;
          return (
            <Card key={modelo.arquivo} className="hover:shadow-md transition-shadow border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm leading-tight">{modelo.nome}</CardTitle>
                    <span className="text-xs text-muted-foreground mt-1 inline-block px-2 py-0.5 bg-muted rounded-full">
                      {categoriaLabels[modelo.categoria]}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">{modelo.descricao}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => toast.info(`Download de ${modelo.nome} — funcionalidade será conectada ao storage`)}>
                  <Download className="w-4 h-4 mr-1" /> Baixar Modelo
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
