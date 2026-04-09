import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import AdminImageField from '@/components/admin/media/AdminImageField'
import type { SectionFormProps } from './types'
import { getString, getTeamMembers } from './utils'

export default function TeamSectionForm({ value, onChange, onFeedback }: SectionFormProps) {
  const members = getTeamMembers(value)

  const sanitizeImageUrl = (raw: unknown) => {
    if (typeof raw !== 'string') return ''
    const input = raw.trim()
    if (!input) return ''
    try {
      const url = new URL(input)
      if (url.pathname.includes('/storage/v1/render/image/public/')) {
        url.pathname = url.pathname.replace('/storage/v1/render/image/public/', '/storage/v1/object/public/')
      }
      ;['w', 'width', 'h', 'height', 'q', 'quality', 'fm', 'format'].forEach((param) => {
        url.searchParams.delete(param)
      })
      return url.toString()
    } catch {
      return input
    }
  }

  const applyMembers = (nextMembers: Array<Record<string, unknown>>) => {
    const withLegacy: Record<string, unknown> = { ...value, members: nextMembers }

    for (let i = 0; i < 3; i += 1) {
      const member = nextMembers[i]
      withLegacy[`member_${i + 1}_name`] = typeof member?.name === 'string' ? member.name : ''
      withLegacy[`member_${i + 1}_role`] = typeof member?.role === 'string' ? member.role : ''
      withLegacy[`member_${i + 1}_creci`] = typeof member?.creci === 'string' ? member.creci : ''
      withLegacy[`member_${i + 1}_image`] = sanitizeImageUrl(member?.image)
    }

    onChange(withLegacy)
  }

  const setMember = (index: number, field: 'name' | 'role' | 'creci' | 'image' | 'bio', next: string) => {
    const current = Array.isArray(value.members) ? [...(value.members as Array<Record<string, unknown>>)] : members.map((m) => ({ ...m }))
    const row = current[index] ?? { name: '', role: '', creci: '', image: '', bio: '' }
    const nextValue = field === 'image' ? sanitizeImageUrl(next) : next
    current[index] = { ...row, [field]: nextValue }
    applyMembers(current)
  }

  const addMember = () => {
    const current = Array.isArray(value.members) ? [...(value.members as Array<Record<string, unknown>>)] : members.map((m) => ({ ...m }))
    current.push({ name: '', role: '', creci: '', image: '', bio: '' })
    applyMembers(current)
    onFeedback?.('Membro adicionado à equipe')
  }

  const removeMember = (index: number) => {
    const current = Array.isArray(value.members) ? [...(value.members as Array<Record<string, unknown>>)] : members.map((m) => ({ ...m }))
    current.splice(index, 1)
    applyMembers(current)
    onFeedback?.('Membro removido da equipe')
  }

  const moveMember = (index: number, direction: 'up' | 'down') => {
    const current = Array.isArray(value.members) ? [...(value.members as Array<Record<string, unknown>>)] : members.map((m) => ({ ...m }))
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= current.length) return
    const [moved] = current.splice(index, 1)
    current.splice(target, 0, moved)
    applyMembers(current)
    onFeedback?.('Ordem da equipe atualizada')
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2"><Label>Título</Label><Input value={getString(value, ['title'])} onChange={(e) => onChange({ ...value, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>Subtítulo</Label><Input value={getString(value, ['subtitle'])} onChange={(e) => onChange({ ...value, subtitle: e.target.value })} /></div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Membros</Label>
          <Button size="sm" variant="outline" onClick={addMember}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
        {(members.length === 0 ? [{ name: '', role: '', creci: '', image: '', bio: '' }] : members).map((member, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input placeholder="Nome" value={member.name} onChange={(e) => setMember(index, 'name', e.target.value)} />
              <Input placeholder="Cargo" value={member.role} onChange={(e) => setMember(index, 'role', e.target.value)} />
            </div>
            <Input placeholder="CRECI" value={member.creci} onChange={(e) => setMember(index, 'creci', e.target.value)} />
            <AdminImageField
              label="Imagem"
              value={member.image}
              onChange={(next) => setMember(index, 'image', next)}
              pathPrefix={`cms/team/member-${index + 1}`}
              advanced
            />
            <Textarea placeholder="Bio" rows={3} value={member.bio} onChange={(e) => setMember(index, 'bio', e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => moveMember(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4 mr-1" />Subir</Button>
              <Button size="sm" variant="outline" onClick={() => moveMember(index, 'down')} disabled={index === members.length - 1}><ArrowDown className="h-4 w-4 mr-1" />Descer</Button>
              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => removeMember(index)}><Trash2 className="h-4 w-4 mr-1" />Remover</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
