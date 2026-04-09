import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import AdminImageField from '@/components/admin/media/AdminImageField'
import type { SectionFormProps } from './types'
import { getString } from './utils'

export default function HeroSectionForm({ value, onChange }: SectionFormProps) {
  const setField = (field: string, legacyField: string, next: string) => {
    onChange({ ...value, [field]: next, [legacyField]: next })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Badge</Label><Input value={getString(value, ['badge'])} onChange={(e) => setField('badge', 'badge', e.target.value)} /></div>
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => setField('title', 'title', e.target.value)} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Textarea rows={3} value={getString(value, ['subtitle'])} onChange={(e) => setField('subtitle', 'subtitle', e.target.value)} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Texto botão primário</Label><Input value={getString(value, ['primaryButtonText', 'primary_button_text'])} onChange={(e) => setField('primaryButtonText', 'primary_button_text', e.target.value)} /></div>
        <div className="space-y-2"><Label>Link botão primário</Label><Input value={getString(value, ['primaryButtonLink', 'primary_button_url'])} onChange={(e) => setField('primaryButtonLink', 'primary_button_url', e.target.value)} /></div>
        <div className="space-y-2"><Label>Texto botão secundário</Label><Input value={getString(value, ['secondaryButtonText', 'secondary_button_text'])} onChange={(e) => setField('secondaryButtonText', 'secondary_button_text', e.target.value)} /></div>
        <div className="space-y-2"><Label>Link botão secundário</Label><Input value={getString(value, ['secondaryButtonLink', 'secondary_button_url'])} onChange={(e) => setField('secondaryButtonLink', 'secondary_button_url', e.target.value)} /></div>
      </div>
      <AdminImageField
        label="Imagem de fundo"
        value={getString(value, ['backgroundImage', 'background_image'])}
        onChange={(next) => setField('backgroundImage', 'background_image', next)}
        pathPrefix="cms/hero"
        advanced
      />
    </div>
  )
}
