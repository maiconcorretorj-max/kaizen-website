export type CmsPageSlug = 'home' | 'sobre' | 'contato'

export type SectionType =
  | 'hero'
  | 'featured_properties'
  | 'differentials'
  | 'cta'
  | 'story'
  | 'values'
  | 'team'
  | 'contact_info'
  | 'custom'

export interface SectionTypeMeta {
  type: SectionType
  label: string
  description: string
  icon: string
}

export const sectionTypeMetaMap: Record<SectionType, SectionTypeMeta> = {
  hero: {
    type: 'hero',
    label: 'Banner principal',
    description: 'Título principal da seção com mensagem de destaque.',
    icon: '🏷️',
  },
  featured_properties: {
    type: 'featured_properties',
    label: 'Imóveis em destaque',
    description: 'Lista de imóveis com prioridade na página.',
    icon: '⭐',
  },
  differentials: {
    type: 'differentials',
    label: 'Diferenciais',
    description: 'Motivos e pontos fortes da imobiliária.',
    icon: '✨',
  },
  cta: {
    type: 'cta',
    label: 'Chamada para ação',
    description: 'Convite para contato ou próxima ação.',
    icon: '📣',
  },
  story: {
    type: 'story',
    label: 'História da empresa',
    description: 'Bloco para contar a trajetória da marca.',
    icon: '📖',
  },
  values: {
    type: 'values',
    label: 'Valores',
    description: 'Missão, visão e valores em cards.',
    icon: '🎯',
  },
  team: {
    type: 'team',
    label: 'Equipe',
    description: 'Apresentação dos membros da equipe.',
    icon: '👥',
  },
  contact_info: {
    type: 'contact_info',
    label: 'Informações de contato',
    description: 'Telefone, e-mail, endereço e WhatsApp.',
    icon: '☎️',
  },
  custom: {
    type: 'custom',
    label: 'Seção personalizada',
    description: 'Conteúdo livre para casos especiais.',
    icon: '🧩',
  },
}

const typeAliases: Record<string, SectionType> = {
  hero: 'hero',
  featured: 'featured_properties',
  featured_property: 'featured_properties',
  featured_properties: 'featured_properties',
  'featured-properties': 'featured_properties',
  differentials: 'differentials',
  diferencial: 'differentials',
  diferenciais: 'differentials',
  cta: 'cta',
  story: 'story',
  historia: 'story',
  values: 'values',
  valores: 'values',
  team: 'team',
  equipe: 'team',
  contact: 'contact_info',
  contact_info: 'contact_info',
  'contact-info': 'contact_info',
  contato: 'contact_info',
  mapa: 'contact_info',
  map: 'contact_info',
  custom: 'custom',
}

function normalizeToken(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
    .replace(/[^a-z0-9_]/g, '')
}

function inferFromContent(content: Record<string, unknown> | null | undefined): SectionType | null {
  if (!content) return null
  if (Array.isArray(content.members)) return 'team'
  if (Array.isArray(content.items)) {
    const first = content.items[0]
    if (first && typeof first === 'object' && 'description' in (first as Record<string, unknown>)) {
      return 'differentials'
    }
    return 'values'
  }
  if (typeof content.phone === 'string' || typeof content.whatsapp === 'string' || typeof content.map_url === 'string') {
    return 'contact_info'
  }
  return null
}

export function resolveSectionType(
  pageSlug: CmsPageSlug,
  sectionType: string,
  sectionKey: string,
  content: Record<string, unknown> | null
): SectionType {
  const normalizedType = normalizeToken(sectionType)
  if (normalizedType in typeAliases) {
    return typeAliases[normalizedType]
  }

  const normalizedKey = normalizeToken(sectionKey)
  if (normalizedKey in typeAliases) {
    return typeAliases[normalizedKey]
  }

  if (normalizedKey.includes('hero') || normalizedKey.includes('banner')) return 'hero'
  if (normalizedKey.includes('featured') || normalizedKey.includes('destaque')) return 'featured_properties'
  if (normalizedKey.includes('diferencial')) return 'differentials'
  if (normalizedKey.includes('historia') || normalizedKey.includes('story')) return 'story'
  if (normalizedKey.includes('valor')) return 'values'
  if (normalizedKey.includes('equipe') || normalizedKey.includes('team')) return 'team'
  if (normalizedKey.includes('contato') || normalizedKey.includes('contact') || normalizedKey.includes('mapa')) return 'contact_info'
  if (normalizedKey.includes('cta') || normalizedKey.includes('whatsapp')) return 'cta'

  const inferred = inferFromContent(content)
  if (inferred) return inferred

  if (pageSlug === 'contato') return 'contact_info'
  return 'custom'
}

export function getSectionMeta(
  pageSlug: CmsPageSlug,
  sectionType: string,
  sectionKey: string,
  content: Record<string, unknown> | null
) {
  const resolvedType = resolveSectionType(pageSlug, sectionType, sectionKey, content)
  return sectionTypeMetaMap[resolvedType]
}

export function getSectionTemplates(pageSlug: CmsPageSlug) {
  if (pageSlug === 'home') {
    return [
      { type: 'hero', key: 'hero', title: 'Banner principal' },
      { type: 'featured_properties', key: 'featured_properties', title: 'Imóveis em destaque' },
      { type: 'differentials', key: 'differentials', title: 'Diferenciais' },
      { type: 'cta', key: 'cta', title: 'Chamada para ação' },
      { type: 'custom', key: 'custom', title: 'Seção personalizada' },
    ] as const
  }

  if (pageSlug === 'sobre') {
    return [
      { type: 'hero', key: 'hero', title: 'Banner principal' },
      { type: 'story', key: 'story', title: 'História da empresa' },
      { type: 'values', key: 'values', title: 'Valores' },
      { type: 'team', key: 'team', title: 'Equipe' },
      { type: 'cta', key: 'cta', title: 'Chamada para ação' },
      { type: 'custom', key: 'custom', title: 'Seção personalizada' },
    ] as const
  }

  return [
    { type: 'hero', key: 'hero', title: 'Banner principal' },
    { type: 'contact_info', key: 'contact_info', title: 'Informações de contato' },
    { type: 'cta', key: 'cta_whatsapp', title: 'Chamada para WhatsApp' },
    { type: 'custom', key: 'custom', title: 'Seção personalizada' },
  ] as const
}
