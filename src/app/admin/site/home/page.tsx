import PageSectionsEditor from '@/components/admin/cms/PageSectionsEditor'

export default function AdminSiteHomePage() {
  return (
    <PageSectionsEditor
      pageSlug="home"
      title="Site > Home"
      description="Gerencie as seções da Home usando a nova estrutura CMS (cms_pages/page_sections)."
    />
  )
}
