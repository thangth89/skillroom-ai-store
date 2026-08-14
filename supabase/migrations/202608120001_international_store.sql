alter table public.skills
  add column if not exists name_en text,
  add column if not exists eyebrow_en text,
  add column if not exists short_description_en text,
  add column if not exists description_en text,
  add column if not exists category_en text,
  add column if not exists price_usd_cents integer,
  add column if not exists is_free boolean not null default false,
  add column if not exists lemon_checkout_url text,
  add column if not exists deliverables_en jsonb not null default '[]'::jsonb,
  add column if not exists outcomes_en jsonb not null default '[]'::jsonb,
  add column if not exists requirements_en jsonb not null default '[]'::jsonb;

alter table public.skills
  drop constraint if exists skills_price_usd_cents_nonnegative;

alter table public.skills
  add constraint skills_price_usd_cents_nonnegative
  check (price_usd_cents is null or price_usd_cents >= 0);

create index if not exists skills_international_catalog_idx
  on public.skills (status, is_free, sort_order, created_at)
  where name_en is not null and name_en <> '';
