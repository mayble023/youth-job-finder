-- =============================================================================
-- Youth Job Finder — 001_schema.sql
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Shared: updated_at trigger function
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  town        text,
  education   text,
  skills      text[] not null default '{}',
  cv_path     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- jobs
-- -----------------------------------------------------------------------------
create table if not exists public.jobs (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  company       text not null,
  category      text not null check (category in (
                  'Administration','Agriculture','Construction','Education',
                  'Engineering','Finance','Health','Hospitality','IT',
                  'Mining','Retail','Transport')),
  job_type      text not null check (job_type in (
                  'Full-time','Part-time','Internship','Graduate',
                  'Casual','Volunteer')),
  town          text not null,
  latitude      double precision,
  longitude     double precision,
  salary_min    int,          -- PGK per year, null if unpaid / not disclosed
  salary_max    int,          -- PGK per year
  description   text,
  requirements  text,
  tags          text[] not null default '{}',
  closing_date  date,
  created_at    timestamptz not null default now(),
  constraint jobs_salary_range check (
    salary_min is null or salary_max is null or salary_min <= salary_max
  )
);

create index if not exists jobs_category_idx on public.jobs (category);
create index if not exists jobs_town_idx     on public.jobs (town);

-- -----------------------------------------------------------------------------
-- applications
-- -----------------------------------------------------------------------------
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid()
                  references auth.users (id) on delete cascade,
  job_id        uuid not null references public.jobs (id) on delete cascade,
  status        text not null default 'applied'
                  check (status in ('applied','interviewing','offered','rejected')),
  cover_note    text not null
                  check (char_length(cover_note) between 20 and 1000),
  interview_at  timestamptz,
  notes         text check (notes is null or char_length(notes) <= 1000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, job_id)
);

create index if not exists applications_user_id_idx on public.applications (user_id);

create or replace trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- saved_jobs
-- -----------------------------------------------------------------------------
create table if not exists public.saved_jobs (
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  job_id      uuid not null references public.jobs (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index if not exists saved_jobs_user_id_idx on public.saved_jobs (user_id);

-- -----------------------------------------------------------------------------
-- Table privileges (RLS below decides WHICH rows; grants decide WHICH actions)
-- -----------------------------------------------------------------------------
revoke all on public.profiles, public.jobs, public.applications, public.saved_jobs from anon;

grant select, insert, update         on public.profiles     to authenticated;
grant select                         on public.jobs         to authenticated;
grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, delete         on public.saved_jobs   to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs   enable row level security;

-- profiles: own row only, no delete ------------------------------------------
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- jobs: read-only for signed-in users; admin manages via SQL ------------------
drop policy if exists "jobs_select_authenticated" on public.jobs;
create policy "jobs_select_authenticated" on public.jobs
  for select to authenticated
  using (true);

-- applications: owner only ----------------------------------------------------
drop policy if exists "applications_select_own" on public.applications;
create policy "applications_select_own" on public.applications
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "applications_insert_own" on public.applications;
create policy "applications_insert_own" on public.applications
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "applications_update_own" on public.applications;
create policy "applications_update_own" on public.applications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "applications_delete_own" on public.applications;
create policy "applications_delete_own" on public.applications
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- saved_jobs: owner only ------------------------------------------------------
drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own" on public.saved_jobs
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own" on public.saved_jobs
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own" on public.saved_jobs
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- -----------------------------------------------------------------------------
-- Storage: private 'cvs' bucket (PDF only, max 5 MB)
-- Files must be stored as  <user_id>/<filename>.pdf
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array['application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- (RLS is already enabled on storage.objects by Supabase.)

drop policy if exists "cvs_select_own" on storage.objects;
create policy "cvs_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cvs_insert_own" on storage.objects;
create policy "cvs_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cvs_update_own" on storage.objects;
create policy "cvs_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "cvs_delete_own" on storage.objects;
create policy "cvs_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'cvs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
