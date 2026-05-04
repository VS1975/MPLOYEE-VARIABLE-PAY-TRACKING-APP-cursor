-- Run in Supabase SQL Editor (or migrate) before first deploy.
-- Creates tables, RLS, storage bucket policies, and pay config.

create extension if not exists "pgcrypto";

-- Profiles: links auth.users to admin flag
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Submissions (employee work log)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null,
  employee_name text not null,
  work_date date not null default (timezone('utc', now()))::date,
  rack_count integer not null check (rack_count >= 0),
  work_type text,
  before_image_path text not null,
  after_image_path text not null,
  before_captured_at timestamptz not null,
  after_captured_at timestamptz not null,
  submitted_at timestamptz not null default now()
);

create index if not exists submissions_employee_id_idx on public.submissions (employee_id);
create index if not exists submissions_work_date_idx on public.submissions (work_date desc);
create index if not exists submissions_submitted_at_idx on public.submissions (submitted_at desc);

alter table public.submissions enable row level security;

drop policy if exists "submissions_admin_select" on public.submissions;
create policy "submissions_admin_select"
  on public.submissions for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Inserts happen via service role from Next.js API (bypasses RLS). No anon insert.

-- Pay configuration (single row, id = 1)
create table if not exists public.pay_config (
  id integer primary key default 1 check (id = 1),
  normal_pay_per_rack numeric(14, 4) not null default 0,
  bonus_threshold_racks integer not null default 10,
  bonus_pay_per_rack numeric(14, 4) not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.pay_config (id, normal_pay_per_rack, bonus_threshold_racks, bonus_pay_per_rack)
values (1, 5.00, 10, 8.00)
on conflict (id) do nothing;

alter table public.pay_config enable row level security;

drop policy if exists "pay_config_admin_select" on public.pay_config;
create policy "pay_config_admin_select"
  on public.pay_config for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "pay_config_admin_update" on public.pay_config;
create policy "pay_config_admin_update"
  on public.pay_config for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- New user → profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, is_admin)
  values (
    new.id,
    new.email,
    false
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- After profile exists, set is_admin = true for bootstrap emails (optional; or run manually):
-- update public.profiles set is_admin = true where email in ('you@company.com');

-- Storage bucket (create in Dashboard → Storage → New bucket: submission-images, private)
-- Then run policies below (adjust bucket name if different).

insert into storage.buckets (id, name, public)
values ('submission-images', 'submission-images', false)
on conflict (id) do nothing;

-- Admins can read objects in submission-images
drop policy if exists "storage_submission_images_admin_read" on storage.objects;
create policy "storage_submission_images_admin_read"
  on storage.objects for select
  using (
    bucket_id = 'submission-images'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Service role uploads bypass RLS; signed URLs for admin viewing generated server-side.
