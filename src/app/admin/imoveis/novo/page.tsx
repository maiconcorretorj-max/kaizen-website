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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { slugify } from '@/lib/utils'

interface PropertyForm {
  title: string
  slug: string
  description: string
  type: string
  status: string
  condition: string
  price: string
  rent_price: string
  area: string
  bedrooms: string
  bathrooms: string
  parking_spaces: string
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  featured: boolean
  active: boolean
  features: string
}

const initialForm: PropertyForm = {
  title: '',
  slug: '',
  description: '',
  type: '',
  status: 'venda',
  condition: '',
  price: '',
  rent_price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  parking_spaces: '',
  address: '',
  neighborhood: '',
  city: 'Rio de Janeiro',
  state: 'RJ',
  zip_code: '',
  featured: false,
  active: true,
  features: '',
}

export default function NovoImovelPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState<PropertyForm>(initialForm)
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([])

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

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    const newImgs = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setImageFiles((prev) => [...prev, ...newImgs])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm((prev) => ({ ...prev, [name]: checked }))
    } else {
      setForm((prev) => {
        const updated = { ...prev, [name]: value }
        if (name === 'title') {
          updated.slug = slugify(value)
        }
        return updated
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await import('@/lib/supabase/client')).default() as any

      if (imageFiles.length === 0) {
        toast({
          title: 'Adicione ao menos 1 imagem',
          description: 'O cadastro só é concluído com imagem enviada com sucesso.',
          variant: 'destructive',
        })
        return
      }

      for (const img of imageFiles) {
        if (!isSupportedImage(img.file)) {
          toast({
            title: 'Formato não suportado',
            description: `Use JPG, PNG ou WEBP. Arquivo: ${img.file.name}`,
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

      // Upload images to storage
      const uploadedUrls: string[] = []
      for (let i = 0; i < imageFiles.length; i++) {
        const { file } = imageFiles[i]
        const ext = resolveExtension(file)
        const safeSlug = (form.slug || 'imovel').trim() || 'imovel'
        const path = `properties/${user.id}/${safeSlug}-${Date.now()}-${i}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('property-images')
          .upload(path, file, {
            upsert: false,
            contentType: file.type || `image/${ext}`,
            cacheControl: '3600',
          })

        if (upErr) {
          throw new Error(`Falha no upload da imagem ${i + 1}: ${upErr.message}`)
        }

        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(path)
        uploadedUrls.push(publicUrl)
      }

      const payload = {
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
        images: uploadedUrls,
      }

      const { data, error } = await supabase.from('properties').insert(payload).select('id')

      if (error) {
        toast({ title: 'Erro ao cadastrar', description: error.message, variant: 'destructive' })
        return
      }

      if (!data || data.length === 0) {
        toast({
          title: 'Cadastro não confirmado',
          description: 'Verifique permissões de admin (RLS) para properties.',
          variant: 'destructive',
        })
        return
      }

      toast({ title: 'Imóvel cadastrado!', description: 'O imóvel foi adicionado com sucesso.' })
      router.push('/admin/imoveis')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tente novamente.'
      toast({ title: 'Erro no cadastro', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/imoveis">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Novo Imóvel</h1>
          <p className="text-gray-500 text-sm">Cadastre um novo imóvel no portfólio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Título do Imóvel *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Apartamento 3 Quartos em Campo Grande"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                placeholder="gerado-automaticamente"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Imóvel *</Label>
              <Select
                value={form.type}
                onValueChange={(val) => handleSelectChange('type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
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
              <Select
                value={form.status}
                onValueChange={(val) => handleSelectChange('status', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="venda_aluguel">Venda e Aluguel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                {form.status === 'aluguel' ? 'Valor do Aluguel (R$) *' : 'Preço de Venda (R$) *'}
              </Label>
              <Input
                id="price"
                name="price"
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area">Área (m²) *</Label>
              <Input
                id="area"
                name="area"
                type="number"
                placeholder="Ex: 85"
                value={form.area}
                onChange={handleChange}
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descreva o imóvel com detalhes..."
                rows={5}
                value={form.description}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Características</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">Quartos</Label>
              <Input
                id="bedrooms"
                name="bedrooms"
                type="number"
                placeholder="0"
                min="0"
                value={form.bedrooms}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">Banheiros</Label>
              <Input
                id="bathrooms"
                name="bathrooms"
                type="number"
                placeholder="0"
                min="0"
                value={form.bathrooms}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking_spaces">Vagas de Garagem</Label>
              <Input
                id="parking_spaces"
                name="parking_spaces"
                type="number"
                placeholder="0"
                min="0"
                value={form.parking_spaces}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <Label htmlFor="features">
              Diferenciais (separe por vírgula)
            </Label>
            <Input
              id="features"
              name="features"
              placeholder="Piscina, Churrasqueira, Academia, Portaria 24h"
              value={form.features}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-[#0A2A66] mb-5">Localização</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input
                id="address"
                name="address"
                placeholder="Rua, número, complemento"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                name="neighborhood"
                placeholder="Ex: Campo Grande"
                value={form.neighborhood}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                name="zip_code"
                placeholder="00000-000"
                value={form.zip_code}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input
                id="state"
                name="state"
                value={form.state}
                onChange={handleChange}
                required
              />
            </div>
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

          {imageFiles.length === 0 ? (
            <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#1E4ED8] transition-colors">
              <Upload className="h-8 w-8 text-gray-300 mb-2" />
              <span className="text-sm text-gray-400">Clique para adicionar fotos</span>
              <span className="text-xs text-gray-300 mt-1">JPG, PNG, WebP — múltiplas fotos permitidas</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
            </label>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {imageFiles.map((img, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden h-28 group">
                  <Image src={img.preview} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 bg-[#1E4ED8] text-white text-[10px] px-1.5 py-0.5 rounded">Capa</span>
                  )}
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
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
              />
              <div>
                <p className="font-medium text-gray-700 text-sm">Ativo</p>
                <p className="text-gray-400 text-xs">O imóvel aparece no site</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-[#1E4ED8] focus:ring-[#1E4ED8]"
              />
              <div>
                <p className="font-medium text-gray-700 text-sm">Destaque</p>
                <p className="text-gray-400 text-xs">Aparece na seção de destaques na home</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/imoveis">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
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
                Cadastrar Imóvel
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
