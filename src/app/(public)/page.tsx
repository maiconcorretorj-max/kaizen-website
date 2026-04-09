import HeroSection from '@/components/home/HeroSection'
import FeaturedProperties from '@/components/home/FeaturedProperties'
import Differentials from '@/components/home/Differentials'
import CallToAction from '@/components/home/CallToAction'
import { mapSectionsToLegacyContent } from '@/lib/cms/section-mapper'
import createServerClient from '@/lib/supabase/server'
import { getCmsPageSeoWithFallback, getLegacyContentBlocksByPages, getSectionsByPageSlug, getSiteSettings } from '@/lib/cms/server'
import type { Metadata } from 'next'

const defaultOrder = ['hero', 'featured_properties', 'differentials', 'cta'] as const

const componentBySectionType: Record<string, (content: Record<string, string>) => JSX.Element> = {
  hero: (content) => <HeroSection content={content} />,
  featured_properties: (content) => <FeaturedProperties content={content} />,
  differentials: (content) => <Differentials content={content} />,
  cta: (content) => <CallToAction content={content} />,
}

export async function generateMetadata({ searchParams }: { searchParams?: { preview?: string } }): Promise<Metadata> {
  let includeDraft = false
  if (searchParams?.preview === '1') {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    includeDraft = !!data.session
  }

  const seo = await getCmsPageSeoWithFallback('home', {
    includeDraft,
    fallbackTitle: 'Kaizen Soluções Imobiliárias | Imóveis em Campo Grande - RJ',
    fallbackDescription: 'Realizando sonhos através do imóvel ideal. Encontre casas, apartamentos, coberturas e terrenos em Campo Grande e toda região do Rio de Janeiro.',
  })

  return {
    title: seo.title,
    description: seo.description,
    openGraph: {
      title: seo.title,
      description: seo.description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : undefined,
    },
    robots: {
      index: seo.robotsIndex,
      follow: seo.robotsFollow,
    },
  }
}

export const dynamic = 'force-dynamic'

async function getContent() {
  return getLegacyContentBlocksByPages(['home', 'home_destaques', 'home_diferenciais', 'home_cta', 'contato'])
}

async function getOrderAndContent(previewMode: boolean) {
  let allowPreview = false

  if (previewMode) {
    const supabase = createServerClient()
    const { data } = await supabase.auth.getSession()
    allowPreview = !!data.session
  }

  const sections = await getSectionsByPageSlug('home', {
    publishedOnly: !allowPreview,
    activeOnly: true,
  })
  const settings = await getSiteSettings(['contact_info'])
  const contactInfo = settings.contact_info ?? {}

  const mapped = mapSectionsToLegacyContent('home', sections)
  const content = Object.keys(mapped).length > 0 ? mapped : await getContent()

  if (!content.contact_whatsapp && typeof contactInfo.whatsapp === 'string' && contactInfo.whatsapp.trim().length > 0) {
    content.contact_whatsapp = contactInfo.whatsapp
  }

  const ordered = sections
    .map((item) => item.section_type)
    .filter((type, index, arr) => defaultOrder.includes(type as (typeof defaultOrder)[number]) && arr.indexOf(type) === index)

  return {
    content,
    order: ordered.length > 0 ? ordered : [...defaultOrder],
  }
}

export default async function HomePage({ searchParams }: { searchParams?: { preview?: string } }) {
  const previewMode = searchParams?.preview === '1'
  const { content, order } = await getOrderAndContent(previewMode)

  return (
    <>
      {order.map((sectionType) => componentBySectionType[sectionType]?.(content) ?? null)}
    </>
  )
}
