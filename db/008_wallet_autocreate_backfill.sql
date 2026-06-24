-- ============================================================
-- SuriPay — Wallet auto-aanmaak + backfill
-- Voer dit uit na 007_currencies.sql.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Probleem: de Next.js-registratie roept alleen auth.signUp aan en vertrouwt
-- op een trigger om de wallet te maken. Als die trigger ontbreekt, hebben
-- accounts géén wallet en kunnen ze geen geld ontvangen
-- ("Geen gebruiker gevonden met dit e-mailadres").
--
-- Deze migratie:
--   1. (her)installeert de trigger die bij elke nieuwe auth-gebruiker een
--      wallet aanmaakt;
--   2. vult ontbrekende wallets aan voor bestaande gebruikers;
--   3. zet (indien mogelijk) een unieke constraint op wallets.user_id.
-- ============================================================

-- ------------------------------------------------------------
-- Stap 1 — Trigger-functie (zonder afhankelijkheid van een unieke constraint)
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.wallets where user_id = new.id) then
    insert into public.wallets (user_id) values (new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Stap 2 — Backfill: wallet voor elke bestaande gebruiker zonder wallet
-- ------------------------------------------------------------
insert into public.wallets (user_id)
select u.id
from auth.users u
left join public.wallets w on w.user_id = u.id
where w.id is null;

-- ------------------------------------------------------------
-- Stap 3 — Unieke constraint op user_id (alleen als er geen duplicaten zijn)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'wallets_user_id_key'
  ) and not exists (
    select 1 from public.wallets group by user_id having count(*) > 1
  ) then
    alter table public.wallets add constraint wallets_user_id_key unique (user_id);
  end if;
end $$;
