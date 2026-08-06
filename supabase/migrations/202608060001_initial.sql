create extension if not exists pgcrypto;

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  eyebrow text not null default '',
  short_description text not null default '',
  description text not null default '',
  price integer not null check (price >= 0),
  category text not null,
  version text not null default '1.0',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  video_url text,
  file_path text,
  accent text,
  accent_soft text,
  featured boolean not null default false,
  deliverables jsonb not null default '[]'::jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  requirements jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_email text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'cancelled', 'expired', 'refunded')),
  currency text not null default 'VND',
  subtotal integer not null check (subtotal >= 0),
  total integer not null check (total >= 0),
  payos_order_code bigint unique,
  payos_payment_link_id text,
  checkout_url text,
  qr_code_data text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  skill_id uuid references public.skills(id) on delete set null,
  skill_name text not null,
  skill_slug text not null,
  version text not null,
  file_path text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'payos',
  provider_reference text,
  amount integer not null check (amount >= 0),
  status text not null,
  webhook_payload jsonb,
  created_at timestamptz not null default now()
);

create table public.download_tokens (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  download_count integer not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now()
);

create index orders_customer_email_idx on public.orders (lower(customer_email));
create index orders_status_created_at_idx on public.orders (status, created_at desc);
create index order_items_order_id_idx on public.order_items (order_id);
create index payments_order_id_idx on public.payments (order_id);
create index download_tokens_expires_at_idx on public.download_tokens (expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger skills_set_updated_at
before update on public.skills
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

alter table public.skills enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.download_tokens enable row level security;

revoke all on public.skills from anon, authenticated;
revoke all on public.orders from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.download_tokens from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on public.skills to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;
grant select, insert, update, delete on public.payments to service_role;
grant select, insert, update, delete on public.download_tokens to service_role;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;

-- Không tạo policy public: ứng dụng chỉ đọc/ghi các bảng này từ server.
-- SUPABASE_SECRET_KEY phải luôn là biến môi trường bí mật phía server.
