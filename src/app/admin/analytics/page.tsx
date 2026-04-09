'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { BarChart3, CalendarDays, Mail, MousePointerClick } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

interface VisitRow {
  path: string
  visited_at: string
}

interface MessageRow {
  created_at: string
  status: string | null
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function dayLabel(isoDay: string) {
  const [year, month, day] = isoDay.split('-')
  return `${day}/${month}`
}

function buildLastDays(days: number) {
  const result: string[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    result.push(dayKey(d))
  }
  return result
}

export default function AdminAnalyticsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [visits, setVisits] = useState<VisitRow[]>([])
  const [messages, setMessages] = useState<MessageRow[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const supabase = createClient() as any
      const fromDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      const [visitQuery, messageQuery] = await Promise.all([
        supabase
          .from('site_visits')
          .select('path, visited_at')
          .gte('visited_at', fromDate)
          .order('visited_at', { ascending: true }),
        supabase
          .from('contact_messages')
          .select('created_at, status')
          .gte('created_at', fromDate)
          .order('created_at', { ascending: true }),
      ])

      if (visitQuery.error) {
        toast({
          title: 'Erro ao carregar visitas',
          description: visitQuery.error.message,
          variant: 'destructive',
        })
      } else {
        setVisits((visitQuery.data ?? []) as VisitRow[])
      }

      if (messageQuery.error) {
        toast({
          title: 'Erro ao carregar mensagens',
          description: messageQuery.error.message,
          variant: 'destructive',
        })
      } else {
        setMessages((messageQuery.data ?? []) as MessageRow[])
      }

      setLoading(false)
    }

    load()
  }, [toast])

  const days = useMemo(() => buildLastDays(14), [])

  const visitsByDay = useMemo(() => {
    const map = new Map<string, number>()
    days.forEach((d) => map.set(d, 0))
    visits.forEach((item) => {
      const key = item.visited_at.slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return days.map((d) => ({ day: d, value: map.get(d) ?? 0 }))
  }, [days, visits])

  const messagesByDay = useMemo(() => {
    const map = new Map<string, number>()
    days.forEach((d) => map.set(d, 0))
    messages.forEach((item) => {
      const key = item.created_at.slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    return days.map((d) => ({ day: d, value: map.get(d) ?? 0 }))
  }, [days, messages])

  const topPaths = useMemo(() => {
    const map = new Map<string, number>()
    visits.forEach((item) => {
      map.set(item.path, (map.get(item.path) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [visits])

  const unreadMessages = useMemo(
    () => messages.filter((item) => (item.status ?? 'new') === 'new').length,
    [messages]
  )

  const maxVisitValue = Math.max(1, ...visitsByDay.map((item) => item.value))
  const maxMessageValue = Math.max(1, ...messagesByDay.map((item) => item.value))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2A66]">Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">Visitas e mensagens reais dos últimos 14 dias.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Visitas (14 dias)</p>
          <p className="text-3xl font-bold text-[#0A2A66] mt-1">{loading ? '...' : visits.length.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1"><MousePointerClick className="h-3.5 w-3.5" /> dados coletados por navegação</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Mensagens (14 dias)</p>
          <p className="text-3xl font-bold text-[#0A2A66] mt-1">{loading ? '...' : messages.length.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> do formulário de contato</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Mensagens não lidas</p>
          <p className="text-3xl font-bold text-[#0A2A66] mt-1">{loading ? '...' : unreadMessages.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> status = new</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-[#0A2A66] mb-4 inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" />Visitas por dia</h2>
          <div className="flex items-end gap-2 h-44">
            {visitsByDay.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                <div className="text-[10px] text-gray-400">{item.value}</div>
                <div className="w-full bg-emerald-500/80 rounded-t-md" style={{ height: `${(item.value / maxVisitValue) * 100}%` }} />
                <div className="text-[10px] text-gray-500">{dayLabel(item.day)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-[#0A2A66] mb-4 inline-flex items-center gap-2"><BarChart3 className="h-4 w-4" />Mensagens por dia</h2>
          <div className="flex items-end gap-2 h-44">
            {messagesByDay.map((item) => (
              <div key={item.day} className="flex-1 flex flex-col items-center justify-end gap-2">
                <div className="text-[10px] text-gray-400">{item.value}</div>
                <div className="w-full bg-orange-500/80 rounded-t-md" style={{ height: `${(item.value / maxMessageValue) * 100}%` }} />
                <div className="text-[10px] text-gray-500">{dayLabel(item.day)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <h2 className="font-bold text-[#0A2A66] mb-4">Páginas mais visitadas</h2>
        {topPaths.length === 0 ? (
          <p className="text-sm text-gray-400">Sem dados de navegação ainda.</p>
        ) : (
          <div className="space-y-2">
            {topPaths.map((item) => (
              <div key={item.path} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <span className="text-sm text-gray-700 truncate pr-4">{item.path}</span>
                <span className="text-xs font-semibold text-[#0A2A66]">{item.count} visitas</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
