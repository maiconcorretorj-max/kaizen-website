-- ============================================================
-- Kaizen Soluções Imobiliárias - Initial Database Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- PROPERTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('casa', 'apartamento', 'terreno', 'comercial', 'cobertura', 'sala')),
  status TEXT NOT NULL CHECK (status IN ('venda', 'aluguel', 'venda_aluguel')),
  condition TEXT CHECK (condition IN ('novo', 'usado', 'na_planta')),
  price NUMERIC(15, 2) NOT NULL,
  rent_price NUMERIC(15, 2),
  area NUMERIC(10, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  parking_spaces INTEGER,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Rio de Janeiro',
  state TEXT NOT NULL DEFAULT 'RJ',
  zip_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  images TEXT[] DEFAULT '{}',
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_active ON public.properties(active);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON public.properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);

-- RLS for properties
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Anyone can read active properties
CREATE POLICY "Anyone can view active properties"
  ON public.properties FOR SELECT
  USING (active = TRUE);

-- Only admins can do CRUD
CREATE POLICY "Admins can manage properties"
  ON public.properties FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================
-- NAV_TABS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.nav_tabs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.nav_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active nav tabs"
  ON public.nav_tabs FOR SELECT
  USING (active = TRUE);

CREATE POLICY "Admins can manage nav tabs"
  ON public.nav_tabs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Default nav tabs
INSERT INTO public.nav_tabs (label, href, "order", active) VALUES
  ('Início', '/', 1, TRUE),
  ('Sobre Nós', '/sobre', 2, TRUE),
  ('Imóveis', '/imoveis', 3, TRUE),
  ('Contato', '/contato', 4, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONTENT_BLOCKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'html', 'json')),
  page TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(key, page)
);

ALTER TABLE public.content_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view content blocks"
  ON public.content_blocks FOR SELECT
  TO PUBLIC USING (TRUE);

CREATE POLICY "Admins can manage content blocks"
  ON public.content_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE TRIGGER update_content_blocks_updated_at
  BEFORE UPDATE ON public.content_blocks
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Default content blocks
INSERT INTO public.content_blocks (key, title, content, type, page) VALUES
  ('hero_title', 'Título Hero', 'Realizando sonhos através do imóvel ideal', 'text', 'home'),
  ('hero_subtitle', 'Subtítulo Hero', 'Encontre o imóvel perfeito com a expertise da Kaizen Soluções Imobiliárias.', 'text', 'home'),
  ('about_title', 'Título Sobre', 'Construindo sonhos desde 2014', 'text', 'sobre'),
  ('contact_phone', 'Telefone', '(21) 99999-9999', 'text', 'contato'),
  ('contact_email', 'E-mail', 'contato@kaizenimoveis.com.br', 'text', 'contato'),
  ('contact_whatsapp', 'WhatsApp', '5521999999999', 'text', 'global')
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONTACT_MESSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert contact messages
CREATE POLICY "Anyone can send contact messages"
  ON public.contact_messages FOR INSERT
  TO PUBLIC WITH CHECK (TRUE);

-- Only admins can read/update contact messages
CREATE POLICY "Admins can manage contact messages"
  ON public.contact_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', TRUE)
ON CONFLICT DO NOTHING;

-- Allow public read access to property images
CREATE POLICY "Public read access to property images"
  ON storage.objects FOR SELECT
  TO PUBLIC
  USING (bucket_id = 'property-images');

-- Allow authenticated admins to upload
CREATE POLICY "Admins can upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to delete
CREATE POLICY "Admins can delete property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- FUNCTION: Handle new user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
