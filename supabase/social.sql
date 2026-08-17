-- Vision Grid — social layer (step 2: pairing)
--
-- Model: a single friendships row per relationship, holding both user ids.
-- Sharing is READ-ONLY in both directions: a friend can see your whole board
-- but never write to it. That is deliberate — the state document is synced
-- last-write-wins, which is safe for one author and unsafe for two.
--
-- Privacy decision recorded here so it isn't lost: paired friends see the
-- FULL board, including vision images.

-- ============ friendships ============

create table if not exists public.friendships (
  id          uuid primary key default gen_random_uuid(),
  -- requester
  a_id        uuid not null references auth.users(id) on delete cascade,
  -- recipient
  b_id        uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  -- one relationship per ordered pair, and never with yourself
  constraint no_self_friend check (a_id <> b_id),
  constraint uniq_pair unique (a_id, b_id)
);

create index if not exists friendships_a on public.friendships(a_id);
create index if not exists friendships_b on public.friendships(b_id);

alter table public.friendships enable row level security;

-- either side can see rows they are part of
drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships" on public.friendships
  for select using (auth.uid() = a_id or auth.uid() = b_id);

-- you may only create a request as yourself
drop policy if exists "request friendship" on public.friendships;
create policy "request friendship" on public.friendships
  for insert with check (auth.uid() = a_id);

-- only the recipient can accept or decline
drop policy if exists "respond to friendship" on public.friendships;
create policy "respond to friendship" on public.friendships
  for update using (auth.uid() = b_id);

-- either side can unfriend
drop policy if exists "remove friendship" on public.friendships;
create policy "remove friendship" on public.friendships
  for delete using (auth.uid() = a_id or auth.uid() = b_id);

-- ============ invite codes ============
-- Short human-shareable code so pairing needs no email lookup.

create table if not exists public.invite_codes (
  code       text primary key,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);

create index if not exists invite_owner on public.invite_codes(owner_id);

alter table public.invite_codes enable row level security;

drop policy if exists "manage own codes" on public.invite_codes;
create policy "manage own codes" on public.invite_codes
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ============ helper: are these two accepted friends? ============

create or replace function public.are_friends(u1 uuid, u2 uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and (
        (f.a_id = u1 and f.b_id = u2) or
        (f.a_id = u2 and f.b_id = u1)
      )
  );
$$;

-- ============ redeem a code (atomic, bypasses the select-RLS problem) ============
-- A joiner cannot read someone else's invite_codes row, so redemption runs
-- as a definer function that validates the code and creates the friendship.

create or replace function public.redeem_invite(p_code text)
returns table (friendship_id uuid, friend_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_id    uuid;
begin
  select owner_id into v_owner
  from public.invite_codes
  where code = upper(trim(p_code)) and expires_at > now();

  if v_owner is null then
    raise exception 'invalid_or_expired_code';
  end if;

  if v_owner = auth.uid() then
    raise exception 'cannot_pair_with_self';
  end if;

  -- already connected either way? return it instead of erroring
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

  return query select v_id, v_owner;
end;
$$;

-- ============ widen read access for accepted friends ============

-- board state: friends may READ, never write
drop policy if exists "friends read state" on public.boards_state;
create policy "friends read state" on public.boards_state
  for select using (public.are_friends(auth.uid(), user_id));

-- profiles: friends may read each other's handle/name
drop policy if exists "friends read profile" on public.profiles;
create policy "friends read profile" on public.profiles
  for select using (public.are_friends(auth.uid(), id));

-- profiles must also be readable by code redeemers to show who invited them
drop policy if exists "read profile by id" on public.profiles;

-- vision images: friends may read objects inside a friend's folder
drop policy if exists "friends read images" on storage.objects;
create policy "friends read images" on storage.objects
  for select using (
    bucket_id = 'visions'
    and public.are_friends(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
