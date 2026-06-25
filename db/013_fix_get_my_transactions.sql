-- ============================================================
-- SuriPay — Fix get_my_transactions
-- Voer dit uit na 012.
-- Idempotent: veilig opnieuw uit te voeren.
--
-- Probleem: get_my_transactions gaf "structure of query does not match
-- function result type" → de transactiegeschiedenis bleef leeg.
-- Zelfde oorzaak als bij find_wallet_by_email (db/009): de functie was
-- gedefinieerd op een rowtype dat niet meer klopt.
--
-- Oplossing: herdefinieer met een expliciete TABLE-structuur die de client
-- verwacht: id, direction ('in'|'out'), other_party, amount, description,
-- created_at.
-- ============================================================

-- Return-type wijzigen kan niet met CREATE OR REPLACE → eerst droppen.
drop function if exists public.get_my_transactions(uuid);

create function public.get_my_transactions(p_wallet_id uuid)
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
  order by t.created_at desc;
$$;

grant execute on function public.get_my_transactions(uuid) to authenticated, service_role;
