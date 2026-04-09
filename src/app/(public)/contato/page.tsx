import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react'
import createServerClient from '@/lib/supabase/server'
import { getCmsPageSeoWithFallback, getLegacyContentBlocksByPages, getSectionsByPageSlug, getSiteSettings } from '@/lib/cms/server'
import { mapSectionsToLegacyContent } from '@/lib/cms/section-mapper'
import ContactFormClient from '@/components/contact/ContactFormClient'

const WHATSAPP_MSG = encodeURIComponent('Olá! Vim pelo site da Kaizen Soluções Imobiliárias e gostaria de mais informações.')

const DEFAULT_ORDER_MAP: Record<string, number> = {
  hero: 1,
  contact_info: 2,
}

async function canPreview(searchParams?: { preview?: string }) {
  if (searchParams?.preview !== '1') return false
  const supabase = createServerClient()
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

async function getContatoData(searchParams?: { preview?: string }) {
  const includeDraft = await canPreview(searchParams)

  if (process.env.NODE_ENV === 'development') {
    return fetchContatoData(includeDraft)
  }

  if (!includeDraft) {
    return getPublishedContatoData()
  }

  return fetchContatoData(true)
}

async function fetchContatoData(includeDraft: boolean) {
  const sections = await getSectionsByPageSlug('contato', { publishedOnly: !includeDraft, activeOnly: true })
  const settings = await getSiteSettings(['contact_info'])
  const cmsContent = mapSectionsToLegacyContent('contato', sections)

  const sectionOrderMap = { ...DEFAULT_ORDER_MAP }
  sections.forEach((item, index) => {
    if (item.section_type in sectionOrderMap) {
      sectionOrderMap[item.section_type] = index + 1
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
    return { content: { ...settingsMap, ...cmsContent }, sectionOrderMap, includeDraft }
  }

  const fallback = await getLegacyContentBlocksByPages(['contato', 'global'])
  return { content: fallback, sectionOrderMap, includeDraft }
}

const getPublishedContatoData = unstable_cache(
  async () => fetchContatoData(false),
  ['public-contato-data-v1'],
  { revalidate: 300, tags: ['public-contato'] }
)

const getPublishedContatoSeo = unstable_cache(
  async () => getCmsPageSeoWithFallback('contato', {
    includeDraft: false,
    fallbackTitle: 'Contato | Kaizen Soluções Imobiliárias',
    fallbackDescription: 'Fale com a Kaizen Soluções Imobiliárias.',
  }),
  ['public-contato-seo-v1'],
  { revalidate: 300, tags: ['public-contato-seo'] }
)

export async function generateMetadata({ searchParams }: { searchParams?: { preview?: string } }): Promise<Metadata> {
  const includeDraft = await canPreview(searchParams)
  const seo = includeDraft
    ? await getCmsPageSeoWithFallback('contato', {
      includeDraft: true,
      fallbackTitle: 'Contato | Kaizen Soluções Imobiliárias',
      fallbackDescription: 'Fale com a Kaizen Soluções Imobiliárias.',
    })
    : await getPublishedContatoSeo()

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

export default async function ContatoPage({ searchParams }: { searchParams?: { preview?: string } }) {
  const { content, sectionOrderMap } = await getContatoData(searchParams)

  const whatsapp = content['contact_whatsapp'] || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5521999999999'
  const phone = content['contact_phone'] || '(21) 99999-9999'
  const email = content['contact_email'] || 'contato@kaizenimoveis.com.br'
  const address = content['contact_address'] || 'Rua Engenheiro Trindade, 99\nCampo Grande, Rio de Janeiro - RJ'
  const hours = content['contact_hours'] || 'Seg-Sex: 8h às 18h\nSáb: 8h às 13h'

  const contactInfo = [
    { icon: MapPin, label: 'Endereço', value: address },
    { icon: Phone, label: 'Telefone', value: phone, href: `tel:+${phone.replace(/\D/g, '')}` },
    { icon: Mail, label: 'E-mail', value: email, href: `mailto:${email}` },
    { icon: Clock, label: 'Horário', value: hours },
  ]

  return (
    <div className="pt-20 min-h-screen bg-gray-50 flex flex-col animate-fade-in">
      <div style={{ order: sectionOrderMap.hero }} className="bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <span className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3 block">{content['contact_hero_badge'] || 'Fale conosco'}</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{content['contact_hero_title'] || 'Contato'}</h1>
          <p className="text-blue-100 text-lg">{content['contact_hero_subtitle'] || 'Nossa equipe está pronta para atendê-lo'}</p>
        </div>
      </div>

      <div style={{ order: sectionOrderMap.contact_info }} className="container mx-auto px-4 max-w-7xl py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#0A2A66] mb-2">Informações de Contato</h2>
              <p className="text-gray-600 text-sm leading-relaxed">Estamos aqui para ajudá-lo a encontrar o imóvel ideal.</p>
            </div>

            {contactInfo.map((info) => (
              <div key={info.label} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <info.icon className="h-5 w-5 text-[#1E4ED8]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{info.label}</p>
                  {'href' in info && info.href ? (
                    <a href={info.href} className="text-gray-700 hover:text-[#1E4ED8] transition-colors text-sm whitespace-pre-line">{info.value}</a>
                  ) : (
                    <p className="text-gray-700 text-sm whitespace-pre-line">{info.value}</p>
                  )}
                </div>
              </div>
            ))}

            <a
              href={`https://wa.me/${whatsapp}?text=${WHATSAPP_MSG}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-5 py-4 rounded-xl transition-colors shadow-md"
            >
              <MessageCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold text-sm">Falar no WhatsApp</p>
                <p className="text-green-100 text-xs">Resposta rápida!</p>
              </div>
            </a>
          </div>

          <div className="lg:col-span-2">
            <ContactFormClient />
          </div>
        </div>

        <div className="mt-14">
          <h2 className="text-2xl font-bold text-[#0A2A66] mb-6">Nossa Localização</h2>
          <div className="rounded-2xl overflow-hidden shadow-lg h-80 md:h-[450px] border border-gray-200">
            <iframe
              src={content['contact_map_url'] || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3675.0855283752185!2d-43.56862472396399!3d-22.90316153789617!2m3!1f0!2f0!3f0!2m3!1i1024!2i768!4f13.1!3m3!1m2!1s0x9be17b8d25000001%3A0x0!2sR.+Eng.+Trindade%2C+99+-+Campo+Grande%2C+Rio+de+Janeiro+-+RJ%2C+23080-090!5e0!3m2!1spt-BR!2sbr!4v1700000000000!5m2!1spt-BR!2sbr'}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização Kaizen Soluções Imobiliárias"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
