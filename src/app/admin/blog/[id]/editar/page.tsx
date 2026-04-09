'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Upload, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface ExistingImage { id: string; image_url: string; caption: string | null; order: number }
interface NewImage { file: File; preview: string; caption: string }

export default function EditarBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null)
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([])
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any
      const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single()
      if (!post) { router.push('/admin/blog'); return }
      setTitle(post.title)
      setSlug(post.slug)
      setExcerpt(post.excerpt ?? '')
      setContent(post.content)
      setVideoUrl(post.video_url ?? '')
      setPublished(post.published)
      setCoverUrl(post.cover_image)
      const { data: imgs } = await supabase
        .from('post_images').select('*').eq('post_id', postId).order('order', { ascending: true })
      setExistingImages(imgs ?? [])
      setLoading(false)
    }
    load()
  }, [postId, router])

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setNewCoverFile(file)
    setNewCoverPreview(URL.createObjectURL(file))
  }

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const imgs: NewImage[] = files.map((file) => ({ file, preview: URL.createObjectURL(file), caption: '' }))
    setNewImages((prev) => [...prev, ...imgs])
    e.target.value = ''
  }

  const removeExisting = (id: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== id))
    setDeletedImageIds((prev) => [...prev, id])
  }

  const removeNew = (i: number) => setNewImages((prev) => prev.filter((_, idx) => idx !== i))

  const updateNewCaption = (i: number, caption: string) => {
    setNewImages((prev) => prev.map((img, idx) => (idx === i ? { ...img, caption } : img)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any

      // Upload new cover if selected
      let finalCoverUrl = coverUrl
      if (newCoverFile) {
        const ext = newCoverFile.name.split('.').pop()
        const path = `covers/${slug}-${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('blog-media').upload(path, newCoverFile, { upsert: true })
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('blog-media').getPublicUrl(path)
        finalCoverUrl = publicUrl
      }

      // Update post
      const { data: postData, error: postErr } = await supabase.from('posts').update({
        title, slug, excerpt: excerpt || null, content,
        cover_image: finalCoverUrl, video_url: videoUrl || null, published,
      }).eq('id', postId).select('id')
      if (postErr) throw postErr
      if (!postData || postData.length === 0) throw new Error('Nenhuma alteração aplicada no post. Verifique permissões de admin (RLS).')

      // Delete removed images
      for (const id of deletedImageIds) {
        const { data: deletedData, error: delErr } = await supabase.from('post_images').delete().eq('id', id).select('id')
        if (delErr) throw delErr
        if (!deletedData || deletedData.length === 0) throw new Error('Não foi possível remover imagem antiga da galeria.')
      }

      // Upload new gallery images
      const startOrder = existingImages.length
      for (let i = 0; i < newImages.length; i++) {
        const img = newImages[i]
        const ext = img.file.name.split('.').pop()
        const imgPath = `gallery/${postId}-new-${i}-${Date.now()}.${ext}`
        const { error: imgUpErr } = await supabase.storage
          .from('blog-media').upload(imgPath, img.file, { upsert: true })
        if (imgUpErr) continue
        const { data: { publicUrl: imgUrl } } = supabase.storage.from('blog-media').getPublicUrl(imgPath)
        const { data: imageData, error: imageErr } = await supabase.from('post_images').insert({
          post_id: postId, image_url: imgUrl, caption: img.caption || null, order: startOrder + i,
        })
        .select('id')

        if (imageErr || !imageData || imageData.length === 0) {
          throw new Error(imageErr?.message || 'Não foi possível salvar imagem da galeria.')
        }
      }

      toast({ title: 'Post atualizado!', description: published ? 'Publicado com sucesso.' : 'Salvo como rascunho.' })
      router.push('/admin/blog')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.'
      toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
  }

  const coverDisplay = newCoverPreview ?? coverUrl

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Editar Postagem</h1>
          <p className="text-gray-500 text-sm">Atualize o conteúdo da postagem</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-[#0A2A66]">Informações Básicas</h2>

          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Slug (URL)</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono text-sm" />
          </div>

          <div className="space-y-2">
            <Label>Resumo</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} />
          </div>

          <div className="space-y-2">
            <Label>Conteúdo *</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} required />
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-[#0A2A66]">Imagem de Capa</h2>

          {coverDisplay ? (
            <div className="relative rounded-xl overflow-hidden h-56">
              <Image src={coverDisplay} alt="Capa" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setNewCoverFile(null); setNewCoverPreview(null); setCoverUrl(null) }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
              <label className="absolute bottom-2 right-2 bg-white/90 text-gray-700 rounded-lg px-3 py-1.5 text-xs cursor-pointer hover:bg-white flex items-center gap-1">
                <Upload className="h-3.5 w-3.5" /> Trocar
                <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
              </label>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E4ED8] transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">Clique para enviar imagem de capa</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
            </label>
          )}
        </div>

        {/* Video */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-[#0A2A66]">Vídeo (opcional)</h2>
          <div className="space-y-2">
            <Label>URL do Vídeo</Label>
            <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..." />
            <p className="text-xs text-gray-400">Suporta YouTube, Vimeo ou link direto de vídeo</p>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#0A2A66]">Galeria de Imagens</h2>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span><Plus className="h-4 w-4 mr-1" /> Adicionar Fotos</span>
              </Button>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
            </label>
          </div>

          {existingImages.length === 0 && newImages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma imagem na galeria.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {existingImages.map((img) => (
                <div key={img.id} className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden h-36">
                    <Image src={img.image_url} alt={img.caption ?? ''} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExisting(img.id)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 truncate px-1">{img.caption ?? '—'}</p>
                </div>
              ))}
              {newImages.map((img, i) => (
                <div key={`new-${i}`} className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden h-36">
                    <Image src={img.preview} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNew(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-[#1E4ED8] text-white text-[10px] px-1.5 py-0.5 rounded">Nova</span>
                  </div>
                  <Input
                    value={img.caption}
                    onChange={(e) => updateNewCaption(i, e.target.value)}
                    placeholder="Legenda (opcional)"
                    className="text-xs h-7"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Publish */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-4">Publicação</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
            />
            <div>
              <p className="font-medium text-gray-700 text-sm">Publicado</p>
              <p className="text-gray-400 text-xs">O post fica visível no blog</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/blog">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar Alterações
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
