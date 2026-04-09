import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeroSectionProps {
  content?: Record<string, string>
}

export default function HeroSection({ content = {} }: HeroSectionProps) {
  const badge = content['hero_badge'] || 'Rio de Janeiro & Região'
  const title = content['hero_title'] || 'Realizando sonhos através do imóvel ideal'
  const subtitle = content['hero_subtitle'] || 'Encontre o imóvel perfeito com a expertise da Kaizen Soluções Imobiliárias. Casas, apartamentos, terrenos e muito mais em Campo Grande e toda região do Rio de Janeiro.'
  const btnPrimary = content['hero_btn_primary'] || 'Buscar Imóveis'
  const btnSecondary = content['hero_btn_secondary'] || 'Fale com um Corretor'
  const backgroundImage =
    content['hero_background_image'] ||
    content['backgroundImage'] ||
    content['background_image'] ||
    'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1920&q=80'

  const stats = [
    { value: content['hero_stat1_value'] || '3+', label: content['hero_stat1_label'] || 'Anos de Experiência' },
    { value: content['hero_stat2_value'] || '100+', label: content['hero_stat2_label'] || 'Famílias Atendidas' },
    { value: content['hero_stat3_value'] || '98%', label: content['hero_stat3_label'] || 'Clientes Satisfeitos' },
    { value: content['hero_stat4_value'] || '200+', label: content['hero_stat4_label'] || 'Imóveis Disponíveis' },
  ]

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt="Imagem de destaque da Kaizen"
          fill
          priority
          quality={85}
          sizes="100vw"
          className="object-cover"
        />
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2A66]/90 via-[#0A2A66]/70 to-[#1E4ED8]/60" />

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 max-w-7xl pt-24 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-blue-100 text-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <MapPin className="h-4 w-4 text-[#3B82F6]" />
              {badge}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 animate-fade-in">
            {title}
          </h1>

          <p className="text-lg md:text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto animate-fade-in">
            {subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Link href="/imoveis">
              <Button
                size="xl"
                className="bg-[#1E4ED8] hover:bg-white hover:text-[#0A2A66] text-white w-full sm:w-auto shadow-xl transition-all duration-300 group"
              >
                <Search className="h-5 w-5 mr-2" />
                {btnPrimary}
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contato">
              <Button
                size="xl"
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-[#0A2A66] w-full sm:w-auto transition-all duration-300"
              >
                {btnSecondary}
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
            >
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-blue-200 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  )
}
