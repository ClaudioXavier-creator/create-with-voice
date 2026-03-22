import { useState } from "react";
import {
  HelpCircle, ChevronDown, ChevronRight, BookOpen, FileText, Droplets, Users,
  ShieldCheck, Wrench, Bug, Recycle, Search, Beaker, ClipboardCheck, FileDown,
  Printer, Upload, FolderArchive, Pen
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

interface GuiaSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  content: React.ReactNode;
}

function AccordionCard({ section, isOpen, onToggle }: { section: GuiaSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;
  return (
    <Card className="border border-border transition-shadow hover:shadow-md">
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="flex flex-row items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              {section.badge && <Badge variant="secondary" className="text-xs">{section.badge}</Badge>}
            </div>
          </div>
          {isOpen ? <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
        </CardHeader>
      </button>
      <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0")}>
        <CardContent className="pt-0 space-y-4">{section.content}</CardContent>
      </div>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">{n}</span>
      <p className="text-sm text-foreground/80">{children}</p>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex gap-2 items-start">
      <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function PopFieldsTable({ fields }: { fields: { campo: string; orientacao: string }[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%]">Campo / Área</TableHead>
          <TableHead>Orientação de Preenchimento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((f, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium text-sm">{f.campo}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{f.orientacao}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const sections: GuiaSection[] = [
  {
    id: "fluxo-geral",
    title: "Fluxo Geral: Preenchimento → Verificação → Arquivamento",
    icon: FileText,
    badge: "Início",
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo 1 — Criar Planilha Mensal</h4>
          <div className="space-y-2">
            <Step n={1}>Acesse o módulo <b>Planilhas POP</b> no menu lateral.</Step>
            <Step n={2}>Clique em <b>Nova Planilha</b>.</Step>
            <Step n={3}>Selecione o POP, a periodicidade, mês e ano.</Step>
            <Step n={4}>O sistema gera automaticamente a planilha com as áreas e períodos configurados.</Step>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo 2 — Preencher Registros (Digital)</h4>
          <div className="space-y-2">
            <Step n={1}>Clique em <b>Adicionar Registro</b> na planilha.</Step>
            <Step n={2}>Selecione a área e o período (dia, semana, quinzena ou mês).</Step>
            <Step n={3}>Marque como <b>Conforme (C)</b> ou <b>Não Conforme (NC)</b>.</Step>
            <Step n={4}>Informe o responsável pela execução e a função.</Step>
            <Step n={5}>Adicione observações quando houver NC ou situação relevante.</Step>
            <Step n={6}>Clique em <b>Salvar</b>.</Step>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo 2A — Preencher Registros (Físico/Impresso)</h4>
          <div className="space-y-2">
            <Step n={1}>Imprima a planilha mensal a partir do sistema (botão Imprimir/Exportar).</Step>
            <Step n={2}>Preencha manualmente no chão de fábrica, em letra legível.</Step>
            <Step n={3}>Use caneta azul ou preta. <b>Não use lápis.</b></Step>
            <Step n={4}>Em caso de erro, risque com um traço único, rubrique e escreva o valor correto ao lado.</Step>
            <Step n={5}><b>Não use corretivo</b> (liquid paper) em hipótese alguma.</Step>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo 3 — Assinaturas</h4>
          <div className="space-y-2">
            <Step n={1}>O <b>executor</b> assina ao final de cada turno ou período.</Step>
            <Step n={2}>O <b>supervisor</b> verifica e assina a planilha ao final do período.</Step>
            <Step n={3}>O <b>Responsável Técnico (RT)</b> assina com número do CRMV ao final do mês.</Step>
            <Step n={4}>No sistema digital: preencha os campos de assinatura com nome completo e data.</Step>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo 4 — Verificação e Validação</h4>
          <div className="space-y-2">
            <Step n={1}>O verificador confere todos os registros e assinaturas.</Step>
            <Step n={2}>Identifica eventuais lacunas ou inconsistências.</Step>
            <Step n={3}>Atualiza o status da planilha para <b>Verificada</b>.</Step>
            <Step n={4}>Registra nome do verificador e data da verificação.</Step>
          </div>
        </div>
        <Tip>Formas de registro aceitas: <b>Digital</b> (direto no sistema), <b>Físico</b> (impresso + digitalizado), ou <b>Híbrido</b> (digital + assinatura física).</Tip>
      </div>
    ),
  },
  {
    id: "pop01",
    title: "POP 01 — Qualificação de Fornecedores e Controle de MP",
    icon: Users,
    badge: "Diário",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Registrar cada recebimento de matéria-prima, verificando laudos, condições e fornecedor.</p>
        <PopFieldsTable fields={[
          { campo: "Matéria-prima recebida", orientacao: "Nome completo da MP conforme cadastro" },
          { campo: "Laudo/Certificado", orientacao: "Marcar C se o certificado de análise acompanha o lote; NC se ausente" },
          { campo: "Inspeção visual", orientacao: "Marcar C se aparência, odor e embalagem dentro do padrão" },
          { campo: "Temperatura/Umidade", orientacao: "Registrar valores medidos; marcar C se dentro dos limites" },
        ]} />
        <Tip>Vincule o registro ao fornecedor e lote no módulo de Recebimento para rastreabilidade completa.</Tip>
      </div>
    ),
  },
  {
    id: "pop02",
    title: "POP 02 — Limpeza e Higienização das Instalações",
    icon: Droplets,
    badge: "Diário / Semanal / Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Documentar todas as ações de limpeza realizadas nas instalações, equipamentos e utensílios conforme cronograma.</p>
        <PopFieldsTable fields={[
          { campo: "Áreas internas (diário)", orientacao: "Verificar e registrar a limpeza de cada área (escritório, vestiários, produção, etc.)" },
          { campo: "Equipamentos (semanal)", orientacao: "Verificar limpeza de misturadores, balanças, silos, paletes" },
          { campo: "Áreas e estruturas (mensal)", orientacao: "Verificar reservatórios, sistemas de ventilação, caixa de gordura" },
          { campo: "Veículos (quinzenal)", orientacao: "Verificar limpeza de caminhões, empilhadeiras, caçambas" },
          { campo: "Validação de limpeza", orientacao: "Registrar resultados de swab, teste de água de enxágue, inspeção visual" },
        ]} />
        <Tip>Nas NCs de limpeza, registre a ação corretiva imediata no campo de observações e abra uma NC no módulo de Não Conformidades.</Tip>
      </div>
    ),
  },
  {
    id: "pop03",
    title: "POP 03 — Higiene e Saúde do Pessoal",
    icon: ClipboardCheck,
    badge: "Diário / Semanal / Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Verificar diariamente as condições de higiene e saúde dos operadores antes de iniciar as atividades.</p>
        <PopFieldsTable fields={[
          { campo: "Higiene pessoal (diário)", orientacao: "Verificar uniforme, EPIs, mãos, adornos, unhas, barba, ferimentos, saúde, perfume, comportamento" },
          { campo: "Instalações sanitárias (semanal)", orientacao: "Verificar vestiários, sanitários, lavatórios, lixeiras, cartazes" },
          { campo: "Saúde e documentação (mensal)", orientacao: "Verificar ASOs, exames periódicos, treinamentos, PCMSO" },
        ]} />
        <Tip>Colaboradores com sintomas de doença devem ser afastados da produção e registrados como NC no dia.</Tip>
      </div>
    ),
  },
  {
    id: "pop04",
    title: "POP 04 — Potabilidade da Água",
    icon: Beaker,
    badge: "Diário / Semanal / Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Monitorar a qualidade da água utilizada no processo e nas instalações, conforme Portaria de Potabilidade e IN 04/2007.</p>
        <PopFieldsTable fields={[
          { campo: "Cloro residual (diário)", orientacao: "Medir e registrar em cada ponto de coleta. Faixa aceitável: 0,2 a 2,0 mg/L" },
          { campo: "pH e turbidez (diário)", orientacao: "Registrar valores. pH aceitável: 6,0 a 9,5. Turbidez: até 5 NTU" },
          { campo: "Reservatórios (semanal)", orientacao: "Verificar tampa, vedação, tubulações, filtros" },
          { campo: "Laudos laboratoriais (mensal)", orientacao: "Enviar amostras, registrar número do laudo, arquivar resultado" },
        ]} />
        <Tip>A higienização do reservatório é semestral — registre o mês de execução na planilha mensal e arquive o certificado da empresa.</Tip>
      </div>
    ),
  },
  {
    id: "pop05",
    title: "POP 05 — Prevenção de Contaminação Cruzada",
    icon: ShieldCheck,
    badge: "Diário / Semanal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Verificar as medidas de controle para evitar a contaminação cruzada entre produtos e matérias-primas.</p>
        <PopFieldsTable fields={[
          { campo: "Sequência de produção (diário)", orientacao: "Verificar se a ordem de produção segue a matriz de sensibilidade" },
          { campo: "Limpeza entre lotes (diário)", orientacao: "Confirmar flushing ou limpeza entre troca de produtos" },
          { campo: "Separação de ingredientes (diário)", orientacao: "Verificar que MPs com e sem medicamentos estão segregadas" },
          { campo: "Armazenamento segregado (semanal)", orientacao: "Verificar identificação e separação nos depósitos" },
        ]} />
        <Tip>Sempre que houver troca de produto com medicamento para sem medicamento, registre a validação de limpeza de linha no módulo específico.</Tip>
      </div>
    ),
  },
  {
    id: "pop06",
    title: "POP 06 — Manutenção e Calibração",
    icon: Wrench,
    badge: "Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Registrar as manutenções preventivas realizadas e o status de calibração dos instrumentos de medição.</p>
        <PopFieldsTable fields={[
          { campo: "Manutenção de equipamentos (mensal)", orientacao: "Registrar execução em misturadores, moegas, silos, transportadores, ensacadeira, costuradeira" },
          { campo: "Calibração de instrumentos (mensal)", orientacao: "Registrar calibração de balanças, termômetros e medidores de umidade" },
        ]} />
        <Tip>Vincule o certificado de calibração ao registro. Instrumentos fora de calibração devem ser retirados de uso imediatamente.</Tip>
      </div>
    ),
  },
  {
    id: "pop07",
    title: "POP 07 — Controle Integrado de Pragas",
    icon: Bug,
    badge: "Semanal / Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Monitorar e registrar as ações de controle de pragas nas instalações.</p>
        <PopFieldsTable fields={[
          { campo: "Armadilhas (semanal)", orientacao: "Inspecionar armadilhas internas e externas, registrar capturas" },
          { campo: "Vedação (semanal)", orientacao: "Verificar portas, janelas e telas anti-inseto" },
          { campo: "Desinsetização/Desratização (mensal)", orientacao: "Registrar aplicação e número do laudo da empresa terceirizada" },
        ]} />
        <Tip>Mantenha o contrato e a licença sanitária da empresa de controle de pragas arquivados no sistema.</Tip>
      </div>
    ),
  },
  {
    id: "pop08",
    title: "POP 08 — Controle de Resíduos e Efluentes",
    icon: Recycle,
    badge: "Diário / Mensal",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Gerenciar a coleta, destinação e documentação de resíduos sólidos e efluentes.</p>
        <PopFieldsTable fields={[
          { campo: "Coleta diária", orientacao: "Registrar a coleta de resíduos orgânicos, recicláveis e varredura/pó" },
          { campo: "Destinação (mensal)", orientacao: "Registrar empresa coletora, manifesto de transporte e destino final" },
          { campo: "Caixas de gordura e efluentes (mensal)", orientacao: "Registrar limpeza e análise de efluentes" },
        ]} />
        <Tip>Guarde os manifestos de transporte de resíduos por no mínimo 5 anos. Digitalize e faça upload no módulo de Controle de Resíduos.</Tip>
      </div>
    ),
  },
  {
    id: "pop09",
    title: "POP 09 — Rastreabilidade e Recolhimento",
    icon: Search,
    badge: "Diário",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Registrar diariamente os dados de rastreabilidade: lotes de produção, matérias-primas utilizadas e destino dos produtos.</p>
        <PopFieldsTable fields={[
          { campo: "Lote de produção", orientacao: "Registrar o lote gerado para cada ordem de produção" },
          { campo: "MP utilizada (lotes)", orientacao: "Listar todos os lotes de matéria-prima consumidos" },
          { campo: "Destino/cliente", orientacao: "Registrar o cliente e local de entrega" },
          { campo: "Nota fiscal", orientacao: "Registrar o número da NF de saída" },
        ]} />
        <Tip>Execute testes de rastreabilidade periódicos (montante e jusante) e registre o tempo. O prazo regulatório é de 4 horas para rastreio completo.</Tip>
      </div>
    ),
  },
  {
    id: "digitalizacao",
    title: "Digitalização e Arquivamento",
    icon: Upload,
    badge: "Processo",
    content: (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold mb-3">Padrão de Nomenclatura de Arquivos</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Exemplo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>Planilha POP</TableCell><TableCell className="font-mono text-xs">POP-XX_AAAA-MM_periodicidade.pdf</TableCell><TableCell className="text-xs">POP-02_2026-03_diario.pdf</TableCell></TableRow>
              <TableRow><TableCell>Laudo laboratorial</TableCell><TableCell className="font-mono text-xs">LAUDO_produto_AAAA-MM-DD.pdf</TableCell><TableCell className="text-xs">LAUDO_racao-corte_2026-03-15.pdf</TableCell></TableRow>
              <TableRow><TableCell>Certificado calibração</TableCell><TableCell className="font-mono text-xs">CALIB_equipamento_AAAA.pdf</TableCell><TableCell className="text-xs">CALIB_balanca-pesagem_2026.pdf</TableCell></TableRow>
              <TableRow><TableCell>Manifesto resíduos</TableCell><TableCell className="font-mono text-xs">MTR_numero_AAAA-MM.pdf</TableCell><TableCell className="text-xs">MTR_12345_2026-03.pdf</TableCell></TableRow>
              <TableRow><TableCell>Relatório auditoria</TableCell><TableCell className="font-mono text-xs">AUD_tipo_AAAA-MM-DD.pdf</TableCell><TableCell className="text-xs">AUD_interna_2026-03-20.pdf</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Requisitos Técnicos</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Resolução mínima: <b>200 DPI</b> (recomendado: 300 DPI para assinaturas)</li>
            <li>• Formato: <b>PDF</b> (preferencialmente PDF/A para longo prazo)</li>
            <li>• Cor: Escala de cinza para planilhas; colorido para laudos com selos</li>
            <li>• Verificar legibilidade de todas as informações após digitalização</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Passo a Passo do Upload</h4>
          <div className="space-y-2">
            <Step n={1}>Acesse o módulo <b>Relatórios</b> no menu lateral.</Step>
            <Step n={2}>Clique em <b>Novo Relatório</b> → tipo <b>Digitalizado</b>.</Step>
            <Step n={3}>Selecione o módulo de origem (ex: Higiene e Sanitização).</Step>
            <Step n={4}>Preencha título seguindo o padrão de nomenclatura.</Step>
            <Step n={5}>Faça o upload do arquivo PDF digitalizado.</Step>
            <Step n={6}>Confirme e salve. O status será <b>Ativo</b>.</Step>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Tempo de Retenção Mínimo</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Documento</TableHead>
                <TableHead>Tempo</TableHead>
                <TableHead>Base Legal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>Planilhas de POP</TableCell><TableCell>5 anos</TableCell><TableCell>IN 04/2007</TableCell></TableRow>
              <TableRow><TableCell>Laudos laboratoriais</TableCell><TableCell>5 anos</TableCell><TableCell>IN 04/2007</TableCell></TableRow>
              <TableRow><TableCell>Certificados de calibração</TableCell><TableCell>5 anos</TableCell><TableCell>IN 15/2009</TableCell></TableRow>
              <TableRow><TableCell>Manifestos de resíduos</TableCell><TableCell>5 anos</TableCell><TableCell>Decreto 12.031/2024</TableCell></TableRow>
              <TableRow><TableCell>Registros de recall</TableCell><TableCell><b>Permanente</b></TableCell><TableCell>Decreto 12.031/2024</TableCell></TableRow>
            </TableBody>
          </Table>
        </div>
        <Tip>Digitalize e faça upload de todas as planilhas físicas <b>até o 5º dia útil do mês seguinte</b>.</Tip>
      </div>
    ),
  },
  {
    id: "relatorios",
    title: "Relatórios Consolidados",
    icon: FileDown,
    badge: "Gestão",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">O sistema gera relatórios consolidados a partir dos dados preenchidos nas planilhas. Essenciais para auditorias.</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Relatório</TableHead>
              <TableHead>Fonte de Dados</TableHead>
              <TableHead>Frequência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>Conformidade BPF</TableCell><TableCell>Auditorias e checklists</TableCell><TableCell>Mensal</TableCell></TableRow>
            <TableRow><TableCell>NCs e Plano de Ação</TableCell><TableCell>Não Conformidades</TableCell><TableCell>Mensal</TableCell></TableRow>
            <TableRow><TableCell>Treinamentos</TableCell><TableCell>Treinamentos</TableCell><TableCell>Trimestral</TableCell></TableRow>
            <TableRow><TableCell>Calibrações/Manutenções</TableCell><TableCell>Manutenção Preventiva</TableCell><TableCell>Mensal</TableCell></TableRow>
            <TableRow><TableCell>Rastreabilidade (teste)</TableCell><TableCell>Rastreabilidade</TableCell><TableCell>Semestral</TableCell></TableRow>
            <TableRow><TableCell>Reclamações</TableCell><TableCell>Qualidade Total</TableCell><TableCell>Mensal</TableCell></TableRow>
            <TableRow><TableCell>Produção Consolidada</TableCell><TableCell>PCP / Produção</TableCell><TableCell>Mensal</TableCell></TableRow>
            <TableRow><TableCell>Controle de Resíduos</TableCell><TableCell>Resíduos</TableCell><TableCell>Mensal</TableCell></TableRow>
          </TableBody>
        </Table>
        <div>
          <h4 className="text-sm font-semibold mb-3">Como Gerar</h4>
          <div className="space-y-2">
            <Step n={1}>Acesse o módulo <b>Relatórios</b>.</Step>
            <Step n={2}>Clique em <b>Novo Relatório</b> → tipo <b>Digital</b>.</Step>
            <Step n={3}>Selecione o módulo e o período desejado.</Step>
            <Step n={4}>Preencha título e descrição.</Step>
            <Step n={5}>Clique em <b>Gerar</b>. O sistema consolida os dados automaticamente.</Step>
          </div>
        </div>
        <Tip>Para auditorias, acesse a <b>Sala do Auditor</b> onde todos os relatórios ficam organizados por módulo.</Tip>
      </div>
    ),
  },
  {
    id: "boas-praticas",
    title: "Orientações Finais e Boas Práticas",
    icon: Pen,
    badge: "Importante",
    content: (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Preenchimento</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Preencha as planilhas <b>no momento da execução</b>, nunca depois.</li>
            <li>• Nunca deixe campos em branco — use "N/A" quando não aplicável.</li>
            <li>• Em caso de NC, descreva a situação e a ação imediata no campo de observações.</li>
            <li>• Planilhas físicas: caneta azul ou preta. Nunca lápis ou corretivo.</li>
            <li>• Erros: risque com traço único, rubrique e escreva o valor correto ao lado.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Assinaturas</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Executor: assina ao final de cada turno.</li>
            <li>• Supervisor: verifica e co-assina ao final do período.</li>
            <li>• RT: assina mensalmente com nome completo e CRMV.</li>
            <li>• Assinaturas digitais têm validade equivalente às físicas para auditoria interna.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Arquivamento e Backup</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Upload das planilhas físicas até o <b>5º dia útil</b> do mês seguinte.</li>
            <li>• Backup automático de todos os registros digitais pelo sistema.</li>
            <li>• Retenção mínima: <b>5 anos</b>. Registros de recall: <b>permanente</b>.</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-2">Auditoria e Fiscalização</h4>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>• Antes da auditoria: todas as planilhas com status <b>Verificada</b>.</li>
            <li>• Use a <b>Sala do Auditor</b> para organizar documentação ao fiscal.</li>
            <li>• O painel de <b>Indicadores</b> oferece visão consolidada do desempenho.</li>
          </ul>
        </div>
      </div>
    ),
  },
];

export default function GuiaPops() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    sections.forEach((s) => (all[s.id] = true));
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections({});

  return (
    <>
      <PageHeader
        icon={HelpCircle}
        title="Guia de Preenchimento dos POPs"
        description="Passo a passo para preenchimento, digitalização e arquivamento de planilhas e relatórios — IN 04/2007 · IN 15/2009 · Decreto 12.031/2024"
      />

      <div className="flex gap-2 mb-6">
        <button onClick={expandAll} className="text-sm text-primary hover:underline font-medium">Expandir tudo</button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-sm text-primary hover:underline font-medium">Recolher tudo</button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <AccordionCard
            key={section.id}
            section={section}
            isOpen={openSections[section.id] ?? false}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </>
  );
}
