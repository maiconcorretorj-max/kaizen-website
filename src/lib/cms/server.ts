import 'server-only'

import createServerClient from '@/lib/supabase/server'
import { mapSectionsToLegacyContent, type CmsSection } from './section-mapper'

interface CmsPageRow {
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

interface SiteSettingRow {
  setting_key: string
  setting_value: Record<string, unknown>
}

interface NavTabRow {
  href: string
  label: string
  order: number
  active: boolean
  visible?: boolean
}

interface GetSectionsOptions {
  publishedOnly?: boolean
  activeOnly?: boolean
}

interface GetCmsPageOptions {
  publishedOnly?: boolean
}

interface CmsSeoOptions {
  includeDraft?: boolean
  fallbackTitle: string
  fallbackDescription: string
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

export async function getCmsPageBySlug(pageSlug: string, options: GetCmsPageOptions = {}) {
  const { publishedOnly = true } = options

  try {
    const supabase = createServerClient()
    let query = supabase
      .from('cms_pages')
      .select('id, slug, title, status, meta_title, meta_description, og_image_url, meta_robots_index, meta_robots_follow')
      .eq('slug', pageSlug)

    if (publishedOnly) {
      query = query.eq('status', 'published')
    }

    const { data } = await query.single()
    return (data as CmsPageRow | null) ?? null
  } catch {
    return null
  }
}

export async function getSectionsByPageSlug(pageSlug: string, options: GetSectionsOptions = {}): Promise<CmsSection[]> {
  const { publishedOnly = true, activeOnly = true } = options

  try {
    const page = await getCmsPageBySlug(pageSlug, { publishedOnly })

    if (!page) {
      return []
    }

    const supabase = createServerClient()
    let query = supabase
      .from('page_sections')
      .select('id, section_key, section_type, content, position, is_active, status')
      .eq('page_id', page.id)

    if (publishedOnly) {
      query = query.eq('status', 'published')
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: sections } = await query.order('position', { ascending: true })
    return ((sections ?? []) as CmsSection[])
  } catch {
    return []
  }
}

export async function getPublishedSectionsByPageSlug(pageSlug: string): Promise<CmsSection[]> {
  return getSectionsByPageSlug(pageSlug, { publishedOnly: true, activeOnly: true })
}

export async function getLegacyContentBlocksByPages(pages: string[]): Promise<Record<string, string>> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('content_blocks')
      .select('key, content')
      .in('page', pages)

    const map: Record<string, string> = {}
    ;(data ?? []).forEach((row: { key: string; content: string }) => {
      map[row.key] = row.content
    })
    return map
  } catch {
    return {}
  }
}

export async function getPageContentMapWithFallback(pageSlug: string, legacyPages: string[]) {
  const sections = await getPublishedSectionsByPageSlug(pageSlug)
  const cmsMap = mapSectionsToLegacyContent(pageSlug, sections)

  if (Object.keys(cmsMap).length > 0) {
    if (process.env.NODE_ENV === 'development') {
      console.info('[CMS Read] using page_sections', { pageSlug, sections: sections.length, keys: Object.keys(cmsMap).length })
    }
    return cmsMap
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[CMS Read] fallback to content_blocks', { pageSlug, legacyPages })
  }
  return getLegacyContentBlocksByPages(legacyPages)
}

export async function getSiteSettings(keys: string[]) {
  try {
    const supabase = createServerClient()
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

export async function getFooterLinks() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('nav_tabs')
      .select('href, label, order, active, visible, menu_location')
      .eq('menu_location', 'footer')
      .eq('active', true)
      .order('order', { ascending: true })

    const links = ((data ?? []) as NavTabRow[])
      .filter((item) => item.visible ?? true)
      .map((item) => ({ href: item.href, label: item.label }))

    return links
  } catch {
    return []
  }
}

export async function getCmsPageSeoWithFallback(pageSlug: string, options: CmsSeoOptions) {
  const { includeDraft = false, fallbackTitle, fallbackDescription } = options

  const [page, settings] = await Promise.all([
    getCmsPageBySlug(pageSlug, { publishedOnly: !includeDraft }),
    getSiteSettings(['seo_global']),
  ])

  const seoGlobal = settings.seo_global ?? {}
  const defaultTitle = readString(seoGlobal.default_title) ?? fallbackTitle
  const defaultDescription = readString(seoGlobal.default_description) ?? fallbackDescription
  const titleTemplate = readString(seoGlobal.title_template)
  const pageTitle = readString(page?.meta_title) ?? readString(page?.title)
  const finalTitle = pageTitle ?? defaultTitle
  const finalDescription = readString(page?.meta_description) ?? defaultDescription

  const title = titleTemplate && pageTitle
    ? titleTemplate.replace('%s', pageTitle)
    : finalTitle

  return {
    title,
    description: finalDescription,
    ogImage: readString(page?.og_image_url),
    robotsIndex: page?.meta_robots_index ?? true,
    robotsFollow: page?.meta_robots_follow ?? true,
  }
}
