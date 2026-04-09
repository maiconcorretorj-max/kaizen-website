'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Upload, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { slugify } from '@/lib/utils'

interface GalleryImage { file: File; preview: string; caption: string }

export default function NovoBlogPostPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [gallery, setGallery] = useState<GalleryImage[]>([])

  const handleTitle = (v: string) => {
    setTitle(v)
    setSlug(slugify(v))
  }

  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  const handleGalleryAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const newImages: GalleryImage[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
    }))
    setGallery((prev) => [...prev, ...newImages])
    e.target.value = ''
  }

  const removeGalleryItem = (index: number) => {
    setGallery((prev) => prev.filter((_, i) => i !== index))
  }

  const updateCaption = (index: number, caption: string) => {
    setGallery((prev) => prev.map((img, i) => (i === index ? { ...img, caption } : img)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content) {
      toast({ title: 'Campos obrigatórios', description: 'Título e conteúdo são obrigatórios.', variant: 'destructive' })
      return
    }
    setLoading(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any

      // Upload cover image
      let coverUrl: string | null = null
      if (coverFile) {
        const ext = coverFile.name.split('.').pop()
        const path = `covers/${slug}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('blog-media')
          .upload(path, coverFile, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: { publicUrl } } = supabase.storage.from('blog-media').getPublicUrl(path)
        coverUrl = publicUrl
      }

      // Insert post
      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          title,
          slug,
          excerpt: excerpt || null,
          content,
          cover_image: coverUrl,
          video_url: videoUrl || null,
          published,
        })
        .select('id')
        .single()

      if (postErr) throw postErr
      if (!post?.id) throw new Error('Post não foi criado. Verifique permissões de admin (RLS).')

      // Upload gallery images
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i]
        const ext = img.file.name.split('.').pop()
        const imgPath = `gallery/${post.id}-${i}-${Date.now()}.${ext}`
        const { error: imgUploadErr } = await supabase.storage
          .from('blog-media')
          .upload(imgPath, img.file, { upsert: true })
        if (imgUploadErr) continue
        const { data: { publicUrl: imgUrl } } = supabase.storage.from('blog-media').getPublicUrl(imgPath)
        const { data: imageData, error: imageErr } = await supabase.from('post_images').insert({
          post_id: post.id,
          image_url: imgUrl,
          caption: img.caption || null,
          order: i,
        })
        .select('id')

        if (imageErr || !imageData || imageData.length === 0) {
          throw new Error(imageErr?.message || 'Não foi possível salvar imagem da galeria.')
        }
      }

      toast({ title: 'Post criado!', description: published ? 'Publicado com sucesso.' : 'Salvo como rascunho.' })
      router.push('/admin/blog')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.'
      toast({ title: 'Erro ao salvar', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Nova Postagem</h1>
          <p className="text-gray-500 text-sm">Crie uma nova postagem para o blog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h2 className="font-bold text-[#0A2A66]">Informações Básicas</h2>

          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitle(e.target.value)}
              placeholder="Título da postagem"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="gerado-automaticamente"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descrição do post (aparece na listagem)"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva o conteúdo completo da postagem..."
              rows={12}
              required
            />
          </div>
        </div>

        {/* Cover Image */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-[#0A2A66]">Imagem de Capa</h2>

          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden h-56">
              <Image src={coverPreview} alt="Capa" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setCoverFile(null); setCoverPreview(null) }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E4ED8] transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">Clique para enviar imagem de capa</span>
              <span className="text-xs text-gray-300 mt-1">JPG, PNG, WebP — máx. 50MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
            </label>
          )}
        </div>

        {/* Video */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="font-bold text-[#0A2A66]">Vídeo (opcional)</h2>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">URL do Vídeo</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            />
            <p className="text-xs text-gray-400">Suporta YouTube, Vimeo ou link direto de vídeo</p>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#0A2A66]">Galeria de Imagens</h2>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Fotos
                </span>
              </Button>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryAdd} />
            </label>
          </div>

          {gallery.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma imagem adicionada à galeria.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.map((img, i) => (
                <div key={i} className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden h-36">
                    <Image src={img.preview} alt="" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Input
                    value={img.caption}
                    onChange={(e) => updateCaption(i, e.target.value)}
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
              <p className="font-medium text-gray-700 text-sm">Publicar agora</p>
              <p className="text-gray-400 text-xs">O post ficará visível no blog</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/blog">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {published ? 'Publicar' : 'Salvar Rascunho'}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
