-- Vision Grid — profile: display name + emoji avatar
--
-- Emoji avatars deliberately over image uploads: no storage bucket, no signed
-- URLs, no moderation surface, and one short text column syncs everywhere for
-- free. The colour is stored so two people picking 🎯 still look different.

alter table public.profiles
  add column if not exists avatar_emoji text,
  add column if not exists avatar_color text;

-- Keep the values sane at the database level, not just in the UI.
-- (A grapheme cluster like 👨‍👩‍👧 is several code points, so cap on length
--  rather than trying to validate "is one emoji".)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'avatar_emoji_short'
  ) then
    alter table public.profiles
      add constraint avatar_emoji_short check (avatar_emoji is null or length(avatar_emoji) <= 16);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'avatar_color_hex'
  ) then
    alter table public.profiles
      add constraint avatar_color_hex check (avatar_color is null or avatar_color ~ '^#[0-9a-fA-F]{6}$');
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'display_name_len'
  ) then
    alter table public.profiles
      add constraint display_name_len check (display_name is null or length(display_name) <= 40);
  end if;
end $$;

-- The user must be able to edit their own profile. The original schema only
-- granted select/insert, so display_name was effectively read-only.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- friend_summary must return the avatar so the Together list can draw it
-- without a second round trip per friend.
-- Postgres cannot change a function's OUT columns in place, so drop first.
drop function if exists public.friend_summary();
create or replace function public.friend_summary()
returns table (
  friend_id     uuid,
  display_name  text,
  avatar_emoji  text,
  avatar_color  text,
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
    pr.avatar_emoji,
    pr.avatar_color,
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

-- Nudges should show who sent them. Returning the sender's profile inline
-- avoids the client needing a readable-profiles policy for non-friends.
drop function if exists public.my_nudges();
create or replace function public.my_nudges()
returns table (
  id           uuid,
  from_id      uuid,
  from_name    text,
  from_emoji   text,
  from_color   text,
  task_id      text,
  task_title   text,
  message      text,
  created_at   timestamptz,
  read_at      timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select n.id, n.from_id, pr.display_name, pr.avatar_emoji, pr.avatar_color,
         n.task_id, n.task_title, n.message, n.created_at, n.read_at
  from public.nudges n
  left join public.profiles pr on pr.id = n.from_id
  where n.to_id = auth.uid()
  order by n.created_at desc
  limit 50;
$$;
