import { useState } from "react";
import {
  BookOpen, LayoutDashboard, Building2, FileText, ClipboardCheck, AlertTriangle,
  Package, Factory, Search, Bug, GraduationCap, BarChart3, PlayCircle, FileDown,
  Scale, Users, Settings, ChevronDown, ChevronRight, HelpCircle, Droplets,
  Wrench, FlaskConical, ShieldCheck, Beaker, CalendarRange, Tag, FileSpreadsheet,
  Recycle, Pill, Star, UserCheck, Microscope, Activity, FileCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MANUAL_BPF_SECTIONS } from "@/config/manualBpfContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  features: { title: string; text: string }[];
  tips?: string[];
}

const sections: ManualSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    description:
      "Tela inicial do sistema com visão geral de todos os indicadores de BPF. Apresenta cards com métricas em tempo real e gráficos de evolução.",
    features: [
      { title: "Cards de Indicadores", text: "Exibe a conformidade BPF geral (%), total de NCs abertas, auditorias realizadas e treinamentos pendentes (vencidos ou a vencer em 30 dias)." },
      { title: "Conformidade por Área", text: "Barras de progresso mostrando o percentual de conformidade de cada área avaliada nas auditorias." },
      { title: "NCs Recentes", text: "Lista as 5 não conformidades mais recentes com setor, descrição e status." },
      { title: "Gráfico de NCs", text: "Gráfico de barras mostrando a evolução de NCs abertas vs. fechadas nos últimos 6 meses." },
      { title: "Gráfico de Conformidade", text: "Gráfico de linha mostrando a evolução do percentual de conformidade BPF ao longo do tempo." },
    ],
    tips: ["Os dados são atualizados em tempo real a cada acesso à tela."],
  },
  {
    id: "cadastro",
    title: "Cadastro da Empresa",
    icon: Building2,
    description:
      "Módulo para cadastrar e editar os dados da empresa: razão social, CNPJ, endereço, responsável técnico, CRMV, tipos de produção e capacidade instalada.",
    features: [
      { title: "Dados da Empresa", text: "Formulário para inserir nome, CNPJ, endereço completo, responsável técnico e número do CRMV." },
      { title: "Tipos de Produção", text: "Seleção múltipla dos tipos de produção (ração, suplemento, premix, sal mineral, etc.)." },
      { title: "Capacidade Instalada", text: "Informe a capacidade produtiva mensal da fábrica." },
    ],
  },
  {
    id: "produtos",
    title: "Produtos",
    icon: Tag,
    badge: "Cadastro",
    description:
      "Cadastro completo de produtos acabados com dados regulatórios (MAPA), ficha técnica e editor de rótulos conforme IN 30/2009.",
    features: [
      { title: "Cadastro de Produto", text: "Registre nome, classificação (ração, suplemento, premix, etc.), espécie alvo, forma física, registro MAPA e composição." },
      { title: "Níveis de Garantia", text: "Informe os níveis de garantia do produto (umidade, PB, EE, FB, minerais, vitaminas, etc.) com valores mínimos e máximos." },
      { title: "Ficha Técnica", text: "Gere a ficha técnica consolidada em layout A4 com todos os dados regulatórios e comerciais, incluindo foto, diferenciais e modo de preparo." },
      { title: "Editor de Rótulos", text: "Crie e edite rótulos conforme legislação MAPA com todos os campos obrigatórios: composição, níveis de garantia, indicações de uso, precauções, dados da empresa e RT." },
    ],
    tips: ["A ficha técnica integra-se ao módulo PCP para reaproveitar dados de fórmulas.", "O rótulo pode ser configurado em dimensões customizáveis (mm)."],
  },
  {
    id: "documentos",
    title: "Documentos / POPs",
    icon: FileText,
    badge: "Qualidade",
    description:
      "Gerenciamento de todos os Procedimentos Operacionais Padrão (POPs) e documentos do sistema de qualidade. Controle de versão, status e responsáveis.",
    features: [
      { title: "Cadastro de POPs", text: "Registre código, nome, versão, data de revisão e responsável de cada POP." },
      { title: "Status do Documento", text: "Controle se o documento está Ativo, Em Revisão ou Obsoleto." },
      { title: "Versionamento", text: "Histórico de versões para rastreabilidade de alterações." },
      { title: "Arquivos BPF", text: "Upload e gestão de arquivos digitalizados vinculados aos documentos do sistema." },
    ],
    tips: ["Mantenha todos os POPs atualizados antes de uma auditoria oficial."],
  },
  {
    id: "planilhas-pop",
    title: "Planilhas de POP",
    icon: FileSpreadsheet,
    badge: "Qualidade",
    description:
      "Registro mensal das planilhas de controle vinculadas a cada POP, com campos de assinatura do executor, supervisor e RT.",
    features: [
      { title: "Planilha Mensal", text: "Crie planilhas mensais para cada POP com código, periodicidade e status (Aberta, Preenchida, Verificada)." },
      { title: "Itens de Registro", text: "Adicione registros por período (turno/dia) com área, responsável, conformidade e observações." },
      { title: "Assinaturas Digitais", text: "Campos para assinatura do executor, supervisor e RT (com CRMV), com data de assinatura." },
      { title: "Verificação", text: "Registre quem verificou a planilha e quando, para auditoria e rastreabilidade." },
    ],
  },
  {
    id: "execucao-pops",
    title: "Execução de ITs / POPs",
    icon: PlayCircle,
    badge: "Qualidade",
    description:
      "Registro da execução prática das Instruções de Trabalho e POPs no chão de fábrica.",
    features: [
      { title: "Registro de Execução", text: "Informe o POP executado, data, executor, setor e status (Pendente, Em execução, Concluído, Não conforme)." },
      { title: "Vinculação com Documentos", text: "Cada execução pode ser vinculada ao POP cadastrado no módulo de Documentos." },
      { title: "Referência de Auditoria", text: "Vincule a execução a um checklist de auditoria para rastreabilidade cruzada." },
      { title: "Observações", text: "Campo livre para anotações sobre desvios, condições especiais ou melhorias identificadas." },
    ],
  },
  {
    id: "auditoria",
    title: "Auditoria BPF",
    icon: ClipboardCheck,
    badge: "Qualidade",
    description:
      "Checklist de auditoria interna baseado no Decreto 12.031/2024 (MAPA). Avalie cada item e gere relatórios de conformidade.",
    features: [
      { title: "Checklist por Área", text: "Itens organizados por áreas: Higiene, Instalações, Equipamentos, Controle de Qualidade, etc." },
      { title: "Avaliação Individual", text: "Marque cada item como conforme ou não conforme, com campo para observações." },
      { title: "Cálculo Automático", text: "O sistema calcula automaticamente o percentual de conformidade por área e geral." },
    ],
    tips: ["Realize auditorias periódicas (recomendado: mensal ou trimestral)."],
  },
  {
    id: "nao-conformidades",
    title: "Não Conformidades",
    icon: AlertTriangle,
    badge: "Qualidade",
    description:
      "Registro e acompanhamento de todas as não conformidades identificadas, com sugestão de plano de ação por IA.",
    features: [
      { title: "Registro de NC", text: "Informe data, setor, descrição detalhada, causa raiz e ação corretiva planejada." },
      { title: "Plano de Ação", text: "Defina responsável e prazo para cada ação corretiva. O sistema alerta sobre prazos vencidos." },
      { title: "Status de Acompanhamento", text: "Acompanhe o ciclo: Aberta → Em andamento → Fechada." },
      { title: "IA para Plano de Ação", text: "Utilize inteligência artificial para sugerir causas e ações corretivas automaticamente." },
    ],
  },
  {
    id: "qualidade-total",
    title: "Qualidade Total / Reclamações",
    icon: Star,
    badge: "Qualidade",
    description:
      "Gestão completa de reclamações de clientes e recolhimento de produtos, incluindo análise técnica e plano de ação corretiva/preventiva.",
    features: [
      { title: "Registro de Reclamações", text: "Cadastre reclamações com número, cliente, produto, lote, tipo (qualidade, corpo estranho, embalagem, etc.) e descrição detalhada." },
      { title: "Análise Técnica", text: "Registre causa raiz, análise técnica, ações imediatas, corretivas e preventivas com responsáveis e prazos." },
      { title: "Gestão de Recolhimento", text: "Para casos graves, ative o recolhimento de produto com rastreio de lotes afetados, quantidades e destino do produto recolhido." },
      { title: "Satisfação do Cliente", text: "Registre a resposta ao cliente e o nível de satisfação após a resolução." },
    ],
    tips: ["Vincule reclamações aos POPs de referência para análise sistêmica."],
  },
  {
    id: "higiene-sanitizacao",
    title: "Higiene e Sanitização (POP 02/03/04)",
    icon: Droplets,
    badge: "POPs",
    description:
      "Módulo integrado para POP 02 (Higiene dos Operadores), POP 03 (Higienização das Instalações/Equipamentos) e POP 04 (Potabilidade da Água), conforme IN 04/2007.",
    features: [
      { title: "Checklist Pré-Operacional", text: "7 áreas de verificação (pisos, silos, moegas, misturadores, etc.) com registro digital de conformidade antes de cada turno." },
      { title: "Cronograma de Higienização", text: "Programe limpezas por área, frequência, produto utilizado, concentração e responsável." },
      { title: "Registros de Limpeza", text: "Registre cada execução de limpeza com executor, horários, conformidade e observações." },
      { title: "Potabilidade da Água (POP 04)", text: "Controle de cloro residual, pH, turbidez e laudos laboratoriais dos pontos de coleta. Registro de higienização de reservatórios." },
    ],
    tips: ["Mantenha os registros de limpeza pré-operacional sempre em dia para auditorias do MAPA."],
  },
  {
    id: "manutencao-preventiva",
    title: "Manutenção Preventiva (POP 06)",
    icon: Wrench,
    badge: "POPs",
    description:
      "Plano de manutenção preventiva de máquinas e equipamentos conforme IN 15/2009, para evitar contaminação cruzada por falha de equipamento.",
    features: [
      { title: "Cadastro de Equipamentos", text: "Registre equipamentos com código, descrição, localização e tipo de manutenção (preventiva, corretiva, preditiva)." },
      { title: "Programação de Manutenções", text: "Agende manutenções com datas programadas, responsáveis e controle de execução." },
      { title: "Registro de Execução", text: "Documente peças trocadas, custos, tempo de parada e próxima manutenção." },
      { title: "Calibrações", text: "Controle de calibração de instrumentos com certificados, datas e verificações intermediárias." },
    ],
    tips: ["Vincule manutenções aos cronogramas de limpeza para evitar gaps de produção."],
  },
  {
    id: "validacao-limpeza",
    title: "Validação de Limpeza de Linha (Carryover)",
    icon: ShieldCheck,
    badge: "POPs",
    description:
      "Validação da limpeza de linha entre batidas de diferentes produtos para prevenção de contaminação cruzada, conforme IN 04/2007.",
    features: [
      { title: "Registro de Validação", text: "Registre produto anterior, produto seguinte, linha de produção, tipo de validação (flushing, swab, visual) e resultado." },
      { title: "Análise de Resíduos", text: "Informe método de análise, resíduo detectado, limite aceitável e se o produto contém medicamento." },
      { title: "Matriz de Sensibilidade", text: "Configure a matriz indicando quais transições entre produtos requerem flushing obrigatório." },
      { title: "Controle de Medicamentos", text: "Alerta automático quando a transição envolve produto com medicamento veterinário." },
    ],
    tips: ["Sempre valide a limpeza ao trocar de produto com medicamento para produto sem medicamento."],
  },
  {
    id: "controle-residuos",
    title: "Controle de Resíduos (POP 05)",
    icon: Recycle,
    badge: "POPs",
    description:
      "Gestão de resíduos e subprodutos conforme Decreto 12.031/2024, garantindo o destino adequado de varreduras e produtos condenados.",
    features: [
      { title: "Classificação de Resíduos", text: "Classifique resíduos como Classe I (perigosos) ou Classe II (não perigosos) e controle o destino final." },
      { title: "Descarte de Produtos", text: "Registre produtos descartados com lote, motivo (vencido, contaminado, avariado) e quantidade." },
      { title: "Efluentes e Emissões", text: "Monitore parâmetros de efluentes (DBO, pH, etc.) e controle licenças ambientais." },
      { title: "Manifesto de Transporte", text: "Registre manifestos de transporte de resíduos com empresa coletora, frequência e licenças." },
    ],
  },
  {
    id: "controle-substancias",
    title: "Controle de Substâncias Indesejáveis",
    icon: Pill,
    badge: "Controles",
    description:
      "Monitoramento de substâncias indesejáveis, contaminantes e aditivos em matérias-primas conforme limites da legislação vigente.",
    features: [
      { title: "Tipos de Controle", text: "Gerencie micotoxinas (aflatoxinas, DON, fumonisinas), metais pesados (chumbo, mercúrio, cádmio) e aditivos." },
      { title: "Limites de Referência", text: "Compare resultados analíticos com os limites máximos normativos e classifique como conforme ou não conforme." },
      { title: "Vinculação com Fornecedor", text: "Relacione cada análise ao fornecedor e lote da matéria-prima para rastreabilidade." },
    ],
  },
  {
    id: "analises-laboratorio",
    title: "Análises de Laboratório",
    icon: Microscope,
    badge: "Controles",
    description:
      "Gestão de análises laboratoriais de matérias-primas e produtos acabados, com controle de laudos e conformidade.",
    features: [
      { title: "Registro de Análises", text: "Cadastre análises com tipo (físico-química, microbiológica, bromatológica), produto, lote e laboratório." },
      { title: "Resultados e Laudos", text: "Registre resultados, método de análise, limites de referência e número do laudo." },
      { title: "Conformidade", text: "Classifique automaticamente como conforme ou não conforme baseado nos limites cadastrados." },
      { title: "Upload de Laudos", text: "Faça upload dos laudos em PDF para arquivo digital vinculado à análise." },
    ],
  },
  {
    id: "recebimento",
    title: "Recebimento de Matéria-Prima",
    icon: Package,
    badge: "Operacional",
    description:
      "Controle de recebimento e inspeção de matérias-primas com certificado de análise e avaliação sensorial.",
    features: [
      { title: "Registro de Recebimento", text: "Informe data, fornecedor, matéria-prima, lote, quantidade e validade." },
      { title: "Inspeção Visual", text: "Avalie odor (normal/anormal), umidade, temperatura e presença de insetos." },
      { title: "Certificado de Análise", text: "Registre o número do certificado de análise e se é válido/inválido." },
      { title: "Aprovação/Rejeição", text: "Marque se o lote foi aprovado ou rejeitado. Lotes rejeitados podem gerar NCs." },
    ],
  },
  {
    id: "fornecedores",
    title: "Qualificação de Fornecedores",
    icon: Users,
    badge: "Operacional",
    description:
      "Cadastro e avaliação de fornecedores com verificação SIPEAGRO e controle de qualificação.",
    features: [
      { title: "Cadastro Completo", text: "Nome, CNPJ, endereço, contato, e-mail e tipo de produto fornecido." },
      { title: "Avaliação e Nota", text: "Atribua notas de 0 a 10 e defina o status de qualificação (Aprovado, Aprovado c/ Restrições, Pendente, Reprovado)." },
      { title: "Verificação SIPEAGRO", text: "Registre o número de registro SIPEAGRO e a data de verificação para compliance com o MAPA." },
      { title: "Controle de Validade", text: "Registre a última e próxima avaliação programada." },
      { title: "Lista de Fornecedores Aprovados", text: "Tabela consolidada (PL POP 1.1) exibindo todos os fornecedores com status Aprovado ou Aprovado c/ Restrições, com indicação visual de cada resultado." },
      { title: "Exportação Excel e PDF", text: "Exporte o questionário de qualificação (em branco ou preenchido) e a lista de fornecedores aprovados nos formatos Excel (.xlsx) e PDF para impressão." },
    ],
  },
  {
    id: "producao",
    title: "Produção",
    icon: Factory,
    badge: "Operacional",
    description:
      "Registro simplificado de produção diária. Informe produto, lote, operador, tempo de mistura e quantidade produzida.",
    features: [
      { title: "Registro Diário", text: "Cadastre cada produção com data, produto, lote, operador e quantidade." },
      { title: "Tempo de Mistura", text: "Registre o tempo de mistura para controle de qualidade e rastreabilidade." },
    ],
  },
  {
    id: "pcp",
    title: "PCP / Ordens de Produção",
    icon: Settings,
    badge: "Operacional",
    description:
      "Planejamento e Controle de Produção com ordens detalhadas, fórmulas, batidas, retrabalho e controle de sobras.",
    features: [
      { title: "Ordens de Produção", text: "Crie ordens com número, produto, fórmula, quantidade, lote e prioridade. Suporte a ordens de retrabalho com vínculo à ordem original." },
      { title: "Fórmulas / Itens", text: "Cadastre os itens da fórmula com matéria-prima, quantidade, unidade, percentual e lote do fornecedor." },
      { title: "Batidas de Produção", text: "Registre cada batida com operador, horários, temperatura, tempo de mistura e observações." },
      { title: "Gestão de Sobras", text: "Controle quantidade de sobra de cada ordem e defina o destino (reprocesso, descarte, etc.)." },
      { title: "Status da Ordem", text: "Acompanhe: Programada → Em produção → Concluída → Cancelada." },
    ],
    tips: ["Vincule os lotes de MP recebidos às fórmulas para rastreabilidade completa."],
  },
  {
    id: "rastreabilidade",
    title: "Rastreabilidade",
    icon: Search,
    badge: "Operacional",
    description:
      "Rastreabilidade bidirecional: do produto final até a matéria-prima e do lote vendido até o cliente. Inclui gestão de recall e testes de rastreabilidade.",
    features: [
      { title: "Vínculo Produto ↔ MP", text: "Relacione cada produto final com suas matérias-primas, lotes e fornecedores." },
      { title: "Origem Animal", text: "Identifique matérias-primas de origem animal com tipo específico para compliance regulatório." },
      { title: "Rastreio de Vendas", text: "Registre cliente, espécie destino, local de entrega, nota fiscal e quantidade vendida." },
      { title: "Gestão de Recall", text: "Ative recall em um lote, informe motivo e acompanhe o status." },
      { title: "Testes de Rastreabilidade", text: "Execute testes montante/jusante para verificar a capacidade de rastreio dentro do prazo regulatório (ex: 4 horas)." },
    ],
    tips: ["Em caso de recall, o sistema identifica rapidamente todos os clientes que receberam o lote afetado."],
  },
  {
    id: "matriz-risco",
    title: "Matriz de Risco / APPCC",
    icon: Activity,
    badge: "Controles",
    description:
      "Análise de perigos e pontos críticos de controle (APPCC) com classificação de risco por probabilidade × severidade.",
    features: [
      { title: "Identificação de Perigos", text: "Cadastre perigos por etapa do processo, classificados como físico, químico ou biológico." },
      { title: "Classificação de Risco", text: "Avalie probabilidade e severidade para calcular automaticamente o nível de risco (Baixo, Médio, Alto, Crítico)." },
      { title: "Medidas de Controle", text: "Registre as medidas de controle para cada perigo identificado." },
    ],
  },
  {
    id: "categorizacao-risco",
    title: "Categorização de Risco — Tutorial",
    icon: ShieldCheck,
    badge: "Legislação",
    description:
      "Tutorial completo sobre como categorizar o risco do estabelecimento conforme o Decreto 12.031/2024 e IN 17/2017 do MAPA. Inclui critérios, método de cálculo e ações por nível de risco.",
    features: [
      { title: "Critérios de Avaliação", text: "O risco é determinado por: tipo de produto fabricado (medicamentoso = alto), espécies atendidas (multiespécie eleva risco por contaminação cruzada), volume de produção, histórico de conformidade e uso de substâncias controladas (ureia, ionóforos, antibióticos)." },
      { title: "Método de Pontuação", text: "Responder questionário com SIM (100% do peso), PARCIAL (50%), NÃO (0%) ou N/A (excluído). Calcular: % Conformidade = (Σ Pontos Obtidos / Σ Pontuação Máxima) × 100." },
      { title: "Classificação de Risco", text: "≥80% = Risco BAIXO (verde) — fiscalização reduzida. 50-79% = Risco MÉDIO (amarelo) — plano de ação em 90 dias. <50% = Risco ALTO (vermelho) — ação imediata, risco de interdição." },
      { title: "10 Categorias Avaliadas", text: "Infraestrutura, Higiene, Controle de MP, Processo Produtivo, Pragas, Treinamento, Rastreabilidade, Equipamentos, Documentação e PAC — alinhadas aos 10 POPs do sistema." },
      { title: "Periodicidade", text: "Avaliação semestral como rotina do PAC, após mudanças no processo, após NC crítica/recall, ou quando solicitado pelo SIF/MAPA." },
      { title: "Questionário Digital", text: "Acesse o módulo Matriz de Risco > aba 'Questionário de Risco' para realizar a avaliação automatizada com cálculo em tempo real e resultado por categoria." },
    ],
    tips: [
      "O Decreto 12.031/2024 alterou a classificação de estabelecimentos — atualize sua avaliação.",
      "Fábricas que produzem para equinos + aves devem ter atenção especial à contaminação cruzada por ionóforos.",
      "Mantenha o histórico de avaliações para demonstrar evolução ao fiscal do MAPA.",
      "Utilize o resultado da categorização para definir a frequência de auditorias internas no Planejamento Anual.",
    ],
  },
  {
    id: "pragas",
    title: "Controle de Pragas",
    icon: Bug,
    badge: "Controles",
    description:
      "Registro de monitoramento e ações de controle de pragas nas instalações da fábrica.",
    features: [
      { title: "Registro de Ocorrências", text: "Informe data, local, tipo de praga identificada e ação tomada." },
      { title: "Responsável", text: "Registre o responsável pela ação (equipe interna ou empresa terceirizada)." },
    ],
  },
  {
    id: "treinamentos",
    title: "Treinamentos",
    icon: GraduationCap,
    badge: "Controles",
    description:
      "Controle de treinamentos dos funcionários com data de realização, instrutor e validade.",
    features: [
      { title: "Cadastro de Treinamento", text: "Registre funcionário, nome do treinamento, data, instrutor e validade." },
      { title: "Alertas de Vencimento", text: "O sistema identifica treinamentos vencidos ou a vencer nos próximos 30 dias e exibe no Dashboard." },
    ],
    tips: ["Mantenha todos os treinamentos de BPF dentro da validade para estar em conformidade com a legislação."],
  },
  {
    id: "planejamento-anual",
    title: "Planejamento Anual",
    icon: CalendarRange,
    badge: "Gestão",
    description:
      "Cronograma anual de atividades do sistema de qualidade com controle de execução e frequência.",
    features: [
      { title: "Atividades Programadas", text: "Cadastre atividades por categoria (auditoria, treinamento, calibração, manutenção, etc.) com frequência e mês de início." },
      { title: "Controle de Execução", text: "Registre última execução, próxima execução prevista e status (Programada, Em andamento, Concluída, Atrasada)." },
      { title: "Quantidade Prevista", text: "Defina a quantidade de execuções previstas no ano para cada atividade." },
    ],
  },
  {
    id: "indicadores",
    title: "Indicadores",
    icon: BarChart3,
    badge: "Gestão",
    description:
      "Painel de indicadores de desempenho do sistema de qualidade com gráficos e métricas consolidadas.",
    features: [
      { title: "KPIs de Qualidade", text: "Visualize indicadores como taxa de conformidade, NCs por período, treinamentos realizados, etc." },
      { title: "Tendências", text: "Acompanhe a evolução dos indicadores ao longo do tempo com gráficos interativos." },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileDown,
    badge: "Gestão",
    description:
      "Geração e armazenamento de relatórios digitais e digitalizados, organizados por módulo.",
    features: [
      { title: "Relatórios Digitais", text: "Gere relatórios diretamente no sistema com dados consolidados de cada módulo." },
      { title: "Relatórios Digitalizados", text: "Faça upload de relatórios escaneados (laudos, certificados, etc.) e vincule ao módulo correspondente." },
      { title: "Relatório de Produção", text: "Visualize dados consolidados de produção com filtros por período e exportação." },
      { title: "Status", text: "Organize relatórios como Ativos ou Arquivados." },
    ],
  },
  {
    id: "sala-auditor",
    title: "Sala do Auditor",
    icon: UserCheck,
    badge: "Gestão",
    description:
      "Espaço dedicado para auditores externos acessarem documentação e evidências de conformidade de forma organizada.",
    features: [
      { title: "Visão Consolidada", text: "Acesso rápido a todos os documentos, registros e evidências necessários para auditoria." },
      { title: "Organização por Módulo", text: "Documentação organizada por área (POPs, auditorias, treinamentos, calibrações, etc.)." },
    ],
  },
  {
    id: "legislacao",
    title: "Legislação & IA",
    icon: Scale,
    badge: "Gestão",
    description:
      "Acompanhe atualizações da legislação de alimentação animal (MAPA) com alertas por IA, consulta inteligente e pesquisa SISLEGIS.",
    features: [
      { title: "Alertas de Legislação", text: "Receba alertas sobre novas normas, atualizações e revogações relevantes para sua produção." },
      { title: "Classificação por Relevância", text: "Cada alerta é classificado como Alta, Média ou Baixa relevância automaticamente." },
      { title: "Resumo por IA", text: "A IA gera um resumo claro de cada publicação, facilitando o entendimento rápido." },
      { title: "Consulta à IA", text: "Faça perguntas sobre legislação diretamente ao assistente de IA integrado." },
      { title: "Pesquisa SISLEGIS", text: "Pesquise normas diretamente na base do SISLEGIS/DOU do MAPA, com filtros por categoria (novas, alterações, consultas públicas) e análise de impacto BPF." },
      { title: "Base de Normas", text: "Cadastre e consulte normas com código, órgão, tipo, data de publicação e tags para busca rápida." },
    ],
    tips: ["Marque alertas como lidos para manter o controle do que já foi analisado.", "Salve resultados da pesquisa SISLEGIS diretamente na base de normas."],
  },
];

function SectionCard({ section, isOpen, onToggle }: { section: ManualSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;

  return (
    <Card className="border border-border transition-shadow hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full text-left"
      >
        <CardHeader className="flex flex-row items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              {section.badge && (
                <Badge variant="secondary" className="text-xs">{section.badge}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
        </CardHeader>
      </button>

      <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">{section.description}</p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Funcionalidades:</h4>
            {section.features.map((f, i) => (
              <div key={i} className="flex gap-3 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">{f.title}:</span>{" "}
                  <span className="text-sm text-muted-foreground">{f.text}</span>
                </div>
              </div>
            ))}
          </div>

          {section.tips && section.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="w-4 h-4 text-primary" />
                Dicas
              </div>
              {section.tips.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-6">• {tip}</p>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export default function Manual() {
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
      <PageHeader icon={BookOpen} title="Manual de Utilização" description="Guia completo de todas as funcionalidades do sistema FeedBPF" />

      <div className="flex gap-2 mb-6">
        <button onClick={expandAll} className="text-sm text-primary hover:underline font-medium">
          Expandir tudo
        </button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-sm text-primary hover:underline font-medium">
          Recolher tudo
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard
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
