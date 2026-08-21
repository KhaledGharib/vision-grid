-- Vision Grid — nudges (step 3)
--
-- A nudge points at ONE specific task on a friend's board. The daily budget is
-- enforced in the database, not the client, so it cannot be bypassed by
-- calling the API directly.

create table if not exists public.nudges (
  id           uuid primary key default gen_random_uuid(),
  from_id      uuid not null references auth.users(id) on delete cascade,
  to_id        uuid not null references auth.users(id) on delete cascade,
  -- the task this is about, by id from the friend's state document
  task_id      text not null,
  task_title   text not null,          -- denormalised so the inbox reads standalone
  message      text,                   -- optional, short
  created_at   timestamptz not null default now(),
  read_at      timestamptz,
  constraint no_self_nudge check (from_id <> to_id)
);

create index if not exists nudges_to   on public.nudges(to_id, created_at desc);
create index if not exists nudges_from on public.nudges(from_id, created_at desc);

alter table public.nudges enable row level security;

-- sender and recipient can both see it (sender needs to know it landed)
drop policy if exists "see own nudges" on public.nudges;
create policy "see own nudges" on public.nudges
  for select using (auth.uid() = from_id or auth.uid() = to_id);

-- Only the recipient may mark read. Restricting them to the read_at COLUMN
-- needs a column grant, not a policy — see hardening.sql.
drop policy if exists "mark nudge read" on public.nudges;
create policy "mark nudge read" on public.nudges
  for update
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

-- sender may withdraw; recipient may dismiss
drop policy if exists "delete own nudges" on public.nudges;
create policy "delete own nudges" on public.nudges
  for delete using (auth.uid() = from_id or auth.uid() = to_id);

-- ============ send_nudge: budget + friendship enforced server-side ============

create or replace function public.send_nudge(
  p_to uuid, p_task_id text, p_task_title text, p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_id    uuid;
  c_daily_budget constant int := 3;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if p_to = auth.uid() then
    raise exception 'cannot_nudge_self';
  end if;

  -- must be accepted friends in either direction
  if not public.are_friends(auth.uid(), p_to) then
    raise exception 'not_friends';
  end if;

  -- budget is per sender per recipient per day: enough to be useful,
  -- not enough to be spam
  select count(*) into v_count
  from public.nudges
  where from_id = auth.uid()
    and to_id = p_to
    and created_at >= (now() - interval '24 hours');

  if v_count >= c_daily_budget then
    raise exception 'daily_budget_exhausted';
  end if;

  insert into public.nudges (from_id, to_id, task_id, task_title, message)
  values (auth.uid(), p_to, p_task_id, left(coalesce(p_task_title, ''), 200),
          left(nullif(trim(coalesce(p_message, '')), ''), 240))
  returning id into v_id;

  return v_id;
end;
$$;

-- ============ nudges_left_today: so the UI can show the remaining budget ============

create or replace function public.nudges_left_today(p_to uuid)
returns int
language sql
security definer
stable
set search_path = public
as $$
  select greatest(0, 3 - count(*)::int)
  from public.nudges
  where from_id = auth.uid()
    and to_id = p_to
    and created_at >= (now() - interval '24 hours');
$$;

-- ============ friend_summary: progress without shipping the whole document ============
-- Returns just the counts, so a "Circle" list is one cheap call instead of
-- downloading every friend's full board.

create or replace function public.friend_summary()
returns table (
  friend_id     uuid,
  display_name  text,
  updated_at    timestamptz,
  visions       int,
  tasks_today   int,
  done_today    int
)
language sql
security definer
stable
set search_path = public
as $$
  with pals as (
    select case when f.a_id = auth.uid() then f.b_id else f.a_id end as uid
    from public.friendships f
    where f.status = 'accepted'
      and (f.a_id = auth.uid() or f.b_id = auth.uid())
  )
  select
    p.uid,
    pr.display_name,
    bs.updated_at,
    (select count(*)::int
       from jsonb_array_elements(coalesce(bs.state->'elements', '[]'::jsonb)) e
      where e->>'kind' = 'vision') as visions,
    (select count(*)::int from jsonb_array_elements(coalesce(bs.state->'tasks','[]'::jsonb)) t
       where t->>'date' = to_char(now(), 'YYYY-MM-DD')) as tasks_today,
    (select count(*)::int from jsonb_array_elements(coalesce(bs.state->'tasks','[]'::jsonb)) t
       where t->>'date' = to_char(now(), 'YYYY-MM-DD') and (t->>'done')::boolean) as done_today
  from pals p
  left join public.profiles pr on pr.id = p.uid
  left join public.boards_state bs on bs.user_id = p.uid;
$$;
