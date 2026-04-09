'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bed, Bath, Car, Maximize2, MapPin, Tag } from 'lucide-react'
import { formatCurrency, formatArea, getPropertyTypeLabel, getPropertyStatusLabel } from '@/lib/utils'
import type { Property } from '@/types'

interface PropertyCardProps {
  property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl = property.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80'

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image
          src={imageUrl}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-[#0A2A66] text-white text-xs font-medium px-3 py-1 rounded-full">
            {getPropertyTypeLabel(property.type)}
          </span>
          <span className={`text-white text-xs font-medium px-3 py-1 rounded-full ${
            property.status === 'venda' ? 'bg-green-600' :
            property.status === 'aluguel' ? 'bg-orange-500' :
            'bg-purple-600'
          }`}>
            {getPropertyStatusLabel(property.status)}
          </span>
        </div>
        {property.featured && (
          <div className="absolute top-3 right-3">
            <span className="bg-yellow-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Destaque
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="mb-3">
          <p className="text-[#1E4ED8] font-bold text-xl mb-1">
            {formatCurrency(property.price)}
            {property.status === 'aluguel' && <span className="text-sm font-normal text-gray-500">/mês</span>}
          </p>
          <h3 className="text-[#0A2A66] font-semibold text-base leading-snug line-clamp-2">
            {property.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-gray-500 text-xs mb-4">
          <MapPin className="h-3 w-3 text-[#3B82F6] shrink-0" />
          <span className="line-clamp-1">{property.neighborhood}, {property.city} - {property.state}</span>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2 mb-5 flex-1">
          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
            <Maximize2 className="h-3.5 w-3.5 text-[#1E4ED8]" />
            <span>{formatArea(property.area)}</span>
          </div>
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-600 text-xs">
              <Bed className="h-3.5 w-3.5 text-[#1E4ED8]" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'Quarto' : 'Quartos'}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-600 text-xs">
              <Bath className="h-3.5 w-3.5 text-[#1E4ED8]" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</span>
            </div>
          )}
          {property.parking_spaces !== undefined && (
            <div className="flex items-center gap-1.5 text-gray-600 text-xs">
              <Car className="h-3.5 w-3.5 text-[#1E4ED8]" />
              <span>{property.parking_spaces} {property.parking_spaces === 1 ? 'Vaga' : 'Vagas'}</span>
            </div>
          )}
        </div>

        <Link
          href={`/imoveis/${property.slug}`}
          className="mt-auto block w-full text-center bg-[#0A2A66] hover:bg-[#1E4ED8] text-white text-sm font-medium py-2.5 rounded-xl transition-colors duration-200"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  )
}
