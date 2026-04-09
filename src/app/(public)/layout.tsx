import { unstable_cache } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import WhatsAppButton from '@/components/layout/WhatsAppButton'
import SiteVisitTracker from '@/components/analytics/SiteVisitTracker'
import { getSiteSettings } from '@/lib/cms/server'

const fallbackLinks = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre Nós' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/contato', label: 'Contato' },
]

const getCachedNavLinks = unstable_cache(
  async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return fallbackLinks
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { data } = await supabase
      .from('nav_tabs')
      .select('label, href, order, menu_location, visible')
      .eq('menu_location', 'header')
      .eq('visible', true)
      .eq('active', true)
      .order('order', { ascending: true })

    if (data && data.length > 0) {
      return data.map((t: { label: string; href: string }) => ({ href: t.href, label: t.label }))
    }

    return fallbackLinks
  },
  ['public-nav-links'],
  { revalidate: 300 }
)

async function getNavLinks() {
  try {
    return await getCachedNavLinks()
  } catch {
    return fallbackLinks
  }
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const navLinks = await getNavLinks()
  const settings = await getSiteSettings(['contact_info'])
  const contactInfo = settings.contact_info ?? {}
  const whatsappNumber = typeof contactInfo.whatsapp === 'string'
    ? contactInfo.whatsapp
    : process.env.NEXT_PUBLIC_WHATSAPP_NUMBER

  return (
    <>
      <Navbar navLinks={navLinks} />
      <SiteVisitTracker />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton whatsappNumber={whatsappNumber} />
    </>
  )
}
