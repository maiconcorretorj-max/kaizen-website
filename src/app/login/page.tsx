'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) {
        const msg =
          error.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error.message === 'Email not confirmed'
            ? 'E-mail não confirmado. Verifique sua caixa de entrada ou desative a confirmação de e-mail no painel Supabase.'
            : error.message === 'Too many requests'
            ? 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
            : error.message
        toast({ title: 'Erro ao entrar', description: msg, variant: 'destructive' })
        return
      }

      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo de volta.',
      })

      const redirectTo = new URLSearchParams(window.location.search).get('redirectTo')
      const destination = redirectTo?.startsWith('/admin') ? redirectTo : '/admin'

      for (let attempt = 0; attempt < 8; attempt += 1) {
        const { data } = await supabase.auth.getSession()
        if (data.session) break
        await new Promise((resolve) => setTimeout(resolve, 150))
      }

      router.replace(destination)
      router.refresh()
      window.location.href = destination
    } catch {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-2xl bg-[#0A2A66] flex items-center justify-center shadow-lg ring-1 ring-[#0A2A66]/15">
                <Image
                  src="/logo-kaizen.png?v=6"
                  alt="Logo Kaizen"
                  width={64}
                  height={64}
                  unoptimized
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="font-bold text-[#0A2A66] text-xl">Kaizen</p>
                <p className="text-gray-500 text-sm">Soluções Imobiliárias</p>
              </div>
            </Link>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#0A2A66] mb-1">Entrar</h1>
            <p className="text-gray-500 text-sm mb-8">
              Acesse o painel administrativo
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={handleChange}
                    className="pl-9"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="pl-9 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Entrar
                  </span>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-gray-500 hover:text-[#1E4ED8] text-sm transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
