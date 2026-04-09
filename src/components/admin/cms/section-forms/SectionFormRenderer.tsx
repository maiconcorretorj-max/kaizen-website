import type { SectionFormProps } from './types'
import HeroSectionForm from './HeroSectionForm'
import ContactInfoSectionForm from './ContactInfoSectionForm'
import FeaturedPropertiesSectionForm from './FeaturedPropertiesSectionForm'
import DifferentialsSectionForm from './DifferentialsSectionForm'
import CtaSectionForm from './CtaSectionForm'
import StorySectionForm from './StorySectionForm'
import ValuesSectionForm from './ValuesSectionForm'
import TeamSectionForm from './TeamSectionForm'

export const friendlySectionTypes = [
  'hero',
  'contact_info',
  'featured_properties',
  'differentials',
  'cta',
  'story',
  'values',
  'team',
] as const

export function hasFriendlyForm(sectionType: string) {
  return friendlySectionTypes.includes(sectionType as (typeof friendlySectionTypes)[number])
}

export default function SectionFormRenderer({ sectionType, ...props }: SectionFormProps & { sectionType: string }) {
  if (sectionType === 'hero') return <HeroSectionForm {...props} />
  if (sectionType === 'contact_info') return <ContactInfoSectionForm {...props} />
  if (sectionType === 'featured_properties') return <FeaturedPropertiesSectionForm {...props} />
  if (sectionType === 'differentials') return <DifferentialsSectionForm {...props} />
  if (sectionType === 'cta') return <CtaSectionForm {...props} />
  if (sectionType === 'story') return <StorySectionForm {...props} />
  if (sectionType === 'values') return <ValuesSectionForm {...props} />
  if (sectionType === 'team') return <TeamSectionForm {...props} />
  return null
}
