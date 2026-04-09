import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getBoolean, getNumber, getString } from './utils'
import type { SectionFormProps } from './types'

export default function FeaturedPropertiesSectionForm({ value, onChange }: SectionFormProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => onChange({ ...value, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle'])} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Limite</Label><Input type="number" value={getNumber(value, ['limit'], 3)} onChange={(e) => onChange({ ...value, limit: Number(e.target.value) || 0 })} /></div>
        <div className="space-y-2"><Label>Finalidade</Label><Input value={getString(value, ['purpose'])} onChange={(e) => onChange({ ...value, purpose: e.target.value })} /></div>
        <div className="space-y-2"><Label>Tipo</Label><Input value={getString(value, ['type'])} onChange={(e) => onChange({ ...value, type: e.target.value })} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={getBoolean(value, ['onlyFeatured', 'only_featured'], true)}
          onChange={(e) => onChange({ ...value, onlyFeatured: e.target.checked, only_featured: e.target.checked })}
        />
        Somente imóveis em destaque
      </label>
    </div>
  )
}
