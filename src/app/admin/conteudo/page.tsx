'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Save, FileText, Edit2, Loader2, Plus, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'
import Link from 'next/link'

interface ContentBlock {
  id: string
  key: string
  title: string | null
  content: string
  type: string
  page: string
}

interface NavTab {
  label: string
  href: string
}

// Built-in pages with fixed sections
const BUILTIN_PAGES = [
  {
    id: 'home',
    page: 'home',
    label: 'Hero — Página Inicial',
    fields: [
      { name: 'hero_title', label: 'Título Principal', type: 'text' },
      { name: 'hero_subtitle', label: 'Subtítulo', type: 'textarea' },
      { name: 'hero_btn_primary', label: 'Botão Principal', type: 'text' },
      { name: 'hero_btn_secondary', label: 'Botão Secundário', type: 'text' },
      { name: 'hero_stat1_value', label: 'Estatística 1 — Valor (ex: 3+)', type: 'text' },
      { name: 'hero_stat1_label', label: 'Estatística 1 — Legenda', type: 'text' },
      { name: 'hero_stat2_value', label: 'Estatística 2 — Valor (ex: 100+)', type: 'text' },
      { name: 'hero_stat2_label', label: 'Estatística 2 — Legenda', type: 'text' },
      { name: 'hero_stat3_value', label: 'Estatística 3 — Valor (ex: 98%)', type: 'text' },
      { name: 'hero_stat3_label', label: 'Estatística 3 — Legenda', type: 'text' },
      { name: 'hero_stat4_value', label: 'Estatística 4 — Valor (ex: 200+)', type: 'text' },
      { name: 'hero_stat4_label', label: 'Estatística 4 — Legenda', type: 'text' },
    ],
  },
  {
    id: 'home_destaques',
    page: 'home_destaques',
    label: 'Imóveis em Destaque',
    fields: [
      { name: 'destaques_label', label: 'Rótulo (acima do título)', type: 'text' },
      { name: 'destaques_title', label: 'Título', type: 'text' },
      { name: 'destaques_subtitle', label: 'Subtítulo', type: 'textarea' },
      { name: 'destaques_btn', label: 'Texto do botão "Ver todos"', type: 'text' },
    ],
  },
  {
    id: 'home_diferenciais',
    page: 'home_diferenciais',
    label: 'Nossos Diferenciais',
    fields: [
      { name: 'diferenciais_label', label: 'Rótulo (acima do título)', type: 'text' },
      { name: 'diferenciais_title', label: 'Título da seção', type: 'text' },
      { name: 'diferenciais_subtitle', label: 'Subtítulo da seção', type: 'textarea' },
      { name: 'diferenciais_1_title', label: 'Card 1 — Título', type: 'text' },
      { name: 'diferenciais_1_desc', label: 'Card 1 — Descrição', type: 'textarea' },
      { name: 'diferenciais_2_title', label: 'Card 2 — Título', type: 'text' },
      { name: 'diferenciais_2_desc', label: 'Card 2 — Descrição', type: 'textarea' },
      { name: 'diferenciais_3_title', label: 'Card 3 — Título', type: 'text' },
      { name: 'diferenciais_3_desc', label: 'Card 3 — Descrição', type: 'textarea' },
      { name: 'diferenciais_4_title', label: 'Card 4 — Título', type: 'text' },
      { name: 'diferenciais_4_desc', label: 'Card 4 — Descrição', type: 'textarea' },
      { name: 'diferenciais_5_title', label: 'Card 5 — Título', type: 'text' },
      { name: 'diferenciais_5_desc', label: 'Card 5 — Descrição', type: 'textarea' },
      { name: 'diferenciais_6_title', label: 'Card 6 — Título', type: 'text' },
      { name: 'diferenciais_6_desc', label: 'Card 6 — Descrição', type: 'textarea' },
    ],
  },
  {
    id: 'home_cta',
    page: 'home_cta',
    label: 'Call to Action (Banner Final)',
    fields: [
      { name: 'cta_badge', label: 'Badge (ex: Pronto para começar?)', type: 'text' },
      { name: 'cta_title', label: 'Título', type: 'text' },
      { name: 'cta_subtitle', label: 'Subtítulo', type: 'textarea' },
      { name: 'cta_whatsapp', label: 'Número WhatsApp (com DDI, ex: 5521999999999)', type: 'text' },
      { name: 'cta_feature1', label: 'Ponto 1 (ex: Atendimento rápido)', type: 'text' },
      { name: 'cta_feature2', label: 'Ponto 2 (ex: Corretores especializados)', type: 'text' },
      { name: 'cta_feature3', label: 'Ponto 3 (ex: Visitas presenciais e virtuais)', type: 'text' },
    ],
  },
  {
    id: 'sobre',
    page: 'sobre',
    label: 'Sobre Nós — Hero',
    fields: [
      { name: 'about_hero_badge', label: 'Badge (ex: Quem somos)', type: 'text' },
      { name: 'about_hero_title', label: 'Título principal', type: 'text' },
      { name: 'about_hero_subtitle', label: 'Subtítulo', type: 'textarea' },
    ],
  },
  {
    id: 'sobre_historia',
    page: 'sobre',
    label: 'Sobre Nós — Nossa História',
    fields: [
      { name: 'about_story_badge', label: 'Badge (ex: Nossa História)', type: 'text' },
      { name: 'about_story_title', label: 'Título', type: 'text' },
      { name: 'about_story_p1', label: 'Parágrafo 1', type: 'textarea' },
      { name: 'about_story_p2', label: 'Parágrafo 2', type: 'textarea' },
      { name: 'about_story_p3', label: 'Parágrafo 3', type: 'textarea' },
      { name: 'about_story_bullet1', label: 'Item 1 da lista', type: 'text' },
      { name: 'about_story_bullet2', label: 'Item 2 da lista', type: 'text' },
      { name: 'about_story_bullet3', label: 'Item 3 da lista', type: 'text' },
      { name: 'about_story_bullet4', label: 'Item 4 da lista', type: 'text' },
      { name: 'about_story_years', label: 'Destaque — Anos (ex: 10+)', type: 'text' },
      { name: 'about_story_years_label', label: 'Destaque — Legenda (ex: Anos de mercado)', type: 'text' },
      { name: 'about_story_sold', label: 'Destaque — Vendidos (ex: 500+)', type: 'text' },
      { name: 'about_story_sold_label', label: 'Destaque — Legenda vendidos', type: 'text' },
      { name: 'about_story_image', label: 'URL da imagem', type: 'text' },
    ],
  },
  {
    id: 'sobre_missao',
    page: 'sobre',
    label: 'Sobre Nós — Missão, Visão e Valores',
    fields: [
      { name: 'about_values_badge', label: 'Badge (ex: Nosso Propósito)', type: 'text' },
      { name: 'about_values_title', label: 'Título da seção', type: 'text' },
      { name: 'about_card1_title', label: 'Card 1 — Título (ex: Missão)', type: 'text' },
      { name: 'about_card1_desc', label: 'Card 1 — Descrição', type: 'textarea' },
      { name: 'about_card2_title', label: 'Card 2 — Título (ex: Visão)', type: 'text' },
      { name: 'about_card2_desc', label: 'Card 2 — Descrição', type: 'textarea' },
      { name: 'about_card3_title', label: 'Card 3 — Título (ex: Valores)', type: 'text' },
      { name: 'about_card3_desc', label: 'Card 3 — Descrição', type: 'textarea' },
    ],
  },
  {
    id: 'sobre_equipe',
    page: 'sobre',
    label: 'Sobre Nós — Equipe',
    fields: [
      { name: 'about_team_badge', label: 'Badge (ex: Nossa Equipe)', type: 'text' },
      { name: 'about_team_title', label: 'Título', type: 'text' },
      { name: 'about_team_subtitle', label: 'Subtítulo', type: 'textarea' },
      { name: 'about_team1_name', label: 'Membro 1 — Nome', type: 'text' },
      { name: 'about_team1_role', label: 'Membro 1 — Cargo', type: 'text' },
      { name: 'about_team1_creci', label: 'Membro 1 — CRECI', type: 'text' },
      { name: 'about_team1_image', label: 'Membro 1 — URL da foto', type: 'text' },
      { name: 'about_team2_name', label: 'Membro 2 — Nome', type: 'text' },
      { name: 'about_team2_role', label: 'Membro 2 — Cargo', type: 'text' },
      { name: 'about_team2_creci', label: 'Membro 2 — CRECI', type: 'text' },
      { name: 'about_team2_image', label: 'Membro 2 — URL da foto', type: 'text' },
      { name: 'about_team3_name', label: 'Membro 3 — Nome', type: 'text' },
      { name: 'about_team3_role', label: 'Membro 3 — Cargo', type: 'text' },
      { name: 'about_team3_creci', label: 'Membro 3 — CRECI', type: 'text' },
      { name: 'about_team3_image', label: 'Membro 3 — URL da foto', type: 'text' },
    ],
  },
  {
    id: 'sobre_cta',
    page: 'sobre',
    label: 'Sobre Nós — CTA Final',
    fields: [
      { name: 'about_cta_title', label: 'Título', type: 'text' },
      { name: 'about_cta_subtitle', label: 'Subtítulo', type: 'textarea' },
      { name: 'about_cta_btn', label: 'Texto do botão', type: 'text' },
    ],
  },
  {
    id: 'contato',
    page: 'contato',
    label: 'Contato — Cabeçalho',
    fields: [
      { name: 'contact_hero_badge', label: 'Badge (ex: Fale conosco)', type: 'text' },
      { name: 'contact_hero_title', label: 'Título (ex: Contato)', type: 'text' },
      { name: 'contact_hero_subtitle', label: 'Subtítulo', type: 'text' },
    ],
  },
  {
    id: 'contato_info',
    page: 'contato',
    label: 'Contato — Informações',
    fields: [
      { name: 'contact_phone', label: 'Telefone', type: 'text' },
      { name: 'contact_email', label: 'E-mail', type: 'text' },
      { name: 'contact_address', label: 'Endereço (use \\n para quebra de linha)', type: 'textarea' },
      { name: 'contact_hours', label: 'Horário de Atendimento (use \\n para quebra de linha)', type: 'textarea' },
      { name: 'contact_whatsapp', label: 'WhatsApp (com DDI, ex: 5521999999999)', type: 'text' },
      { name: 'contact_map_url', label: 'URL embed do Google Maps', type: 'text' },
    ],
  },
  {
    id: 'global',
    page: 'global',
    label: 'Rodapé',
    fields: [
      { name: 'footer_description', label: 'Descrição', type: 'textarea' },
      { name: 'footer_instagram', label: 'Instagram URL', type: 'text' },
      { name: 'footer_facebook', label: 'Facebook URL', type: 'text' },
    ],
  },
]

export default function ConteudoPage() {
  const { toast } = useToast()
  const [contentMap, setContentMap] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState('home')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customPages, setCustomPages] = useState<NavTab[]>([])
  const [customBlocks, setCustomBlocks] = useState<ContentBlock[]>([])
  const [newBlock, setNewBlock] = useState({ title: '', content: '' })
  const [showAddBlock, setShowAddBlock] = useState(false)

  const isBuiltin = BUILTIN_PAGES.some((p) => p.id === activeSection)
  const activeBuiltin = BUILTIN_PAGES.find((p) => p.id === activeSection)
  const activePage = isBuiltin ? activeBuiltin!.page : activeSection

  const loadData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Load all content blocks
    const { data: blocks } = await supabase.from('content_blocks').select('*')
    const map: Record<string, string> = {}
    blocks?.forEach((b: ContentBlock) => { map[b.key] = b.content })
    setContentMap(map)

    // Load custom nav tabs (non-builtin pages)
    const builtinHrefs = ['/', '/sobre', '/imoveis', '/contato']
    const { data: tabs } = await supabase
      .from('nav_tabs')
      .select('label, href')
      .eq('active', true)
      .order('order', { ascending: true })
    const custom = (tabs ?? []).filter((t: NavTab) => !builtinHrefs.includes(t.href))
    setCustomPages(custom)

    setLoading(false)
  }, [])

  const loadCustomBlocks = useCallback(async (page: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('page', page)
      .order('created_at', { ascending: true })
    setCustomBlocks((data as ContentBlock[]) ?? [])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!isBuiltin) loadCustomBlocks(activeSection)
  }, [activeSection, isBuiltin, loadCustomBlocks])

  const handleChange = (key: string, value: string) => {
    setContentMap((prev) => ({ ...prev, [key]: value }))
  }

  const handleSaveBuiltin = async () => {
    setSaving(true)
    const section = activeBuiltin!
    const upserts = section.fields.map((field) => ({
      key: field.name,
      title: field.label,
      content: contentMap[field.name] ?? '',
      type: 'text',
      page: section.page,
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createClient() as any)
      .from('content_blocks')
      .upsert(upserts, { onConflict: 'key,page' })
      .select('id')
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para content_blocks.',
          variant: 'destructive',
        })
        setSaving(false)
        return
      }
      toast({ title: 'Conteúdo salvo!', description: 'Alterações aplicadas ao site.' })
    }
    setSaving(false)
  }

  const handleAddBlock = async () => {
    if (!newBlock.content) {
      toast({ title: 'Conteúdo obrigatório', description: 'Preencha o conteúdo do bloco.', variant: 'destructive' })
      return
    }
    const supabase = createClient()
    const key = `${activeSection}_${Date.now()}`
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('content_blocks')
      .insert([{ key, title: newBlock.title || null, content: newBlock.content, type: 'text', page: activeSection }])
      .select()
      .single()
    if (error) {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' })
    } else {
      setCustomBlocks((prev) => [...prev, data as ContentBlock])
      setNewBlock({ title: '', content: '' })
      setShowAddBlock(false)
      toast({ title: 'Bloco adicionado!' })
    }
  }

  const handleUpdateBlock = async (block: ContentBlock) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (createClient() as any)
      .from('content_blocks')
      .update({ title: block.title, content: block.content })
      .eq('id', block.id)
      .select('id')
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para content_blocks.',
          variant: 'destructive',
        })
        return
      }
      toast({ title: 'Bloco salvo!' })
    }
  }

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Excluir este bloco de conteúdo?')) return
    const { data, error } = await createClient().from('content_blocks').delete().eq('id', id).select('id')
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum bloco excluído',
          description: 'Verifique permissões de admin (RLS) para content_blocks.',
          variant: 'destructive',
        })
        return
      }
      setCustomBlocks((prev) => prev.filter((b) => b.id !== id))
      toast({ title: 'Bloco excluído.' })
    }
  }

  const updateLocalBlock = (id: string, field: 'title' | 'content', value: string) => {
    setCustomBlocks((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b))
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Gerenciar Conteúdo</h1>
          <p className="text-gray-500 text-sm mt-1">Edite os textos e informações do site</p>
        </div>
        {isBuiltin && (
          <Button onClick={handleSaveBuiltin} disabled={saving || loading}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" />Salvar Seção</span>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#1E4ED8]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1 space-y-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Páginas fixas</p>
            {BUILTIN_PAGES.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  activeSection === section.id ? 'bg-[#0A2A66] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{section.label}</span>
              </button>
            ))}

            {customPages.length > 0 && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mt-4 mb-2 pt-2 border-t border-gray-100">Páginas personalizadas</p>
                {customPages.map((tab) => {
                  const slug = tab.href.replace('/', '')
                  return (
                    <button
                      key={slug}
                      onClick={() => setActiveSection(slug)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                        activeSection === slug ? 'bg-[#1E4ED8] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="line-clamp-1">{tab.label}</span>
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {/* Editor */}
          <div className="md:col-span-3">
            {isBuiltin ? (
              // Built-in page editor
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Edit2 className="h-5 w-5 text-[#1E4ED8]" />
                  <h2 className="font-bold text-[#0A2A66]">{activeBuiltin!.label}</h2>
                  <span className="ml-auto text-xs bg-blue-50 text-[#1E4ED8] px-2.5 py-1 rounded-full">{activePage}</span>
                </div>
                <div className="space-y-5">
                  {activeBuiltin!.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      {field.type === 'textarea' ? (
                        <Textarea id={field.name} value={contentMap[field.name] ?? ''} onChange={(e) => handleChange(field.name, e.target.value)} rows={3} />
                      ) : (
                        <Input id={field.name} value={contentMap[field.name] ?? ''} onChange={(e) => handleChange(field.name, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <Button onClick={handleSaveBuiltin} disabled={saving}>
                    {saving ? (
                      <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Salvando...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" />Salvar Seção</span>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              // Custom page editor — block-based
              <div className="space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit2 className="h-5 w-5 text-[#1E4ED8]" />
                    <h2 className="font-bold text-[#0A2A66]">
                      {customPages.find((t) => t.href === `/${activeSection}`)?.label ?? activeSection}
                    </h2>
                    <span className="text-xs bg-blue-50 text-[#1E4ED8] px-2.5 py-1 rounded-full">/{activeSection}</span>
                  </div>
                  <Link href={`/${activeSection}`} target="_blank" className="text-xs text-gray-400 hover:text-[#1E4ED8] flex items-center gap-1 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> Ver página
                  </Link>
                </div>

                {customBlocks.length === 0 && !showAddBlock && (
                  <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhum conteúdo nesta página ainda.</p>
                    <p className="text-xs mt-1">Clique em "Adicionar Bloco" para começar.</p>
                  </div>
                )}

                {customBlocks.map((block, index) => (
                  <div key={block.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Bloco {index + 1}</span>
                      <button onClick={() => handleDeleteBlock(block.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Label>Título (opcional)</Label>
                      <Input
                        value={block.title ?? ''}
                        onChange={(e) => updateLocalBlock(block.id, 'title', e.target.value)}
                        placeholder="Título do bloco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conteúdo *</Label>
                      <Textarea
                        value={block.content}
                        onChange={(e) => updateLocalBlock(block.id, 'content', e.target.value)}
                        rows={4}
                        placeholder="Texto do bloco..."
                      />
                    </div>
                    <Button size="sm" onClick={() => handleUpdateBlock(block)} variant="outline">
                      <Save className="h-3.5 w-3.5 mr-1.5" /> Salvar bloco
                    </Button>
                  </div>
                ))}

                {showAddBlock ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-5 space-y-3">
                    <p className="font-semibold text-[#0A2A66] text-sm">Novo Bloco</p>
                    <div className="space-y-2">
                      <Label>Título (opcional)</Label>
                      <Input value={newBlock.title} onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })} placeholder="Ex: Sobre o Blog" />
                    </div>
                    <div className="space-y-2">
                      <Label>Conteúdo *</Label>
                      <Textarea value={newBlock.content} onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })} rows={4} placeholder="Escreva o conteúdo aqui..." />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddBlock}><Plus className="h-4 w-4 mr-1.5" />Adicionar</Button>
                      <Button variant="outline" onClick={() => { setShowAddBlock(false); setNewBlock({ title: '', content: '' }) }}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddBlock(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-[#1E4ED8] hover:text-[#1E4ED8] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <Plus className="h-4 w-4" /> Adicionar Bloco de Conteúdo
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
