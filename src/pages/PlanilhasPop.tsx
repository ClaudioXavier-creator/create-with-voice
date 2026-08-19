import { useState, useEffect } from "react";
import { 
  Clipboard, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Download, 
  Search, 
  FileSignature,
  FileBadge,
  AlertTriangle,
  Info,
  ExternalLink,
  BookOpen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageHeader from "@/components/PageHeader";
import { POPS_CUSTOM } from "@/config/feedBpfCustomConfig";
import { MODELOS_ASSETS } from "@/config/modelosAssetsMapping";
import { getItsPorPop } from "@/config/documentosCentral";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function PlanilhasPop() {
  const navigate = useNavigate();
  const [selectedPop, setSelectedPop] = useState(POPS_CUSTOM[0]);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPops = POPS_CUSTOM.filter(pop => 
    pop.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pop.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relatedIts = getItsPorPop(selectedPop.codigo);

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Clipboard} 
        title="Planilhas de POPs" 
        description="Acesso centralizado aos procedimentos, instruções de trabalho e registros digitais por POP."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Barra Lateral de Seleção */}
        <Card className="lg:col-span-4 h-fit">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar POP..." 
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredPops.map((pop) => (
                  <button
                    key={pop.codigo}
                    onClick={() => setSelectedPop(pop)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group ${
                      selectedPop.codigo === pop.codigo ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-primary">{pop.codigo}</span>
                      <span className="text-sm font-medium leading-tight">{pop.nome}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedPop.codigo === pop.codigo ? "translate-x-1 text-primary" : "text-muted-foreground group-hover:translate-x-1"}`} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Conteúdo do POP Selecionado */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-primary font-mono border-primary/30">
                  {selectedPop.codigo}
                </Badge>
                {selectedPop.moduloAtivo && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Módulo Ativo
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mt-2">{selectedPop.nome}</CardTitle>
              <CardDescription className="text-base">
                Gestão integrada de documentos e registros conforme IN 04/2007.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Procedimento Descritivo (Word/PDF) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <FileText className="w-4 h-4" /> Procedimento Descritivo
                  </h3>
                  <div className="space-y-2">
                    {MODELOS_ASSETS[selectedPop.codigo]?.filter(m => !m.label.toLowerCase().includes("planilha")).map((doc, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-3 border-dashed"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-3 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{doc.label}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">Documento original (Word/PDF)</span>
                        </div>
                      </Button>
                    ))}
                    {!MODELOS_ASSETS[selectedPop.codigo]?.some(m => !m.label.toLowerCase().includes("planilha")) && (
                      <div className="text-xs p-3 bg-muted rounded-md text-muted-foreground flex items-center gap-2">
                        <Info className="w-3 h-3" /> Nenhum procedimento Word encontrado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Planilhas e Registros Digitais */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <FileSignature className="w-4 h-4" /> Registros e Planilhas
                  </h3>
                  <div className="space-y-2">
                    {/* Link para o Módulo Integrado */}
                    {selectedPop.moduloAtivo && (
                      <Button 
                        className="w-full justify-start text-left h-auto py-3 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => navigate(selectedPop.moduloAtivo!)}
                      >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Ir para o Módulo do Sistema</span>
                          <span className="text-[11px] opacity-80 font-normal">Preenchimento automatizado via formulários</span>
                        </div>
                      </Button>
                    )}

                    {/* Novo Registro Digital Customizado */}
                    <Button 
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                      onClick={() => navigate(`/feedbpf-custom/registros/novo?modelo=${selectedPop.codigo}`)}
                    >
                      <FileBadge className="w-4 h-4 mr-3 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-emerald-800">Novo Registro Digital Customizado</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Preencher formulário digital personalizado</span>
                      </div>
                    </Button>

                    {/* Planilhas Excel Originais */}
                    {MODELOS_ASSETS[selectedPop.codigo]?.filter(m => m.label.toLowerCase().includes("planilha")).map((doc, idx) => (
                      <Button 
                        key={idx} 
                        variant="ghost" 
                        className="w-full justify-start text-left h-auto py-2 hover:bg-primary/5"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="w-3.5 h-3.5 mr-3 text-primary" />
                        <span className="text-xs">{doc.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instruções de Trabalho (ITs) Relacionadas */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider mb-4">
                  <BookOpen className="w-4 h-4" /> Instruções de Trabalho (ITs) Vinculadas
                </h3>
                {relatedIts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relatedIts.map((it) => (
                      <Card key={it.id} className="bg-muted/30 border-none shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-[10px] font-mono h-5">
                              {it.id}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{it.frequencia}</span>
                          </div>
                          <h4 className="text-sm font-bold mb-1">{it.titulo}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{it.objetivo}</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-primary text-xs"
                            onClick={() => navigate(`/execucao-pops`)}
                          >
                            Ver detalhes e registrar execução →
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma Instrução de Trabalho mapeada para este POP ainda.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
