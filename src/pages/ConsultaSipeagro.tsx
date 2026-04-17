import { useState, useEffect } from "react";
import { Search, Building2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { format } from "date-fns";

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  registro_mapa: string;
  registro_sipeagro: string;
  sipeagro_verificado: boolean;
  sipeagro_data_verificacao: string | null;
  status_qualificacao: string;
}

export default function ConsultaSipeagro() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) carregarFornecedores();
  }, [user, empresaAtiva]);

  const carregarFornecedores = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("fornecedores")
      .select("id, nome, cnpj, registro_mapa, registro_sipeagro, sipeagro_verificado, sipeagro_data_verificacao, status_qualificacao")
      .eq("user_id", user.id)
      .order("nome");
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    setFornecedores((data as Fornecedor[]) || []);
    setLoading(false);
  };

  const marcarVerificado = async (id: string, verificado: boolean) => {
    const { error } = await supabase
      .from("fornecedores")
      .update({
        sipeagro_verificado: verificado,
        sipeagro_data_verificacao: verificado ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar.");
      return;
    }
    toast.success(verificado ? "Fornecedor marcado como verificado no SIPEAGRO." : "Verificação removida.");
    carregarFornecedores();
  };

  const filtrados = fornecedores.filter(
    (f) =>
      f.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      (f.cnpj || "").includes(filtro) ||
      (f.registro_mapa || "").includes(filtro)
  );

  const totalVerificados = fornecedores.filter((f) => f.sipeagro_verificado).length;
  const totalPendentes = fornecedores.length - totalVerificados;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta SIPEAGRO"
        description="Verificação de fornecedores no sistema MAPA/SIPEAGRO"
        icon={Search}
        orientacaoModuloId="consulta-sipeagro"
      />

      {/* Banner: Lista Oficial MAPA (sempre atualizada) */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm flex items-center gap-2">
              🏛️ Lista Oficial de Estabelecimentos Registrados — MAPA/SIPEAGRO
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              A planilha oficial é atualizada semanalmente pelo MAPA. Consulte sempre a versão mais recente diretamente no portal gov.br para validar fornecedores por CNPJ, Razão Social ou nº de registro.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <a
              href="https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/alimentacao-animal/arquivos-alimentacao-animal/estabelecimentos-registrados"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" className="gap-2 w-full">
                <ExternalLink className="w-4 h-4" />
                Lista Oficial (XLSX)
              </Button>
            </a>
            <a
              href="https://sistemasweb.agricultura.gov.br/pages/SIPEAGRO.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline" className="gap-2 w-full">
                <Search className="w-4 h-4" />
                Consulta Online
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{fornecedores.length}</p>
            <p className="text-xs text-muted-foreground">Total Fornecedores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{totalVerificados}</p>
            <p className="text-xs text-muted-foreground">Verificados SIPEAGRO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{totalPendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle>Fornecedores</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Filtrar por nome, CNPJ ou registro..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={carregarFornecedores}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado.</p>
          ) : (
            <div className="space-y-3">
              {filtrados.map((f) => (
                <div key={f.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{f.nome}</h4>
                      {f.sipeagro_verificado ? (
                        <Badge className="bg-green-600 text-white">✓ Verificado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {f.cnpj || "—"} · Reg. MAPA: {f.registro_mapa || "—"} · SIPEAGRO: {f.registro_sipeagro || "—"}
                    </p>
                    {f.sipeagro_data_verificacao && (
                      <p className="text-xs text-muted-foreground">
                        Última verificação: {format(new Date(f.sipeagro_data_verificacao), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://sistemasweb.agricultura.gov.br/pages/SIPEAGRO.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3 mr-1" /> Consultar SIPEAGRO
                      </Button>
                    </a>
                    {f.sipeagro_verificado ? (
                      <Button variant="ghost" size="sm" onClick={() => marcarVerificado(f.id, false)}>
                        <XCircle className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => marcarVerificado(f.id, true)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Marcar Verificado
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Como verificar no SIPEAGRO</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Clique em "Consultar SIPEAGRO" ao lado do fornecedor.</p>
          <p>2. No site do MAPA, busque pelo CNPJ ou número de registro do fornecedor.</p>
          <p>3. Verifique se o estabelecimento está com o registro ativo e válido.</p>
          <p>4. Após confirmação, clique em "Marcar Verificado" para registrar a consulta no sistema.</p>
          <p className="text-muted-foreground mt-4">
            <strong>Nota:</strong> A verificação deve ser realizada periodicamente conforme seu programa de qualificação de fornecedores (IN 04/2007).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
