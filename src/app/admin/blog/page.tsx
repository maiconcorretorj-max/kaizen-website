'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  created_at: string
}

export default function AdminBlogPage() {
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await import('@/lib/supabase/client')).default() as any
    const { data } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, published, created_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const togglePublished = async (post: Post) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await import('@/lib/supabase/client')).default() as any
    const { data, error } = await supabase
      .from('posts')
      .update({ published: !post.published })
      .eq('id', post.id)
      .select('id')
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhuma alteração aplicada',
          description: 'Verifique permissões de admin (RLS) para posts.',
          variant: 'destructive',
        })
        return
      }
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, published: !p.published } : p))
      toast({ title: post.published ? 'Post despublicado' : 'Post publicado' })
    }
  }

  const handleDelete = async (post: Post) => {
    if (!confirm(`Excluir "${post.title}"? Esta ação não pode ser desfeita.`)) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await import('@/lib/supabase/client')).default() as any
    const { data, error } = await supabase.from('posts').delete().eq('id', post.id).select('id')
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      if (!data || data.length === 0) {
        toast({
          title: 'Nenhum post excluído',
          description: 'Verifique permissões de admin (RLS) para posts.',
          variant: 'destructive',
        })
        return
      }
      setPosts((prev) => prev.filter((p) => p.id !== post.id))
      toast({ title: 'Post excluído' })
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Blog</h1>
          <p className="text-gray-500 text-sm">Gerencie as postagens do blog</p>
        </div>
        <Link href="/admin/blog/novo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Postagem
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Carregando...</div>
        ) : posts.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <p className="text-lg mb-2">Nenhum post criado ainda.</p>
            <p className="text-sm">
              <Link href="/admin/blog/novo" className="text-[#1E4ED8] hover:underline">
                Criar primeira postagem
              </Link>
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-6 py-3 font-medium">Título</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">Data</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#0A2A66] line-clamp-1">{post.title}</p>
                    {post.excerpt && (
                      <p className="text-gray-400 text-xs line-clamp-1 mt-0.5">{post.excerpt}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell whitespace-nowrap">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {post.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => togglePublished(post)}
                        title={post.published ? 'Despublicar' : 'Publicar'}
                        className="p-1.5 text-gray-400 hover:text-[#1E4ED8] transition-colors"
                      >
                        {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link href={`/admin/blog/${post.id}/editar`}>
                        <button className="p-1.5 text-gray-400 hover:text-[#1E4ED8] transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
