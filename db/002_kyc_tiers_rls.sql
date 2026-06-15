-- ============================================================
-- SuriPay — RLS-policy voor kyc_tiers
-- Voer dit uit na 001_kyc_tiers.sql.
-- Ingelogde gebruikers mogen lezen; niemand mag via de client wijzigen.
-- Alleen de service-role (server-side) kan tiers nog aanpassen.
-- Idempotent: veilig opnieuw uit te voeren.
-- ============================================================

alter table public.kyc_tiers enable row level security;

drop policy if exists "kyc_tiers_select_authenticated" on public.kyc_tiers;
create policy "kyc_tiers_select_authenticated"
  on public.kyc_tiers
  for select
  to authenticated
  using (true);
