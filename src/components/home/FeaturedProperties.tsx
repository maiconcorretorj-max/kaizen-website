'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PropertyCard from '@/components/properties/PropertyCard'
import type { Property } from '@/types'
import createClient from '@/lib/supabase/client'

interface FeaturedPropertiesProps {
  content?: Record<string, string>
}

export default function FeaturedProperties({ content = {} }: FeaturedPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const label = content['destaques_label'] || 'Destaques'
  const title = content['destaques_title'] || 'Imóveis em Destaque'
  const subtitle = content['destaques_subtitle'] || 'Confira nossa seleção especial de imóveis com as melhores oportunidades do mercado'
  const btnText = content['destaques_btn'] || 'Ver Todos os Imóveis'

  useEffect(() => {
    const load = async () => {
      const supabase = createClient() as any
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, neighborhood, city, state, type, status, price, area, bedrooms, bathrooms, parking_spaces, featured, images, created_at')
        // publication_status is the primary visibility source of truth.
        .eq('publication_status', 'published')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(3)
      setProperties((data ?? []) as Property[])
      setLoading(false)
    }
    load()
  }, [])

  if (!loading && properties.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-12 animate-fade-in">
          <span className="text-[#1E4ED8] text-sm font-semibold uppercase tracking-widest mb-3 block">{label}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0A2A66] mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && [1, 2, 3].map((item) => (
            <div key={item} className="h-[430px] rounded-2xl bg-white border border-gray-100 animate-pulse" />
          ))}
          {!loading && properties.map((property) => (
            <div key={property.id} className="animate-fade-in">
              <PropertyCard property={property} />
            </div>
          ))}
        </div>

        <div className="text-center mt-12 animate-fade-in">
          <Link href="/imoveis">
            <Button size="lg" className="group">
              {btnText}
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
