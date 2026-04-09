import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SectionFormProps } from './types'
import { getString } from './utils'

export default function ContactInfoSectionForm({ value, onChange }: SectionFormProps) {
  const setField = (field: string, legacyField: string, next: string) => {
    onChange({ ...value, [field]: next, [legacyField]: next })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => setField('title', 'title', e.target.value)} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Textarea rows={2} value={getString(value, ['subtitle'])} onChange={(e) => setField('subtitle', 'subtitle', e.target.value)} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Telefone</Label><Input value={getString(value, ['phone'])} onChange={(e) => setField('phone', 'phone', e.target.value)} /></div>
        <div className="space-y-2"><Label>E-mail</Label><Input value={getString(value, ['email'])} onChange={(e) => setField('email', 'email', e.target.value)} /></div>
        <div className="space-y-2"><Label>WhatsApp</Label><Input value={getString(value, ['whatsapp'])} onChange={(e) => setField('whatsapp', 'whatsapp', e.target.value)} /></div>
        <div className="space-y-2"><Label>Horário</Label><Input value={getString(value, ['hours'])} onChange={(e) => setField('hours', 'hours', e.target.value)} /></div>
      </div>
      <div className="space-y-2"><Label>Endereço</Label><Textarea rows={3} value={getString(value, ['address'])} onChange={(e) => setField('address', 'address', e.target.value)} /></div>
    </div>
  )
}
