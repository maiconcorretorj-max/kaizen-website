import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SectionFormProps } from './types'
import { getArrayItems, getString } from './utils'

export default function DifferentialsSectionForm({ value, onChange, onFeedback }: SectionFormProps) {
  const items = getArrayItems(value)

  const getEditableItems = () => {
    if (Array.isArray(value.items)) {
      return [...(value.items as Array<Record<string, unknown>>)]
    }
    return items.map((item) => ({ icon: '', title: item.title, description: item.description }))
  }

  const setItem = (index: number, field: 'title' | 'description' | 'icon', next: string) => {
    const current = getEditableItems()
    const row = current[index] ?? { title: '', description: '', icon: '' }
    current[index] = { ...row, [field]: next }
    onChange({ ...value, items: current })
  }

  const addItem = () => {
    const current = getEditableItems()
    current.push({ icon: '', title: '', description: '' })
    onChange({ ...value, items: current })
    onFeedback?.('Item adicionado aos diferenciais')
  }

  const removeItem = (index: number) => {
    const current = getEditableItems()
    current.splice(index, 1)
    onChange({ ...value, items: current })
    onFeedback?.('Item removido dos diferenciais')
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const current = getEditableItems()
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= current.length) return
    const [moved] = current.splice(index, 1)
    current.splice(target, 0, moved)
    onChange({ ...value, items: current })
    onFeedback?.('Ordem dos diferenciais atualizada')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => onChange({ ...value, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle'])} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} /></div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Itens</Label>
          <Button size="sm" variant="outline" onClick={addItem}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
        {(items.length === 0 ? [{ title: '', description: '' }] : items).map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input placeholder="Ícone" value={(item as any).icon ?? ''} onChange={(e) => setItem(index, 'icon', e.target.value)} />
              <Input placeholder="Título" value={item.title} onChange={(e) => setItem(index, 'title', e.target.value)} />
            </div>
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
