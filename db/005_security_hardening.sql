-- ============================================================
-- SuriPay — Beveiligingshardening (beta)
-- Voer dit uit na 003_max_balance_check.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Inhoud:
--   1. transfer_money mag NIET meer rechtstreeks door de client worden
--      aangeroepen — alleen via de server (service-role). Zo kan de
--      PIN-check op /api/transfers/send niet worden omzeild.
--   2. transfer_money hardening: vaste search_path, self-transfer-guard,
--      bedrag-check vóór saldocheck, deterministische lock-volgorde
--      (deadlock-preventie). Tier-checks uit 003 blijven behouden.
--   3. PIN brute-force: tellers op wallets voor lockout.
-- ============================================================

-- ------------------------------------------------------------
-- Stap 1 — PIN-lockout kolommen
-- ------------------------------------------------------------
alter table public.wallets
  add column if not exists failed_pin_attempts integer not null default 0,
  add column if not exists pin_locked_until     timestamptz;

-- ------------------------------------------------------------
-- Stap 2 — transfer_money opnieuw, gehard
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_money(
  p_sender_wallet_id uuid,
  p_receiver_wallet_id uuid,
  p_amount numeric,
  p_description text DEFAULT NULL::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE
  v_sender_balance NUMERIC;
  v_transaction_id UUID;
  v_receiver_id UUID;
  v_receiver_balance NUMERIC;
  v_received_this_year NUMERIC;
  v_year_reset_at DATE;
  v_annual_limit NUMERIC;
  v_max_balance NUMERIC;
  v_base_received NUMERIC;
  v_new_year_reset_at DATE;
BEGIN
  -- Bedrag- en self-transfer-checks eerst (vóór enige lock/bijwerking).
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ongeldig bedrag');
  END IF;

  IF p_sender_wallet_id = p_receiver_wallet_id THEN
    RETURN json_build_object('success', false, 'error', 'Je kunt geen geld naar jezelf sturen');
  END IF;

  -- Beide wallets in vaste volgorde (op id) locken → geen deadlocks bij
  -- gelijktijdige tegenovergestelde overboekingen.
  PERFORM 1 FROM wallets
  WHERE id IN (p_sender_wallet_id, p_receiver_wallet_id)
  ORDER BY id
  FOR UPDATE;

  SELECT balance INTO v_sender_balance
  FROM wallets WHERE id = p_sender_wallet_id;

  IF v_sender_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Verzender wallet niet gevonden');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Onvoldoende saldo');
  END IF;

  -- Ontvanger + tier-gegevens.
  SELECT w.id, w.balance, w.received_this_year, w.year_reset_at,
         t.annual_receive_limit, t.max_balance
    INTO v_receiver_id, v_receiver_balance, v_received_this_year, v_year_reset_at,
         v_annual_limit, v_max_balance
  FROM wallets w
  LEFT JOIN kyc_tiers t ON t.name = w.tier
  WHERE w.id = p_receiver_wallet_id;

  IF v_receiver_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ontvanger wallet niet gevonden');
  END IF;

  -- Jaarreset van de ontvangstteller.
  IF v_year_reset_at IS NULL
     OR EXTRACT(YEAR FROM v_year_reset_at) < EXTRACT(YEAR FROM CURRENT_DATE) THEN
    v_base_received := 0;
    v_new_year_reset_at := CURRENT_DATE;
  ELSE
    v_base_received := COALESCE(v_received_this_year, 0);
    v_new_year_reset_at := v_year_reset_at;
  END IF;

  -- Jaarlijkse ontvangstlimiet van de tier van de ontvanger.
  IF v_annual_limit IS NOT NULL AND (v_base_received + p_amount) > v_annual_limit THEN
    RETURN json_build_object('success', false,
      'error', 'Ontvanger overschrijdt de jaarlijkse ontvangstlimiet van zijn KYC-niveau');
  END IF;

  -- Maximaal saldo van de tier van de ontvanger.
  IF v_max_balance IS NOT NULL AND (COALESCE(v_receiver_balance, 0) + p_amount) > v_max_balance THEN
    RETURN json_build_object('success', false,
      'error', 'Ontvanger overschrijdt het maximale saldo van zijn KYC-niveau');
  END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_sender_wallet_id;

  UPDATE wallets SET balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_receiver_wallet_id;

  UPDATE wallets
  SET received_this_year = v_base_received + p_amount,
      year_reset_at = v_new_year_reset_at,
      updated_at = NOW()
  WHERE id = p_receiver_wallet_id;

  INSERT INTO transactions (sender_wallet_id, receiver_wallet_id, amount, type, status, description)
  VALUES (p_sender_wallet_id, p_receiver_wallet_id, p_amount, 'send', 'completed', p_description)
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$function$;

-- ------------------------------------------------------------
-- Stap 3 — Directe client-toegang tot transfer_money intrekken.
-- Alleen de service-role (server-side) mag de functie nog uitvoeren.
-- find_wallet_by_email en get_my_transactions blijven client-aanroepbaar.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.transfer_money(uuid, uuid, numeric, text) FROM public;
REVOKE EXECUTE ON FUNCTION public.transfer_money(uuid, uuid, numeric, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_money(uuid, uuid, numeric, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_money(uuid, uuid, numeric, text) TO service_role;
