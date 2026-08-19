// Configuração de Conformidade MAPA (Decreto 12.031/2024 e IN 04/2007):
// 1. Implementado alertas visuais de "Vencimento: 1 Ano" nos cabeçalhos dos POPs em src/pages/PlanilhasPop.tsx.
// 2. Adicionado selo de "Revisão Anual Obrigatória" para atender às exigências da fiscalização federal.
// 3. Central de Alertas no Dashboard Principal configurada para monitorar conformidade em tempo real.
// 4. Sala do Auditor: Implementada filtragem por validade de documentos para garantir que apenas itens vigentes sejam auditados.
// 5. Automação: Configurada Edge Function 'alertas-vencimento' para notificações de 30 dias via WhatsApp e e-mail.

// Próximos passos sugeridos:
// - Configurar o gatilho CRON (no banco) para disparar a função de alertas diariamente.
// - Integrar a visualização de "Não Conformidades" geradas automaticamente por documentos vencidos e a vencer a partir de 30 dias.
// - Refinar a matriz de riscos integrada à Sala do Auditor.



