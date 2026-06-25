-- ============================================================
-- SuriPay — get_my_transactions: dubbele overload opheffen
-- Voer dit uit na 013.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Probleem: db/013 maakte een get_my_transactions(uuid), terwijl de originele
-- get_my_transactions(uuid, integer) bleef bestaan. De client roept aan met
-- alleen p_wallet_id → PostgREST kan niet kiezen:
--   "Could not choose the best candidate function between ...".
--
-- Oplossing: BEIDE varianten droppen en één functie maken met een optionele
-- p_limit (default), zodat de aanroep met alleen p_wallet_id eenduidig is.
-- ============================================================

drop function if exists public.get_my_transactions(uuid);
drop function if exists public.get_my_transactions(uuid, integer);

create function public.get_my_transactions(
  p_wallet_id uuid,
  p_limit integer default 200
)
returns table (
  id          uuid,
  direction   text,
  other_party text,
  amount      numeric,
  description text,
  created_at  timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    t.id,
    case when t.sender_wallet_id = p_wallet_id then 'out' else 'in' end as direction,
    coalesce(
      other_u.raw_user_meta_data ->> 'full_name',
      other_u.email,
      'SuriPay'
    ) as other_party,
    t.amount,
    t.description,
    t.created_at
  from public.transactions t
  left join public.wallets other_w
    on other_w.id = case
         when t.sender_wallet_id = p_wallet_id then t.receiver_wallet_id
         else t.sender_wallet_id
       end
  left join auth.users other_u on other_u.id = other_w.user_id
  where t.sender_wallet_id = p_wallet_id
     or t.receiver_wallet_id = p_wallet_id
  order by t.created_at desc
  limit p_limit;
$$;

grant execute on function public.get_my_transactions(uuid, integer) to authenticated, service_role;
