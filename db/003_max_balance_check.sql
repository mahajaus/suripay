-- ============================================================
-- SuriPay — transfer_money: tier-checks voor de ontvanger
-- Voer dit uit na 001_kyc_tiers.sql (vereist kyc_tiers + de extra
-- wallets-kolommen) en na de aanwezige transfer_money-functie.
-- Idempotent: CREATE OR REPLACE vervangt de functie volledig.
--
-- Toevoegingen t.o.v. de basis-transfer:
--   1. Jaarreset van received_this_year bij een nieuw kalenderjaar.
--   2. Controle tegen annual_receive_limit van de tier van de ontvanger.
--   3. Controle tegen max_balance van de tier van de ontvanger.
--   4. Ophogen van received_this_year bij een geslaagde overboeking.
-- Alle checks gebeuren vóór de debet/credit, zodat een geweigerde
-- overboeking geen enkele bijwerking achterlaat.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_money(p_sender_wallet_id uuid, p_receiver_wallet_id uuid, p_amount numeric, p_description text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_sender_balance DECIMAL;
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
  SELECT balance INTO v_sender_balance
  FROM wallets WHERE id = p_sender_wallet_id FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Verzender wallet niet gevonden');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Onvoldoende saldo');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Ongeldig bedrag');
  END IF;

  -- Ontvanger locken en tier-gegevens ophalen (vóór enige bij-/afschrijving).
  SELECT w.id, w.balance, w.received_this_year, w.year_reset_at,
         t.annual_receive_limit, t.max_balance
    INTO v_receiver_id, v_receiver_balance, v_received_this_year, v_year_reset_at,
         v_annual_limit, v_max_balance
  FROM wallets w
  LEFT JOIN kyc_tiers t ON t.name = w.tier
  WHERE w.id = p_receiver_wallet_id
  FOR UPDATE OF w;

  IF v_receiver_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Ontvanger wallet niet gevonden');
  END IF;

  -- Jaarreset: nieuw kalenderjaar (of nog nooit gereset) => teller weer op 0.
  IF v_year_reset_at IS NULL
     OR EXTRACT(YEAR FROM v_year_reset_at) < EXTRACT(YEAR FROM CURRENT_DATE) THEN
    v_base_received := 0;
    v_new_year_reset_at := CURRENT_DATE;
  ELSE
    v_base_received := COALESCE(v_received_this_year, 0);
    v_new_year_reset_at := v_year_reset_at;
  END IF;

  -- Limietcontrole tegen de jaarlijkse ontvangstlimiet van de tier van de ontvanger.
  IF v_annual_limit IS NOT NULL AND (v_base_received + p_amount) > v_annual_limit THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ontvanger overschrijdt de jaarlijkse ontvangstlimiet van zijn KYC-niveau'
    );
  END IF;

  -- Saldocontrole: ontvanger mag na de transfer het max saldo van zijn tier niet overschrijden.
  IF v_max_balance IS NOT NULL AND (COALESCE(v_receiver_balance, 0) + p_amount) > v_max_balance THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ontvanger overschrijdt het maximale saldo van zijn KYC-niveau'
    );
  END IF;

  UPDATE wallets SET balance = balance - p_amount, updated_at = NOW()
  WHERE id = p_sender_wallet_id;

  UPDATE wallets SET balance = balance + p_amount, updated_at = NOW()
  WHERE id = p_receiver_wallet_id;

  -- Jaarteller van de ontvanger ophogen (en year_reset_at zetten bij een reset).
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
