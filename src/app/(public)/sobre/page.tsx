import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Award, Users, Target, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import createServerClient from '@/lib/supabase/server'
import { getCmsPageSeoWithFallback, getLegacyContentBlocksByPages, getSectionsByPageSlug } from '@/lib/cms/server'
import { mapSectionsToLegacyContent } from '@/lib/cms/section-mapper'

const DEFAULT_ORDER_MAP: Record<string, number> = {
  hero: 1,
  story: 2,
  values: 3,
  team: 4,
  cta: 5,
}

function resolveOriginalImageUrl(raw: string) {
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (url.pathname.includes('/storage/v1/render/image/public/')) {
      url.pathname = url.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')
    }
    ;['w', 'width', 'h', 'height', 'q', 'quality', 'fm', 'format'].forEach((param) => {
      url.searchParams.delete(param)
    })
    return url.toString()
  } catch {
    return raw
  }
}

async function canPreview(searchParams?: { preview?: string }) {
  if (searchParams?.preview !== '1') return false
  const supabase = createServerClient()
  const { data } = await supabase.auth.getSession()
  return !!data.session
}

async function getSobreData(searchParams?: { preview?: string }) {
  const includeDraft = await canPreview(searchParams)
  return fetchSobreData(includeDraft)
}

async function fetchSobreData(includeDraft: boolean) {
  const sections = await getSectionsByPageSlug('sobre', { publishedOnly: !includeDraft, activeOnly: true })
  const cmsContent = mapSectionsToLegacyContent('sobre', sections)
  const hasCmsContent = Object.keys(cmsContent).length > 0

  const content = hasCmsContent
    ? cmsContent
    : await getLegacyContentBlocksByPages(['sobre'])

  const sectionOrderMap = { ...DEFAULT_ORDER_MAP }
  sections.forEach((item, index) => {
    if (item.section_type in sectionOrderMap) {
      sectionOrderMap[item.section_type] = index + 1
    }
  })

  return { content, sectionOrderMap }
}

export async function generateMetadata({ searchParams }: { searchParams?: { preview?: string } }): Promise<Metadata> {
  const includeDraft = await canPreview(searchParams)
  const seo = await getCmsPageSeoWithFallback('sobre', {
    includeDraft,
    fallbackTitle: 'Sobre | Kaizen Soluções Imobiliárias',
    fallbackDescription: 'Conheça a história da Kaizen Soluções Imobiliárias.',
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

export default async function SobrePage({ searchParams }: { searchParams?: { preview?: string } }) {
  const { content, sectionOrderMap } = await getSobreData(searchParams)
  const c = (key: string, fallback: string) => content[key] || fallback

  const valueIcons = [Target, Award, Users]
  const teamMembers = [1, 2, 3]
    .map((index) => ({
      name: (content[`about_team${index}_name`] || '').trim(),
      role: (content[`about_team${index}_role`] || '').trim(),
      creci: (content[`about_team${index}_creci`] || '').trim(),
      image: resolveOriginalImageUrl((content[`about_team${index}_image`] || '').trim()),
    }))
    .filter((member) => member.name || member.role || member.creci || member.image)

  return (
    <div className="pt-20 flex flex-col animate-fade-in">
      <section style={{ order: sectionOrderMap.hero }} className="bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="max-w-2xl">
            <span className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-4 block">{c('about_hero_badge', 'Quem somos')}</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{c('about_hero_title', 'Sobre a Kaizen Soluções Imobiliárias')}</h1>
            <p className="text-blue-100 text-lg leading-relaxed">{c('about_hero_subtitle', 'Mais de uma década de experiência transformando a vida de famílias através do mercado imobiliário em Campo Grande e toda região do Rio de Janeiro.')}</p>
          </div>
        </div>
      </section>

      <section style={{ order: sectionOrderMap.story }} className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-[#1E4ED8] text-sm font-semibold uppercase tracking-widest mb-4 block">{c('about_story_badge', 'Nossa História')}</span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A2A66] mb-6 leading-tight">{c('about_story_title', 'Construindo sonhos desde 2014')}</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>{c('about_story_p1', 'A Kaizen Soluções Imobiliárias nasceu com uma proposta simples e poderosa: oferecer o melhor serviço imobiliário em Campo Grande, com transparência, compromisso e dedicação total ao cliente.')}</p>
                <p>{c('about_story_p2', 'Em japonês, "Kaizen" significa melhoria contínua. Este é o princípio que guia nosso trabalho todos os dias - estamos sempre buscando novas formas de melhorar nossa experiência e superar as expectativas dos nossos clientes.')}</p>
                <p>{c('about_story_p3', 'Com uma equipe de corretores experientes e certificados, já ajudamos mais de 500 famílias a realizarem o sonho da casa própria ou encontrarem o imóvel comercial ideal para seus negócios.')}</p>
              </div>

              <ul className="mt-8 space-y-3">
                {[
                  c('about_story_bullet1', 'CRECI registrado e regular'),
                  c('about_story_bullet2', 'Corretores com mais de 10 anos de experiência'),
                  c('about_story_bullet3', 'Carteira com 200+ imóveis disponíveis'),
                  c('about_story_bullet4', 'Atendimento personalizado e humanizado'),
                ].filter(Boolean).map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-700"><CheckCircle className="h-5 w-5 text-[#1E4ED8] shrink-0" /><span>{item}</span></li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={c('about_story_image', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80')}
                  alt="Empreendimentos modernos na cidade"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-[#0A2A66] text-white p-6 rounded-2xl shadow-xl"><p className="text-4xl font-bold">3+</p><p className="text-blue-200 text-sm">{c('about_story_years_label', 'Anos de mercado')}</p></div>
              <div className="absolute -top-6 -right-6 bg-white border border-gray-100 p-4 rounded-2xl shadow-xl"><TrendingUp className="h-8 w-8 text-[#1E4ED8] mb-1" /><p className="text-[#0A2A66] font-bold text-xl">{c('about_story_sold', '500+')}</p><p className="text-gray-500 text-xs">{c('about_story_sold_label', 'Imóveis vendidos')}</p></div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ order: sectionOrderMap.values }} className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-14">
            <span className="text-[#1E4ED8] text-sm font-semibold uppercase tracking-widest mb-3 block">{c('about_values_badge', 'Nosso Propósito')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A2A66] mb-4">{c('about_values_title', 'Missão, Visão e Valores')}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { titleKey: 'about_card1_title', descKey: 'about_card1_desc', defaultTitle: 'Missão', defaultDesc: 'Proporcionar a melhor experiência imobiliária, conectando pessoas aos imóveis que transformam suas vidas.' },
              { titleKey: 'about_card2_title', descKey: 'about_card2_desc', defaultTitle: 'Visão', defaultDesc: 'Ser a imobiliária de referência em Campo Grande e região, reconhecida pela excelência e confiança.' },
              { titleKey: 'about_card3_title', descKey: 'about_card3_desc', defaultTitle: 'Valores', defaultDesc: 'Transparência, respeito, comprometimento e inovação em cada negociação que realizamos.' },
            ].map((item, index) => {
              const Icon = valueIcons[index]
              return (
                <div key={item.titleKey} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5"><Icon className="h-8 w-8 text-[#1E4ED8]" /></div>
                  <h3 className="text-xl font-bold text-[#0A2A66] mb-3">{c(item.titleKey, item.defaultTitle)}</h3>
                  <p className="text-gray-600 leading-relaxed">{c(item.descKey, item.defaultDesc)}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section style={{ order: sectionOrderMap.team }} className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-14">
            <span className="text-[#1E4ED8] text-sm font-semibold uppercase tracking-widest mb-3 block">{c('about_team_badge', 'Nossa Equipe')}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A2A66] mb-4">{c('about_team_title', 'Conheça nossos especialistas')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{c('about_team_subtitle', 'Profissionais dedicados e experientes, prontos para encontrar o imóvel perfeito para você')}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-8 max-w-5xl mx-auto">
            {teamMembers.length === 0 && <p className="w-full text-center text-gray-500">Cadastre os membros da equipe no painel administrativo para exibir esta seção.</p>}
            {teamMembers.map((member) => (
              <div key={`${member.name}-${member.role}-${member.creci}`} className="text-center group w-full max-w-[18rem]">
                <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-lg transition-shadow">
                  {member.image ? (
                    <Image
                      src={member.image}
                      alt={member.name || 'Membro da equipe'}
                      fill
                      quality={100}
                      sizes="(max-width: 768px) 88vw, (max-width: 1280px) 32vw, 320px"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-100 flex items-center justify-center"><Users className="h-12 w-12 text-gray-400" /></div>
                  )}
                </div>
                <h3 className="font-bold text-[#0A2A66] text-lg">{member.name || 'Equipe Kaizen'}</h3>
                <p className="text-gray-600 text-sm">{member.role || 'Corretor de Imóveis'}</p>
                {member.creci && <p className="text-[#3B82F6] text-xs mt-1">{member.creci}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ order: sectionOrderMap.cta }} className="py-16 bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8]">
        <div className="container mx-auto px-4 max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{c('about_cta_title', 'Pronto para encontrar seu imóvel?')}</h2>
          <p className="text-blue-100 mb-8">{c('about_cta_subtitle', 'Nossa equipe está à disposição para ajudá-lo')}</p>
          <Link href="/contato"><Button size="lg" variant="white" className="group">{c('about_cta_btn', 'Entrar em Contato')}<ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" /></Button></Link>
        </div>
      </section>
    </div>
  )
}
