'use client'

import React, { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

type LeadStatus = 'new' | 'in_progress' | 'won' | 'lost' | 'archived'

interface LeadRow {
  id: string
  name: string
  email: string
  phone: string | null
  status: LeadStatus
  created_at: string
}

const statusOptions: LeadStatus[] = ['new', 'in_progress', 'won', 'lost', 'archived']

export default function AdminLeadsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<LeadRow[]>([])

  const loadLeads = async () => {
    setLoading(true)
    const supabase = createClient() as any
    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, name, email, phone, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Erro ao carregar leads', description: error.message, variant: 'destructive' })
      setLoading(false)
      return
    }

    const rows = ((data ?? []) as Array<LeadRow & { status?: LeadStatus }>).map((item) => ({
      ...item,
      status: item.status ?? 'new',
    }))
    setLeads(rows)
    setLoading(false)
  }

  useEffect(() => {
    loadLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateStatus = async (id: string, status: LeadStatus) => {
    setLeads((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))

    const supabase = createClient() as any
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select('id')

    if (error) {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' })
      await loadLeads()
      return
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Nenhuma alteração aplicada',
        description: 'Verifique permissões de admin (RLS) para contact_messages.',
        variant: 'destructive',
      })
      await loadLeads()
      return
    }

    toast({ title: 'Status atualizado' })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2A66]">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">Mensagens recebidas pelo formulário de contato.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Carregando...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum lead encontrado.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-gray-800 font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.email}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.phone ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Select value={lead.status} onValueChange={(value: LeadStatus) => updateStatus(lead.id, value)}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(lead.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
