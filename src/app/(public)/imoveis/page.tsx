'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { Heart, LayoutGrid, List, Search } from 'lucide-react'
import PropertyCard from '@/components/properties/PropertyCard'
import PropertyFilter from '@/components/properties/PropertyFilter'
import type { Property, PropertyFilters } from '@/types'
import createClient from '@/lib/supabase/client'

const PROPERTIES_CACHE_KEY = 'cache:properties:published:v1'
const PROPERTIES_CACHE_TTL = 5 * 60 * 1000

export default function ImoveisPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PropertyFilters>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const load = async () => {
      if (typeof window !== 'undefined') {
        const raw = window.sessionStorage.getItem(PROPERTIES_CACHE_KEY)
        if (raw) {
          try {
            const cached = JSON.parse(raw) as { timestamp: number; data: Property[] }
            if (Date.now() - cached.timestamp < PROPERTIES_CACHE_TTL && Array.isArray(cached.data)) {
              setProperties(cached.data)
              setLoading(false)
            }
          } catch {
            window.sessionStorage.removeItem(PROPERTIES_CACHE_KEY)
          }
        }
      }

      const supabase = createClient() as any
      const { data } = await supabase
        .from('properties')
        .select('id, slug, title, neighborhood, city, state, address, type, status, price, area, bedrooms, bathrooms, parking_spaces, featured, images, publication_status, created_at')
        .eq('publication_status', 'published')
        .order('created_at', { ascending: false })

      const nextData = (data ?? []) as Property[]
      setProperties(nextData)
      setLoading(false)

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          PROPERTIES_CACHE_KEY,
          JSON.stringify({ timestamp: Date.now(), data: nextData })
        )
      }
    }
    load()
  }, [])

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (filters.search) {
        const search = filters.search.toLowerCase()
        if (
          !p.title.toLowerCase().includes(search) &&
          !p.neighborhood.toLowerCase().includes(search) &&
          !p.city.toLowerCase().includes(search) &&
          !p.address.toLowerCase().includes(search)
        ) return false
      }
      if (filters.type && p.type !== filters.type) return false
      if (filters.status && p.status !== filters.status) return false
      if (filters.minPrice && p.price < filters.minPrice) return false
      if (filters.maxPrice && p.price > filters.maxPrice) return false
      if (filters.minArea && p.area < filters.minArea) return false
      if (filters.bedrooms && p.bedrooms && p.bedrooms < filters.bedrooms) return false
      return true
    })
  }, [properties, filters])

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <Head>
        <title>Imóveis à venda e aluguel em Campo Grande RJ | Kaizen</title>
        <meta
          name="description"
          content="Veja imóveis à venda e para alugar em Campo Grande, Rio de Janeiro. Filtre por bairro, preço e tipo com atendimento da Kaizen Soluções Imobiliárias."
        />
        <link rel="canonical" href="https://imobkaizen.com.br/imoveis" />
      </Head>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="animate-fade-in">
            <span className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3 block">Portfólio</span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Imóveis em Campo Grande e região</h1>
            <p className="text-blue-100 text-lg">Encontre casas, apartamentos e opções comerciais para compra e aluguel no Rio de Janeiro.</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl pt-10 pb-6">
        <div className="mb-8">
          <PropertyFilter onFilter={setFilters} />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600 text-sm">
            {loading ? 'Carregando...' : (
              <><span className="font-semibold text-[#0A2A66]">{filteredProperties.length}</span>{' '}
              {filteredProperties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}</>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/imoveis/favoritos"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <Heart className="h-4 w-4" />
              Favoritos
            </Link>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[#0A2A66] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              aria-label="Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[#0A2A66] text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}
              aria-label="Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Nenhum imóvel encontrado</h2>
            <p className="text-gray-400">Tente ajustar os filtros para encontrar mais resultados</p>
          </div>
        ) : (
          <div className={`grid gap-8 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {filteredProperties.map((property, index) => (
              <div key={property.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(index * 40, 200)}ms` }}>
                <PropertyCard property={property} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
