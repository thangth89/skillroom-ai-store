alter table public.skills
  add column if not exists discount_percent_vn integer not null default 0,
  add column if not exists discount_percent_international integer not null default 0;

alter table public.skills
  drop constraint if exists skills_discount_percent_vn_range,
  drop constraint if exists skills_discount_percent_international_range;

alter table public.skills
  add constraint skills_discount_percent_vn_range
    check (discount_percent_vn between 0 and 99),
  add constraint skills_discount_percent_international_range
    check (discount_percent_international between 0 and 99);
