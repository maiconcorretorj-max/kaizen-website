-- Evolve existing entities for CMS phase 1

-- properties: publication_status is now the source of truth for public visibility.
-- 'active' remains temporary for backward compatibility only.
alter table public.properties
  add column if not exists publication_status text not null default 'published'
  check (publication_status in ('draft', 'published', 'archived'));

alter table public.properties
  add column if not exists published_at timestamptz;

alter table public.properties
  add column if not exists seo_title text;

alter table public.properties
  add column if not exists seo_description text;

alter table public.properties
  add column if not exists cover_image_url text;

create index if not exists idx_properties_publication_status on public.properties(publication_status);

update public.properties
set publication_status = case when active then 'published' else 'draft' end;

update public.properties
set published_at = coalesce(published_at, created_at)
where publication_status = 'published';

update public.properties
set cover_image_url = images[1]
where cover_image_url is null and array_length(images, 1) >= 1;

-- replace public select policy to use publication_status
-- while keeping admin policy untouched.
drop policy if exists "Anyone can view active properties" on public.properties;

drop policy if exists "Anyone can view published properties" on public.properties;

create policy "Anyone can view published properties"
  on public.properties for select
  using (publication_status = 'published');

-- nav_tabs: enable footer menu management with same table
alter table public.nav_tabs
  add column if not exists menu_location text not null default 'header'
  check (menu_location in ('header', 'footer'));

alter table public.nav_tabs
  add column if not exists visible boolean not null default true;

alter table public.nav_tabs
  add column if not exists target text not null default '_self'
  check (target in ('_self', '_blank'));

alter table public.nav_tabs
  add column if not exists parent_id uuid references public.nav_tabs(id) on delete cascade;

alter table public.nav_tabs
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_nav_tabs_location_order on public.nav_tabs(menu_location, "order");

update public.nav_tabs
set visible = active
where visible is distinct from active;

create trigger update_nav_tabs_updated_at
  before update on public.nav_tabs
  for each row execute procedure update_updated_at_column();
