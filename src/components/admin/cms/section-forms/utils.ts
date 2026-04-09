import type { TeamMember, TextItem } from './types'

export function getString(value: Record<string, unknown>, keys: string[], fallback = '') {
  for (const key of keys) {
    const current = value[key]
    if (typeof current === 'string') return current
  }
  return fallback
}

export function getNumber(value: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const current = value[key]
    if (typeof current === 'number') return current
    if (typeof current === 'string' && current.trim() !== '' && !Number.isNaN(Number(current))) {
      return Number(current)
    }
  }
  return fallback
}

export function getBoolean(value: Record<string, unknown>, keys: string[], fallback = false) {
  for (const key of keys) {
    const current = value[key]
    if (typeof current === 'boolean') return current
    if (typeof current === 'string') {
      if (current === 'true') return true
      if (current === 'false') return false
    }
  }
  return fallback
}

export function getArrayItems(value: Record<string, unknown>): TextItem[] {
  const raw = value.items
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>
        return {
          title: typeof row.title === 'string' ? row.title : '',
          description: typeof row.description === 'string' ? row.description : '',
        }
      })
  }

  const cards = [1, 2, 3].map((index) => ({
    title: getString(value, [`card_${index}_title`]),
    description: getString(value, [`card_${index}_desc`]),
  }))
  return cards.some((item) => item.title || item.description) ? cards : []
}

export function getTeamMembers(value: Record<string, unknown>): TeamMember[] {
  const raw = value.members
  if (Array.isArray(raw)) {
    return raw
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>
        return {
          name: typeof row.name === 'string' ? row.name : '',
          role: typeof row.role === 'string' ? row.role : '',
          creci: typeof row.creci === 'string' ? row.creci : '',
          image: typeof row.image === 'string' ? row.image : '',
          bio: typeof row.bio === 'string' ? row.bio : '',
        }
      })
  }

  const legacy = [1, 2, 3].map((index) => ({
    name: getString(value, [`member_${index}_name`]),
    role: getString(value, [`member_${index}_role`]),
    creci: getString(value, [`member_${index}_creci`]),
    image: getString(value, [`member_${index}_image`]),
    bio: '',
  }))
  return legacy.some((item) => item.name || item.role || item.creci || item.image) ? legacy : []
}
