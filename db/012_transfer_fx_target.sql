-- ============================================================
-- SuriPay — Cross-currency overmaken met KEUZE doel-valuta
-- Voer dit uit na 011.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Breidt transfer_money_fx uit met p_to_currency, zodat de verzender kiest
-- wat de ontvanger krijgt:
--   • Model A (diaspora): p_to_currency = 'SRD'  → ontvanger krijgt SRD.
--   • Model B (same-cur):  p_to_currency = p_from_currency → ontvanger krijgt EUR.
--   • Algemeen ook EUR→USD enz.
-- KYC-limieten gelden op de SRD-tegenwaarde. Alleen service-role.
-- ============================================================

-- Oude 5-argument versie verwijderen (signature wijzigt).
drop function if exists public.transfer_money_fx(uuid, uuid, text, numeric, text);

create or replace function public.transfer_money_fx(
  p_sender_wallet_id uuid,
  p_receiver_wallet_id uuid,
  p_from_currency text,
  p_to_currency text,
  p_from_amount numeric,
  p_description text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_rate numeric; v_to_rate numeric;
  v_srd numeric; v_to_amount numeric;
  v_sender_bal numeric;
  v_receiver_id uuid; v_received numeric; v_year_reset date;
  v_annual numeric; v_max numeric; v_base numeric; v_new_reset date;
  v_recv_bal numeric; v_recv_srd numeric;
  v_txid uuid;
begin
  if p_from_amount is null or p_from_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  if p_sender_wallet_id = p_receiver_wallet_id then
    return json_build_object('success', false, 'error', 'Je kunt geen geld naar jezelf sturen');
  end if;

  select srd_per_unit into v_from_rate from currencies where code = p_from_currency and enabled;
  select srd_per_unit into v_to_rate   from currencies where code = p_to_currency   and enabled;
  if v_from_rate is null or v_to_rate is null then
    return json_build_object('success', false, 'error', 'Onbekende of uitgeschakelde valuta');
  end if;

  v_srd := p_from_amount * v_from_rate;     -- SRD-tegenwaarde (voor limieten)
  v_to_amount := v_srd / v_to_rate;         -- bedrag dat de ontvanger krijgt

  perform 1 from wallets
  where id in (p_sender_wallet_id, p_receiver_wallet_id)
  order by id for update;

  -- Bron-saldo verzender.
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

  -- Ontvanger + tier.
  select w.id, w.received_this_year, w.year_reset_at, t.annual_receive_limit, t.max_balance
    into v_receiver_id, v_received, v_year_reset, v_annual, v_max
  from wallets w left join kyc_tiers t on t.name = w.tier
  where w.id = p_receiver_wallet_id;
  if v_receiver_id is null then
    return json_build_object('success', false, 'error', 'Ontvanger wallet niet gevonden');
  end if;

  if v_year_reset is null
     or extract(year from v_year_reset) < extract(year from current_date) then
    v_base := 0; v_new_reset := current_date;
  else
    v_base := coalesce(v_received, 0); v_new_reset := v_year_reset;
  end if;

  -- Jaarlimiet op SRD-tegenwaarde.
  if v_annual is not null and (v_base + v_srd) > v_annual then
    return json_build_object('success', false,
      'error', 'Ontvanger overschrijdt de jaarlijkse ontvangstlimiet van zijn KYC-niveau');
  end if;

  -- Max saldo op SRD-tegenwaarde van de doel-pocket na bijschrijving.
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

  -- Debiteer bron.
  if p_from_currency = 'SRD' then
    update wallets set balance = balance - p_from_amount, updated_at = now()
      where id = p_sender_wallet_id;
  else
    update wallet_balances set balance = balance - p_from_amount, updated_at = now()
      where wallet_id = p_sender_wallet_id and currency = p_from_currency;
  end if;

  -- Crediteer doel.
  if p_to_currency = 'SRD' then
    update wallets set balance = balance + v_to_amount, updated_at = now()
      where id = p_receiver_wallet_id;
  else
    insert into wallet_balances (wallet_id, currency, balance)
    values (p_receiver_wallet_id, p_to_currency, v_to_amount)
    on conflict (wallet_id, currency)
      do update set balance = wallet_balances.balance + excluded.balance, updated_at = now();
  end if;

  -- Jaarteller ontvanger (+= SRD-tegenwaarde).
  update wallets set received_this_year = v_base + v_srd, year_reset_at = v_new_reset,
    updated_at = now()
    where id = p_receiver_wallet_id;

  insert into transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  values (
    p_sender_wallet_id, p_receiver_wallet_id, v_srd, 'send', 'completed',
    coalesce(p_description,
      format('%s %s → %s %s', p_from_currency, p_from_amount, p_to_currency, round(v_to_amount, 2)))
  )
  returning id into v_txid;

  return json_build_object('success', true, 'transaction_id', v_txid, 'to_amount', v_to_amount);
end;
$$;

revoke execute on function public.transfer_money_fx(uuid, uuid, text, text, numeric, text) from public, anon, authenticated;
grant  execute on function public.transfer_money_fx(uuid, uuid, text, text, numeric, text) to service_role;
