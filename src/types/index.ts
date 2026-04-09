export type PropertyType = 'casa' | 'apartamento' | 'terreno' | 'comercial' | 'cobertura' | 'sala'

export type PropertyStatus = 'venda' | 'aluguel' | 'venda_aluguel'

export type PropertyCondition = 'novo' | 'usado' | 'na_planta'

export interface Property {
  id: string
  title: string
  slug: string
  description: string
  type: PropertyType
  status: PropertyStatus
  condition?: PropertyCondition
  price: number
  rent_price?: number
  area: number
  bedrooms?: number
  bathrooms?: number
  parking_spaces?: number
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code?: string
  latitude?: number
  longitude?: number
  images: string[]
  cover_image_url?: string
  featured: boolean
  active: boolean
  publication_status?: 'draft' | 'published' | 'archived'
  published_at?: string
  seo_title?: string
  seo_description?: string
  features?: string[]
  created_at: string
  updated_at: string
}

export interface NavTab {
  id: string
  label: string
  href: string
  order: number
  menu_location?: 'header' | 'footer'
  visible?: boolean
  target?: '_self' | '_blank'
  parent_id?: string | null
  active: boolean
  created_at: string
  updated_at?: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  cover_image?: string
  published: boolean
  author_id: string
  created_at: string
  updated_at: string
}

export interface ContentBlock {
  id: string
  key: string
  title?: string
  content: string
  type: 'text' | 'html' | 'json'
  page: string
  created_at: string
  updated_at: string
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  property_id?: string
  read: boolean
  status?: 'new' | 'in_progress' | 'won' | 'lost' | 'archived'
  created_at: string
  updated_at?: string
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: 'admin' | 'user'
  created_at: string
}

export interface PropertyFilters {
  type?: PropertyType | ''
  status?: PropertyStatus | ''
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  bedrooms?: number
  neighborhood?: string
  city?: string
  search?: string
}

export interface PropertyCardProps {
  property: Property
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}
