'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

interface FooterLink {
  id: string
  label: string
  href: string
  order: number
  active: boolean
  visible: boolean
  target: '_self' | '_blank'
}

export default function AdminSiteRodapePage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingFooter, setSavingFooter] = useState(false)

  const [footerContent, setFooterContent] = useState({
    description: '',
    creci: '',
    rights_text: '',
  })

  const [links, setLinks] = useState<FooterLink[]>([])
  const [newLink, setNewLink] = useState({ label: '', href: '', order: 0, target: '_self' as '_self' | '_blank' })

  const nextOrder = useMemo(() => {
    if (links.length === 0) return 1
    return Math.max(...links.map((item) => item.order)) + 1
  }, [links])

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient() as any

    const [{ data: settingData, error: settingError }, { data: linksData, error: linksError }] = await Promise.all([
      supabase.from('site_settings').select('setting_value').eq('setting_key', 'footer_content').single(),
      supabase
        .from('nav_tabs')
        .select('id, label, href, order, active, visible, target')
        .eq('menu_location', 'footer')
        .order('order', { ascending: true }),
    ])

    if (settingError && settingError.code !== 'PGRST116') {
      toast({ title: 'Erro ao carregar rodapé', description: settingError.message, variant: 'destructive' })
    }

    if (linksError) {
      toast({ title: 'Erro ao carregar links do rodapé', description: linksError.message, variant: 'destructive' })
    }

    const value = settingData?.setting_value ?? {}
    setFooterContent({
      description: typeof value.description === 'string' ? value.description : '',
      creci: typeof value.creci === 'string' ? value.creci : '',
      rights_text: typeof value.rights_text === 'string' ? value.rights_text : '',
    })

    setLinks((linksData ?? []) as FooterLink[])
    setNewLink((prev) => ({ ...prev, order: nextOrder }))
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setNewLink((prev) => ({ ...prev, order: nextOrder }))
  }, [nextOrder])

  const saveFooterContent = async () => {
    setSavingFooter(true)
    const supabase = createClient() as any
    const { data, error } = await supabase.from('site_settings').upsert(
      {
        setting_key: 'footer_content',
        setting_value: footerContent,
      },
      { onConflict: 'setting_key' }
    )
    .select('setting_key')

    if (error) {
      toast({ title: 'Erro ao salvar conteúdo do rodapé', description: error.message, variant: 'destructive' })
      setSavingFooter(false)
      return
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Nenhuma alteração aplicada',
        description: 'Verifique permissões de admin (RLS) para site_settings.',
        variant: 'destructive',
      })
      setSavingFooter(false)
      return
    }

    toast({ title: 'Conteúdo do rodapé atualizado' })
    setSavingFooter(false)
  }

  const saveLink = async (link: FooterLink) => {
    const supabase = createClient() as any
    const { data, error } = await supabase
      .from('nav_tabs')
      .update({
        label: link.label,
        href: link.href,
        order: link.order,
        active: link.active,
        visible: link.visible,
        target: link.target,
      })
      .eq('id', link.id)
      .eq('menu_location', 'footer')
      .select('id')

    if (error) {
      toast({ title: 'Erro ao salvar link', description: error.message, variant: 'destructive' })
      return
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Nenhuma alteração aplicada',
        description: 'Verifique permissões de admin (RLS) ou se o link pertence ao rodapé.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Link atualizado' })
    await loadData()
  }

  const addLink = async () => {
    if (!newLink.label || !newLink.href) {
      toast({ title: 'Preencha label e URL', variant: 'destructive' })
      return
    }

    const supabase = createClient() as any
    const { data, error } = await supabase.from('nav_tabs').insert({
      label: newLink.label,
      href: newLink.href,
      order: newLink.order,
      active: true,
      visible: true,
      menu_location: 'footer',
      target: newLink.target,
    })
    .select('id')

    if (error) {
      toast({ title: 'Erro ao criar link', description: error.message, variant: 'destructive' })
      return
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Não foi possível criar link',
        description: 'Verifique permissões de admin (RLS) para nav_tabs.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Link criado' })
    setNewLink({ label: '', href: '', order: nextOrder, target: '_self' })
    await loadData()
  }

  const deleteLink = async (id: string) => {
    if (!confirm('Excluir este link de rodapé?')) return

    const supabase = createClient() as any
    const { data, error } = await supabase
      .from('nav_tabs')
      .delete()
      .eq('id', id)
      .eq('menu_location', 'footer')
      .select('id')
    if (error) {
      toast({ title: 'Erro ao excluir link', description: error.message, variant: 'destructive' })
      return
    }

    if (!data || data.length === 0) {
      toast({
        title: 'Nenhum link excluído',
        description: 'Verifique permissões de admin (RLS) ou se o link é do rodapé.',
        variant: 'destructive',
      })
      return
    }

    toast({ title: 'Link excluído' })
    await loadData()
  }

  if (loading) return <div className="text-sm text-gray-500">Carregando rodapé...</div>

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2A66]">Site {'>'} Rodapé</h1>
        <p className="text-gray-500 text-sm mt-1">Edite conteúdo global do rodapé e links em nav_tabs (menu_location=footer).</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#0A2A66]">Conteúdo do rodapé</h2>
          <Button onClick={saveFooterContent} disabled={savingFooter}><Save className="h-4 w-4 mr-2" />{savingFooter ? 'Salvando...' : 'Salvar'}</Button>
        </div>

        <div className="space-y-2">
          <Label>Descrição</Label>
          <Textarea rows={4} value={footerContent.description} onChange={(e) => setFooterContent((p) => ({ ...p, description: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>CRECI</Label><Input value={footerContent.creci} onChange={(e) => setFooterContent((p) => ({ ...p, creci: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Texto de direitos</Label><Input value={footerContent.rights_text} onChange={(e) => setFooterContent((p) => ({ ...p, rights_text: e.target.value }))} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66]">Adicionar link de rodapé</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Label</Label><Input value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} /></div>
          <div className="space-y-2"><Label>URL</Label><Input value={newLink.href} onChange={(e) => setNewLink((p) => ({ ...p, href: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Ordem</Label><Input type="number" value={newLink.order} onChange={(e) => setNewLink((p) => ({ ...p, order: Number(e.target.value) }))} /></div>
          <div className="space-y-2"><Label>Target</Label>
            <Select value={newLink.target} onValueChange={(value: '_self' | '_blank') => setNewLink((p) => ({ ...p, target: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">_self</SelectItem>
                <SelectItem value="_blank">_blank</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={addLink}><Plus className="h-4 w-4 mr-2" />Adicionar link</Button>
      </div>

      <div className="space-y-3">
        <h2 className="font-bold text-[#0A2A66]">Links existentes</h2>
        {links.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-sm text-gray-500">Nenhum link de rodapé cadastrado.</div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input value={link.label} onChange={(e) => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, label: e.target.value } : item))} />
                <Input value={link.href} onChange={(e) => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, href: e.target.value } : item))} />
                <Input type="number" value={link.order} onChange={(e) => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, order: Number(e.target.value) } : item))} />
                <Select value={link.target} onValueChange={(value: '_self' | '_blank') => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, target: value } : item))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">_self</SelectItem>
                    <SelectItem value="_blank">_blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <input type="checkbox" checked={link.active} onChange={(e) => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, active: e.target.checked } : item))} />
                  active
                </label>
                <label className="text-sm text-gray-700 flex items-center gap-2">
                  <input type="checkbox" checked={link.visible} onChange={(e) => setLinks((prev) => prev.map((item) => item.id === link.id ? { ...item, visible: e.target.checked } : item))} />
                  visible
                </label>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => saveLink(link)}><Save className="h-4 w-4 mr-2" />Salvar</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteLink(link.id)}><Trash2 className="h-4 w-4 mr-2" />Excluir</Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
