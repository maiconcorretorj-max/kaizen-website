'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import createClient from '@/lib/supabase/client'
import { mapSectionsToLegacyContent } from '@/lib/cms/section-mapper'
import { getSectionsByPageSlugClient, getSiteSettingsClient } from '@/lib/cms/client'

const TRACK_TTL_MINUTES = 30
const ROUTES_TO_PREFETCH = ['/', '/sobre', '/imoveis', '/contato', '/login']
const PROPERTIES_CACHE_KEY = 'cache:properties:published:v1'
const PROPERTIES_CACHE_TTL = 5 * 60 * 1000
const ABOUT_CACHE_KEY = 'cache:public:sobre:v1:published'
const CONTACT_CACHE_KEY = 'cache:public:contato:v1:published'
const CMS_CACHE_TTL = 5 * 60 * 1000

const DEFAULT_ABOUT_ORDER_MAP: Record<string, number> = {
  hero: 1,
  story: 2,
  values: 3,
  team: 4,
  cta: 5,
}

const DEFAULT_CONTACT_ORDER_MAP: Record<string, number> = {
  hero: 1,
  contact_info: 2,
}

function hasFreshCache(key: string, ttlMs: number) {
  if (typeof window === 'undefined') return false
  const raw = window.sessionStorage.getItem(key)
  if (!raw) return false

  try {
    const cached = JSON.parse(raw) as { timestamp: number }
    return Date.now() - cached.timestamp < ttlMs
  } catch {
    window.sessionStorage.removeItem(key)
    return false
  }
}

async function warmAboutCache() {
  if (typeof window === 'undefined') return
  if (hasFreshCache(ABOUT_CACHE_KEY, CMS_CACHE_TTL)) return

  const sectionRows = await getSectionsByPageSlugClient('sobre', { preview: false })
  const cmsContent = mapSectionsToLegacyContent('sobre', sectionRows)
  const nextOrderMap = { ...DEFAULT_ABOUT_ORDER_MAP }

  sectionRows.forEach((item, index) => {
    if (item.section_type in nextOrderMap) {
      nextOrderMap[item.section_type] = index + 1
    }
  })

  if (Object.keys(cmsContent).length > 0) {
    window.sessionStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), content: cmsContent, orderMap: nextOrderMap }))
    return
  }

  const supabase = createClient() as any
  const { data } = await supabase
    .from('content_blocks')
    .select('key, content')
    .eq('page', 'sobre')

  const map: Record<string, string> = {}
  ;(data ?? []).forEach((row: { key: string; content: string }) => {
    map[row.key] = row.content
  })

  ;[
    'about_team1_name', 'about_team1_role', 'about_team1_creci', 'about_team1_image',
    'about_team2_name', 'about_team2_role', 'about_team2_creci', 'about_team2_image',
    'about_team3_name', 'about_team3_role', 'about_team3_creci', 'about_team3_image',
  ].forEach((key) => {
    delete map[key]
  })

  window.sessionStorage.setItem(ABOUT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), content: map, orderMap: nextOrderMap }))
}

async function warmContactCache() {
  if (typeof window === 'undefined') return
  if (hasFreshCache(CONTACT_CACHE_KEY, CMS_CACHE_TTL)) return

  const [sectionRows, settings] = await Promise.all([
    getSectionsByPageSlugClient('contato', { preview: false }),
    getSiteSettingsClient(['contact_info']),
  ])

  const cmsContent = mapSectionsToLegacyContent('contato', sectionRows)
  const nextOrderMap = { ...DEFAULT_CONTACT_ORDER_MAP }

  sectionRows.forEach((item, index) => {
    if (item.section_type in nextOrderMap) {
      nextOrderMap[item.section_type] = index + 1
    }
  })

  const contactInfo = settings.contact_info ?? {}
  const settingsMap: Record<string, string> = {}
  if (typeof contactInfo.phone === 'string') settingsMap.contact_phone = contactInfo.phone
  if (typeof contactInfo.email === 'string') settingsMap.contact_email = contactInfo.email
  if (typeof contactInfo.address === 'string') settingsMap.contact_address = contactInfo.address
  if (typeof contactInfo.hours === 'string') settingsMap.contact_hours = contactInfo.hours
  if (typeof contactInfo.whatsapp === 'string') settingsMap.contact_whatsapp = contactInfo.whatsapp

  if (Object.keys(cmsContent).length > 0 || Object.keys(settingsMap).length > 0) {
    window.sessionStorage.setItem(
      CONTACT_CACHE_KEY,
      JSON.stringify({ timestamp: Date.now(), content: { ...settingsMap, ...cmsContent }, orderMap: nextOrderMap })
    )
    return
  }

  const supabase = createClient() as any
  const { data } = await supabase
    .from('content_blocks')
    .select('key, content')
    .eq('page', 'contato')

  const map: Record<string, string> = {}
  ;(data ?? []).forEach((row: { key: string; content: string }) => {
    map[row.key] = row.content
  })

  const { data: global } = await supabase
    .from('content_blocks')
    .select('key, content')
    .eq('page', 'global')

  ;(global ?? []).forEach((row: { key: string; content: string }) => {
    map[row.key] = row.content
  })

  window.sessionStorage.setItem(CONTACT_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), content: map, orderMap: nextOrderMap }))
}

function canTrackPath(pathname: string) {
  if (!pathname) return false
  return !pathname.startsWith('/admin')
}

export default function SiteVisitTracker() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    ROUTES_TO_PREFETCH.forEach((route) => router.prefetch(route))
  }, [router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const shouldWarmCache = pathname === '/'
    if (!shouldWarmCache) return

    const raw = window.sessionStorage.getItem(PROPERTIES_CACHE_KEY)
    if (raw) {
      try {
        const cached = JSON.parse(raw) as { timestamp: number; data: unknown[] }
        if (Date.now() - cached.timestamp < PROPERTIES_CACHE_TTL && Array.isArray(cached.data) && cached.data.length > 0) {
          return
        }
      } catch {
        window.sessionStorage.removeItem(PROPERTIES_CACHE_KEY)
      }
    }

    const warm = async () => {
      const supabase = createClient() as any
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, neighborhood, city, state, address, type, status, price, area, bedrooms, bathrooms, parking_spaces, featured, images, publication_status, created_at')
        .eq('publication_status', 'published')
        .order('created_at', { ascending: false })

      window.sessionStorage.setItem(PROPERTIES_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: data ?? [] }))
    }

    const warmAll = async () => {
      await Promise.allSettled([warm(), warmAboutCache(), warmContactCache()])
    }

    const win = window as Window & { requestIdleCallback?: (callback: () => void) => number }
    if (typeof win.requestIdleCallback === 'function') {
      win.requestIdleCallback(() => {
        warmAll()
      })
      return
    }

    const timer = window.setTimeout(() => {
      warmAll()
    }, 250)

    return () => {
      window.clearTimeout(timer)
    }
  }, [pathname])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!canTrackPath(pathname)) return

    const minuteBucket = Math.floor(Date.now() / (TRACK_TTL_MINUTES * 60 * 1000))
    const key = `site_visit:${pathname}:${minuteBucket}`
    if (window.sessionStorage.getItem(key)) return

    window.sessionStorage.setItem(key, '1')

    const track = async () => {
      const supabase = createClient() as any
      await supabase.from('site_visits').insert({
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent || null,
      })
    }

    track()
  }, [pathname])

  return null
}
