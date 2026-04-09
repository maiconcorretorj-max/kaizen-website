'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Home,
  Filter,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency, getPropertyTypeLabel } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'
import type { Property } from '@/types'

export default function AdminImoveisPage() {
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadProperties = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao carregar imóveis', description: error.message, variant: 'destructive' })
    } else {
      setProperties((data as Property[]) ?? [])
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  const filtered = properties.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.neighborhood.toLowerCase().includes(search.toLowerCase())
  )

  const toggleActive = async (property: Property) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data, error } = await supabase
      .from('properties')
      .update({ active: !property.active })
      .eq('id', property.id)
      .select('id')

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para properties.',
          variant: 'destructive',
        })
        return
      }
      setProperties((prev) =>
        prev.map((p) => (p.id === property.id ? { ...p, active: !p.active } : p))
      )
      toast({
        title: property.active ? 'Imóvel desativado' : 'Imóvel ativado',
        description: `"${property.title}" foi ${property.active ? 'desativado' : 'ativado'}.`,
      })
    }
  }

  const handleDelete = async (property: Property) => {
    if (!confirm(`Excluir "${property.title}"? Esta ação não pode ser desfeita.`)) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any
    const { data, error } = await supabase.from('properties').delete().eq('id', property.id).select('id')

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum imóvel excluído',
          description: 'Verifique permissões de admin (RLS) para properties.',
          variant: 'destructive',
        })
        return
      }
      setProperties((prev) => prev.filter((p) => p.id !== property.id))
      toast({ title: 'Imóvel excluído', description: `"${property.title}" foi removido.` })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Imóveis</h1>
          <p className="text-gray-500 text-sm mt-1">
            {loading ? 'Carregando...' : `${properties.length} imóvel${properties.length !== 1 ? 'is' : ''} cadastrado${properties.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link href="/admin/imoveis/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Imóvel
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por título ou bairro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={loadProperties}>
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#1E4ED8]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Imóvel</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Preço</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-gray-400">
                      <Home className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>{search ? 'Nenhum imóvel encontrado para a busca' : 'Nenhum imóvel cadastrado ainda'}</p>
                      {!search && (
                        <Link href="/admin/imoveis/novo" className="mt-3 inline-block">
                          <Button size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Cadastrar primeiro imóvel
                          </Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((property, index) => (
                    <motion.tr
                      key={property.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.04 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-800 text-sm line-clamp-1">{property.title}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{property.neighborhood}, {property.city}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <span className="text-xs bg-blue-50 text-[#1E4ED8] px-2.5 py-1 rounded-full font-medium">
                          {getPropertyTypeLabel(property.type)}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <span className="text-sm font-semibold text-[#0A2A66]">
                          {formatCurrency(property.price)}
                        </span>
                      </td>
                      <td className="py-4 px-6 hidden md:table-cell">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          property.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {property.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive(property)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                            title={property.active ? 'Desativar' : 'Ativar'}
                          >
                            {property.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </button>
                          <Link href={`/admin/imoveis/${property.id}/editar`}>
                            <button className="p-2 rounded-lg hover:bg-blue-50 transition-colors text-[#1E4ED8]">
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(property)}
                            className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
