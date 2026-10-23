create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  empresa_id uuid,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  product_id text not null,
  price_id text not null,
  produto text,
  nivel text,
  plano text,
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_empresa on public.subscriptions(empresa_id);
create index idx_subscriptions_environment on public.subscriptions(environment);

create table public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  event_type text not null,
  environment text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

grant select on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
grant all on public.stripe_webhook_events to service_role;

alter table public.subscriptions enable row level security;
alter table public.stripe_webhook_events enable row level security;

create policy "Usuario le assinaturas da propria conta"
  on public.subscriptions for select
  using (auth.uid() = user_id);