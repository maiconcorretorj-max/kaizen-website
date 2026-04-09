import createClient from '@/lib/supabase/client'
import type { CmsSection } from './section-mapper'

interface CmsPageRow {
  id: string
}

interface SiteSettingRow {
  setting_key: string
  setting_value: Record<string, unknown>
}

interface GetClientCmsOptions {
  preview?: boolean
}

interface CmsPageClientRow {
  id: string
  slug: string
  title: string
  status: string
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  meta_robots_index: boolean
  meta_robots_follow: boolean
}

async function isPreviewAllowed(supabase: ReturnType<typeof createClient>, preview: boolean) {
  if (!preview) return false
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

export async function getCmsPageBySlugClient(pageSlug: string, options: GetClientCmsOptions = {}) {
  try {
    const supabase = createClient()
    const allowPreview = await isPreviewAllowed(supabase, options.preview ?? false)

    let query = supabase
      .from('cms_pages')
      .select('id, slug, title, status, meta_title, meta_description, og_image_url, meta_robots_index, meta_robots_follow')
      .eq('slug', pageSlug)

    if (!allowPreview) {
      query = query.eq('status', 'published')
    }

    const { data } = await query.single()
    return (data as CmsPageClientRow | null) ?? null
  } catch {
    return null
  }
}

export async function getSectionsByPageSlugClient(pageSlug: string, options: GetClientCmsOptions = {}): Promise<CmsSection[]> {
  try {
    const supabase = createClient()
    const allowPreview = await isPreviewAllowed(supabase, options.preview ?? false)

    let pageQuery = supabase
      .from('cms_pages')
      .select('id')
      .eq('slug', pageSlug)

    if (!allowPreview) {
      pageQuery = pageQuery.eq('status', 'published')
    }

    const { data: page } = await pageQuery.single()

    if (!page) {
      return []
    }

    let query = supabase
      .from('page_sections')
      .select('id, section_key, section_type, content, position, is_active, status')
      .eq('page_id', (page as CmsPageRow).id)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (!allowPreview) {
      query = query.eq('status', 'published')
    }

    const { data: sections } = await query

    return (sections ?? []) as CmsSection[]
  } catch {
    return []
  }
}

export async function getPublishedSectionsByPageSlugClient(pageSlug: string): Promise<CmsSection[]> {
  return getSectionsByPageSlugClient(pageSlug)
}

export async function getSiteSettingsClient(keys: string[]) {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value')
      .in('setting_key', keys)

    const map: Record<string, Record<string, unknown>> = {}
    ;(data as SiteSettingRow[] | null)?.forEach((row) => {
      map[row.setting_key] = row.setting_value ?? {}
    })
    return map
  } catch {
    return {}
  }
}
