import { notFound } from 'next/navigation'
import createServerClient from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'

interface Props {
  params: { slug: string }
}

// Pages that have their own dedicated routes — don't intercept these
const RESERVED_SLUGS = ['sobre', 'imoveis', 'contato', 'login', 'admin', 'blog', 'sitemap.xml']

interface TabRow { label: string }
interface BlockRow { key: string; title: string | null; content: string; type: string }

async function getPageData(slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any

  const { data: tab } = await supabase
    .from('nav_tabs')
    .select('label')
    .eq('href', `/${slug}`)
    .eq('active', true)
    .single()

  if (!tab) return null

  const { data: blocks } = await supabase
    .from('content_blocks')
    .select('key, title, content, type')
    .eq('page', slug)
    .order('created_at', { ascending: true })

  return { tab: tab as TabRow, blocks: (blocks ?? []) as BlockRow[] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPageData(params.slug)
  return {
    title: data?.tab?.label ?? params.slug,
  }
}

export default async function DynamicPage({ params }: Props) {
  if (RESERVED_SLUGS.includes(params.slug)) notFound()

  const data = await getPageData(params.slug)
  if (!data) notFound()

  const { tab, blocks } = data

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">{tab.label}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl py-16">
        {blocks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">Esta página ainda não tem conteúdo.</p>
            <p className="text-sm">
              Acesse{' '}
              <Link href="/admin/conteudo" className="text-[#1E4ED8] hover:underline">
                Admin → Conteúdo
              </Link>{' '}
              para adicionar conteúdo a esta página.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {blocks.map((block) => (
              <div key={block.key}>
                {block.title && (
                  <h2 className="text-2xl font-bold text-[#0A2A66] mb-3">{block.title}</h2>
                )}
                {block.type === 'html' ? (
                  <div
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: block.content }}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{block.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
