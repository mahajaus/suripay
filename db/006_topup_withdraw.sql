-- ============================================================
-- SuriPay — Opwaarderen & opnemen (admin-bemiddeld, beta)
-- Voer dit uit na 005_security_hardening.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Model voor de closed beta (geen externe betaalintegratie):
--   • Opwaarderen: gebruiker dient een verzoek in → admin bevestigt dat het
--     geld binnen is → service-role crediteert de wallet.
--   • Opnemen: gebruiker dient een verzoek in → bedrag wordt direct
--     gereserveerd (gedebiteerd) → admin markeert als uitbetaald, of wijst af
--     (refund).
-- Saldo-mutaties lopen UITSLUITEND via SECURITY DEFINER-functies die alleen
-- de service-role mag aanroepen.
-- ============================================================

-- ------------------------------------------------------------
-- Stap 1 — Kritieke RLS-fix: client mag wallets NIET meer wijzigen.
-- Alle wallet-mutaties lopen nu server-side (service-role). De oude
-- update-policy liet een gebruiker zijn eigen rij (incl. balance!) wijzigen.
-- ------------------------------------------------------------
drop policy if exists "wallets_update_own" on public.wallets;

-- ------------------------------------------------------------
-- Stap 2 — Tabellen
-- ------------------------------------------------------------
create table if not exists public.topup_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric not null check (amount > 0),
  method      text not null default 'bank',
  reference   text,
  status      text not null default 'pending', -- pending | approved | rejected
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists topup_requests_user_idx on public.topup_requests (user_id);

create table if not exists public.withdrawals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  amount      numeric not null check (amount > 0),
  method      text not null default 'bank',
  destination text,
  status      text not null default 'pending', -- pending | paid | rejected
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists withdrawals_user_idx on public.withdrawals (user_id);

-- ------------------------------------------------------------
-- Stap 3 — RLS: gebruiker mag eigen verzoeken lezen + aanmaken.
-- Wijzigen (goedkeuren/afwijzen) gebeurt alleen via service-role.
-- ------------------------------------------------------------
alter table public.topup_requests enable row level security;
alter table public.withdrawals    enable row level security;

drop policy if exists "topup_select_own" on public.topup_requests;
create policy "topup_select_own" on public.topup_requests
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "topup_insert_own" on public.topup_requests;
create policy "topup_insert_own" on public.topup_requests
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "wd_select_own" on public.withdrawals;
create policy "wd_select_own" on public.withdrawals
  for select to authenticated using (user_id = auth.uid());
drop policy if exists "wd_insert_own" on public.withdrawals;
create policy "wd_insert_own" on public.withdrawals
  for insert to authenticated with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Stap 4 — Saldo-mutatiefuncties (alleen service-role).
-- ------------------------------------------------------------
create or replace function public.admin_credit_wallet(
  p_user_id uuid, p_amount numeric, p_type text, p_description text
)
returns json language plpgsql security definer set search_path = public as $$
declare v_wallet uuid; v_bal numeric; v_max numeric;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  select w.id, w.balance, t.max_balance into v_wallet, v_bal, v_max
  from wallets w left join kyc_tiers t on t.name = w.tier
  where w.user_id = p_user_id for update of w;
  if v_wallet is null then
    return json_build_object('success', false, 'error', 'Wallet niet gevonden');
  end if;
  if v_max is not null and (coalesce(v_bal, 0) + p_amount) > v_max then
    return json_build_object('success', false, 'error', 'Overschrijdt het maximale saldo van het KYC-niveau');
  end if;
  update wallets set balance = balance + p_amount, updated_at = now() where id = v_wallet;
  insert into transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  values (null, v_wallet, p_amount, p_type, 'completed', p_description);
  return json_build_object('success', true);
end; $$;

create or replace function public.admin_debit_wallet(
  p_user_id uuid, p_amount numeric, p_type text, p_description text
)
returns json language plpgsql security definer set search_path = public as $$
declare v_wallet uuid; v_bal numeric;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  select id, balance into v_wallet, v_bal from wallets
  where user_id = p_user_id for update;
  if v_wallet is null then
    return json_build_object('success', false, 'error', 'Wallet niet gevonden');
  end if;
  if v_bal < p_amount then
    return json_build_object('success', false, 'error', 'Onvoldoende saldo');
  end if;
  update wallets set balance = balance - p_amount, updated_at = now() where id = v_wallet;
  insert into transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  values (v_wallet, null, p_amount, p_type, 'completed', p_description);
  return json_build_object('success', true);
end; $$;

revoke execute on function public.admin_credit_wallet(uuid, numeric, text, text) from public, anon, authenticated;
revoke execute on function public.admin_debit_wallet(uuid, numeric, text, text) from public, anon, authenticated;
grant execute on function public.admin_credit_wallet(uuid, numeric, text, text) to service_role;
grant execute on function public.admin_debit_wallet(uuid, numeric, text, text) to service_role;
