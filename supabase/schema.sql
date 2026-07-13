-- Gold consignment SaaS: run this in Supabase SQL Editor before enabling the app.
create extension if not exists pgcrypto;

create type public.contract_status as enum ('active', 'redeemed', 'expired');
create type public.transaction_status as enum ('success', 'pending_review');

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  theme_color text not null default '#ad7b19',
  bank_name text not null,
  bank_account_no text not null,
  bank_account_name text not null,
  extension_rate numeric(5,2) not null default 1.25 check (extension_rate >= 0),
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  line_user_id text not null,
  full_name text not null,
  phone text not null,
  citizen_id_encrypted text not null,
  created_at timestamptz not null default now(),
  unique (shop_id, line_user_id)
);

create table public.consignment_contracts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  contract_no text not null,
  consignment_amount numeric(12,2) not null check (consignment_amount > 0),
  gold_weight_text text not null,
  start_date date not null,
  expiry_date date not null,
  status public.contract_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (shop_id, contract_no),
  check (expiry_date >= start_date)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  contract_id uuid not null references public.consignment_contracts(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  slip_url text,
  bank_trans_id text unique,
  status public.transaction_status not null default 'pending_review',
  created_at timestamptz not null default now()
);

create index contracts_shop_customer_idx on public.consignment_contracts(shop_id, customer_id);
create index transactions_shop_contract_idx on public.transactions(shop_id, contract_id);

-- The app sets these values only after an authenticated server-side identity check.
alter table public.shops enable row level security;
alter table public.customers enable row level security;
alter table public.consignment_contracts enable row level security;
alter table public.transactions enable row level security;

create policy "customers see only their shop" on public.customers
  for select using (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
create policy "contracts stay within shop" on public.consignment_contracts
  for select using (shop_id = (auth.jwt() ->> 'shop_id')::uuid);
create policy "transactions stay within shop" on public.transactions
  for select using (shop_id = (auth.jwt() ->> 'shop_id')::uuid);

-- Writes to transactions and expiry_date are performed by /api/verify-slip using
-- the service role after all three checks have passed. Do not expose that key.
