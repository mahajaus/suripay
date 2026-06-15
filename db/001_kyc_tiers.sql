-- ============================================================
-- SuriPay — Tiered KYC fundament
-- Voer dit in één keer uit in de Supabase SQL Editor.
-- Idempotent: veilig opnieuw uit te voeren.
-- ============================================================

-- Stap 1 — Tabel kyc_tiers (configureerbare tiers + limieten)
create table if not exists public.kyc_tiers (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null unique,
  display_name         text not null,
  max_balance          numeric not null,
  annual_receive_limit numeric not null,
  required_kyc         text not null,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Stap 2 — Auto-update van updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kyc_tiers_updated_at on public.kyc_tiers;
create trigger trg_kyc_tiers_updated_at
  before update on public.kyc_tiers
  for each row execute function public.set_updated_at();

-- Stap 3 — Drie start-tiers (placeholder-bedragen)
insert into public.kyc_tiers
  (name, display_name, max_balance, annual_receive_limit, required_kyc, sort_order)
values
  ('normal', 'SuriPay Normal',  5000,       50000, 'phone',                       1),
  ('medium', 'SuriPay Medium', 25000,      300000, 'phone_email_id',              2),
  ('high',   'SuriPay High',  1000000,    12000000, 'phone_email_id_passport',     3)
on conflict (name) do update set
  display_name         = excluded.display_name,
  max_balance          = excluded.max_balance,
  annual_receive_limit = excluded.annual_receive_limit,
  required_kyc         = excluded.required_kyc,
  sort_order           = excluded.sort_order,
  updated_at           = now();

-- Stap 4 — wallets uitbreiden (tier + jaarteller)
alter table public.wallets
  add column if not exists tier               text    not null default 'normal',
  add column if not exists received_this_year numeric not null default 0,
  add column if not exists year_reset_at      date;

-- Foreign key apart, zodat de add-column-stap herhaalbaar blijft.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wallets_tier_fkey'
  ) then
    alter table public.wallets
      add constraint wallets_tier_fkey
      foreign key (tier) references public.kyc_tiers (name)
      on update cascade;
  end if;
end $$;
