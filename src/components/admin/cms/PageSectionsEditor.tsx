'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, ExternalLink, GripVertical, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'
import SectionFormRenderer, { hasFriendlyForm } from '@/components/admin/cms/section-forms/SectionFormRenderer'
import AdminImageField from '@/components/admin/media/AdminImageField'
import { getSectionMeta, getSectionTemplates, sectionTypeMetaMap, type SectionType } from '@/components/admin/cms/section-catalog'

type SectionStatus = 'draft' | 'published'
type PageSlug = 'home' | 'sobre' | 'contato'
type EditorTab = 'content' | 'settings' | 'advanced'

interface SectionRow {
  id: string
  page_id: string
  section_key: string
  section_type: string
  admin_title: string | null
  content: Record<string, unknown> | null
  position: number
  is_active: boolean
  status: SectionStatus
}

interface PageSectionsEditorProps {
  pageSlug: PageSlug
  title: string
  description: string
}

interface CmsPageMeta {
  title: string
  meta_title: string
  meta_description: string
  og_image_url: string
  meta_robots_index: boolean
  meta_robots_follow: boolean
  status: SectionStatus
  updated_at: string | null
}

const sectionTypeOptions: SectionType[] = Object.keys(sectionTypeMetaMap) as SectionType[]

function safeStringify(content: Record<string, unknown> | null) {
  try { return JSON.stringify(content ?? {}, null, 2) } catch { return '{}' }
}

function normalizeKey(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
}

function parseJsonContent(raw: string, fallback: Record<string, unknown>) {
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback
  } catch { return fallback }
}

function summarizeContent(contentText: string) {
  try {
    const parsed = JSON.parse(contentText) as Record<string, unknown>
    const title = typeof parsed.title === 'string' ? parsed.title : ''
    const subtitle = typeof parsed.subtitle === 'string' ? parsed.subtitle : ''
    const text = [title, subtitle].filter(Boolean).join(' - ')
    if (text) return text.slice(0, 96)
    return `${Object.keys(parsed).length} campo(s)`
  } catch { return 'Conteúdo em edição' }
}

export default function PageSectionsEditor({ pageSlug, title, description }: PageSectionsEditorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [pageId, setPageId] = useState<string | null>(null)
  const [sections, setSections] = useState<SectionRow[]>([])
  const [contentDrafts, setContentDrafts] = useState<Record<string, string>>({})
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null)
  const [openSectionId, setOpenSectionId] = useState<string | null>(null)
  const [editorTab, setEditorTab] = useState<EditorTab>('content')
  const [technicalMode, setTechnicalMode] = useState<Record<string, boolean>>({})
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [pageMeta, setPageMeta] = useState<CmsPageMeta>({ title: '', meta_title: '', meta_description: '', og_image_url: '', meta_robots_index: true, meta_robots_follow: true, status: 'draft', updated_at: null })

  const sectionTemplates = useMemo(() => getSectionTemplates(pageSlug), [pageSlug])
  const openSection = useMemo(() => sections.find((item) => item.id === openSectionId) ?? null, [sections, openSectionId])

  const stats = useMemo(() => {
    const published = sections.filter((item) => item.status === 'published').length
    const hidden = sections.filter((item) => !item.is_active).length
    return { total: sections.length, published, hidden }
  }, [sections])

  const isSectionDirty = (section: SectionRow) => {
    const current = sections.find((item) => item.id === section.id)
    if (!current) return false
    return safeStringify(current.content) !== (contentDrafts[section.id] ?? '{}')
  }

  const reindex = (list: SectionRow[]) => list.map((item, index) => ({ ...item, position: index + 1 }))

  const loadData = async () => {
    setLoading(true)
    const supabase = createClient() as any
    const { data: page, error: pageError } = await supabase.from('cms_pages').select('id,title,meta_title,meta_description,og_image_url,meta_robots_index,meta_robots_follow,status,updated_at').eq('slug', pageSlug).single()
    if (pageError || !page) { toast({ title: 'Erro ao carregar página', description: pageError?.message, variant: 'destructive' }); setLoading(false); return }
    setPageId(page.id)
    setPageMeta({ title: page.title ?? '', meta_title: page.meta_title ?? '', meta_description: page.meta_description ?? '', og_image_url: page.og_image_url ?? '', meta_robots_index: page.meta_robots_index ?? true, meta_robots_follow: page.meta_robots_follow ?? true, status: page.status ?? 'draft', updated_at: page.updated_at ?? null })
    const { data: rows, error } = await supabase.from('page_sections').select('id,page_id,section_key,section_type,admin_title,content,position,is_active,status').eq('page_id', page.id).order('position', { ascending: true })
    if (error) { toast({ title: 'Erro ao carregar seções', description: error.message, variant: 'destructive' }); setLoading(false); return }
    const list = reindex((rows ?? []) as SectionRow[])
    const drafts: Record<string, string> = {}
    list.forEach((item) => { drafts[item.id] = safeStringify(item.content) })
    setSections(list)
    setContentDrafts(drafts)
    setLoading(false)
  }

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pageSlug])

  const updateSectionField = <K extends keyof SectionRow>(id: string, field: K, value: SectionRow[K]) => {
    setSections((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const persistOrder = async (ordered: SectionRow[]) => {
    if (!pageId) return false
    const supabase = createClient() as any
    const updates = reindex(ordered)
    const results = await Promise.all(updates.map((item) => supabase.from('page_sections').update({ position: item.position }).eq('id', item.id).eq('page_id', pageId).select('id')))
    const failed = results.find((r: { error: { message: string } | null; data: Array<{ id: string }> | null }) => r.error || !r.data || r.data.length === 0)
    if (failed) { toast({ title: 'Falha ao reorganizar seções', description: failed.error?.message ?? 'Não foi possível persistir a ordem.', variant: 'destructive' }); return false }
    return true
  }

  const moveSection = async (id: string, dir: 'up' | 'down') => {
    const index = sections.findIndex((item) => item.id === id)
    const target = dir === 'up' ? index - 1 : index + 1
    if (index < 0 || target < 0 || target >= sections.length) return
    const snapshot = [...sections]
    const next = [...sections]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    const normalized = reindex(next)
    setSections(normalized)
    const ok = await persistOrder(normalized)
    if (!ok) setSections(snapshot)
    else toast({ title: 'Ordem da página atualizada' })
  }

  const dropSection = async (targetId: string) => {
    if (!draggingSectionId || draggingSectionId === targetId) return
    const from = sections.findIndex((item) => item.id === draggingSectionId)
    const to = sections.findIndex((item) => item.id === targetId)
    if (from < 0 || to < 0) return
    const snapshot = [...sections]
    const next = [...sections]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const normalized = reindex(next)
    setSections(normalized)
    setDraggingSectionId(null)
    const ok = await persistOrder(normalized)
    if (!ok) setSections(snapshot)
    else toast({ title: 'Seção reposicionada' })
  }

  const saveSection = async (section: SectionRow, customMessage?: string) => {
    const parsed = parseJsonContent(contentDrafts[section.id] ?? '{}', section.content ?? {})
    const resolvedType = getSectionMeta(pageSlug, section.section_type, section.section_key, parsed).type
    const nextStatus: SectionStatus = 'published'
    const supabase = createClient() as any
    await supabase
      .from('cms_pages')
      .update({ status: 'published' })
      .eq('id', section.page_id)

    const { data, error } = await supabase.from('page_sections').update({ section_key: normalizeKey(section.section_key), section_type: resolvedType, admin_title: section.admin_title, content: parsed, position: section.position, is_active: section.is_active, status: nextStatus }).eq('id', section.id).eq('page_id', section.page_id).select('id')
    if (error) { toast({ title: 'Erro ao salvar seção', description: error.message, variant: 'destructive' }); return }
    if (!data || data.length === 0) { toast({ title: 'Nenhuma alteração aplicada', description: 'Verifique permissões RLS para page_sections.', variant: 'destructive' }); return }
    const label = getSectionMeta(pageSlug, section.section_type, section.section_key, parsed).label
    toast({ title: customMessage ?? `${label} atualizada e publicada` })
    await loadData()
  }

  const savePageMeta = async (publish = false) => {
    if (!pageId) return
    const supabase = createClient() as any
    const { data, error } = await supabase.from('cms_pages').update({ ...pageMeta, status: publish ? 'published' : pageMeta.status, meta_title: pageMeta.meta_title || null, meta_description: pageMeta.meta_description || null, og_image_url: pageMeta.og_image_url || null }).eq('id', pageId).select('id')
    if (error) { toast({ title: 'Erro ao salvar página', description: error.message, variant: 'destructive' }); return }
    if (!data || data.length === 0) { toast({ title: 'Nenhuma alteração aplicada', description: 'Verifique permissões RLS para cms_pages.', variant: 'destructive' }); return }
    toast({ title: publish ? 'Página publicada com sucesso' : 'Página salva com sucesso' })
    await loadData()
  }

  const addSection = async (template: (typeof sectionTemplates)[number]) => {
    if (!pageId) return
    const supabase = createClient() as any
    const meta = sectionTypeMetaMap[template.type]
    const content = template.type === 'hero' ? { title: template.title, subtitle: meta.description } : template.type === 'contact_info' ? { phone: '', email: '', address: '', hours: '', whatsapp: '' } : template.type === 'team' ? { title: template.title, members: [] } : template.type === 'values' || template.type === 'differentials' ? { title: template.title, items: [] } : { title: template.title }
    const key = sections.some((s) => s.section_key === template.key) ? `${template.key}_${Date.now().toString().slice(-4)}` : template.key
    const { data, error } = await supabase.from('page_sections').insert({ page_id: pageId, section_key: key, section_type: template.type, admin_title: template.title, content, position: sections.length + 1, is_active: true, status: 'draft' }).select('id')
    if (error) { toast({ title: 'Erro ao adicionar seção', description: error.message, variant: 'destructive' }); return }
    if (!data || data.length === 0) { toast({ title: 'Não foi possível adicionar seção', description: 'Permissão insuficiente para inserir.', variant: 'destructive' }); return }
    setShowTemplateModal(false)
    toast({ title: `${template.title} adicionada` })
    await loadData()
    setOpenSectionId(data[0].id)
  }

  const duplicateSection = async (section: SectionRow) => {
    if (!pageId) return
    const parsed = parseJsonContent(contentDrafts[section.id] ?? '{}', section.content ?? {})
    const type = getSectionMeta(pageSlug, section.section_type, section.section_key, parsed).type
    const supabase = createClient() as any
    const key = `${normalizeKey(section.section_key)}_copy_${Date.now().toString().slice(-4)}`
    const { data, error } = await supabase.from('page_sections').insert({ page_id: pageId, section_key: key, section_type: type, admin_title: section.admin_title ? `${section.admin_title} (cópia)` : null, content: parsed, position: sections.length + 1, is_active: section.is_active, status: 'draft' }).select('id')
    if (error) { toast({ title: 'Erro ao duplicar seção', description: error.message, variant: 'destructive' }); return }
    if (!data || data.length === 0) { toast({ title: 'Não foi possível duplicar seção', description: 'Permissão insuficiente para inserir.', variant: 'destructive' }); return }
    toast({ title: 'Seção duplicada' })
    await loadData()
  }

  const toggleVisibility = async (section: SectionRow) => {
    const label = getSectionMeta(pageSlug, section.section_type, section.section_key, section.content).label
    const updated = { ...section, is_active: !section.is_active }
    updateSectionField(section.id, 'is_active', updated.is_active)
    await saveSection(updated, updated.is_active ? `${label} exibida na página` : `${label} ocultada na página`)
  }

  const removeSection = async (section: SectionRow) => {
    if (!confirm('Excluir esta seção? Esta ação não pode ser desfeita.')) return
    const supabase = createClient() as any
    const { data, error } = await supabase.from('page_sections').delete().eq('id', section.id).eq('page_id', section.page_id).select('id')
    if (error) { toast({ title: 'Erro ao excluir seção', description: error.message, variant: 'destructive' }); return }
    if (!data || data.length === 0) { toast({ title: 'Nenhuma seção excluída', description: 'Permissão insuficiente ou seção fora da página.', variant: 'destructive' }); return }
    toast({ title: 'Seção removida' })
    setOpenSectionId((prev) => (prev === section.id ? null : prev))
    await loadData()
  }

  return (
    <div className="max-w-7xl space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold">Editor de Página</p>
            <h1 className="text-2xl font-bold text-[#0A2A66]">{title}</h1>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => savePageMeta()}><Save className="h-4 w-4 mr-2" />Salvar</Button>
            <Button onClick={() => savePageMeta(true)}>Publicar</Button>
            <a href={`/${pageSlug === 'home' ? '' : pageSlug}?preview=1`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#1E4ED8]/30 px-3 text-sm font-medium text-[#1E4ED8] hover:bg-[#1E4ED8]/5"><ExternalLink className="h-4 w-4" />Preview</a>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3"><p className="text-xs text-gray-500">Total</p><p className="text-lg font-bold text-[#0A2A66]">{stats.total}</p></div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3"><p className="text-xs text-gray-500">Publicadas</p><p className="text-lg font-bold text-emerald-700">{stats.published}</p></div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3"><p className="text-xs text-gray-500">Ocultas</p><p className="text-lg font-bold text-amber-700">{stats.hidden}</p></div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-3"><p className="text-xs text-gray-500">Atualização</p><p className="text-sm font-semibold text-[#0A2A66]">{pageMeta.updated_at ? new Date(pageMeta.updated_at).toLocaleString('pt-BR') : 'Sem registro'}</p></div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#0A2A66]">Blocos da página</h2>
          <Button onClick={() => setShowTemplateModal(true)}><Plus className="h-4 w-4 mr-1" />Adicionar seção</Button>
        </div>

        {loading ? <p className="text-sm text-gray-500">Carregando seções...</p> : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              const content = parseJsonContent(contentDrafts[section.id] ?? '{}', section.content ?? {})
              const meta = getSectionMeta(pageSlug, section.section_type, section.section_key, content)
              return (
                <div key={section.id} onDragOver={(e) => e.preventDefault()} onDrop={() => dropSection(section.id)} className={`rounded-2xl border p-4 ${openSectionId === section.id ? 'border-[#1E4ED8] bg-blue-50/40' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="text-left flex-1" onClick={() => { setOpenSectionId(section.id); setEditorTab('content') }}>
                      <div className="flex items-center gap-2"><span className="text-lg">{meta.icon}</span><p className="font-semibold text-[#0A2A66]">{section.admin_title || meta.label}</p>{isSectionDirty(section) && <span className="text-[11px] rounded-full px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">Não salvo</span>}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{meta.description}</p>
                      <p className="text-xs text-gray-700 mt-2">{summarizeContent(contentDrafts[section.id] ?? '{}')}</p>
                    </button>
                    <button type="button" draggable onDragStart={() => setDraggingSectionId(section.id)} onDragEnd={() => setDraggingSectionId(null)} className="rounded border border-gray-200 p-1 text-gray-500 hover:text-[#1E4ED8]" title="Arrastar para mover"><GripVertical className="h-4 w-4" /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">{meta.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${section.status === 'published' ? 'border border-emerald-200 bg-emerald-100 text-emerald-700' : 'border border-amber-200 bg-amber-100 text-amber-700'}`}>{section.status === 'published' ? 'Publicado' : 'Rascunho'}</span>
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{section.is_active ? 'Visível' : 'Oculta'}</span>
                    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">Ordem {section.position}</span>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => { setOpenSectionId(section.id); setEditorTab('content') }}>Editar</Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateSection(section)}><Copy className="h-3.5 w-3.5 mr-1" />Duplicar</Button>
                    <Button size="sm" variant="outline" onClick={() => toggleVisibility(section)}>{section.is_active ? <EyeOff className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}{section.is_active ? 'Ocultar' : 'Exibir'}</Button>
                    <Button size="sm" variant="outline" onClick={() => moveSection(section.id, 'up')} disabled={index === 0}><ArrowUp className="h-3.5 w-3.5 mr-1" />Subir</Button>
                    <Button size="sm" variant="outline" onClick={() => moveSection(section.id, 'down')} disabled={index === sections.length - 1}><ArrowDown className="h-3.5 w-3.5 mr-1" />Descer</Button>
                    <Button size="sm" variant="destructive" onClick={() => removeSection(section)}><Trash2 className="h-3.5 w-3.5 mr-1" />Excluir</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 border border-gray-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="text-xl font-bold text-[#0A2A66]">Adicionar seção</h3><button className="p-1 text-gray-500" onClick={() => setShowTemplateModal(false)}><X className="h-5 w-5" /></button></div>
            <p className="text-sm text-gray-600 mt-1">Escolha um template para começar sem precisar configurar estrutura técnica.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectionTemplates.map((template) => {
                const meta = sectionTypeMetaMap[template.type]
                return <button key={template.key} onClick={() => addSection(template)} className="rounded-xl border border-gray-200 p-4 text-left hover:border-[#1E4ED8]/40 hover:bg-[#1E4ED8]/5"><p className="text-xl">{meta.icon}</p><p className="font-semibold text-[#0A2A66] mt-2">{template.title}</p><p className="text-xs text-gray-600 mt-1">{meta.description}</p></button>
              })}
            </div>
          </div>
        </div>
      )}

      {openSection && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={() => setOpenSectionId(null)}>
          <div className="h-full w-full max-w-3xl bg-white border-l border-gray-200 shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-blue-600 font-semibold">Editor de seção</p>
                <p className="font-bold text-[#0A2A66]">{openSection.admin_title || getSectionMeta(pageSlug, openSection.section_type, openSection.section_key, parseJsonContent(contentDrafts[openSection.id] ?? '{}', openSection.content ?? {})).label}</p>
              </div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setOpenSectionId(null)}>Fechar</Button><Button size="sm" onClick={() => saveSection(openSection)}><Save className="h-4 w-4 mr-1" />Salvar</Button></div>
            </div>

            <div className="p-4 space-y-4">
              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button className={`px-3 py-1.5 rounded-md text-sm ${editorTab === 'content' ? 'bg-[#1E4ED8] text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setEditorTab('content')}>Conteúdo</button>
                <button className={`px-3 py-1.5 rounded-md text-sm ${editorTab === 'settings' ? 'bg-[#1E4ED8] text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setEditorTab('settings')}>Configurações</button>
                <button className={`px-3 py-1.5 rounded-md text-sm ${editorTab === 'advanced' ? 'bg-[#1E4ED8] text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setEditorTab('advanced')}>Avançado</button>
              </div>

              {editorTab === 'content' && (
                <div className="space-y-3">
                  {hasFriendlyForm(getSectionMeta(pageSlug, openSection.section_type, openSection.section_key, parseJsonContent(contentDrafts[openSection.id] ?? '{}', openSection.content ?? {})).type)
                    ? <SectionFormRenderer sectionType={getSectionMeta(pageSlug, openSection.section_type, openSection.section_key, parseJsonContent(contentDrafts[openSection.id] ?? '{}', openSection.content ?? {})).type} value={parseJsonContent(contentDrafts[openSection.id] ?? '{}', openSection.content ?? {})} onChange={(next) => setContentDrafts((prev) => ({ ...prev, [openSection.id]: safeStringify(next) }))} onFeedback={(msg) => toast({ title: msg })} />
                    : <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Esta seção ainda não possui formulário visual. Use a aba Avançado para editar o conteúdo.</div>
                  }
                </div>
              )}

              {editorTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Nome da seção</Label><Input value={openSection.admin_title ?? ''} onChange={(e) => updateSectionField(openSection.id, 'admin_title', e.target.value)} /></div>
                  <div className="space-y-2"><Label>Tipo de seção</Label><Select value={getSectionMeta(pageSlug, openSection.section_type, openSection.section_key, parseJsonContent(contentDrafts[openSection.id] ?? '{}', openSection.content ?? {})).type} onValueChange={(value) => updateSectionField(openSection.id, 'section_type', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{sectionTypeOptions.map((item) => <SelectItem key={item} value={item}>{sectionTypeMetaMap[item].label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>Publicação</Label><Select value={openSection.status} onValueChange={(value: SectionStatus) => updateSectionField(openSection.id, 'status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="published">Publicado</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Ordem na página</Label><Input type="number" value={openSection.position} onChange={(e) => updateSectionField(openSection.id, 'position', Number(e.target.value))} /></div>
                  <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"><input type="checkbox" checked={openSection.is_active} onChange={(e) => updateSectionField(openSection.id, 'is_active', e.target.checked)} /> Seção visível</label>
                </div>
              )}

              {editorTab === 'advanced' && (
                <div className="space-y-3">
                  <div className="space-y-2"><Label>Identificador interno</Label><Input value={openSection.section_key} onChange={(e) => updateSectionField(openSection.id, 'section_key', e.target.value)} /></div>
                  <button type="button" onClick={() => setTechnicalMode((prev) => ({ ...prev, [openSection.id]: !prev[openSection.id] }))} className="text-xs text-[#1E4ED8] hover:underline">{technicalMode[openSection.id] ? 'Ocultar JSON avançado' : 'Abrir JSON avançado'}</button>
                  {technicalMode[openSection.id] && <Textarea rows={14} value={contentDrafts[openSection.id] ?? '{}'} onChange={(e) => setContentDrafts((prev) => ({ ...prev, [openSection.id]: e.target.value }))} className="font-mono text-xs" />}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-[#0A2A66]">SEO da página</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Título administrativo</Label><Input value={pageMeta.title} onChange={(e) => setPageMeta((prev) => ({ ...prev, title: e.target.value }))} /></div>
          <div className="space-y-2"><Label>Status</Label><Select value={pageMeta.status} onValueChange={(value: SectionStatus) => setPageMeta((prev) => ({ ...prev, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="published">Publicado</SelectItem></SelectContent></Select></div>
          <div className="space-y-2 md:col-span-2"><Label>Meta title</Label><Input value={pageMeta.meta_title} onChange={(e) => setPageMeta((prev) => ({ ...prev, meta_title: e.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2"><Label>Meta description</Label><Textarea rows={3} value={pageMeta.meta_description} onChange={(e) => setPageMeta((prev) => ({ ...prev, meta_description: e.target.value }))} /></div>
          <div className="space-y-2 md:col-span-2"><AdminImageField label="Imagem OG" value={pageMeta.og_image_url} onChange={(next) => setPageMeta((prev) => ({ ...prev, og_image_url: next }))} pathPrefix="cms/seo" advanced /></div>
        </div>
      </div>
    </div>
  )
}
