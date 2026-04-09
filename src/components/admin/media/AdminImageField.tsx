'use client'

import React, { useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Trash2, Upload, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

interface AdminImageFieldProps {
  label?: string
  value: string
  onChange: (next: string) => void
  bucket?: string
  pathPrefix?: string
  advanced?: boolean
}

function getExtension(file: File) {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase()
  if (fromName) return fromName
  if (file.type.includes('png')) return 'png'
  if (file.type.includes('webp')) return 'webp'
  if (file.type.includes('gif')) return 'gif'
  return 'jpg'
}

export default function AdminImageField({
  label = 'Imagem',
  value,
  onChange,
  bucket = 'blog-media',
  pathPrefix = 'cms',
  advanced = false,
}: AdminImageFieldProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showManualUrl, setShowManualUrl] = useState(false)

  const hasImage = value.trim().length > 0
  const previewUrl = useMemo(() => value.trim(), [value])

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem válida.', variant: 'destructive' })
      return
    }

    setUploading(true)
    try {
      const supabase = createClient() as any
      const ext = getExtension(file)
      const path = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })

      if (error) {
        toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' })
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(path)

      onChange(publicUrl)
      toast({ title: 'Imagem enviada com sucesso' })
    } finally {
      setUploading(false)
    }
  }

  const onFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadFile(file)
      event.target.value = ''
    }
  }

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }

  const onPaste = async (event: React.ClipboardEvent<HTMLDivElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'))
    if (file) {
      event.preventDefault()
      await uploadFile(file)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-800">{label}</p>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileInput} />

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        onPaste={onPaste}
        className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3"
      >
        {hasImage ? (
          <div className="space-y-2">
            <img src={previewUrl} alt="Preview" className="h-36 w-full rounded-lg object-cover border border-gray-200 bg-white" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />} Substituir
              </Button>
              <Button size="sm" variant="outline" onClick={() => onChange('')}>
                <Trash2 className="h-4 w-4 mr-1" /> Remover
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 py-3">
            <ImageIcon className="mx-auto h-6 w-6 text-gray-500" />
            <p className="text-xs text-gray-600">Arraste uma imagem, clique para enviar ou cole com Ctrl+V.</p>
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />} Enviar imagem
            </Button>
          </div>
        )}
      </div>

      {advanced && (
        <div className="space-y-2">
          <button type="button" onClick={() => setShowManualUrl((prev) => !prev)} className="text-xs text-[#1E4ED8] hover:underline inline-flex items-center gap-1">
            <Link2 className="h-3.5 w-3.5" /> {showManualUrl ? 'Ocultar URL manual' : 'Usar URL manual (avançado)'}
          </button>
          {showManualUrl && <Input placeholder="https://..." value={value} onChange={(e) => onChange(e.target.value)} />}
        </div>
      )}
    </div>
  )
}
