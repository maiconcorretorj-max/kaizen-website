'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Plus, Save, Trash2, GripVertical, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'
import type { NavTab } from '@/types'

export default function AbasPage() {
  const { toast } = useToast()
  const [tabs, setTabs] = useState<NavTab[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTab, setNewTab] = useState({ label: '', href: '' })
  const [showAddForm, setShowAddForm] = useState(false)

  const loadTabs = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('nav_tabs')
      .select('*')
      .order('order', { ascending: true })

    if (!error && data) {
      setTabs(data as NavTab[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadTabs()
  }, [loadTabs])

  const toggleTab = (id: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, active: !tab.active } : tab)))
  }

  const deleteTab = async (id: string) => {
    if (!confirm('Deseja remover esta aba do menu?')) return
    const supabase = createClient()
    const { data, error } = await supabase.from('nav_tabs').delete().eq('id', id).select('id')
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma aba excluída',
          description: 'Verifique permissões de admin (RLS) para nav_tabs.',
          variant: 'destructive',
        })
        return
      }
      setTabs((prev) => prev.filter((tab) => tab.id !== id))
      toast({ title: 'Aba removida', description: 'A aba foi excluída do menu.' })
    }
  }

  const addTab = async () => {
    if (!newTab.label || !newTab.href) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha o nome e o link da aba.', variant: 'destructive' })
      return
    }

    const supabase = createClient()
    const href = newTab.href.startsWith('/') ? newTab.href : `/${newTab.href}`
    const order = tabs.length + 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('nav_tabs')
      .insert([{ label: newTab.label, href, order, active: true }])
      .select()
      .single()

    if (error) {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' })
    } else {
      setTabs((prev) => [...prev, data as NavTab])
      setNewTab({ label: '', href: '' })
      setShowAddForm(false)
      toast({ title: 'Aba adicionada!', description: `"${newTab.label}" foi adicionada ao menu.` })
    }
  }

  const updateTabField = (id: string, field: 'label' | 'href', value: string) => {
    setTabs((prev) => prev.map((tab) => (tab.id === id ? { ...tab, [field]: value } : tab)))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()

    const upserts = tabs.map((tab, index) => ({
      id: tab.id,
      label: tab.label,
      href: tab.href,
      order: index + 1,
      active: tab.active,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).from('nav_tabs').upsert(upserts).select('id')

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para nav_tabs.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }
      toast({ title: 'Menu salvo!', description: 'As abas do menu foram atualizadas.' })
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Abas do Menu</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os links de navegação do site</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading}>
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar Menu
            </span>
          )}
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <strong>Dica:</strong> Arraste as abas para reordenar. Clique no ícone de olho para ativar/desativar. Salve ao terminar.
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4ED8]" />
        </div>
      ) : (
        <>
          {/* Tabs List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <p className="font-semibold text-gray-700 text-sm">
                {tabs.length} {tabs.length === 1 ? 'aba' : 'abas'} configurada{tabs.length !== 1 ? 's' : ''}
              </p>
              <span className="text-xs text-gray-400">
                {tabs.filter((t) => t.active).length} ativa{tabs.filter((t) => t.active).length !== 1 ? 's' : ''}
              </span>
            </div>

            <Reorder.Group axis="y" values={tabs} onReorder={setTabs} className="divide-y divide-gray-50">
              {tabs.map((tab) => (
                <Reorder.Item key={tab.id} value={tab}>
                  <div className={`flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors ${!tab.active ? 'opacity-50' : ''}`}>
                    <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <Input
                        value={tab.label}
                        onChange={(e) => updateTabField(tab.id, 'label', e.target.value)}
                        placeholder="Nome da aba"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={tab.href}
                        onChange={(e) => updateTabField(tab.id, 'href', e.target.value)}
                        placeholder="/link"
                        className="h-8 text-sm font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleTab(tab.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          tab.active ? 'text-[#1E4ED8] hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={tab.active ? 'Desativar' : 'Ativar'}
                      >
                        {tab.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => deleteTab(tab.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          {/* Add New Tab */}
          {showAddForm ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-[#0A2A66] mb-4">Nova Aba</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label>Nome da Aba</Label>
                  <Input
                    placeholder="Ex: Blog"
                    value={newTab.label}
                    onChange={(e) => setNewTab({ ...newTab, label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link (URL)</Label>
                  <Input
                    placeholder="Ex: /blog"
                    value={newTab.href}
                    onChange={(e) => setNewTab({ ...newTab, href: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={addTab}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowAddForm(false); setNewTab({ label: '', href: '' }) }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#1E4ED8] hover:text-[#1E4ED8] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Adicionar Nova Aba
            </button>
          )}
        </>
      )}
    </div>
  )
}
