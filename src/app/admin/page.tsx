'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Home,
  Eye,
  MessageSquare,
  Plus,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

interface DashboardMetrics {
  activeProperties: number
  newPropertiesThisMonth: number
  newPropertiesLastMonth: number
  visitsThisWeek: number
  visitsLastWeek: number
  totalMessages: number
  unreadMessages: number
}

interface RecentProperty {
  id: string
  title: string
  status: 'venda' | 'aluguel' | 'venda_aluguel'
  price: number
  active: boolean
}

const initialMetrics: DashboardMetrics = {
  activeProperties: 0,
  newPropertiesThisMonth: 0,
  newPropertiesLastMonth: 0,
  visitsThisWeek: 0,
  visitsLastWeek: 0,
  totalMessages: 0,
  unreadMessages: 0,
}

function signedNumber(value: number) {
  if (value > 0) return `+${value}`
  return `${value}`
}

function percentChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function AdminDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics)
  const [recentProperties, setRecentProperties] = useState<RecentProperty[]>([])

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      const supabase = createClient() as any

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
      const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const startOfPreviousWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const [
        activeTotal,
        activeCurrentMonth,
        activePreviousMonth,
        visitsCurrentWeek,
        visitsPreviousWeek,
        messagesTotal,
        messagesUnread,
        recent,
      ] = await Promise.all([
        supabase.from('properties').select('id', { head: true, count: 'exact' }).eq('active', true).eq('publication_status', 'published'),
        supabase.from('properties').select('id', { head: true, count: 'exact' }).eq('active', true).eq('publication_status', 'published').gte('created_at', startOfMonth),
        supabase.from('properties').select('id', { head: true, count: 'exact' }).eq('active', true).eq('publication_status', 'published').gte('created_at', startOfPreviousMonth).lt('created_at', startOfMonth),
        supabase.from('site_visits').select('id', { head: true, count: 'exact' }).gte('visited_at', startOfWeek),
        supabase.from('site_visits').select('id', { head: true, count: 'exact' }).gte('visited_at', startOfPreviousWeek).lt('visited_at', startOfWeek),
        supabase.from('contact_messages').select('id', { head: true, count: 'exact' }),
        supabase.from('contact_messages').select('id', { head: true, count: 'exact' }).eq('status', 'new'),
        supabase.from('properties').select('id, title, status, price, active').order('created_at', { ascending: false }).limit(4),
      ])

      const siteVisitError = visitsCurrentWeek.error || visitsPreviousWeek.error
      if (siteVisitError) {
        toast({
          title: 'Visitas indisponíveis no momento',
          description: 'Aplique as migrations pendentes do Supabase para habilitar esse card.',
          variant: 'destructive',
        })
      }

      setMetrics({
        activeProperties: activeTotal.count ?? 0,
        newPropertiesThisMonth: activeCurrentMonth.count ?? 0,
        newPropertiesLastMonth: activePreviousMonth.count ?? 0,
        visitsThisWeek: visitsCurrentWeek.count ?? 0,
        visitsLastWeek: visitsPreviousWeek.count ?? 0,
        totalMessages: messagesTotal.count ?? 0,
        unreadMessages: messagesUnread.count ?? 0,
      })

      if (recent.error) {
        toast({ title: 'Erro ao carregar imóveis recentes', description: recent.error.message, variant: 'destructive' })
      } else {
        setRecentProperties((recent.data ?? []) as RecentProperty[])
      }

      setLoading(false)
    }

    loadDashboard()
  }, [toast])

  const stats = useMemo(() => {
    const visitsDelta = percentChange(metrics.visitsThisWeek, metrics.visitsLastWeek)
    const propertiesDelta = metrics.newPropertiesThisMonth - metrics.newPropertiesLastMonth

    return [
      {
        label: 'Imóveis Ativos',
        value: metrics.activeProperties.toLocaleString('pt-BR'),
        change: `${signedNumber(propertiesDelta)} este mês`,
        href: '/admin/imoveis',
        icon: Home,
        color: 'bg-blue-50',
        iconColor: 'text-[#1E4ED8]',
      },
      {
        label: 'Visitas ao Site',
        value: metrics.visitsThisWeek.toLocaleString('pt-BR'),
        change: `${signedNumber(visitsDelta)}% esta semana`,
        href: '/admin/analytics',
        icon: Eye,
        color: 'bg-green-50',
        iconColor: 'text-green-600',
      },
      {
        label: 'Mensagens',
        value: metrics.totalMessages.toLocaleString('pt-BR'),
        change: `${metrics.unreadMessages} não lidas`,
        href: '/admin/leads',
        icon: MessageSquare,
        color: 'bg-orange-50',
        iconColor: 'text-orange-600',
      },
    ]
  }, [metrics])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Bem-vindo ao painel administrativo</p>
        </div>
        <Link href="/admin/imoveis/novo">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Imóvel
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((stat, index) => (
          <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
            <Link
              href={stat.href}
              className="group block bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#1E4ED8]/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#1E4ED8] group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-2xl font-bold text-[#0A2A66]">{loading ? '...' : stat.value}</p>
              <p className="text-gray-600 text-sm mt-0.5">{stat.label}</p>
              <p className="text-xs text-gray-400 mt-1">{loading ? 'Carregando...' : stat.change}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Properties */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="font-bold text-[#0A2A66]">Imóveis Recentes</h2>
          <Link href="/admin/imoveis" className="text-[#1E4ED8] hover:text-[#0A2A66] text-sm font-medium transition-colors flex items-center gap-1">
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentProperties.map((property) => (
            <div key={property.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: property.active ? '#22c55e' : '#9ca3af' }} />
                <div>
                  <p className="text-sm font-medium text-gray-800">{property.title}</p>
                  <p className="text-xs text-gray-500">
                    {property.status === 'venda'
                      ? `R$ ${property.price.toLocaleString('pt-BR')}`
                      : `R$ ${property.price.toLocaleString('pt-BR')}/mês`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  property.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {property.active ? 'Ativo' : 'Inativo'}
                </span>
                <Link
                  href={`/admin/imoveis/${property.id}/editar`}
                  className="text-[#1E4ED8] hover:text-[#0A2A66] text-xs font-medium transition-colors"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
          {!loading && recentProperties.length === 0 && (
            <div className="px-6 py-8 text-sm text-gray-400 text-center">Nenhum imóvel recente encontrado.</div>
          )}
        </div>
      </div>
    </div>
  )
}
