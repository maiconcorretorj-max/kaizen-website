import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SectionFormProps } from './types'
import { getArrayItems, getString } from './utils'

export default function ValuesSectionForm({ value, onChange, onFeedback }: SectionFormProps) {
  const items = getArrayItems(value)

  const setItem = (index: number, field: 'title' | 'description', next: string) => {
    const current = Array.isArray(value.items) ? [...(value.items as Array<Record<string, unknown>>)] : items.map((i) => ({ ...i }))
    const row = current[index] ?? { title: '', description: '' }
    current[index] = { ...row, [field]: next }

    const withLegacy: Record<string, unknown> = { ...value, items: current }
    current.slice(0, 3).forEach((item, i) => {
      withLegacy[`card_${i + 1}_title`] = typeof item.title === 'string' ? item.title : ''
      withLegacy[`card_${i + 1}_desc`] = typeof item.description === 'string' ? item.description : ''
    })

    onChange(withLegacy)
  }

  const addItem = () => {
    const current = Array.isArray(value.items) ? [...(value.items as Array<Record<string, unknown>>)] : items.map((i) => ({ ...i }))
    current.push({ title: '', description: '' })
    onChange({ ...value, items: current })
    onFeedback?.('Item adicionado aos valores')
  }

  const removeItem = (index: number) => {
    const current = Array.isArray(value.items) ? [...(value.items as Array<Record<string, unknown>>)] : items.map((i) => ({ ...i }))
    current.splice(index, 1)
    onChange({ ...value, items: current })
    onFeedback?.('Item removido dos valores')
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const current = Array.isArray(value.items) ? [...(value.items as Array<Record<string, unknown>>)] : items.map((i) => ({ ...i }))
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= current.length) return
    const [moved] = current.splice(index, 1)
    current.splice(target, 0, moved)
    onChange({ ...value, items: current })
    onFeedback?.('Ordem dos valores atualizada')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => onChange({ ...value, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle', 'badge'])} onChange={(e) => onChange({ ...value, subtitle: e.target.value, badge: e.target.value })} /></div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens</Label>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
        {(items.length === 0 ? [{ title: '', description: '' }] : items).map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <Input placeholder="Título" value={item.title} onChange={(e) => setItem(index, 'title', e.target.value)} />
            <Input placeholder="Descrição" value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => moveItem(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4 mr-1" />Subir</Button>
              <Button size="sm" variant="outline" onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1}><ArrowDown className="h-4 w-4 mr-1" />Descer</Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeItem(index)}><Trash2 className="h-4 w-4 mr-1" />Remover</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
