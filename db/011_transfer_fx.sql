-- ============================================================
-- SuriPay — Cross-currency overmaken (remittance)
-- Voer dit uit na 010.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- transfer_money_fx: verzender betaalt vanuit een bron-valuta (SRD/EUR/USD…),
-- ontvanger ontvangt altijd SRD (de dominante diaspora-case: EUR → SRD).
-- KYC-limieten (max saldo, jaarlijkse ontvangst) gelden op de SRD-tegenwaarde.
-- Alleen de service-role mag dit aanroepen (zoals transfer_money).
-- ============================================================

create or replace function public.transfer_money_fx(
  p_sender_wallet_id uuid,
  p_receiver_wallet_id uuid,
  p_from_currency text,
  p_from_amount numeric,
  p_description text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric;
  v_srd numeric;
  v_sender_bal numeric;
  v_receiver_id uuid;
  v_receiver_balance numeric;
  v_received numeric;
  v_year_reset date;
  v_annual numeric;
  v_max numeric;
  v_base numeric;
  v_new_reset date;
  v_txid uuid;
begin
  if p_from_amount is null or p_from_amount <= 0 then
    return json_build_object('success', false, 'error', 'Ongeldig bedrag');
  end if;
  if p_sender_wallet_id = p_receiver_wallet_id then
    return json_build_object('success', false, 'error', 'Je kunt geen geld naar jezelf sturen');
  end if;

  select srd_per_unit into v_rate from currencies where code = p_from_currency and enabled;
  if v_rate is null then
    return json_build_object('success', false, 'error', 'Onbekende of uitgeschakelde valuta');
  end if;
  v_srd := p_from_amount * v_rate;  -- SRD-tegenwaarde die de ontvanger krijgt

  -- Beide wallets in vaste volgorde locken (deadlock-preventie).
  perform 1 from wallets
  where id in (p_sender_wallet_id, p_receiver_wallet_id)
  order by id for update;

  -- Bron-saldo van de verzender.
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
  select w.id, w.balance, w.received_this_year, w.year_reset_at,
         t.annual_receive_limit, t.max_balance
    into v_receiver_id, v_receiver_balance, v_received, v_year_reset, v_annual, v_max
  from wallets w
  left join kyc_tiers t on t.name = w.tier
  where w.id = p_receiver_wallet_id;
  if v_receiver_id is null then
    return json_build_object('success', false, 'error', 'Ontvanger wallet niet gevonden');
  end if;

  -- Jaarreset ontvangstteller.
  if v_year_reset is null
     or extract(year from v_year_reset) < extract(year from current_date) then
    v_base := 0; v_new_reset := current_date;
  else
    v_base := coalesce(v_received, 0); v_new_reset := v_year_reset;
  end if;

  -- KYC-limieten op SRD-tegenwaarde.
  if v_annual is not null and (v_base + v_srd) > v_annual then
    return json_build_object('success', false,
      'error', 'Ontvanger overschrijdt de jaarlijkse ontvangstlimiet van zijn KYC-niveau');
  end if;
  if v_max is not null and (coalesce(v_receiver_balance, 0) + v_srd) > v_max then
    return json_build_object('success', false,
      'error', 'Ontvanger overschrijdt het maximale saldo van zijn KYC-niveau');
  end if;

  -- Debiteer bron-valuta verzender.
  if p_from_currency = 'SRD' then
    update wallets set balance = balance - p_from_amount, updated_at = now()
      where id = p_sender_wallet_id;
  else
    update wallet_balances set balance = balance - p_from_amount, updated_at = now()
      where wallet_id = p_sender_wallet_id and currency = p_from_currency;
  end if;

  -- Crediteer ontvanger in SRD + ophogen jaarteller.
  update wallets set balance = balance + v_srd, updated_at = now()
    where id = p_receiver_wallet_id;
  update wallets set received_this_year = v_base + v_srd, year_reset_at = v_new_reset,
    updated_at = now()
    where id = p_receiver_wallet_id;

  insert into transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  values (
    p_sender_wallet_id, p_receiver_wallet_id, v_srd, 'send', 'completed',
    coalesce(p_description,
      format('%s %s → SRD %s', p_from_currency, p_from_amount, round(v_srd, 2)))
  )
  returning id into v_txid;

  return json_build_object('success', true, 'transaction_id', v_txid, 'srd_amount', v_srd);
end;
$$;

revoke execute on function public.transfer_money_fx(uuid, uuid, text, numeric, text) from public, anon, authenticated;
grant  execute on function public.transfer_money_fx(uuid, uuid, text, numeric, text) to service_role;
