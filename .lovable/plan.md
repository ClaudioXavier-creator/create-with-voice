# Plano: Stripe + Remoção do NutriCRM

## 1. Regras de preço (aplicadas a todos os planos)

- **Mensal** = assinatura recorrente (`subscription`, `interval=month`)
- **Semestral** = pagamento único (`payment`), 15% desconto sobre 6× mensal
- **Anual** = pagamento único (`payment`), 25% desconto sobre 12× mensal

Fórmulas:
- Semestral = `mensal × 6 × 0,85`
- Anual = `mensal × 12 × 0,75`

## 2. Produtos a criar no Stripe

### Feed_BPF (3 níveis × 3 períodos = 9 preços)
| Plano | Mensal | Semestral | Anual | Usuários |
|---|---|---|---|---|
| Standard | R$ 397 | R$ 2.024,70 | R$ 3.573,00 | até 10 |
| Intermediária | R$ 697 | R$ 3.554,70 | R$ 6.273,00 | até 20 |
| Premium | R$ 1.297 | R$ 6.614,70 | R$ 11.673,00 | ilimitado |

### Audits_BPF (3 níveis × 3 períodos = 9 preços)
| Plano | Mensal | Semestral | Anual | Escopo |
|---|---|---|---|---|
| Empresa Standard | R$ 297 | R$ 1.514,70 | R$ 2.673,00 | 1 empresa, 10 usuários |
| Consultor 10 | R$ 297 | R$ 1.514,70 | R$ 2.673,00 | até 10 empresas |
| Consultor 20 | R$ 497 | R$ 2.534,70 | R$ 4.473,00 | até 20 empresas |

### Agro RC CRM, Nutri_Agro Labels, AgroGestão CRM
Os 3 produtos seguem **a mesma tabela** (3 níveis × 3 períodos = 9 preços cada → 27 preços):
| Plano | Mensal | Semestral | Anual | Escopo |
|---|---|---|---|---|
| Empresa | R$ 97 | R$ 494,70 | R$ 873,00 | 1 licença |
| Gestor Comercial | R$ 297 | R$ 1.514,70 | R$ 2.673,00 | até 10 representantes |
| Consultor Comercial | R$ 497 | R$ 2.534,70 | R$ 4.473,00 | até 20 representantes |

**Total: 45 preços novos no Stripe** (9 + 9 + 9 + 9 + 9).

## 3. Edge functions a atualizar com os novos `price_id`s

- `create-checkout` (Feed_BPF) — substitui os 9 IDs fantasma `price_1TMwhP…`
- `create-checkout-audits` — substitui os 6 IDs fantasma, adiciona o 3º nível (consultor 20)
- `create-checkout-agrorc` — adiciona variantes Gestor 10 e Consultor 20
- `create-checkout-nutriagrolabels` — substitui os 3 IDs Individual fantasma + adiciona Gestor/Consultor
- Verificar `create-checkout` do AgroGestão (se existir) ou criar

Mapa de preços por produto vai num arquivo único (ex.: `supabase/functions/_shared/stripe-prices.ts`) para facilitar manutenção.

## 4. Remoção do NutriCRM

- Tirar card/links do NutriCRM da página **Vitrine** (`src/pages/Vitrine.tsx`)
- Tirar do `productUtils.ts` se aparecer em seletores públicos (mantém o label caso ainda exista licença antiga no banco)
- **Não** apagar rotas `/nutricrm/*`, layout, sidebar, edge functions, nem produtos Stripe existentes — só esconder da vitrine pública (reversível)
- **Não** remover o produto do Stripe (mantém histórico de assinaturas ativas, se houver)

## 5. Validação visual nas páginas de planos

Conferir que os preços exibidos nas páginas de planos (`AuditsBPFPlanos.tsx`, `FeedBPFPage.tsx`, etc.) batem com a nova tabela. Ajustar textos onde estiver desatualizado.

## 6. Ordem de execução

1. Criar os 45 produtos+preços no Stripe (em lote, via tool)
2. Gravar o mapa `price_id → plano/período` em `_shared/stripe-prices.ts`
3. Atualizar os 4 edge functions de checkout
4. Esconder NutriCRM da Vitrine
5. Ajustar textos de preço nas páginas se divergirem
6. Deploy das edge functions

## Confirma?
- Tabela de preços acima está correta?
- **AgroGestão CRM** também ganha os 3 níveis (Empresa / Gestor 10 / Consultor 20), igual ao Agro RC e Labels? (você listou os 3 produtos juntos, então assumi que sim)
- Esconder NutriCRM da vitrine **sem apagar** rotas/código é OK? (reversível quando estiver funcional)
