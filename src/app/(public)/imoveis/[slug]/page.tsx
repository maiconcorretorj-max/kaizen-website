'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Bed,
  Bath,
  Car,
  Maximize2,
  MapPin,
  Phone,
  MessageCircle,
  ArrowLeft,
  Share2,
  Heart,
  Loader2,
  Link2,
  Mail,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatArea, getPropertyTypeLabel, getPropertyStatusLabel } from '@/lib/utils'
import createClient from '@/lib/supabase/client'
import { getSiteSettingsClient } from '@/lib/cms/client'
import type { Property } from '@/types'

const WHATSAPP_NUMBER = '5521999999999'
const FALLBACK_PHONE = '(21) 99999-9999'

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const { toast } = useToast()
  const [selectedImage, setSelectedImage] = useState(0)
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [contactPhone, setContactPhone] = useState(FALLBACK_PHONE)
  const [contactWhatsapp, setContactWhatsapp] = useState(WHATSAPP_NUMBER)
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)

  useEffect(() => {
    const loadPageData = async () => {
      const supabase = createClient() as any
      const [{ data }, settings] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .eq('slug', params.slug)
          .eq('publication_status', 'published')
          .eq('active', true)
          .single(),
        getSiteSettingsClient(['contact_info']),
      ])

      const contactInfo = settings.contact_info ?? {}
      const phone = typeof contactInfo.phone === 'string' && contactInfo.phone.trim().length > 0
        ? contactInfo.phone
        : FALLBACK_PHONE
      const whatsapp = typeof contactInfo.whatsapp === 'string' && contactInfo.whatsapp.trim().length > 0
        ? contactInfo.whatsapp
        : WHATSAPP_NUMBER

      setContactPhone(phone)
      setContactWhatsapp(onlyDigits(whatsapp) || WHATSAPP_NUMBER)

      setProperty((data as Property | null) ?? null)
      setLoading(false)
    }

    loadPageData()
  }, [params.slug])

  useEffect(() => {
    if (!property) return
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('favorite_properties')
      const saved = raw ? (JSON.parse(raw) as string[]) : []
      setIsFavorite(saved.includes(property.slug))
    } catch {
      setIsFavorite(false)
    }
  }, [property])

  const toggleFavorite = () => {
    if (!property || typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('favorite_properties')
      const saved = raw ? (JSON.parse(raw) as string[]) : []
      const next = saved.includes(property.slug)
        ? saved.filter((slug) => slug !== property.slug)
        : [...saved, property.slug]

      window.localStorage.setItem('favorite_properties', JSON.stringify(next))

      const nowFavorite = next.includes(property.slug)
      setIsFavorite(nowFavorite)
      toast({ title: nowFavorite ? 'Imóvel salvo nos favoritos' : 'Imóvel removido dos favoritos' })
    } catch {
      toast({ title: 'Não foi possível salvar favorito', variant: 'destructive' })
    }
  }

  const shareLinks = {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${property?.title ?? 'Imóvel'} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(property?.title ?? 'Imóvel')}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`,
    email: `mailto:?subject=${encodeURIComponent(`Imóvel: ${property?.title ?? ''}`)}&body=${encodeURIComponent(`Veja este imóvel: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`,
  }

  const handleShare = async () => {
    if (typeof window === 'undefined') return
    const url = window.location.href
    const title = property?.title || 'Imóvel'

    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
    } catch {
      // Ignore and open menu fallback.
    }

    setShareMenuOpen((prev) => !prev)
  }

  const copyLink = async () => {
    if (typeof window === 'undefined') return
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Link copiado!' })
      setShareMenuOpen(false)
    } catch {
      toast({ title: 'Não foi possível copiar o link', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1E4ED8]" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="pt-20 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl py-16 text-center">
          <h1 className="text-2xl font-bold text-[#0A2A66] mb-3">Imóvel não encontrado</h1>
          <p className="text-gray-500 mb-6">Este imóvel pode estar inativo, em rascunho ou ter sido removido.</p>
          <Link href="/imoveis">
            <Button>Voltar para imóveis</Button>
          </Link>
        </div>
      </div>
    )
  }

  const images = property.images && property.images.length > 0
    ? property.images
    : ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80']

  const whatsappMsg = `Olá! Tenho interesse no imóvel "${property.title}" (${formatCurrency(property.price)}). Poderia me dar mais informações?`

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            href="/imoveis"
            className="flex items-center gap-1 text-[#1E4ED8] hover:text-[#0A2A66] text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar aos imóveis
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Images + Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative h-80 md:h-[480px] rounded-2xl overflow-hidden shadow-lg"
            >
              <Image
                src={images[selectedImage]}
                alt={property.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="bg-[#0A2A66] text-white text-xs font-medium px-3 py-1 rounded-full">
                  {getPropertyTypeLabel(property.type)}
                </span>
                <span className="bg-green-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {getPropertyStatusLabel(property.status)}
                </span>
              </div>
                <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={toggleFavorite}
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition-colors"
                  aria-label="Salvar imóvel nos favoritos"
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={handleShare}
                    className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition-colors"
                    aria-label="Compartilhar imóvel"
                  >
                    <Share2 className="h-4 w-4 text-gray-600" />
                  </button>

                  {shareMenuOpen && (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-gray-200 bg-white shadow-xl p-2 z-20 space-y-1">
                      <button onClick={copyLink} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Link2 className="h-4 w-4" />
                        Copiar link
                      </button>
                      <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp
                      </a>
                      <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Send className="h-4 w-4" />
                        Telegram
                      </a>
                      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Share2 className="h-4 w-4" />
                        Facebook
                      </a>
                      <a href={shareLinks.email} className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Mail className="h-4 w-4" />
                        E-mail
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-20 w-28 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-[#1E4ED8] shadow-md'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image src={img} alt={`Foto ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h1 className="text-2xl md:text-3xl font-bold text-[#0A2A66] mb-2">
                {property.title}
              </h1>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                <MapPin className="h-4 w-4 text-[#3B82F6]" />
                <span>{property.address} — {property.neighborhood}, {property.city} - {property.state}</span>
              </div>
              <p className="text-3xl font-bold text-[#1E4ED8] mb-6">
                {formatCurrency(property.price)}
                {property.status === 'aluguel' && (
                  <span className="text-base font-normal text-gray-500 ml-1">/mês</span>
                )}
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl mb-6">
                <div className="text-center">
                  <Maximize2 className="h-5 w-5 text-[#1E4ED8] mx-auto mb-1" />
                  <p className="font-semibold text-[#0A2A66]">{formatArea(property.area)}</p>
                  <p className="text-gray-500 text-xs">Área</p>
                </div>
                {property.bedrooms && (
                  <div className="text-center">
                    <Bed className="h-5 w-5 text-[#1E4ED8] mx-auto mb-1" />
                    <p className="font-semibold text-[#0A2A66]">{property.bedrooms}</p>
                    <p className="text-gray-500 text-xs">Quartos</p>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="text-center">
                    <Bath className="h-5 w-5 text-[#1E4ED8] mx-auto mb-1" />
                    <p className="font-semibold text-[#0A2A66]">{property.bathrooms}</p>
                    <p className="text-gray-500 text-xs">Banheiros</p>
                  </div>
                )}
                {property.parking_spaces && (
                  <div className="text-center">
                    <Car className="h-5 w-5 text-[#1E4ED8] mx-auto mb-1" />
                    <p className="font-semibold text-[#0A2A66]">{property.parking_spaces}</p>
                    <p className="text-gray-500 text-xs">Vagas</p>
                  </div>
                )}
              </div>

              <h2 className="text-lg font-bold text-[#0A2A66] mb-3">Descrição</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line text-sm">
                {property.description}
              </div>
            </div>

            {/* Features */}
            {property.features && property.features.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-[#0A2A66] mb-4">Características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-gray-700 text-sm bg-blue-50 rounded-lg px-3 py-2"
                    >
                      <span className="w-2 h-2 bg-[#1E4ED8] rounded-full shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Contact Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-lg font-bold text-[#0A2A66] mb-2">Interessado?</h2>
              <p className="text-gray-500 text-sm mb-5">
                Entre em contato com nossos corretores e agende uma visita
              </p>

              <div className="space-y-3">
                <a
                  href={`https://wa.me/${contactWhatsapp}?text=${encodeURIComponent(whatsappMsg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 px-4 rounded-xl font-medium transition-colors text-sm"
                >
                  <MessageCircle className="h-5 w-5" />
                  Falar no WhatsApp
                </a>
                <a
                  href={`tel:+${onlyDigits(contactPhone)}`}
                  className="w-full flex items-center justify-center gap-2 bg-[#0A2A66] hover:bg-[#1E4ED8] text-white py-3 px-4 rounded-xl font-medium transition-colors text-sm"
                >
                  <Phone className="h-5 w-5" />
                  {contactPhone}
                </a>
                <Link href="/contato" className="block">
                  <Button
                    variant="outline"
                    className="w-full"
                  >
                    Enviar Mensagem
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
