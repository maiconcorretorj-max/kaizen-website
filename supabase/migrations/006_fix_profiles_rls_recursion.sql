-- Fix RLS recursion on public.profiles used by admin pages

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- Remove legacy policies that query public.profiles directly inside USING,
-- since they can trigger recursion through profiles policies.
drop policy if exists "Admins can manage properties" on public.properties;
drop policy if exists "Admins can manage nav tabs" on public.nav_tabs;
drop policy if exists "Admins can manage content blocks" on public.content_blocks;
drop policy if exists "Admins can manage contact messages" on public.contact_messages;
drop policy if exists "Admins can upload property images" on storage.objects;
drop policy if exists "Admins can delete property images" on storage.objects;

-- Track public site visits for dashboard metrics
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  user_agent text,
  visited_at timestamptz not null default now()
);

create index if not exists idx_site_visits_visited_at on public.site_visits (visited_at desc);
create index if not exists idx_site_visits_path on public.site_visits (path);

alter table public.site_visits enable row level security;

drop policy if exists "Anyone can insert site visits" on public.site_visits;
create policy "Anyone can insert site visits"
  on public.site_visits for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated can read site visits" on public.site_visits;
create policy "Authenticated can read site visits"
  on public.site_visits for select
  to authenticated
  using (auth.uid() is not null);
