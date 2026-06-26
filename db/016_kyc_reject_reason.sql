-- ============================================================
-- SuriPay — KYC afwijs-reden
-- Voer dit uit na 015.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Admin kan een KYC-inzending afwijzen mét reden; de gebruiker ziet die op /kyc.
-- ============================================================

alter table public.kyc_submissions
  add column if not exists reject_reason text;
