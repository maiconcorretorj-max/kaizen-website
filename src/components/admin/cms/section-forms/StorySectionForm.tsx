import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import AdminImageField from '@/components/admin/media/AdminImageField'
import type { SectionFormProps } from './types'
import { getString } from './utils'

export default function StorySectionForm({ value, onChange }: SectionFormProps) {
  const setField = (field: string, legacyField: string, next: string) => {
    onChange({ ...value, [field]: next, [legacyField]: next })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => setField('title', 'title', e.target.value)} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle', 'badge'])} onChange={(e) => setField('subtitle', 'badge', e.target.value)} /></div>
      <div className="space-y-2"><Label>Conteúdo</Label><Textarea rows={8} value={getString(value, ['content', 'paragraph_1'])} onChange={(e) => onChange({ ...value, content: e.target.value })} /></div>
      <AdminImageField
        label="Imagem"
        value={getString(value, ['image', 'image_url'])}
        onChange={(next) => setField('image', 'image_url', next)}
        pathPrefix="cms/story"
        advanced
      />
    </div>
  )
}
