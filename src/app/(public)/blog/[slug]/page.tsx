import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import createServerClient from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import ShareButton from './ShareButton'

interface Props { params: { slug: string } }

interface Post {
  id: string; title: string; slug: string; excerpt: string | null
  content: string; cover_image: string | null; video_url: string | null
  created_at: string; published: boolean
}
interface PostImage { id: string; image_url: string; caption: string | null; order: number }

async function getPost(slug: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any
  const { data: post } = await supabase
    .from('posts').select('*').eq('slug', slug).eq('published', true).single()
  if (!post) return null
  const { data: images } = await supabase
    .from('post_images').select('*').eq('post_id', (post as Post).id).order('order', { ascending: true })
  return { post: post as Post, images: (images ?? []) as PostImage[] }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServerClient() as any
  const { data } = await supabase.from('posts').select('title, excerpt, cover_image').eq('slug', params.slug).single()
  if (!data) return { title: 'Post não encontrado' }
  return {
    title: data.title,
    description: data.excerpt ?? undefined,
    openGraph: { images: data.cover_image ? [data.cover_image] : [] },
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.split(' ').length / 200))
}

export default async function PostPage({ params }: Props) {
  const data = await getPost(params.slug)
  if (!data) notFound()
  const { post, images } = data

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      {/* Back */}
      <div className="container mx-auto px-4 max-w-4xl pt-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#1E4ED8] text-sm transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar para o Blog
        </Link>
      </div>

      {/* Cover image */}
      {post.cover_image && (
        <div className="relative h-64 md:h-[480px] w-full mb-0">
          <Image src={post.cover_image} alt={post.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-4 max-w-4xl py-10">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8">
          <div className="flex items-center gap-4 text-gray-400 text-sm mb-5">
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(post.created_at)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{readingTime(post.content)} min de leitura</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#0A2A66] leading-tight mb-4">{post.title}</h1>

          {post.excerpt && (
            <p className="text-gray-500 text-lg leading-relaxed border-l-4 border-[#1E4ED8] pl-4 italic">{post.excerpt}</p>
          )}
        </div>

        {/* Video */}
        {post.video_url && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-md aspect-video bg-black">
            {post.video_url.includes('youtube') || post.video_url.includes('youtu.be') ? (
              <iframe
                src={post.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                className="w-full h-full"
                allowFullScreen
                title={post.title}
              />
            ) : post.video_url.includes('vimeo') ? (
              <iframe src={post.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')} className="w-full h-full" allowFullScreen title={post.title} />
            ) : (
              <video controls className="w-full h-full" src={post.video_url}>
                Seu navegador não suporta vídeo.
              </video>
            )}
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 mb-8">
          <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
            {post.content}
          </div>
        </div>

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#0A2A66] mb-4">Galeria de Imagens</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((img) => (
                <div key={img.id} className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="relative h-56">
                    <Image src={img.image_url} alt={img.caption ?? post.title} fill className="object-cover" />
                  </div>
                  {img.caption && (
                    <p className="text-xs text-gray-500 text-center py-2 px-3 bg-white">{img.caption}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between py-6 border-t border-gray-200">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#1E4ED8] font-medium hover:gap-3 transition-all">
            <ArrowLeft className="h-4 w-4" /> Ver todos os posts
          </Link>
          <ShareButton title={post.title} />
        </div>
      </article>
    </div>
  )
}
