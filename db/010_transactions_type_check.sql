-- ============================================================
-- SuriPay — Fix transactions.type check-constraint
-- Voer dit uit na 009.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Probleem: de bestaande transactions_type_check stond de nieuwe types niet
-- toe. admin_debit_wallet/admin_credit_wallet (db/006) schrijven 'cashout' en
-- 'topup', waardoor /opnemen faalde met:
--   "new row for relation transactions violates check constraint
--    transactions_type_check".
--
-- Oplossing: vervang de constraint door één die alle gebruikte server-types
-- toestaat. NOT VALID → bestaande rijen worden niet opnieuw gevalideerd,
-- nieuwe inserts wél.
-- ============================================================

alter table public.transactions
  drop constraint if exists transactions_type_check;

alter table public.transactions
  add constraint transactions_type_check
  check (type in ('send', 'receive', 'topup', 'cashout', 'exchange'))
  not valid;
