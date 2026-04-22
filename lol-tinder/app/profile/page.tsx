'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, LogOut, Shield, Sword, Globe, User as UserIcon, Tag, Trophy } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/')
      
      const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setProfile(data)
      setUser(authUser)
    }
    getProfile()
  }, [supabase, router])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setMessage('')
    const result = await updateProfile(formData)
    setLoading(false)

    if (result?.error) {
      setMessage(result.error)
    } else {
      setMessage('Профіль успішно оновлено!')
      router.refresh()
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profile) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 text-white p-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 mb-8 hover:text-blue-400 transition-colors group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1" /> Назад до пошуку
        </Link>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Декоративний елемент */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -z-10" />
          
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <img 
                src={user?.user_metadata?.avatar_url} 
                className="w-24 h-24 rounded-full border-4 border-blue-500/50 shadow-lg shadow-blue-500/20" 
                alt="Avatar" 
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-600 rounded-full p-2 border-4 border-slate-900">
                <Trophy size={16} />
              </div>
            </div>
            <h1 className="text-2xl font-bold">{profile.game_name || user?.user_metadata?.full_name || 'Твій Профіль'}</h1>
            <div className="flex flex-col items-center gap-1 mt-2">
              <p className="text-blue-400 text-xs font-black tracking-widest uppercase">Solo: {profile.solo_rank || 'Unranked'}</p>
              <p className="text-slate-400 text-[10px] font-bold tracking-widest uppercase">Flex: {profile.flex_rank || 'Unranked'}</p>
            </div>
          </div>

          <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Riot ID</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 relative group">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500" size={18} />
                  <input name="gameName" defaultValue={profile.game_name || ''} placeholder="Name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="relative group">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500" size={18} />
                  <input name="tagLine" defaultValue={profile.tag_line || ''} placeholder="UA1" required className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Globe size={14} /> Регіон</label>
                <select name="region" defaultValue={profile.region || 'EUNE'} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                  <option value="EUNE">EUNE</option>
                  <option value="EUW">EUW</option>
                  <option value="NA">NA</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2"><Sword size={14} /> Роль</label>
                <select name="role" defaultValue={profile.main_role || 'FILL'} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                  <option value="TOP">Top</option>
                  <option value="JUNGLE">Jungle</option>
                  <option value="MID">Mid</option>
                  <option value="ADC">ADC</option>
                  <option value="SUPPORT">Support</option>
                  <option value="FILL">Fill</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Про себе</label>
              <textarea name="bio" defaultValue={profile.bio || ''} placeholder="Твій стиль гри..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 h-28 focus:border-blue-500 outline-none resize-none transition-all" />
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('успішно') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                {message}
              </div>
            )}

            <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20 group">
              {loading ? <Loader2 className="animate-spin" /> : <Save size={20} className="group-hover:scale-110" />}
              Зберегти зміни
            </button>
          </form>
        </div>

        <button onClick={handleSignOut} className="w-full mt-8 flex items-center justify-center gap-2 text-slate-500 hover:text-red-500 transition-colors text-sm font-medium">
          <LogOut size={16} />
          Вийти з акаунту
        </button>
      </div>
    </div>
  )
}