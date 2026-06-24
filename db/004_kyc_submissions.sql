-- ============================================================
-- SuriPay — KYC-verificatie inzendingen (selfie + ID) + opslag
-- Voer dit uit na 001_kyc_tiers.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- LET OP: dit slaat alleen de INZENDING op (status 'pending').
-- Het daadwerkelijk goedkeuren en ophogen van wallets.tier hoort
-- server-side te gebeuren (admin of IDV-provider via service-role),
-- nooit vanuit de client.
-- ============================================================

create table if not exists public.kyc_submissions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  requested_tier text references public.kyc_tiers (name),
  status         text not null default 'pending', -- pending | approved | rejected
  selfie_path    text,
  id_doc_path    text,
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz
);

create index if not exists kyc_submissions_user_idx
  on public.kyc_submissions (user_id);

alter table public.kyc_submissions enable row level security;

-- Een gebruiker mag alleen zijn eigen inzendingen zien en aanmaken.
drop policy if exists "kyc_sub_select_own" on public.kyc_submissions;
create policy "kyc_sub_select_own" on public.kyc_submissions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "kyc_sub_insert_own" on public.kyc_submissions;
create policy "kyc_sub_insert_own" on public.kyc_submissions
  for insert to authenticated with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Privé opslag-bucket voor KYC-afbeeldingen (selfie + ID).
-- Bestanden komen in een map per gebruiker: <uid>/<bestand>.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('kyc', 'kyc', false)
on conflict (id) do nothing;

drop policy if exists "kyc_upload_own" on storage.objects;
create policy "kyc_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kyc'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "kyc_read_own" on storage.objects;
create policy "kyc_read_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'kyc'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
