-- ============================================================
-- SuriPay — Multi-valuta wallet (SRD + EUR + USD, uitbreidbaar)
-- Voer dit uit na 006_topup_withdraw.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Ontwerp (beta):
--   • SRD blijft het hoofdsaldo in wallets.balance (alle geldpaden ongewijzigd).
--   • Vreemde valuta (EUR, USD, later BRL/CNY/GYD…) staan in wallet_balances.
--   • Wisselen tussen valuta loopt via exchange_currency() (alleen service-role).
--   • Nieuwe valuta toevoegen = één rij in currencies.
-- ============================================================

-- ------------------------------------------------------------
-- Stap 1 — Valuta-catalogus
-- srd_per_unit = waarde van 1 eenheid in SRD (bv. 1 EUR = 38,46 SRD).
-- ------------------------------------------------------------
create table if not exists public.currencies (
  code         text primary key,            -- 'SRD', 'EUR', 'USD'
  name         text not null,
  symbol       text not null,
  srd_per_unit numeric not null,
  sort_order   integer not null default 0,
  enabled      boolean not null default true,
  updated_at   timestamptz not null default now()
);

insert into public.currencies (code, name, symbol, srd_per_unit, sort_order, enabled) values
  ('SRD', 'Surinaamse dollar', 'SRD', 1,      0, true),
  ('EUR', 'Euro',              '€',   38.46,  1, true),
  ('USD', 'US dollar',         '$',   35.71,  2, true)
on conflict (code) do update set
  name = excluded.name, symbol = excluded.symbol,
  srd_per_unit = excluded.srd_per_unit, sort_order = excluded.sort_order,
  enabled = excluded.enabled, updated_at = now();

-- Toekomstige valuta (nog uitgeschakeld) — activeer door enabled=true te zetten.
insert into public.currencies (code, name, symbol, srd_per_unit, sort_order, enabled) values
  ('BRL', 'Braziliaanse real',  'R$', 6.40,  3, false),
  ('CNY', 'Chinese yuan',       '¥',  4.95,  4, false),
  ('GYD', 'Guyaanse dollar',    'G$', 0.17,  5, false)
on conflict (code) do nothing;

alter table public.currencies enable row level security;
drop policy if exists "currencies_select_auth" on public.currencies;
create policy "currencies_select_auth" on public.currencies
  for select to authenticated using (true);

-- ------------------------------------------------------------
-- Stap 2 — Vreemde-valuta saldi per wallet (SRD NIET hier; die blijft in wallets)
-- ------------------------------------------------------------
create table if not exists public.wallet_balances (
  id         uuid primary key default gen_random_uuid(),
  wallet_id  uuid not null references public.wallets (id) on delete cascade,
  currency   text not null references public.currencies (code),
  balance    numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (wallet_id, currency)
);
create index if not exists wallet_balances_wallet_idx on public.wallet_balances (wallet_id);

alter table public.wallet_balances enable row level security;
drop policy if exists "wb_select_own" on public.wallet_balances;
create policy "wb_select_own" on public.wallet_balances
  for select to authenticated
  using (wallet_id in (select id from public.wallets where user_id = auth.uid()));
-- Geen client insert/update/delete: saldomutaties lopen via service-role RPC.

-- ------------------------------------------------------------
-- Stap 3 — Wisselen (SRD ↔ vreemd, of vreemd ↔ vreemd). Alleen service-role.
-- ------------------------------------------------------------
create or replace function public.exchange_currency(
  p_user_id uuid, p_from text, p_to text, p_amount numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_wallet uuid;
  v_from_rate numeric; v_to_rate numeric;
  v_from_bal numeric; v_srd numeric; v_to_amount numeric;
begin
  if p_amount is null or p_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  if p_from = p_to then
    return json_build_object('success', false, 'error', 'Kies twee verschillende valuta');
  end if;

  select id into v_wallet from wallets where user_id = p_user_id for update;
  if v_wallet is null then
    return json_build_object('success', false, 'error', 'Wallet niet gevonden');
  end if;

  select srd_per_unit into v_from_rate from currencies where code = p_from and enabled;
  select srd_per_unit into v_to_rate   from currencies where code = p_to   and enabled;
  if v_from_rate is null or v_to_rate is null then
    return json_build_object('success', false, 'error', 'Onbekende of uitgeschakelde valuta');
  end if;

  -- Huidig saldo in de bron-valuta.
  if p_from = 'SRD' then
    select balance into v_from_bal from wallets where id = v_wallet;
  else
    select coalesce(balance, 0) into v_from_bal from wallet_balances
      where wallet_id = v_wallet and currency = p_from;
    v_from_bal := coalesce(v_from_bal, 0);
  end if;
  if v_from_bal < p_amount then
    return json_build_object('success', false, 'error', 'Onvoldoende saldo');
  end if;

  v_srd := p_amount * v_from_rate;
  v_to_amount := v_srd / v_to_rate;

  -- Debiteer bron.
  if p_from = 'SRD' then
    update wallets set balance = balance - p_amount, updated_at = now() where id = v_wallet;
  else
    update wallet_balances set balance = balance - p_amount, updated_at = now()
      where wallet_id = v_wallet and currency = p_from;
  end if;

  -- Crediteer doel.
  if p_to = 'SRD' then
    update wallets set balance = balance + v_to_amount, updated_at = now() where id = v_wallet;
  else
    insert into wallet_balances (wallet_id, currency, balance)
    values (v_wallet, p_to, v_to_amount)
    on conflict (wallet_id, currency)
      do update set balance = wallet_balances.balance + excluded.balance, updated_at = now();
  end if;

  return json_build_object('success', true, 'to_amount', v_to_amount);
end; $$;

revoke execute on function public.exchange_currency(uuid, text, text, numeric) from public, anon, authenticated;
grant  execute on function public.exchange_currency(uuid, text, text, numeric) to service_role;
