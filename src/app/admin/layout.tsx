'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Home,
  Menu as MenuIcon,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  BookOpen,
  FolderKanban,
  Mail,
  UserCog,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import createClient from '@/lib/supabase/client'

interface SidebarLink {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  children?: Array<{ href: string; label: string }>
}

const sidebarLinks: SidebarLink[] = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  {
    href: '/admin/site',
    icon: FolderKanban,
    label: 'Site',
    children: [
      { href: '/admin/site/home', label: 'Home' },
      { href: '/admin/site/sobre', label: 'Sobre' },
      { href: '/admin/site/contato', label: 'Contato' },
      { href: '/admin/site/configuracoes', label: 'Configurações' },
      { href: '/admin/site/rodape', label: 'Rodapé' },
    ],
  },
  {
    href: '/admin/imoveis',
    icon: Home,
    label: 'Imóveis',
    children: [
      { href: '/admin/imoveis/novo', label: 'Cadastrar imóvel' },
      { href: '/admin/imoveis', label: 'Gerenciar imóveis' },
    ],
  },
  { href: '/admin/blog', icon: BookOpen, label: 'Blog' },
  { href: '/admin/leads', icon: Mail, label: 'Leads' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userName, setUserName] = useState<string>('Administrador')
  const [userAvatar, setUserAvatar] = useState<string>('')
  const pathname = usePathname()
  const router = useRouter()
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/admin/site': pathname.startsWith('/admin/site'),
    '/admin/imoveis': pathname.startsWith('/admin/imoveis'),
  })

  useEffect(() => {
    sidebarLinks.forEach((link) => {
      router.prefetch(link.href)
      link.children?.forEach((child) => {
        router.prefetch(child.href)
      })
    })
  }, [router])

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      const user = data.user
      const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>
      const displayName =
        (typeof metadata.username === 'string' && metadata.username.trim().length > 0 && metadata.username) ||
        (typeof metadata.full_name === 'string' && metadata.full_name.trim().length > 0 && metadata.full_name) ||
        user?.email?.split('@')[0] ||
        'Administrador'

      setUserName(displayName)
      setUserAvatar(typeof metadata.avatar_url === 'string' ? metadata.avatar_url : '')
    }

    loadUser()
  }, [])

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    const supabase = createClient()

    try {
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
      setTimeout(() => {
        window.location.assign('/login')
      }, 150)
    } catch {
      window.location.assign('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-[#0A2A66] text-white flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="rounded-md overflow-hidden">
              <Image
                src="/logo-kaizen.png?v=6"
                alt="Logo Kaizen"
                width={64}
                height={64}
                unoptimized
                className="h-7 w-7 object-contain"
              />
            </div>
            <div>
              <p className="font-bold text-sm">Kaizen Admin</p>
              <p className="text-blue-300 text-xs">Painel</p>
            </div>
          </Link>
          <button
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            const isExpanded = expandedMenus[link.href] ?? isActive
            return (
              <div key={link.href} className="space-y-1">
                {link.children ? (
                  <button
                    type="button"
                    onClick={() => setExpandedMenus((prev) => ({ ...prev, [link.href]: !isExpanded }))}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                    <ChevronDown className={cn('h-4 w-4 ml-auto transition-transform', isExpanded && 'rotate-180')} />
                  </button>
                ) : (
                  <Link
                    href={link.href}
                    prefetch
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-200 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                    {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
                  </Link>
                )}

                {link.children && isExpanded && (
                  <div className="pl-4 space-y-1">
                    {link.children.map((child) => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          prefetch
                          onClick={() => setSidebarOpen(false)}
                          className={cn(
                            'flex items-center px-3 py-2 rounded-lg text-xs transition-colors',
                            childActive
                              ? 'bg-white/20 text-white'
                              : 'text-blue-200 hover:text-white hover:bg-white/10'
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <Settings className="h-4 w-4" />
            Ver site
          </Link>
          <Link
            href="/admin/configuracoes"
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
              pathname === '/admin/configuracoes'
                ? 'bg-white/20 text-white'
                : 'text-blue-200 hover:text-white hover:bg-white/10'
            )}
          >
            <UserCog className="h-4 w-4" />
            Minha Conta
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-200 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? 'Saindo...' : 'Sair'}
          </button>
        </div>
      </aside>

      {/* Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <nav className="text-sm text-gray-500">
              <span>Admin</span>
              {pathname !== '/admin' && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-[#0A2A66] font-medium capitalize">
                    {pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-xs text-gray-400">Logado como</p>
              <p className="text-sm font-semibold text-[#0A2A66]">{userName}</p>
            </div>
            <div className="hidden md:flex h-10 w-10 rounded-full overflow-hidden border border-gray-200 bg-gray-100 items-center justify-center">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-[#0A2A66]">{userName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
