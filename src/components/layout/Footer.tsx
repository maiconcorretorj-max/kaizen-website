import Link from 'next/link'
import Image from 'next/image'
import { Montserrat } from 'next/font/google'
import { Phone, Mail, MapPin, Instagram, Facebook, Linkedin } from 'lucide-react'
import { getFooterLinks, getSiteSettings } from '@/lib/cms/server'

const brandFont = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
})

const fallbackQuickLinks = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre Nós' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/contato', label: 'Contato' },
]

export default async function Footer() {
  const settings = await getSiteSettings(['branding', 'contact_info', 'social_links', 'footer_content'])
  const footerLinks = await getFooterLinks()

  const branding = settings.branding ?? {}
  const contactInfo = settings.contact_info ?? {}
  const socialLinks = settings.social_links ?? {}
  const footerContent = settings.footer_content ?? {}

  const companyName = typeof branding.company_name === 'string' ? branding.company_name : 'Kaizen'
  const companySuffix = typeof branding.company_suffix === 'string' ? branding.company_suffix : 'Soluções Imobiliárias'

  const description = typeof footerContent.description === 'string'
    ? footerContent.description
    : 'Realizando sonhos através do imóvel ideal. Há mais de 10 anos ajudando famílias a encontrarem o lar perfeito no Rio de Janeiro.'

  const creci = typeof footerContent.creci === 'string' ? footerContent.creci : 'CRECI: 00000-J'
  const rightsText = typeof footerContent.rights_text === 'string'
    ? footerContent.rights_text
    : 'Todos os direitos reservados.'

  const phone = typeof contactInfo.phone === 'string' ? contactInfo.phone : '(21) 99999-9999'
  const email = typeof contactInfo.email === 'string' ? contactInfo.email : 'contato@kaizenimoveis.com.br'
  const address = typeof contactInfo.address === 'string'
    ? contactInfo.address
    : 'Rua Engenheiro Trindade, 99\nCampo Grande, Rio de Janeiro - RJ'

  const instagram = typeof socialLinks.instagram === 'string' ? socialLinks.instagram : 'https://instagram.com'
  const facebook = typeof socialLinks.facebook === 'string' ? socialLinks.facebook : 'https://facebook.com'
  const linkedin = typeof socialLinks.linkedin === 'string' ? socialLinks.linkedin : 'https://linkedin.com'

  const links = footerLinks.length > 0 ? footerLinks : fallbackQuickLinks

  return (
    <footer className="bg-[#0A2A66] text-white">
      <div className="container mx-auto px-4 max-w-7xl py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-md overflow-hidden">
                <Image
                  src="/logo-kaizen.png?v=6"
                  alt="Logo Kaizen"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-10 w-10 object-contain"
                />
              </div>
              <div>
                <p className={`${brandFont.className} font-extrabold text-lg leading-tight tracking-tight`}>
                  {companyName}
                </p>
                <p className={`${brandFont.className} text-blue-200 text-xs font-semibold tracking-wide uppercase`}>
                  {companySuffix}
                </p>
              </div>
            </div>
            <p className="text-blue-200 text-sm leading-relaxed mb-6">{description}</p>
            <div className="flex gap-3">
              <a href={instagram} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
              <a href={facebook} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={linkedin} target="_blank" rel="noopener noreferrer" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-5 text-white">Links Rápidos</h3>
            <ul className="space-y-3">
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1">
                    <span className="text-[#3B82F6]">›</span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-5 text-white">Tipos de Imóveis</h3>
            <ul className="space-y-3">
              {[
                { label: 'Apartamentos', href: '/imoveis?tipo=apartamento' },
                { label: 'Casas', href: '/imoveis?tipo=casa' },
                { label: 'Coberturas', href: '/imoveis?tipo=cobertura' },
                { label: 'Terrenos', href: '/imoveis?tipo=terreno' },
                { label: 'Comercial', href: '/imoveis?tipo=comercial' },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1">
                    <span className="text-[#3B82F6]">›</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base mb-5 text-white">Contato</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#3B82F6] mt-0.5 shrink-0" />
                <span className="text-blue-200 text-sm whitespace-pre-line">{address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-[#3B82F6] shrink-0" />
                <a href={`tel:+${phone.replace(/\D/g, '')}`} className="text-blue-200 hover:text-white text-sm transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-[#3B82F6] shrink-0" />
                <a href={`mailto:${email}`} className="text-blue-200 hover:text-white text-sm transition-colors">
                  {email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 max-w-7xl py-5 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-blue-300 text-xs">
            &copy; {new Date().getFullYear()} {companyName} {companySuffix}. {rightsText}
          </p>
          <p className="text-blue-300 text-xs">{creci} | Desenvolvido por HOKMA TECH.</p>
        </div>
      </div>
    </footer>
  )
}
