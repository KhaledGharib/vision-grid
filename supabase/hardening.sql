-- Vision Grid — hardening (step 5)
--
-- Everything in here closes a hole found in review rather than adding a
-- feature. Every statement is idempotent, so it is safe to re-run.

-- ==================================================================
-- 1. UPDATE policies could not pin the identity columns
-- ==================================================================
--
-- An UPDATE policy written with only USING reuses that same expression as its
-- WITH CHECK, and WITH CHECK can only see the NEW row. So
--
--     for update using (auth.uid() = b_id)
--
-- let the RECIPIENT of a friendship rewrite a_id to any account they liked and
-- still pass the check, because b_id never moved. That mints an 'accepted'
-- friendship with a stranger, which are_friends() honours, which grants read
-- on that stranger's entire boards_state and every vision image they own.
--
-- RLS has no way to say "this column is immutable", so the fix is a
-- column-level grant: the authenticated role simply holds no UPDATE privilege
-- on the identity columns. The security definer functions are unaffected,
-- because they run as the owner.

revoke update on public.friendships from authenticated;
grant update (status, accepted_at) on public.friendships to authenticated;

drop policy if exists "respond to friendship" on public.friendships;
create policy "respond to friendship" on public.friendships
  for update
  using (auth.uid() = b_id)
  with check (auth.uid() = b_id and status in ('accepted', 'declined'));

-- Same shape on nudges. Without the column grant the recipient could rewrite
-- from_id, task_title or message on a nudge somebody else sent them, and the
-- sender would then see the altered text.
revoke update on public.nudges from authenticated;
grant update (read_at) on public.nudges to authenticated;

drop policy if exists "mark nudge read" on public.nudges;
create policy "mark nudge read" on public.nudges
  for update
  using (auth.uid() = to_id)
  with check (auth.uid() = to_id);

-- profiles: the policy in schema.sql had no WITH CHECK either. Here id cannot
-- be moved to another account (the check pins it), but state it explicitly.
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- ==================================================================
-- 2. invite codes: a real format, a real expiry, and pruning
-- ==================================================================

-- Codes are minted from a 32-symbol alphabet with the ambiguous glyphs removed.
-- The range allows the 6-character codes minted before this migration.
do $ck$
begin
  if not exists (select 1 from pg_constraint where conname = 'invite_code_shape') then
    alter table public.invite_codes
      add constraint invite_code_shape
      check (code ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6,12}$');
  end if;
end $ck$;

-- expires_at is client-writable through PostgREST, so the documented 14-day
-- lifetime was advisory: a user could insert a code good until the year 3000.
-- Clamp it server-side instead of trusting the insert.
create or replace function public.clamp_invite_expiry()
returns trigger
language plpgsql
as $fn$
begin
  new.expires_at = least(
    coalesce(new.expires_at, now() + interval '14 days'),
    now() + interval '14 days'
  );
  return new;
end;
$fn$;

drop trigger if exists invite_codes_clamp on public.invite_codes;
create trigger invite_codes_clamp
  before insert or update on public.invite_codes
  for each row execute function public.clamp_invite_expiry();


-- ==================================================================
-- 3. redemption is rate limited, and never raises
-- ==================================================================
--
-- A code is a bearer credential for read access to a whole board, so guessing
-- has to cost something. Note the shape of this function: it RETURNS a status
-- instead of raising. plpgsql has no autonomous transactions, so
-- "insert the failed attempt, then raise" would roll that attempt back along
-- with everything else and the limiter would count to zero forever.

create table if not exists public.invite_attempts (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  ok           boolean not null,
  attempted_at timestamptz not null default now()
);

create index if not exists invite_attempts_recent
  on public.invite_attempts(user_id, attempted_at desc);

alter table public.invite_attempts enable row level security;
-- No policies on purpose: only the definer function below touches this table.
revoke all on public.invite_attempts from anon, authenticated;

drop function if exists public.redeem_invite(text);
create function public.redeem_invite(p_code text)
returns table (friendship_id uuid, friend_id uuid, status text)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_owner uuid;
  v_id    uuid;
  v_fails int;
  c_max_fails constant int := 10;   -- failed guesses per hour, per account
begin
  if auth.uid() is null then
    return query select null::uuid, null::uuid, 'not_authenticated'::text;
    return;
  end if;

  -- Housekeeping the original never did: expired codes accumulated forever.
  delete from public.invite_codes where expires_at < now() - interval '7 days';
  delete from public.invite_attempts where attempted_at < now() - interval '1 day';

  select count(*) into v_fails
  from public.invite_attempts
  where user_id = auth.uid()
    and not ok
    and attempted_at > now() - interval '1 hour';

  if v_fails >= c_max_fails then
    return query select null::uuid, null::uuid, 'too_many_attempts'::text;
    return;
  end if;

  select owner_id into v_owner
  from public.invite_codes
  where code = upper(trim(p_code)) and expires_at > now();

  if v_owner is null then
    insert into public.invite_attempts (user_id, ok) values (auth.uid(), false);
    return query select null::uuid, null::uuid, 'invalid_or_expired_code'::text;
    return;
  end if;

  if v_owner = auth.uid() then
    -- Not a guess, just a mistake. Does not burn budget.
    insert into public.invite_attempts (user_id, ok) values (auth.uid(), true);
    return query select null::uuid, null::uuid, 'cannot_pair_with_self'::text;
    return;
  end if;

  -- already connected either way? return it instead of failing
  select id into v_id from public.friendships
  where (a_id = v_owner and b_id = auth.uid())
     or (a_id = auth.uid() and b_id = v_owner)
  limit 1;

  if v_id is not null then
    update public.friendships
      set status = 'accepted', accepted_at = coalesce(accepted_at, now())
      where id = v_id;
  else
    -- the code owner is the requester; the redeemer accepts immediately
    insert into public.friendships (a_id, b_id, status, accepted_at)
    values (v_owner, auth.uid(), 'accepted', now())
    returning id into v_id;
  end if;

  insert into public.invite_attempts (user_id, ok) values (auth.uid(), true);
  return query select v_id, v_owner, 'ok'::text;
end;
$fn$;


-- ==================================================================
-- 4. friend_summary counted the wrong thing
-- ==================================================================
--
-- The column is named "visions" but it was jsonb_array_length over the whole
-- elements array, so text boxes and shapes inflated every friend's count.

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
as $fn$
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
$fn$;
