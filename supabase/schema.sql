-- profiles: one per registered user
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 3 and 80),
  headline text check (char_length(headline) <= 120),
  skills text check (char_length(skills) <= 500),
  location text check (char_length(location) <= 120),
  created_at timestamptz not null default now()
);

create type public.application_status as enum
  ('saved', 'applied', 'interview', 'offer', 'rejected');

-- applications: many per profile (saved jobs + jobs applied for)
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references public.profiles (id) on delete cascade,
  job_title text not null check (char_length(job_title) between 2 and 120),
  company text not null check (char_length(company) between 2 and 120),
  status public.application_status not null default 'saved',
  location_name text check (char_length(location_name) <= 120),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  job_url text check (char_length(job_url) <= 500),
  source_job_slug text,
  notes text check (char_length(notes) <= 2000),
  applied_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications (user_id);

-- Row Level Security: each user can only touch their own rows
alter table public.profiles enable row level security;
alter table public.applications enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "applications_select_own" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "applications_insert_own" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "applications_update_own" on public.applications
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "applications_delete_own" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

-- keep updated_at current on every edit
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- create a profile automatically when someone registers
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'New user'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();