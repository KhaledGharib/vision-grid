-- Vision Grid — cloud sync schema (step 1: auth + personal sync)
--
-- Design notes:
--  * One row per user holds the whole app state as JSONB. The app already
--    treats state as a single serialisable object, so this keeps the client
--    simple and avoids a migration every time a field is added.
--  * Images are NOT in here — they go to Storage, keyed by user id.
--  * RLS is on for every table and the policies compare against auth.uid(),
--    so one user can never read or write another's row. The publishable key
--    is safe in the browser precisely because of this.

-- ============ profiles ============
-- A row per account. handle is what a friend will search for in step 2.

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  handle      text unique,
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create the profile row automatically on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ boards_state ============
-- The user's entire Vision Grid state as one JSONB document.
-- updated_at drives last-write-wins conflict handling on the client.

create table if not exists public.boards_state (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  state       jsonb not null,
  version     int  not null default 3,
  updated_at  timestamptz not null default now()
);

alter table public.boards_state enable row level security;

drop policy if exists "read own state" on public.boards_state;
create policy "read own state" on public.boards_state
  for select using (auth.uid() = user_id);

drop policy if exists "insert own state" on public.boards_state;
create policy "insert own state" on public.boards_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own state" on public.boards_state;
create policy "update own state" on public.boards_state
  for update using (auth.uid() = user_id);

drop policy if exists "delete own state" on public.boards_state;
create policy "delete own state" on public.boards_state
  for delete using (auth.uid() = user_id);

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_state_touch on public.boards_state;
create trigger boards_state_touch
  before update on public.boards_state
  for each row execute function public.touch_updated_at();

-- ============ storage: vision images ============
-- Private bucket. Objects are stored under <user_id>/<image_id>, and the
-- policies below only let a user touch their own folder.

insert into storage.buckets (id, name, public)
values ('visions', 'visions', false)
on conflict (id) do nothing;

drop policy if exists "read own images" on storage.objects;
create policy "read own images" on storage.objects
  for select using (
    bucket_id = 'visions' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "upload own images" on storage.objects;
create policy "upload own images" on storage.objects
  for insert with check (
    bucket_id = 'visions' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "update own images" on storage.objects;
create policy "update own images" on storage.objects
  for update using (
    bucket_id = 'visions' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own images" on storage.objects;
create policy "delete own images" on storage.objects
  for delete using (
    bucket_id = 'visions' and (storage.foldername(name))[1] = auth.uid()::text
  );
