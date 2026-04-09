import Link from 'next/link'
import { Settings, LayoutTemplate, Contact, BookOpenText, ArrowRight } from 'lucide-react'

const links = [
  { href: '/admin/site/home', label: 'Home', icon: LayoutTemplate },
  { href: '/admin/site/sobre', label: 'Sobre', icon: BookOpenText },
  { href: '/admin/site/contato', label: 'Contato', icon: Contact },
  { href: '/admin/site/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/admin/site/rodape', label: 'Rodapé', icon: LayoutTemplate },
]

export default function AdminSitePage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2A66]">Site</h1>
        <p className="text-gray-500 text-sm mt-1">Nova área CMS (coexistindo com telas legadas).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:border-[#1E4ED8]/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-[#1E4ED8]" />
              </div>
              <span className="font-medium text-[#0A2A66]">{item.label}</span>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  )
}
