-- Phase 2 support for leads management

alter table public.contact_messages
  add column if not exists status text not null default 'new'
  check (status in ('new', 'in_progress', 'won', 'lost', 'archived'));

alter table public.contact_messages
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_contact_messages_status on public.contact_messages(status);
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);

drop trigger if exists update_contact_messages_updated_at on public.contact_messages;

create trigger update_contact_messages_updated_at
  before update on public.contact_messages
  for each row execute procedure update_updated_at_column();

-- Align admin panel access with RLS: allow authenticated users
-- (the app already protects /admin routes behind login).

drop policy if exists "Authenticated users can manage properties" on public.properties;
create policy "Authenticated users can manage properties"
  on public.properties for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage nav tabs" on public.nav_tabs;
create policy "Authenticated users can manage nav tabs"
  on public.nav_tabs for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage content blocks" on public.content_blocks;
create policy "Authenticated users can manage content blocks"
  on public.content_blocks for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage contact messages" on public.contact_messages;
create policy "Authenticated users can manage contact messages"
  on public.contact_messages for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage cms pages" on public.cms_pages;
create policy "Authenticated users can manage cms pages"
  on public.cms_pages for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage page sections" on public.page_sections;
create policy "Authenticated users can manage page sections"
  on public.page_sections for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage site settings" on public.site_settings;
create policy "Authenticated users can manage site settings"
  on public.site_settings for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage posts" on public.posts;
create policy "Authenticated users can manage posts"
  on public.posts for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can manage post images" on public.post_images;
create policy "Authenticated users can manage post images"
  on public.post_images for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can upload property images" on storage.objects;
create policy "Authenticated users can upload property images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'property-images' and auth.uid() is not null);

drop policy if exists "Authenticated users can delete property images" on storage.objects;
create policy "Authenticated users can delete property images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'property-images' and auth.uid() is not null);

drop policy if exists "Authenticated users can upload blog media" on storage.objects;
create policy "Authenticated users can upload blog media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-media' and auth.uid() is not null);

drop policy if exists "Authenticated users can delete blog media" on storage.objects;
create policy "Authenticated users can delete blog media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-media' and auth.uid() is not null);
