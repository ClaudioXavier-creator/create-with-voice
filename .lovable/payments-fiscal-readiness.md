# Stripe e NFS-e — preparação sem ativação pública

## Estado e limites
- Stripe de teste: 16 produtos/níveis, 48 preços BRL; NutriCRM excluído.
- Feed_BPF: mensal 297/497/897; semestral 1514,70/2534,70/4574,70; anual 2970/4970/8970.
- Renovação em 1/6/12 meses; quantidade fixa de uma assinatura por contratação.
- Checkout incorporado preparado em função separada e componente não montado. Nenhum botão, rota pública ou função legada alterado.
- Cobranças reais recusadas no servidor. Sessões de preparação não ativam licenças.
- Regras aprovadas: ativação por empresa após pagamento; cancelamento mantém período pago; upgrade após diferença proporcional; downgrade na renovação.
- Essas regras têm testes, mas atualização de licença, gestão de assinatura e processamento fiscal ainda precisam ser conectados e validados antes de ativar.

## Goiânia — evidência oficial consultada
Fonte: https://www.goiania.go.gov.br/wp-content/uploads/2026/03/FAQ_FINAL_V3.pdf
O manual informa que o emissor próprio permanente foi encerrado em 01/10/2025, com emissor gratuito temporário até 30/11/2025. Orienta emissor próprio ou contratado compatível com ABRASF 2.04.

Parâmetros de produção publicados no manual:
- Município 5208707; série RPS 1.
- WebService: https://nfse.issnetonline.com.br/abrasf204/goiania/nfse.asmx
- Serviços incluem GerarNfse, EnviarLoteRps, consultas e cancelamento.

Não transmitir notas reais nem inventar inscrição municipal, CNAE, item de serviço, alíquota ou regime.
Antes de integrar: verificar WSDL/XSD atuais, ambiente de homologação, credenciamento, certificado e assinatura exigidos; validar inscrição municipal, regime fiscal, CNAE/item LC 116, tributação municipal, retenções e sequência RPS com o contador.
Recibo/fatura Stripe não é NFS-e. Cálculo de impostos do Stripe não substitui obrigações municipais ou DAS.
Teste autenticado retornou erro do próprio Stripe: Stripe Tax não é suportado para o país desta conta (Brasil). Portanto, formulário e compra de teste permanecem bloqueados pela configuração fiscal; não remover automatic_tax nem prometer cálculo de tributos sem decisão explícita sobre responsabilidade fiscal.
Certificado, senha e credenciais devem entrar somente por formulário seguro, nunca por chat, frontend ou repositório.

## Ativação pendente
1. Concluir habilitação fiscal e emitir/consultar NFS-e de homologação. Situação em 23/10/2026: inscrição municipal de Goiânia em processo de abertura (informado pelo Cláudio); emissão bloqueada até a inscrição ficar ativa, seguida de credenciamento, certificado/homologação e confirmação de CNAE, item LC 116 e tributação pelo contador.
2. Eventos Stripe já armazenados com idempotência (tabela stripe_webhook_events) e separados por teste/live; apenas eventos de LICENÇA em live sincronizam `licencas` — eventos de teste nunca ativam licença.
3. Conectar gestão de cancelamento e troca de plano na interface (regras já aplicadas no webhook: cancelamento mantém período pago, downgrade na renovação), mantendo acesso até período pago e aplicando upgrade somente após confirmação.
4. Verificar limites 5/10/20 e autorização por empresa.
5. Concluir go-live Stripe e obter autorização do Cláudio antes de ligar botões ou publicar.