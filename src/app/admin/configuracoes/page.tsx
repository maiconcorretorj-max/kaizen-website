'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, Save, ShieldCheck, Trash2, Upload, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import createClient from '@/lib/supabase/client'

interface AccountForm {
  email: string
  fullName: string
  username: string
  avatarUrl: string
}

export default function AdminAccountSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [account, setAccount] = useState<AccountForm>({ email: '', fullName: '', username: '', avatarUrl: '' })
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

  const uploadAvatar = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem válida.', variant: 'destructive' })
      return
    }

    setUploadingAvatar(true)
    try {
      const supabase = createClient() as any
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `profiles/avatar/${userId || 'user'}-${Date.now()}.${ext}`

      const { error } = await supabase.storage.from('blog-media').upload(path, file, { upsert: true })
      if (error) {
        toast({ title: 'Erro no upload da foto', description: error.message, variant: 'destructive' })
        return
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('blog-media').getPublicUrl(path)

      setAccount((prev) => ({ ...prev, avatarUrl: publicUrl }))
      toast({ title: 'Foto atualizada' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  useEffect(() => {
    const load = async () => {
      const supabase = createClient() as any
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        toast({ title: 'Erro ao carregar conta', description: authError?.message ?? 'Faça login novamente.', variant: 'destructive' })
        setLoading(false)
        return
      }

      const user = authData.user
      setUserId(user.id)

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>
      const metadataUsername = typeof metadata.username === 'string' ? metadata.username : ''
      const metadataAvatar = typeof metadata.avatar_url === 'string' ? metadata.avatar_url : ''

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      const fullName = typeof profile?.full_name === 'string' ? profile.full_name : ''
      const avatarUrl = typeof profile?.avatar_url === 'string' && profile.avatar_url.trim().length > 0
        ? profile.avatar_url
        : metadataAvatar

      setAccount({
        email: user.email ?? '',
        fullName,
        username: metadataUsername || fullName,
        avatarUrl,
      })

      setLoading(false)
    }

    load()
  }, [toast])

  const saveProfile = async () => {
    if (!userId) return
    setSavingProfile(true)
    const supabase = createClient() as any

    const { error: authError } = await supabase.auth.updateUser({
      email: account.email,
      data: {
        full_name: account.fullName,
        username: account.username,
        avatar_url: account.avatarUrl,
      },
    })

    if (authError) {
      toast({ title: 'Erro ao atualizar conta', description: authError.message, variant: 'destructive' })
      setSavingProfile(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: account.email,
        full_name: account.fullName,
        avatar_url: account.avatarUrl || null,
      })
      .eq('id', userId)

    if (profileError) {
      toast({
        title: 'Dados principais salvos',
        description: 'Seu login foi atualizado. O cadastro interno de perfil não foi alterado por restrição de permissão.',
      })
      setSavingProfile(false)
      return
    }

    toast({
      title: 'Conta atualizada',
      description: 'Se alterou o e-mail, confirme na caixa de entrada para concluir.',
    })
    setSavingProfile(false)
  }

  const savePassword = async () => {
    if (password.length < 6) {
      toast({ title: 'Senha curta', description: 'Use pelo menos 6 caracteres.', variant: 'destructive' })
      return
    }
    if (password !== passwordConfirm) {
      toast({ title: 'Senhas diferentes', description: 'Confirme a mesma senha nos dois campos.', variant: 'destructive' })
      return
    }

    setSavingPassword(true)
    const supabase = createClient() as any
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast({ title: 'Erro ao atualizar senha', description: error.message, variant: 'destructive' })
      setSavingPassword(false)
      return
    }

    setPassword('')
    setPasswordConfirm('')
    toast({ title: 'Senha atualizada com sucesso' })
    setSavingPassword(false)
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando configurações da conta...</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2A66]">Minha Conta</h1>
          <p className="text-gray-500 text-sm mt-1">Atualize foto, nome de usuário, e-mail e senha de acesso.</p>
        </div>
        <Button onClick={saveProfile} disabled={savingProfile}>
          <Save className="h-4 w-4 mr-2" />
          {savingProfile ? 'Salvando...' : 'Salvar dados'}
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66]">Perfil</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 md:col-span-2">
            <Label>Foto de perfil</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="h-10 w-10 text-gray-400" />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) await uploadAvatar(file)
                      e.target.value = ''
                    }}
                  />
                  <span className="inline-flex items-center rounded-md bg-[#0A2A66] px-3 py-2 text-sm font-medium text-white hover:bg-[#1E4ED8] cursor-pointer">
                    {uploadingAvatar ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Enviar foto
                  </span>
                </label>
                {account.avatarUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAccount((prev) => ({ ...prev, avatarUrl: '' }))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />Remover
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input value={account.fullName} onChange={(e) => setAccount((prev) => ({ ...prev, fullName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Nome de usuário</Label>
            <Input value={account.username} onChange={(e) => setAccount((prev) => ({ ...prev, username: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>E-mail de login</Label>
            <Input type="email" value={account.email} onChange={(e) => setAccount((prev) => ({ ...prev, email: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-[#0A2A66] inline-flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" /> Segurança
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nova senha</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-2">
            <Label>Confirmar nova senha</Label>
            <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Repita a senha" />
          </div>
        </div>
        <Button onClick={savePassword} disabled={savingPassword} variant="outline">
          {savingPassword ? 'Atualizando senha...' : 'Atualizar senha'}
        </Button>
      </div>
    </div>
  )
}
