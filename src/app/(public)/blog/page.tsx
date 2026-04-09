import Link from 'next/link'
import Image from 'next/image'
import createServerClient from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Calendar, Clock, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog | Kaizen Soluções Imobiliárias',
  description: 'Notícias, dicas e novidades do mercado imobiliário da Zona Oeste do Rio de Janeiro.',
}

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  created_at: string
}

async function getPosts(): Promise<Post[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createServerClient() as any
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, cover_image, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
    return (data ?? []) as Post[]
  } catch {
    return []
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function readingTime(excerpt?: string | null) {
  const words = (excerpt ?? '').split(' ').length
  return Math.max(1, Math.ceil(words / 200))
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <span className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3 block">Kaizen Blog</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Notícias & Dicas</h1>
          <p className="text-blue-100 text-lg">Tudo sobre o mercado imobiliário da Zona Oeste</p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-16">
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Nenhuma postagem publicada ainda.</p>
            <p className="text-sm mt-1">Volte em breve!</p>
          </div>
        ) : (
          <>
            {/* Featured post */}
            <div className="mb-12">
              <Link href={`/blog/${posts[0].slug}`} className="group block">
                <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 md:grid md:grid-cols-2">
                  <div className="relative h-64 md:h-full min-h-[300px] bg-gray-100">
                    {posts[0].cover_image ? (
                      <Image
                        src={posts[0].cover_image}
                        alt={posts[0].title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#0A2A66] to-[#1E4ED8] flex items-center justify-center">
                        <span className="text-white/30 text-6xl font-bold">K</span>
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-[#1E4ED8] text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Destaque
                    </span>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(posts[0].created_at)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readingTime(posts[0].excerpt)} min de leitura</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#0A2A66] mb-3 group-hover:text-[#1E4ED8] transition-colors">
                      {posts[0].title}
                    </h2>
                    {posts[0].excerpt && (
                      <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">{posts[0].excerpt}</p>
                    )}
                    <span className="inline-flex items-center gap-2 text-[#1E4ED8] font-semibold text-sm group-hover:gap-3 transition-all">
                      Ler artigo <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Other posts grid */}
            {posts.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(1).map((post) => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="relative h-48 bg-gray-100">
                        {post.cover_image ? (
                          <Image
                            src={post.cover_image}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#0A2A66]/80 to-[#1E4ED8]/80 flex items-center justify-center">
                            <span className="text-white/30 text-4xl font-bold">K</span>
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-3 text-gray-400 text-xs mb-3">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(post.created_at)}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime(post.excerpt)} min</span>
                        </div>
                        <h3 className="font-bold text-[#0A2A66] mb-2 group-hover:text-[#1E4ED8] transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>
                        )}
                        <span className="mt-4 inline-flex items-center gap-1 text-[#1E4ED8] text-sm font-medium group-hover:gap-2 transition-all">
                          Ler mais <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
