'use client'

import React, { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PropertyFilters } from '@/types'

interface PropertyFilterProps {
  onFilter: (filters: PropertyFilters) => void
  initialFilters?: PropertyFilters
}

export default function PropertyFilter({ onFilter, initialFilters = {} }: PropertyFilterProps) {
  const [filters, setFilters] = useState<PropertyFilters>(initialFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleChange = (key: keyof PropertyFilters, value: string | number) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onFilter(filters)
  }

  const handleReset = () => {
    const empty: PropertyFilters = {}
    setFilters(empty)
    onFilter(empty)
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== undefined)

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
    >
      {/* Main Search Row */}
      <div className="flex gap-3 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por bairro, cidade ou endereço..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.type || ''}
          onValueChange={(val) => handleChange('type', val)}
        >
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="apartamento">Apartamento</SelectItem>
            <SelectItem value="casa">Casa</SelectItem>
            <SelectItem value="cobertura">Cobertura</SelectItem>
            <SelectItem value="terreno">Terreno</SelectItem>
            <SelectItem value="comercial">Comercial</SelectItem>
            <SelectItem value="sala">Sala Comercial</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status || ''}
          onValueChange={(val) => handleChange('status', val)}
        >
          <SelectTrigger className="sm:w-40">
            <SelectValue placeholder="Finalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="venda">Venda</SelectItem>
            <SelectItem value="aluguel">Aluguel</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" className="shrink-0">
          <Search className="h-4 w-4 mr-2" />
          Buscar
        </Button>
      </div>

      {/* Advanced Filter Toggle */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-[#1E4ED8] text-sm font-medium hover:text-[#0A2A66] transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {showAdvanced ? 'Menos filtros' : 'Mais filtros'}
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-gray-500 text-sm hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="space-y-1.5">
            <Label htmlFor="minPrice" className="text-gray-600 text-xs">Preço mínimo</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="R$ 0"
              value={filters.minPrice || ''}
              onChange={(e) => handleChange('minPrice', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxPrice" className="text-gray-600 text-xs">Preço máximo</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="R$ 999.999"
              value={filters.maxPrice || ''}
              onChange={(e) => handleChange('maxPrice', Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-600 text-xs">Quartos</Label>
            <Select
              value={String(filters.bedrooms || '')}
              onValueChange={(val) => handleChange('bedrooms', Number(val))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Qualquer</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minArea" className="text-gray-600 text-xs">Área mínima (m²)</Label>
            <Input
              id="minArea"
              type="number"
              placeholder="0 m²"
              value={filters.minArea || ''}
              onChange={(e) => handleChange('minArea', Number(e.target.value))}
            />
          </div>
        </div>
      )}
    </form>
  )
}
