'use client'

import React, { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

export default function ContactFormClient() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await (supabase as any).from('contact_messages').insert([{
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        subject: form.subject || null,
        message: form.message,
      }])

      if (error) {
        toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' })
      } else {
        toast({ title: 'Mensagem enviada!', description: 'Entraremos em contato em breve. Obrigado!' })
        setForm({ name: '', email: '', phone: '', subject: '', message: '' })
      }
    } catch {
      toast({ title: 'Erro', description: 'Tente novamente.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-[#0A2A66] mb-6">Envie uma mensagem</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" name="name" placeholder="Seu nome" value={form.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" value={form.email} onChange={handleChange} required />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" placeholder="(21) 99999-9999" value={form.phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" name="subject" placeholder="Como podemos ajudá-lo?" value={form.subject} onChange={handleChange} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message">Mensagem *</Label>
          <Textarea id="message" name="message" placeholder="Descreva o que procura..." rows={5} value={form.message} onChange={handleChange} required />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Mensagem
            </span>
          )}
        </Button>
      </form>
    </div>
  )
}
