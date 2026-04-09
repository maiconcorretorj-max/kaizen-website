-- Helper function used by admin RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO PUBLIC;

-- Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  video_url TEXT,
  published BOOLEAN DEFAULT FALSE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON public.posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON public.posts(published);

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON public.posts FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Admins can manage posts"
  ON public.posts FOR ALL
  USING (public.is_admin());

-- Post images gallery
CREATE TABLE IF NOT EXISTS public.post_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post images"
  ON public.post_images FOR SELECT TO PUBLIC USING (TRUE);

CREATE POLICY "Admins can manage post images"
  ON public.post_images FOR ALL USING (public.is_admin());

-- Storage bucket for blog media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-media', 'blog-media', TRUE, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']
) ON CONFLICT DO NOTHING;

CREATE POLICY "Public read blog media"
  ON storage.objects FOR SELECT TO PUBLIC
  USING (bucket_id = 'blog-media');

CREATE POLICY "Admins upload blog media"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-media' AND public.is_admin());

CREATE POLICY "Admins delete blog media"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-media' AND public.is_admin());
