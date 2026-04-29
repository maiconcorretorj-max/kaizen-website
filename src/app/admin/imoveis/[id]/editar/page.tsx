'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Upload, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

interface PropertyForm {
  title: string; slug: string; description: string; type: string; status: string
  condition: string; price: string; rent_price: string; area: string
  bedrooms: string; bathrooms: string; parking_spaces: string
  address: string; neighborhood: string; city: string; state: string; zip_code: string
  featured: boolean; active: boolean; features: string
}

const MAX_IMAGE_SIZE_BYTES = 150 * 1024 * 1024

export default function EditarImovelPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PropertyForm>({
    title: '', slug: '', description: '', type: '', status: 'venda',
    condition: '', price: '', rent_price: '', area: '',
    bedrooms: '', bathrooms: '', parking_spaces: '',
    address: '', neighborhood: '', city: 'Rio de Janeiro', state: 'RJ', zip_code: '',
    featured: false, active: true, features: '',
  })
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [deletedImages, setDeletedImages] = useState<string[]>([])

  const isSupportedImage = (file: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    return allowed.includes(file.type)
  }

  const resolveExtension = (file: File) => {
    const byMime: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    if (byMime[file.type]) return byMime[file.type]
    const fromName = file.name.split('.').pop()?.toLowerCase()
    return fromName && fromName.length <= 8 ? fromName : 'jpg'
  }

  useEffect(() => {
    const load = async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any
      const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single()
      if (error || !data) { router.push('/admin/imoveis'); return }
      setForm({
        title: data.title ?? '',
        slug: data.slug ?? '',
        description: data.description ?? '',
        type: data.type ?? '',
        status: data.status ?? 'venda',
        condition: data.condition ?? '',
        price: data.price?.toString() ?? '',
        rent_price: data.rent_price?.toString() ?? '',
        area: data.area?.toString() ?? '',
        bedrooms: data.bedrooms?.toString() ?? '',
        bathrooms: data.bathrooms?.toString() ?? '',
        parking_spaces: data.parking_spaces?.toString() ?? '',
        address: data.address ?? '',
        neighborhood: data.neighborhood ?? '',
        city: data.city ?? 'Rio de Janeiro',
        state: data.state ?? 'RJ',
        zip_code: data.zip_code ?? '',
        featured: data.featured ?? false,
        active: data.active ?? true,
        features: (data.features ?? []).join(', '),
      })
      setExistingImages(data.images ?? [])
      setLoading(false)
    }
    load()
  }, [propertyId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    setNewImageFiles((prev) => [...prev, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    e.target.value = ''
  }

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((u) => u !== url))
    setDeletedImages((prev) => [...prev, url])
  }

  const removeNewImage = (i: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any

      for (const img of newImageFiles) {
        if (!isSupportedImage(img.file)) {
          toast({
            title: 'Formato não suportado',
            description: `Use JPG, PNG ou WEBP. Arquivo: ${img.file.name}`,
            variant: 'destructive',
          })
          return
        }

        if (img.file.size > MAX_IMAGE_SIZE_BYTES) {
          toast({
            title: 'Arquivo acima do limite',
            description: `A imagem ${img.file.name} excede 150MB.`,
            variant: 'destructive',
          })
          return
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user?.id) {
        toast({ title: 'Sessão inválida', description: 'Faça login novamente.', variant: 'destructive' })
        return
      }

      // Upload new images
      const newUrls: string[] = []
      for (let i = 0; i < newImageFiles.length; i++) {
        const { file } = newImageFiles[i]
        const ext = resolveExtension(file)
        const safeSlug = (form.slug || 'imovel').trim() || 'imovel'
        const path = `properties/${user.id}/${safeSlug}-${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('property-images').upload(path, file, {
            upsert: false,
            contentType: file.type || `image/${ext}`,
            cacheControl: '3600',
          })
        if (upErr) {
          throw new Error(`Falha no upload da imagem ${i + 1}: ${upErr.message}`)
        }
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path)
        newUrls.push(publicUrl)
      }

      const allImages = [...existingImages, ...newUrls]

      if (allImages.length === 0) {
        toast({
          title: 'Adicione ao menos 1 imagem',
          description: 'Não é possível salvar o imóvel sem imagens.',
          variant: 'destructive',
        })
        return
      }

      const { data, error } = await supabase.from('properties').update({
        title: form.title,
        slug: form.slug,
        description: form.description,
        type: form.type,
        status: form.status,
        condition: form.condition || null,
        price: parseFloat(form.price),
        rent_price: form.rent_price ? parseFloat(form.rent_price) : null,
        area: parseFloat(form.area),
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        parking_spaces: form.parking_spaces ? parseInt(form.parking_spaces) : null,
        address: form.address,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code || null,
        featured: form.featured,
        active: form.active,
        features: form.features ? form.features.split(',').map((f) => f.trim()).filter(Boolean) : [],
        images: allImages,
      }).eq('id', propertyId).select('id')

      if (error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' })
        return
      }

      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para properties.',
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Imóvel atualizado!', description: 'As alterações foram salvas.' })
      router.push('/admin/imoveis')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.'
      toast({ title: 'Erro ao salvar imóvel', description: msg, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/imoveis">
          <Button variant="outline" size="icon" className="h-9 w-9"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Editar Imóvel</h1>
          <p className="text-gray-500 text-sm">Atualize as informações do imóvel</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <Label>Título *</Label>
              <Input name="title" value={form.title} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Slug (URL)</Label>
              <Input name="slug" value={form.slug} onChange={handleChange} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartamento">Apartamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="cobertura">Cobertura</SelectItem>
                  <SelectItem value="terreno">Terreno</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="sala">Sala Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Finalidade *</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="venda_aluguel">Venda e Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preço (R$) *</Label>
              <Input name="price" type="number" value={form.price} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Área (m²) *</Label>
              <Input name="area" type="number" value={form.area} onChange={handleChange} required />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Descrição *</Label>
              <Textarea name="description" value={form.description} onChange={handleChange} rows={5} required />
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Características</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div className="space-y-2"><Label>Quartos</Label><Input name="bedrooms" type="number" min="0" value={form.bedrooms} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Banheiros</Label><Input name="bathrooms" type="number" min="0" value={form.bathrooms} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Vagas</Label><Input name="parking_spaces" type="number" min="0" value={form.parking_spaces} onChange={handleChange} /></div>
          </div>
          <div className="mt-5 space-y-2">
            <Label>Diferenciais (separe por vírgula)</Label>
            <Input name="features" value={form.features} onChange={handleChange} placeholder="Piscina, Churrasqueira, Academia" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Localização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2"><Label>Endereço *</Label><Input name="address" value={form.address} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>Bairro *</Label><Input name="neighborhood" value={form.neighborhood} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>CEP</Label><Input name="zip_code" value={form.zip_code} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Cidade *</Label><Input name="city" value={form.city} onChange={handleChange} required /></div>
            <div className="space-y-2"><Label>Estado *</Label><Input name="state" value={form.state} onChange={handleChange} required /></div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0A2A66]">Fotos do Imóvel</h2>
            <label className="cursor-pointer">
              <Button type="button" variant="outline" size="sm" asChild>
                <span><Plus className="h-4 w-4 mr-1" /> Adicionar Fotos</span>
              </Button>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          </div>

          {existingImages.length === 0 && newImageFiles.length === 0 ? (
            <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E4ED8] transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">Clique para adicionar fotos</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {existingImages.map((url, i) => (
                <div key={url} className="relative rounded-xl overflow-hidden h-28 group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 bg-[#1E4ED8] text-white text-[10px] px-1.5 py-0.5 rounded">Capa</span>}
                </div>
              ))}
              {newImageFiles.map((img, i) => (
                <div key={`new-${i}`} className="relative rounded-xl overflow-hidden h-28 group">
                  <Image src={img.preview} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">Nova</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Configurações</h2>
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="active" checked={form.active} onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-[#1E4ED8] focus:ring-[#1E4ED8]" />
              <div><p className="font-medium text-gray-700 text-sm">Ativo</p><p className="text-gray-400 text-xs">O imóvel aparece no site</p></div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="featured" checked={form.featured} onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-[#1E4ED8] focus:ring-[#1E4ED8]" />
              <div><p className="font-medium text-gray-700 text-sm">Destaque</p><p className="text-gray-400 text-xs">Aparece na seção de destaques na home</p></div>
            </label>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/imoveis"><Button variant="outline" type="button">Cancelar</Button></Link>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" /> Salvar Alterações</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
