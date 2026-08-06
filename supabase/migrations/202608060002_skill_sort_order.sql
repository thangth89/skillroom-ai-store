alter table public.skills
add column if not exists sort_order integer;

with ranked_skills as (
  select
    id,
    row_number() over (
      order by featured desc, updated_at desc, id
    ) - 1 as position
  from public.skills
)
update public.skills as skill
set sort_order = ranked.position
from ranked_skills as ranked
where skill.id = ranked.id
  and skill.sort_order is null;

alter table public.skills
alter column sort_order set default 0;

alter table public.skills
alter column sort_order set not null;

alter table public.skills
drop constraint if exists skills_sort_order_nonnegative;

alter table public.skills
add constraint skills_sort_order_nonnegative check (sort_order >= 0);

create index if not exists skills_sort_order_idx
on public.skills (sort_order, created_at, id);

create or replace function public.reorder_skills(skill_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  supplied_count integer;
  unique_count integer;
  stored_count integer;
begin
  supplied_count := coalesce(cardinality(skill_ids), 0);

  if supplied_count = 0 or supplied_count > 500 then
    raise exception 'Invalid skill order size';
  end if;

  select count(distinct item.id)
  into unique_count
  from unnest(skill_ids) as item(id);

  if unique_count <> supplied_count then
    raise exception 'Duplicate skill ids';
  end if;

  select count(*)
  into stored_count
  from public.skills
  where id = any(skill_ids);

  if stored_count <> supplied_count then
    raise exception 'Unknown skill id';
  end if;

  update public.skills as skill
  set sort_order = (ordered.position - 1)::integer
  from unnest(skill_ids) with ordinality as ordered(id, position)
  where skill.id = ordered.id;
end;
$$;

revoke all on function public.reorder_skills(uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_skills(uuid[]) to service_role;
