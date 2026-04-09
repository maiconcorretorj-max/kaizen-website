import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SectionFormProps } from './types'
import { getString } from './utils'

export default function CtaSectionForm({ value, onChange }: SectionFormProps) {
  const setField = (field: string, legacyField: string, next: string) => {
    onChange({ ...value, [field]: next, [legacyField]: next })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => setField('title', 'title', e.target.value)} /></div>
      <div className="space-y-2"><Label>Descrição</Label><Textarea rows={3} value={getString(value, ['description', 'subtitle'])} onChange={(e) => setField('description', 'subtitle', e.target.value)} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Texto do botão</Label><Input value={getString(value, ['buttonText', 'button_text'])} onChange={(e) => setField('buttonText', 'button_text', e.target.value)} /></div>
        <div className="space-y-2"><Label>Link do botão</Label><Input value={getString(value, ['buttonLink', 'button_url'])} onChange={(e) => setField('buttonLink', 'button_url', e.target.value)} /></div>
      </div>
    </div>
  )
}
