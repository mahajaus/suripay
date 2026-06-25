-- ============================================================
-- SuriPay — Fix find_wallet_by_email
-- Voer dit uit na 008.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Probleem: de live find_wallet_by_email gaf de fout
--   "structure of query does not match function result type".
-- De oude functie gaf waarschijnlijk het wallets-rowtype terug; sinds er
-- kolommen aan wallets zijn toegevoegd (db/005) klopt die structuur niet meer,
-- waardoor élke ontvanger-zoekopdracht faalt ("Geen gebruiker gevonden").
--
-- Oplossing: herdefinieer als JSON-functie met een vaste vorm die de client
-- al verwacht: { found, wallet_id, full_name }.
-- ============================================================

-- Return-type wijzigen kan niet met CREATE OR REPLACE → eerst droppen.
drop function if exists public.find_wallet_by_email(text);

create function public.find_wallet_by_email(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet_id uuid;
  v_full_name text;
begin
  select w.id, u.raw_user_meta_data ->> 'full_name'
    into v_wallet_id, v_full_name
  from auth.users u
  join public.wallets w on w.user_id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;

  if v_wallet_id is null then
    return json_build_object('found', false);
  end if;

  return json_build_object(
    'found', true,
    'wallet_id', v_wallet_id,
    'full_name', coalesce(v_full_name, p_email)
  );
end;
$$;

grant execute on function public.find_wallet_by_email(text) to authenticated, service_role;
