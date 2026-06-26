-- ============================================================
-- SuriPay — Koop/verkoop-koersen (CME-model)
-- Voer dit uit na 014.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Cambio-model (zoals CME): per valuta twee koersen.
--   buy_srd  = SRD per eenheid als SuriPay die valuta KOOPT
--              (gebruiker wisselt/stuurt VANUIT die valuta).
--   sell_srd = SRD per eenheid als SuriPay die valuta VERKOOPT
--              (gebruiker wisselt/ontvangt NAAR die valuta).
-- De spread (sell - buy) is SuriPay's marge.
-- Startwaarden = CME dagkoersen (25-jun-2026); admin werkt ze bij in /admin/koersen.
-- ============================================================

alter table public.currencies
  add column if not exists buy_srd  numeric,
  add column if not exists sell_srd numeric;

-- Backfill: bestaande enkele koers wordt zowel buy als sell (geen spread).
update public.currencies
  set buy_srd = coalesce(buy_srd, srd_per_unit),
      sell_srd = coalesce(sell_srd, srd_per_unit)
  where buy_srd is null or sell_srd is null;

-- CME-startkoersen.
update public.currencies set buy_srd = 1,     sell_srd = 1     where code = 'SRD';
update public.currencies set buy_srd = 37.35, sell_srd = 37.60 where code = 'USD';
update public.currencies set buy_srd = 41.75, sell_srd = 42.85 where code = 'EUR';

-- ------------------------------------------------------------
-- exchange_currency: buy aan bronzijde, sell aan doelzijde.
-- ------------------------------------------------------------
create or replace function public.exchange_currency(
  p_user_id uuid, p_from text, p_to text, p_amount numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare v_wallet uuid; v_from_rate numeric; v_to_rate numeric;
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

  select buy_srd  into v_from_rate from currencies where code = p_from and enabled;
  select sell_srd into v_to_rate   from currencies where code = p_to   and enabled;
  if v_from_rate is null or v_to_rate is null or v_from_rate <= 0 or v_to_rate <= 0 then
    return json_build_object('success', false, 'error', 'Onbekende of uitgeschakelde valuta');
  end if;

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

  if p_from = 'SRD' then
    update wallets set balance = balance - p_amount, updated_at = now() where id = v_wallet;
  else
    update wallet_balances set balance = balance - p_amount, updated_at = now()
      where wallet_id = v_wallet and currency = p_from;
  end if;

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

-- ------------------------------------------------------------
-- transfer_money_fx: buy aan bronzijde, sell aan doelzijde.
-- ------------------------------------------------------------
create or replace function public.transfer_money_fx(
  p_sender_wallet_id uuid, p_receiver_wallet_id uuid,
  p_from_currency text, p_to_currency text,
  p_from_amount numeric, p_description text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_from_rate numeric; v_to_rate numeric; v_srd numeric; v_to_amount numeric;
  v_sender_bal numeric;
  v_receiver_id uuid; v_received numeric; v_year_reset date;
  v_annual numeric; v_max numeric; v_base numeric; v_new_reset date;
  v_recv_bal numeric; v_recv_srd numeric; v_txid uuid;
begin
  if p_from_amount is null or p_from_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  if p_sender_wallet_id = p_receiver_wallet_id then
    return json_build_object('success', false, 'error', 'Je kunt geen geld naar jezelf sturen');
  end if;

  select buy_srd  into v_from_rate from currencies where code = p_from_currency and enabled;
  select sell_srd into v_to_rate   from currencies where code = p_to_currency   and enabled;
  if v_from_rate is null or v_to_rate is null or v_from_rate <= 0 or v_to_rate <= 0 then
    return json_build_object('success', false, 'error', 'Onbekende of uitgeschakelde valuta');
  end if;

  v_srd := p_from_amount * v_from_rate;
  v_to_amount := v_srd / v_to_rate;

  perform 1 from wallets where id in (p_sender_wallet_id, p_receiver_wallet_id) order by id for update;

  if p_from_currency = 'SRD' then
    select balance into v_sender_bal from wallets where id = p_sender_wallet_id;
  else
    select coalesce(balance, 0) into v_sender_bal from wallet_balances
      where wallet_id = p_sender_wallet_id and currency = p_from_currency;
    v_sender_bal := coalesce(v_sender_bal, 0);
  end if;
  if v_sender_bal is null then
    return json_build_object('success', false, 'error', 'Verzender wallet niet gevonden');
  end if;
  if v_sender_bal < p_from_amount then
    return json_build_object('success', false, 'error', 'Onvoldoende saldo');
  end if;

  select w.id, w.received_this_year, w.year_reset_at, t.annual_receive_limit, t.max_balance
    into v_receiver_id, v_received, v_year_reset, v_annual, v_max
  from wallets w left join kyc_tiers t on t.name = w.tier
  where w.id = p_receiver_wallet_id;
  if v_receiver_id is null then
    return json_build_object('success', false, 'error', 'Ontvanger wallet niet gevonden');
  end if;

  if v_year_reset is null or extract(year from v_year_reset) < extract(year from current_date) then
    v_base := 0; v_new_reset := current_date;
  else
    v_base := coalesce(v_received, 0); v_new_reset := v_year_reset;
  end if;

  if v_annual is not null and (v_base + v_srd) > v_annual then
    return json_build_object('success', false,
      'error', 'Ontvanger overschrijdt de jaarlijkse ontvangstlimiet van zijn KYC-niveau');
  end if;

  if p_to_currency = 'SRD' then
    select balance into v_recv_bal from wallets where id = p_receiver_wallet_id;
    v_recv_srd := coalesce(v_recv_bal, 0) + v_to_amount;
  else
    select coalesce(balance, 0) into v_recv_bal from wallet_balances
      where wallet_id = p_receiver_wallet_id and currency = p_to_currency;
    v_recv_srd := (coalesce(v_recv_bal, 0) + v_to_amount) * v_to_rate;
  end if;
  if v_max is not null and v_recv_srd > v_max then
    return json_build_object('success', false,
      'error', 'Ontvanger overschrijdt het maximale saldo van zijn KYC-niveau');
  end if;

  if p_from_currency = 'SRD' then
    update wallets set balance = balance - p_from_amount, updated_at = now() where id = p_sender_wallet_id;
  else
    update wallet_balances set balance = balance - p_from_amount, updated_at = now()
      where wallet_id = p_sender_wallet_id and currency = p_from_currency;
  end if;

  if p_to_currency = 'SRD' then
    update wallets set balance = balance + v_to_amount, updated_at = now() where id = p_receiver_wallet_id;
  else
    insert into wallet_balances (wallet_id, currency, balance)
    values (p_receiver_wallet_id, p_to_currency, v_to_amount)
    on conflict (wallet_id, currency)
      do update set balance = wallet_balances.balance + excluded.balance, updated_at = now();
  end if;

  update wallets set received_this_year = v_base + v_srd, year_reset_at = v_new_reset, updated_at = now()
    where id = p_receiver_wallet_id;

  insert into transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  values (p_sender_wallet_id, p_receiver_wallet_id, v_srd, 'send', 'completed',
    coalesce(p_description, format('%s %s → %s %s', p_from_currency, p_from_amount, p_to_currency, round(v_to_amount, 2))))
  returning id into v_txid;

  return json_build_object('success', true, 'transaction_id', v_txid, 'to_amount', v_to_amount);
end; $$;
