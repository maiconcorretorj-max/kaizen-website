'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Montserrat } from 'next/font/google'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const brandFont = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
})

interface NavLink {
  href: string
  label: string
}

interface NavbarProps {
  navLinks?: NavLink[]
}

const defaultLinks: NavLink[] = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre Nós' },
  { href: '/imoveis', label: 'Imóveis' },
  { href: '/contato', label: 'Contato' },
]

const cinematicEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

export default function Navbar({ navLinks = defaultLinks }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const startRouteTransition = (href: string) => {
    router.prefetch(href)
    if (href !== pathname) {
      setIsRouteTransitioning(true)
    }
  }

  useEffect(() => {
    const routesToPrefetch = Array.from(new Set(navLinks.map((link) => link.href).concat('/login')))
    routesToPrefetch.forEach((href) => router.prefetch(href))
  }, [navLinks, router])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isRouteTransitioning) return
    const timer = window.setTimeout(() => {
      setIsRouteTransitioning(false)
    }, 320)
    return () => window.clearTimeout(timer)
  }, [pathname, isRouteTransitioning])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A2A66] h-20">
      <div className="container mx-auto px-4 max-w-7xl h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
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
            <div className="flex flex-col">
              <span className={`${brandFont.className} text-white font-extrabold text-lg leading-tight tracking-tight`}>
                Kaizen
              </span>
              <span className={`${brandFont.className} text-blue-200 text-xs font-semibold leading-tight tracking-wide uppercase`}>
                Soluções Imobiliárias
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onMouseEnter={() => router.prefetch(link.href)}
                onFocus={() => router.prefetch(link.href)}
                onClick={() => startRouteTransition(link.href)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'bg-white/20 text-white'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Login Button */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                onMouseEnter={() => router.prefetch('/login')}
                onClick={() => startRouteTransition('/login')}
                className="border-white/40 text-white bg-transparent hover:bg-white hover:text-[#0A2A66] transition-all duration-200"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-md hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#0A2A66] border-t border-white/10"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch
                  onTouchStart={() => router.prefetch(link.href)}
                  onClick={() => startRouteTransition(link.href)}
                  className={cn(
                    'px-4 py-3 rounded-md text-sm font-medium transition-all duration-200',
                    pathname === link.href
                      ? 'bg-white/20 text-white'
                      : 'text-blue-100 hover:text-white hover:bg-white/10'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2">
                <Link href="/login" className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    onTouchStart={() => router.prefetch('/login')}
                    onClick={() => startRouteTransition('/login')}
                    className="w-full border-white/40 text-white bg-transparent hover:bg-white hover:text-[#0A2A66]"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Entrar
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRouteTransitioning && (
          <>
            <motion.div
              initial={{ opacity: 0, scaleX: 0.08 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.32, ease: cinematicEase }}
              className="fixed top-20 left-0 right-0 z-40 h-[2px] origin-left bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-transparent pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>
    </nav>
  )
}
