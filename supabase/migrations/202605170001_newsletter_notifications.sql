-- Newsletter subscriptions and scheduled digest delivery tables.
-- Run this in the Supabase SQL editor or with `supabase db push` after linking the project.

create extension if not exists pgcrypto;

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  channel text not null default 'email' check (channel in ('email', 'telegram', 'kakao')),
  destination text,
  country text not null default 'kr',
  category text not null default 'all',
  active boolean not null default false,
  consented_at timestamptz,
  email_verified_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscriptions_email_channel_unique
  on public.newsletter_subscriptions (email, channel);

create index if not exists newsletter_subscriptions_active_idx
  on public.newsletter_subscriptions (active, channel, country, category);

create table if not exists public.notification_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'success', 'partial_failure', 'failed')),
  error text
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.notification_runs(id) on delete cascade,
  subscription_id uuid references public.newsletter_subscriptions(id) on delete cascade,
  channel text not null check (channel in ('email', 'telegram', 'kakao')),
  article_url text,
  status text not null check (status in ('success', 'skipped', 'failed')),
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists notification_deliveries_subscription_sent_idx
  on public.notification_deliveries (subscription_id, sent_at desc);

create table if not exists public.sent_articles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.newsletter_subscriptions(id) on delete cascade,
  article_url text not null,
  sent_at timestamptz not null default now(),
  unique(subscription_id, article_url)
);

create index if not exists sent_articles_subscription_sent_idx
  on public.sent_articles (subscription_id, sent_at desc);

create table if not exists public.digest_summaries (
  article_url text primary key,
  title text not null,
  description text,
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists newsletter_subscriptions_updated_at on public.newsletter_subscriptions;
create trigger newsletter_subscriptions_updated_at
  before update on public.newsletter_subscriptions
  for each row execute function public.set_updated_at();

drop trigger if exists digest_summaries_updated_at on public.digest_summaries;
create trigger digest_summaries_updated_at
  before update on public.digest_summaries
  for each row execute function public.set_updated_at();

alter table public.newsletter_subscriptions enable row level security;
alter table public.notification_runs enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.sent_articles enable row level security;
alter table public.digest_summaries enable row level security;

-- The Next.js API uses SUPABASE_SERVICE_ROLE_KEY for server-side writes.
-- Keep direct public access closed by default.
