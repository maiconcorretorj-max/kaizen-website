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

  const setStoryHighlightField = (field: string, legacyField: string, next: string) => {
    onChange({ ...value, [field]: next, [legacyField]: next })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => setField('title', 'title', e.target.value)} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle', 'badge'])} onChange={(e) => setField('subtitle', 'badge', e.target.value)} /></div>
      <div className="space-y-2"><Label>Conteúdo</Label><Textarea rows={8} value={getString(value, ['content', 'paragraph_1'])} onChange={(e) => onChange({ ...value, content: e.target.value })} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Destaque da esquerda - Valor</Label>
          <Input
            value={getString(value, ['years_value', 'about_story_years'])}
            onChange={(e) => setStoryHighlightField('years_value', 'about_story_years', e.target.value)}
            placeholder="Ex: 3+"
          />
        </div>
        <div className="space-y-2">
          <Label>Destaque da esquerda - Legenda</Label>
          <Input
            value={getString(value, ['years_label', 'about_story_years_label'])}
            onChange={(e) => setStoryHighlightField('years_label', 'about_story_years_label', e.target.value)}
            placeholder="Ex: Anos de mercado"
          />
        </div>
        <div className="space-y-2">
          <Label>Destaque da direita - Valor</Label>
          <Input
            value={getString(value, ['sold_value', 'about_story_sold'])}
            onChange={(e) => setStoryHighlightField('sold_value', 'about_story_sold', e.target.value)}
            placeholder="Ex: 500+"
          />
        </div>
        <div className="space-y-2">
          <Label>Destaque da direita - Legenda</Label>
          <Input
            value={getString(value, ['sold_label', 'about_story_sold_label'])}
            onChange={(e) => setStoryHighlightField('sold_label', 'about_story_sold_label', e.target.value)}
            placeholder="Ex: Imoveis vendidos"
          />
        </div>
      </div>
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
