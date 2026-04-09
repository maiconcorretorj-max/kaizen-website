export interface SectionFormProps {
  value: Record<string, unknown>
  onChange: (next: Record<string, unknown>) => void
  onFeedback?: (message: string) => void
}

export interface TextItem {
  title: string
  description: string
}

export interface TeamMember {
  name: string
  role: string
  creci: string
  image: string
  bio: string
}
