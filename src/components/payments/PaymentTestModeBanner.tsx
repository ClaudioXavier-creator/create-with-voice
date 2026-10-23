export function PaymentTestModeBanner() {
  const token = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;
  if (!token || (!token.startsWith("pk_test_") && !token.startsWith("pk_live_"))) {
    return <div role="alert" className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Pagamentos reais não configurados. Conclua a ativação do Stripe.</div>;
  }
  if (token.startsWith("pk_test_")) {
    return <div role="status" className="w-full border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-foreground">Todos os pagamentos de teste usam dinheiro fictício. <a className="underline" href="https://docs.lovable.dev/features/payments#test-and-live-environments" target="_blank" rel="noopener noreferrer">Saiba mais</a></div>;
  }
  return null;
}