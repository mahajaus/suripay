-- ============================================================
-- SuriPay — Basisschema: wallets + transactions
-- Voer dit uit VÓÓR 001_kyc_tiers.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- LET OP: dit bestand is GERECONSTRUEERD uit het gebruik in de
-- app-code (queries, RPC-aanroepen), niet uit een pg_dump van de
-- live database. Vergelijk het met het echte Supabase-schema
-- voordat je erop vertrouwt. Kolommen die later worden toegevoegd
-- (tier, received_this_year, year_reset_at) staan bewust in 001.
-- De volledige transfer_money-functie staat in 003.
-- ============================================================

-- ------------------------------------------------------------
-- Stap 1 — Tabel wallets
-- Eén wallet per gebruiker (auth.users). Saldo in SRD.
-- ------------------------------------------------------------
create table if not exists public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  balance    numeric not null default 0,
  pin_hash   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wallets_user_id_idx on public.wallets (user_id);

-- ------------------------------------------------------------
-- Stap 2 — Tabel transactions
-- Eén rij per overboeking. Gevuld door transfer_money (003).
-- ------------------------------------------------------------
create table if not exists public.transactions (
  id                 uuid primary key default gen_random_uuid(),
  sender_wallet_id   uuid references public.wallets (id),
  receiver_wallet_id uuid references public.wallets (id),
  amount             numeric not null,
  type               text not null default 'send',
  status             text not null default 'completed',
  description        text,
  created_at         timestamptz not null default now()
);

create index if not exists transactions_sender_idx
  on public.transactions (sender_wallet_id);
create index if not exists transactions_receiver_idx
  on public.transactions (receiver_wallet_id);

-- ------------------------------------------------------------
-- Stap 3 — Automatisch een wallet aanmaken bij registratie
-- Wordt getriggerd zodra Supabase een nieuwe auth.users-rij maakt.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Stap 4 — Row Level Security
-- Een gebruiker mag alleen zijn eigen wallet lezen/bijwerken.
-- Transacties worden uitsluitend via de RPC's (SECURITY DEFINER)
-- benaderd, dus geen client-select-policy nodig.
-- ------------------------------------------------------------
alter table public.wallets      enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "wallets_select_own" on public.wallets;
create policy "wallets_select_own"
  on public.wallets
  for select
  to authenticated
  using (user_id = auth.uid());

-- Beperk de updatebare kolommen niet op SQL-niveau; de app werkt
-- alleen pin_hash bij. Saldo-mutaties lopen via transfer_money
-- (SECURITY DEFINER) en omzeilen RLS bewust.
drop policy if exists "wallets_update_own" on public.wallets;
create policy "wallets_update_own"
  on public.wallets
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Stap 5 — RPC: find_wallet_by_email
-- Zoekt de wallet van een ontvanger op e-mailadres (auth.users).
-- SECURITY DEFINER omdat auth.users niet client-leesbaar is.
-- Retour: { found, wallet_id, full_name }.
-- ------------------------------------------------------------
create or replace function public.find_wallet_by_email(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_full_name text;
begin
  select w.id, u.raw_user_meta_data ->> 'full_name'
    into v_wallet_id, v_full_name
  from auth.users u
  join public.wallets w on w.user_id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_wallet_id is null then
    return json_build_object('found', false);
  end if;

  return json_build_object(
    'found', true,
    'wallet_id', v_wallet_id,
    'full_name', coalesce(v_full_name, p_email)
  );
end;
$$;

-- ------------------------------------------------------------
-- Stap 6 — RPC: get_my_transactions
-- Geeft de transacties van één wallet terug met richting + tegenpartij.
-- SECURITY DEFINER om de naam van de tegenpartij (auth.users) op te halen.
-- Retour-rijen: id, direction ('in'|'out'), other_party, amount,
--               description, created_at.
-- ------------------------------------------------------------
create or replace function public.get_my_transactions(p_wallet_id uuid)
returns table (
  id          uuid,
  direction   text,
  other_party text,
  amount      numeric,
  description text,
  created_at  timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    case when t.sender_wallet_id = p_wallet_id then 'out' else 'in' end as direction,
    coalesce(
      other_u.raw_user_meta_data ->> 'full_name',
      other_u.email,
      'Onbekend'
    ) as other_party,
    t.amount,
    t.description,
    t.created_at
  from public.transactions t
  left join public.wallets other_w
    on other_w.id = case
         when t.sender_wallet_id = p_wallet_id then t.receiver_wallet_id
         else t.sender_wallet_id
       end
  left join auth.users other_u on other_u.id = other_w.user_id
  where t.sender_wallet_id = p_wallet_id
     or t.receiver_wallet_id = p_wallet_id
  order by t.created_at desc;
$$;
