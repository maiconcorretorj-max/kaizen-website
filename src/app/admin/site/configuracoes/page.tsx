'use client'

import React, { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

type JsonObject = Record<string, unknown>

export default function AdminSiteConfiguracoesPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [branding, setBranding] = useState({ company_name: '', company_suffix: '' })
  const [contactInfo, setContactInfo] = useState({ phone: '', email: '', address: '', hours: '', whatsapp: '' })
  const [socialLinks, setSocialLinks] = useState({ instagram: '', facebook: '', linkedin: '' })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient() as any
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['branding', 'contact_info', 'social_links'])

      if (error) {
        toast({ title: 'Erro ao carregar configurações', description: error.message, variant: 'destructive' })
        setLoading(false)
        return
      }

      ;(data ?? []).forEach((row: { setting_key: string; setting_value: JsonObject }) => {
        const value = row.setting_value ?? {}
        if (row.setting_key === 'branding') {
          setBranding({
            company_name: typeof value.company_name === 'string' ? value.company_name : '',
            company_suffix: typeof value.company_suffix === 'string' ? value.company_suffix : '',
          })
        }
        if (row.setting_key === 'contact_info') {
          setContactInfo({
            phone: typeof value.phone === 'string' ? value.phone : '',
            email: typeof value.email === 'string' ? value.email : '',
            address: typeof value.address === 'string' ? value.address : '',
            hours: typeof value.hours === 'string' ? value.hours : '',
            whatsapp: typeof value.whatsapp === 'string' ? value.whatsapp : '',
          })
        }
        if (row.setting_key === 'social_links') {
          setSocialLinks({
            instagram: typeof value.instagram === 'string' ? value.instagram : '',
            facebook: typeof value.facebook === 'string' ? value.facebook : '',
            linkedin: typeof value.linkedin === 'string' ? value.linkedin : '',
          })
        }
      })

      setLoading(false)
    }

    load()
  }, [toast])

  const upsertSetting = async (key: string, value: JsonObject) => {
    const supabase = createClient() as any
    return supabase
      .from('site_settings')
      .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' })
      .select('setting_key')
  }

  const handleSave = async () => {
    setSaving(true)

    const [a, b, c] = await Promise.all([
      upsertSetting('branding', branding),
      upsertSetting('contact_info', contactInfo),
      upsertSetting('social_links', socialLinks),
    ])

    const error = a.error || b.error || c.error
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
      setSaving(false)
      return
    }

    const affected = [a.data?.length ?? 0, b.data?.length ?? 0, c.data?.length ?? 0]
    if (affected.some((count) => count === 0)) {
      toast({
        title: 'Nenhuma alteração aplicada',
        description: 'Verifique permissões de admin (RLS) para site_settings.',
        variant: 'destructive',
      })
      setSaving(false)
      return
    }

    toast({ title: 'Configurações atualizadas' })
    setSaving(false)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando configurações...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Site {'>'} Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie branding, contato e redes sociais.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66]">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome da empresa</Label>
            <Input value={branding.company_name} onChange={(e) => setBranding((p) => ({ ...p, company_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Sufixo</Label>
            <Input value={branding.company_suffix} onChange={(e) => setBranding((p) => ({ ...p, company_suffix: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66]">Contato</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Telefone</Label><Input value={contactInfo.phone} onChange={(e) => setContactInfo((p) => ({ ...p, phone: e.target.value }))} /></div>
          <div className="space-y-2"><Label>E-mail</Label><Input value={contactInfo.email} onChange={(e) => setContactInfo((p) => ({ ...p, email: e.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Endereço</Label><Input value={contactInfo.address} onChange={(e) => setContactInfo((p) => ({ ...p, address: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Horário</Label><Input value={contactInfo.hours} onChange={(e) => setContactInfo((p) => ({ ...p, hours: e.target.value }))} /></div>
          <div className="space-y-2"><Label>WhatsApp (somente números)</Label><Input value={contactInfo.whatsapp} onChange={(e) => setContactInfo((p) => ({ ...p, whatsapp: e.target.value }))} /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66]">Redes sociais</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>Instagram</Label><Input value={socialLinks.instagram} onChange={(e) => setSocialLinks((p) => ({ ...p, instagram: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Facebook</Label><Input value={socialLinks.facebook} onChange={(e) => setSocialLinks((p) => ({ ...p, facebook: e.target.value }))} /></div>
          <div className="space-y-2"><Label>LinkedIn</Label><Input value={socialLinks.linkedin} onChange={(e) => setSocialLinks((p) => ({ ...p, linkedin: e.target.value }))} /></div>
        </div>
      </div>
    </div>
  )
}
