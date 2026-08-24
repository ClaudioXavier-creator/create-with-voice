# Revisão Geral do Feed_BPF + Plano de Evolução

Objetivo: auditar de ponta a ponta tudo que já foi construído (módulos, funções de backend, integrações, licenciamento, segurança), corrigir o que estiver quebrado e entregar um plano priorizado de melhorias para posicionar o Feed_BPF como a referência em BPF na nutrição animal.

O escopo hoje é grande: 92 páginas no app e 55 funções de backend. Por isso a revisão é feita em fases, com relatório ao final de cada uma.

## Fase 1 — Auditoria funcional automatizada (sem mudanças de código)
- Varredura de rotas: para cada rota registrada, verificar se carrega, se está protegida (login + licença) e se aparece na navegação correta por POP (01 a 10 + PAC).
- Teste de navegação real no app (navegador headless) nas rotas críticas: Dashboard, Recebimento, Produção, Higiene, PCC, Rastreabilidade, Documentos, POPs, Auditoria, Modelos.
- Conferência de CRUD nos módulos de registro: salvar, editar, excluir, bloqueio de registro assinado, rascunho automático e trilha de auditoria.
- Checagem das funções de backend: quais estão ativas, quais nunca são chamadas pelo app (candidatas a remoção) e quais retornam erro.
- Revisão do agendamento diário de alertas de vencimento e da geração automática de não conformidades.
- Saída: relatório "Status Funcional" com tabela verde/amarelo/vermelho por módulo.

## Fase 2 — Auditoria de dados e segurança
- Conferir isolamento multiempresa (empresa_id) em todas as consultas de páginas com dados sensíveis.
- Rodar o verificador de segurança do backend e classificar cada achado em: corrigir agora, aceitar com justificativa, ou ignorar.
- Validar permissões de leitura/escrita das tabelas usadas pelos módulos ativos.
- Validar integridade: selos SHA-256, imutabilidade de registros assinados, retenção de 2 anos.
- Saída: lista de correções obrigatórias antes de homologação com o RT.

## Fase 3 — Correções
- Aplicar as correções classificadas como bloqueantes nas fases 1 e 2, em lotes por módulo, com verificação após cada lote.
- Limpar código morto identificado (ex.: arquivos e funções sem uso).

## Fase 4 — Proposta de evolução (o diferencial de mercado)
Entrega de um documento com melhorias priorizadas por impacto x esforço. Eixos que serão avaliados:
- Prontidão de fiscalização: "modo inspeção" com dossiê da empresa gerado em um clique (POPs vigentes, registros do período, NCs, treinamentos, calibrações).
- Indicadores de gestão: painel de tendência por POP, custo da não qualidade, tempo médio de fechamento de NC.
- Inteligência aplicada: análise automática de desvios recorrentes, sugestão de ação corretiva e revisão anual assistida dos POPs.
- Operação de chão de fábrica: modo tablet/offline com sincronização, leitura de QR de lote.
- Rastreabilidade e recall: simulação cronometrada com relatório assinado.
- Comercial/valor percebido: onboarding guiado por porte de fábrica, biblioteca de modelos por segmento, relatório mensal automático para o RT.

## Detalhes técnicos
- Auditoria de rotas cruzando o registro de rotas do app com a configuração de navegação e a lista de POPs oficiais.
- Testes de interface via navegador headless em ambiente local, com captura de erros de console e requisições com falha.
- Verificação de backend por consultas somente leitura e pelo verificador de segurança nativo.
- Nenhuma alteração de esquema de banco nas fases 1 e 2; mudanças só entram na fase 3, com migração aprovada.

## Ordem de execução sugerida
1. Fase 1 (relatório funcional)
2. Fase 2 (segurança e dados)
3. Fase 3 (correções bloqueantes)
4. Fase 4 (roadmap de melhorias)
