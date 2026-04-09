-- CMS core for institutional pages/settings (Phase 1)

create table if not exists public.cms_pages (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  admin_label text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  meta_title text,
  meta_description text,
  meta_robots_index boolean not null default true,
  meta_robots_follow boolean not null default true,
  og_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.page_sections (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  admin_title text,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_active boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page_id, section_key)
);

create index if not exists idx_page_sections_page_position on public.page_sections(page_id, position);
create index if not exists idx_page_sections_type on public.page_sections(section_type);
create index if not exists idx_page_sections_status_active on public.page_sections(status, is_active);

create table if not exists public.site_settings (
  id uuid primary key default uuid_generate_v4(),
  setting_key text not null unique,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger update_cms_pages_updated_at
  before update on public.cms_pages
  for each row execute procedure update_updated_at_column();

create trigger update_page_sections_updated_at
  before update on public.page_sections
  for each row execute procedure update_updated_at_column();

create trigger update_site_settings_updated_at
  before update on public.site_settings
  for each row execute procedure update_updated_at_column();

alter table public.cms_pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.site_settings enable row level security;

create policy "Public can read published cms pages"
  on public.cms_pages for select
  to public
  using (status = 'published');

create policy "Admins manage cms pages"
  on public.cms_pages for all
  using (public.is_admin());

create policy "Public can read published active sections"
  on public.page_sections for select
  to public
  using (
    is_active = true
    and status = 'published'
    and exists (
      select 1 from public.cms_pages p
      where p.id = page_sections.page_id
        and p.status = 'published'
    )
  );

create policy "Admins manage page sections"
  on public.page_sections for all
  using (public.is_admin());

create policy "Public can read site settings"
  on public.site_settings for select
  to public
  using (true);

create policy "Admins manage site settings"
  on public.site_settings for all
  using (public.is_admin());

insert into public.cms_pages (slug, title, admin_label, status)
values
  ('home', 'Home', 'Home', 'published'),
  ('sobre', 'Sobre Nós', 'Sobre Nós', 'published'),
  ('contato', 'Contato', 'Contato', 'published'),
  ('imoveis', 'Imóveis', 'Página de Imóveis', 'published')
on conflict (slug) do nothing;

insert into public.site_settings (setting_key, setting_value)
values
  ('branding', jsonb_build_object(
    'company_name', 'Kaizen',
    'company_suffix', 'Soluções Imobiliárias'
  )),
  ('contact_info', jsonb_build_object(
    'phone', coalesce((select content from public.content_blocks where key = 'contact_phone' and page = 'contato' limit 1), '(21) 99999-9999'),
    'email', coalesce((select content from public.content_blocks where key = 'contact_email' and page = 'contato' limit 1), 'contato@kaizenimoveis.com.br'),
    'address', coalesce((select content from public.content_blocks where key = 'contact_address' and page = 'contato' limit 1), 'Rua Engenheiro Trindade, 99\nCampo Grande, Rio de Janeiro - RJ'),
    'hours', coalesce((select content from public.content_blocks where key = 'contact_hours' and page = 'contato' limit 1), 'Seg-Sex: 8h às 18h\nSáb: 8h às 13h'),
    'whatsapp', coalesce((select content from public.content_blocks where key = 'contact_whatsapp' and page = 'contato' limit 1), (select content from public.content_blocks where key = 'contact_whatsapp' and page = 'global' limit 1), '5521999999999')
  )),
  ('social_links', jsonb_build_object(
    'instagram', coalesce((select content from public.content_blocks where key = 'footer_instagram' and page = 'global' limit 1), 'https://instagram.com'),
    'facebook', coalesce((select content from public.content_blocks where key = 'footer_facebook' and page = 'global' limit 1), 'https://facebook.com'),
    'linkedin', 'https://linkedin.com'
  )),
  ('footer_content', jsonb_build_object(
    'description', coalesce((select content from public.content_blocks where key = 'footer_description' and page = 'global' limit 1), 'Realizando sonhos através do imóvel ideal. Há mais de 10 anos ajudando famílias a encontrarem o lar perfeito no Rio de Janeiro.'),
    'creci', 'CRECI: 00000-J',
    'rights_text', 'Todos os direitos reservados.'
  )),
  ('seo_global', jsonb_build_object(
    'default_title', 'Kaizen Soluções Imobiliárias | Imóveis em Campo Grande - RJ',
    'title_template', '%s | Kaizen Soluções Imobiliárias',
    'default_description', 'Encontre o imóvel ideal em Campo Grande e toda região do Rio de Janeiro.'
  ))
on conflict (setting_key) do nothing;

-- Optional Phase 1 backfill: create first published sections based on legacy content_blocks.
insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'hero', 'hero', 'Hero', jsonb_build_object(
  'badge', 'Rio de Janeiro & Região',
  'title', coalesce((select content from public.content_blocks where key = 'hero_title' and page = 'home' limit 1), 'Realizando sonhos através do imóvel ideal'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'hero_subtitle' and page = 'home' limit 1), 'Encontre o imóvel perfeito com a expertise da Kaizen Soluções Imobiliárias.'),
  'primary_button_text', coalesce((select content from public.content_blocks where key = 'hero_btn_primary' and page = 'home' limit 1), 'Buscar Imóveis'),
  'primary_button_url', '/imoveis',
  'secondary_button_text', coalesce((select content from public.content_blocks where key = 'hero_btn_secondary' and page = 'home' limit 1), 'Fale com um Corretor'),
  'secondary_button_url', '/contato',
  'stats', jsonb_build_array(
    jsonb_build_object('value', coalesce((select content from public.content_blocks where key = 'hero_stat1_value' and page = 'home' limit 1), '3+'), 'label', coalesce((select content from public.content_blocks where key = 'hero_stat1_label' and page = 'home' limit 1), 'Anos de Experiência')),
    jsonb_build_object('value', coalesce((select content from public.content_blocks where key = 'hero_stat2_value' and page = 'home' limit 1), '100+'), 'label', coalesce((select content from public.content_blocks where key = 'hero_stat2_label' and page = 'home' limit 1), 'Famílias Atendidas')),
    jsonb_build_object('value', coalesce((select content from public.content_blocks where key = 'hero_stat3_value' and page = 'home' limit 1), '98%'), 'label', coalesce((select content from public.content_blocks where key = 'hero_stat3_label' and page = 'home' limit 1), 'Clientes Satisfeitos')),
    jsonb_build_object('value', coalesce((select content from public.content_blocks where key = 'hero_stat4_value' and page = 'home' limit 1), '200+'), 'label', coalesce((select content from public.content_blocks where key = 'hero_stat4_label' and page = 'home' limit 1), 'Imóveis Disponíveis'))
  )
), 1, true, 'published'
from public.cms_pages p
where p.slug = 'home'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'featured_properties', 'featured_properties', 'Imóveis em Destaque', jsonb_build_object(
  'label', coalesce((select content from public.content_blocks where key = 'destaques_label' and page = 'home_destaques' limit 1), 'Destaques'),
  'title', coalesce((select content from public.content_blocks where key = 'destaques_title' and page = 'home_destaques' limit 1), 'Imóveis em Destaque'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'destaques_subtitle' and page = 'home_destaques' limit 1), 'Confira nossa seleção especial de imóveis'),
  'button_text', coalesce((select content from public.content_blocks where key = 'destaques_btn' and page = 'home_destaques' limit 1), 'Ver Todos os Imóveis')
), 2, true, 'published'
from public.cms_pages p
where p.slug = 'home'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'differentials', 'differentials', 'Diferenciais', jsonb_build_object(
  'label', coalesce((select content from public.content_blocks where key = 'diferenciais_label' and page = 'home_diferenciais' limit 1), 'Por que nos escolher'),
  'title', coalesce((select content from public.content_blocks where key = 'diferenciais_title' and page = 'home_diferenciais' limit 1), 'Nossos Diferenciais'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'diferenciais_subtitle' and page = 'home_diferenciais' limit 1), 'Somos muito mais que uma imobiliária.'),
  'items', jsonb_build_array(
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_1_title' and page = 'home_diferenciais' limit 1), 'Segurança Garantida'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_1_desc' and page = 'home_diferenciais' limit 1), '')),
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_2_title' and page = 'home_diferenciais' limit 1), 'Atendimento Premium'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_2_desc' and page = 'home_diferenciais' limit 1), '')),
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_3_title' and page = 'home_diferenciais' limit 1), 'Agilidade no Processo'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_3_desc' and page = 'home_diferenciais' limit 1), '')),
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_4_title' and page = 'home_diferenciais' limit 1), 'Parceria de Confiança'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_4_desc' and page = 'home_diferenciais' limit 1), '')),
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_5_title' and page = 'home_diferenciais' limit 1), 'Melhor Investimento'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_5_desc' and page = 'home_diferenciais' limit 1), '')),
    jsonb_build_object('title', coalesce((select content from public.content_blocks where key = 'diferenciais_6_title' and page = 'home_diferenciais' limit 1), 'Corretores Certificados'), 'description', coalesce((select content from public.content_blocks where key = 'diferenciais_6_desc' and page = 'home_diferenciais' limit 1), ''))
  )
), 3, true, 'published'
from public.cms_pages p
where p.slug = 'home'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'cta', 'cta', 'Call To Action', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'cta_badge' and page = 'home_cta' limit 1), 'Pronto para começar?'),
  'title', coalesce((select content from public.content_blocks where key = 'cta_title' and page = 'home_cta' limit 1), 'Encontre seu imóvel hoje mesmo'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'cta_subtitle' and page = 'home_cta' limit 1), 'Nossa equipe está pronta para ajudar.'),
  'whatsapp', coalesce((select content from public.content_blocks where key = 'cta_whatsapp' and page = 'home_cta' limit 1), (select content from public.content_blocks where key = 'contact_whatsapp' and page = 'global' limit 1), '5521999999999'),
  'feature_1', coalesce((select content from public.content_blocks where key = 'cta_feature1' and page = 'home_cta' limit 1), 'Atendimento rápido'),
  'feature_2', coalesce((select content from public.content_blocks where key = 'cta_feature2' and page = 'home_cta' limit 1), 'Corretores especializados'),
  'feature_3', coalesce((select content from public.content_blocks where key = 'cta_feature3' and page = 'home_cta' limit 1), 'Visitas presenciais e virtuais')
), 4, true, 'published'
from public.cms_pages p
where p.slug = 'home'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'hero', 'hero', 'Hero', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'about_hero_badge' and page = 'sobre' limit 1), 'Quem somos'),
  'title', coalesce((select content from public.content_blocks where key = 'about_hero_title' and page = 'sobre' limit 1), 'Sobre a Kaizen Soluções Imobiliárias'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'about_hero_subtitle' and page = 'sobre' limit 1), 'Mais de uma década de experiência no mercado imobiliário.')
), 1, true, 'published'
from public.cms_pages p
where p.slug = 'sobre'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'story', 'story', 'Nossa História', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'about_story_badge' and page = 'sobre' limit 1), 'Nossa História'),
  'title', coalesce((select content from public.content_blocks where key = 'about_story_title' and page = 'sobre' limit 1), 'Construindo sonhos desde 2014'),
  'paragraph_1', coalesce((select content from public.content_blocks where key = 'about_story_p1' and page = 'sobre' limit 1), ''),
  'paragraph_2', coalesce((select content from public.content_blocks where key = 'about_story_p2' and page = 'sobre' limit 1), ''),
  'paragraph_3', coalesce((select content from public.content_blocks where key = 'about_story_p3' and page = 'sobre' limit 1), ''),
  'bullet_1', coalesce((select content from public.content_blocks where key = 'about_story_bullet1' and page = 'sobre' limit 1), ''),
  'bullet_2', coalesce((select content from public.content_blocks where key = 'about_story_bullet2' and page = 'sobre' limit 1), ''),
  'bullet_3', coalesce((select content from public.content_blocks where key = 'about_story_bullet3' and page = 'sobre' limit 1), ''),
  'bullet_4', coalesce((select content from public.content_blocks where key = 'about_story_bullet4' and page = 'sobre' limit 1), ''),
  'years_value', coalesce((select content from public.content_blocks where key = 'about_story_years' and page = 'sobre' limit 1), '10+'),
  'years_label', coalesce((select content from public.content_blocks where key = 'about_story_years_label' and page = 'sobre' limit 1), 'Anos de mercado'),
  'sold_value', coalesce((select content from public.content_blocks where key = 'about_story_sold' and page = 'sobre' limit 1), '500+'),
  'sold_label', coalesce((select content from public.content_blocks where key = 'about_story_sold_label' and page = 'sobre' limit 1), 'Imóveis vendidos'),
  'image_url', coalesce((select content from public.content_blocks where key = 'about_story_image' and page = 'sobre' limit 1), 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80')
), 2, true, 'published'
from public.cms_pages p
where p.slug = 'sobre'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'values', 'values', 'Missão, Visão e Valores', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'about_values_badge' and page = 'sobre' limit 1), 'Nosso Propósito'),
  'title', coalesce((select content from public.content_blocks where key = 'about_values_title' and page = 'sobre' limit 1), 'Missão, Visão e Valores'),
  'card_1_title', coalesce((select content from public.content_blocks where key = 'about_card1_title' and page = 'sobre' limit 1), 'Missão'),
  'card_1_desc', coalesce((select content from public.content_blocks where key = 'about_card1_desc' and page = 'sobre' limit 1), ''),
  'card_2_title', coalesce((select content from public.content_blocks where key = 'about_card2_title' and page = 'sobre' limit 1), 'Visão'),
  'card_2_desc', coalesce((select content from public.content_blocks where key = 'about_card2_desc' and page = 'sobre' limit 1), ''),
  'card_3_title', coalesce((select content from public.content_blocks where key = 'about_card3_title' and page = 'sobre' limit 1), 'Valores'),
  'card_3_desc', coalesce((select content from public.content_blocks where key = 'about_card3_desc' and page = 'sobre' limit 1), '')
), 3, true, 'published'
from public.cms_pages p
where p.slug = 'sobre'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'team', 'team', 'Equipe', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'about_team_badge' and page = 'sobre' limit 1), 'Nossa Equipe'),
  'title', coalesce((select content from public.content_blocks where key = 'about_team_title' and page = 'sobre' limit 1), 'Conheça nossos especialistas'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'about_team_subtitle' and page = 'sobre' limit 1), ''),
  'member_1_name', coalesce((select content from public.content_blocks where key = 'about_team1_name' and page = 'sobre' limit 1), 'Carlos Eduardo Silva'),
  'member_1_role', coalesce((select content from public.content_blocks where key = 'about_team1_role' and page = 'sobre' limit 1), 'Diretor & Corretor Sênior'),
  'member_1_creci', coalesce((select content from public.content_blocks where key = 'about_team1_creci' and page = 'sobre' limit 1), 'CRECI 12345-F'),
  'member_1_image', coalesce((select content from public.content_blocks where key = 'about_team1_image' and page = 'sobre' limit 1), 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'),
  'member_2_name', coalesce((select content from public.content_blocks where key = 'about_team2_name' and page = 'sobre' limit 1), 'Ana Paula Santos'),
  'member_2_role', coalesce((select content from public.content_blocks where key = 'about_team2_role' and page = 'sobre' limit 1), 'Corretora Especializada'),
  'member_2_creci', coalesce((select content from public.content_blocks where key = 'about_team2_creci' and page = 'sobre' limit 1), 'CRECI 23456-F'),
  'member_2_image', coalesce((select content from public.content_blocks where key = 'about_team2_image' and page = 'sobre' limit 1), 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80'),
  'member_3_name', coalesce((select content from public.content_blocks where key = 'about_team3_name' and page = 'sobre' limit 1), 'Roberto Fernandes'),
  'member_3_role', coalesce((select content from public.content_blocks where key = 'about_team3_role' and page = 'sobre' limit 1), 'Corretor de Imóveis'),
  'member_3_creci', coalesce((select content from public.content_blocks where key = 'about_team3_creci' and page = 'sobre' limit 1), 'CRECI 34567-F'),
  'member_3_image', coalesce((select content from public.content_blocks where key = 'about_team3_image' and page = 'sobre' limit 1), 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80')
), 4, true, 'published'
from public.cms_pages p
where p.slug = 'sobre'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'cta', 'cta', 'CTA final', jsonb_build_object(
  'title', coalesce((select content from public.content_blocks where key = 'about_cta_title' and page = 'sobre' limit 1), 'Pronto para encontrar seu imóvel?'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'about_cta_subtitle' and page = 'sobre' limit 1), 'Nossa equipe está à disposição para ajudá-lo'),
  'button_text', coalesce((select content from public.content_blocks where key = 'about_cta_btn' and page = 'sobre' limit 1), 'Entrar em Contato'),
  'button_url', '/contato'
), 5, true, 'published'
from public.cms_pages p
where p.slug = 'sobre'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'hero', 'hero', 'Hero', jsonb_build_object(
  'badge', coalesce((select content from public.content_blocks where key = 'contact_hero_badge' and page = 'contato' limit 1), 'Fale conosco'),
  'title', coalesce((select content from public.content_blocks where key = 'contact_hero_title' and page = 'contato' limit 1), 'Contato'),
  'subtitle', coalesce((select content from public.content_blocks where key = 'contact_hero_subtitle' and page = 'contato' limit 1), 'Nossa equipe está pronta para atendê-lo')
), 1, true, 'published'
from public.cms_pages p
where p.slug = 'contato'
on conflict (page_id, section_key) do nothing;

insert into public.page_sections (page_id, section_key, section_type, admin_title, content, position, is_active, status)
select p.id, 'contact_info', 'contact_info', 'Informações de contato', jsonb_build_object(
  'phone', coalesce((select content from public.content_blocks where key = 'contact_phone' and page = 'contato' limit 1), '(21) 99999-9999'),
  'email', coalesce((select content from public.content_blocks where key = 'contact_email' and page = 'contato' limit 1), 'contato@kaizenimoveis.com.br'),
  'address', coalesce((select content from public.content_blocks where key = 'contact_address' and page = 'contato' limit 1), 'Rua Engenheiro Trindade, 99\nCampo Grande, Rio de Janeiro - RJ'),
  'hours', coalesce((select content from public.content_blocks where key = 'contact_hours' and page = 'contato' limit 1), 'Seg-Sex: 8h às 18h\nSáb: 8h às 13h'),
  'whatsapp', coalesce((select content from public.content_blocks where key = 'contact_whatsapp' and page = 'contato' limit 1), (select content from public.content_blocks where key = 'contact_whatsapp' and page = 'global' limit 1), '5521999999999'),
  'map_url', coalesce((select content from public.content_blocks where key = 'contact_map_url' and page = 'contato' limit 1), '')
), 2, true, 'published'
from public.cms_pages p
where p.slug = 'contato'
on conflict (page_id, section_key) do nothing;
