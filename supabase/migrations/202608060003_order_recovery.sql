alter table public.orders
  add column if not exists transfer_content text;

update public.orders
set transfer_content = 'SK' || right(payos_order_code::text, 12)
where transfer_content is null
  and payos_order_code is not null;

create index if not exists orders_transfer_content_idx
  on public.orders (upper(transfer_content));

create or replace function public.search_admin_orders(search_term text)
returns setof public.orders
language sql
stable
security invoker
set search_path = ''
as $$
  select order_row.*
  from public.orders as order_row
  where length(trim(search_term)) between 2 and 120
    and (
      lower(order_row.order_code) like '%' || lower(trim(search_term)) || '%'
      or lower(order_row.customer_email) like '%' || lower(trim(search_term)) || '%'
      or upper(regexp_replace(coalesce(order_row.transfer_content, ''), '\s', '', 'g'))
        like '%' || upper(regexp_replace(trim(search_term), '\s', '', 'g')) || '%'
      or (
        regexp_replace(search_term, '\D', '', 'g') <> ''
        and order_row.payos_order_code::text
          like '%' || regexp_replace(search_term, '\D', '', 'g') || '%'
      )
    )
  order by order_row.created_at desc
  limit 100;
$$;

revoke all on function public.search_admin_orders(text) from public, anon, authenticated;
grant execute on function public.search_admin_orders(text) to service_role;
