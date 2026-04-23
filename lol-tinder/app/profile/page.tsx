'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { updateProfile } from './actions'
import { useRouter } from 'next/navigation' // Keep this for redirection
import { ArrowLeft, Save, Loader2, LogOut, Sword, Globe, User as UserIcon, Tag, Trophy, Settings, Star, Languages, LayoutGrid, Mic, MicOff, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/src/components/ToastProvider'

const POPULAR_LANGUAGES = [
  "Ukrainian", "English", "Polish", "German", "French", 
  "Spanish", "Italian", "Romanian", "Dutch", "Hungarian", "Czech"
];

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false) // Keep this for button loading state
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)

  // Стан для обраних мов (розбиваємо рядок з бази назад у масив)
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])

  const toggleLang = (lang: string) => {
    setSelectedLangs(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }
  const { showToast } = useToast()

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return router.push('/')
      
      const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
      setProfile(data)
      setUser(authUser)
      if (data?.language) setSelectedLangs(data.language.split(','))
    }
    getProfile()
  }, [supabase, router])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    // Додаємо обрані мови у FormData перед відправкою
    selectedLangs.forEach(lang => formData.append('languages', lang))
    
    const result = await updateProfile(formData)

    if (result?.error) {
      showToast(result.error, 'error')
      setLoading(false)
    } else {
      // Миттєво оновлюємо локальний стан профілю
      const updatedProfile = {
        ...profile,
        game_name: formData.get('gameName'),
        tag_line: formData.get('tagLine'),
        region: formData.get('region'),
        main_role: formData.get('role'),
        preferred_queue: formData.get('preferredQueue'),
        has_mic: formData.get('hasMic') === 'on',
        is_paused: formData.get('isPaused') === 'on',
        language: selectedLangs.join(','),
        bio: formData.get('bio'),
      }
      setProfile(updatedProfile)
      showToast('Profile updated successfully!', 'success')
      setLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 flex flex-col">
      {/* Compact Navbar */}
      <nav className="w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-lg px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/league" className="hover:text-orange-400 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
            <ArrowLeft size={18} /> Back
          </Link>
          <div className="h-6 w-[1px] bg-slate-700" />
          <h2 className="text-sm font-black uppercase tracking-[0.3em] bg-gradient-to-r from-orange-500 to-zinc-600 bg-clip-text text-transparent">Control Center</h2>
        </div>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-red-500 transition-all uppercase">
          <LogOut size={16} /> Logout
        </button>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 lg:p-16">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Profile Preview (Left) */}
          <section className="w-full lg:w-96 flex flex-col items-center lg:items-start">
            <div className="relative mb-10 group">
              <div className="w-56 h-56 rounded-[2.5rem] bg-gradient-to-tr from-orange-600 to-amber-500 p-1 shadow-2xl shadow-orange-500/20 group-hover:rotate-3 transition-transform duration-500">
                <div className="w-full h-full rounded-[2.3rem] bg-zinc-950 overflow-hidden">
                  <img src={user?.user_metadata?.avatar_url} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" alt="Avatar" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-xl">
                <Trophy size={24} className="text-orange-400" />
              </div>
              {profile.has_mic === false && (
                <div className="absolute -top-2 -left-2 bg-red-500/20 p-2 rounded-full border border-red-500/50 backdrop-blur-md text-red-500 shadow-lg"><MicOff size={16} /></div>
              )}
            </div>

            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                {profile.game_name || 'Summoner'}
                <span className="text-slate-600 block text-2xl mt-1">#{profile.tag_line || 'UA1'}</span>
              </h1>
              {selectedLangs.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 justify-center lg:justify-start">
                  {selectedLangs.map(lang => (
                    <span key={lang} className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-slate-400 border border-white/5 flex items-center gap-1">
                      <Languages size={10} className="text-orange-400" /> {lang}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10 w-full space-y-4">
              <div className={`modern-panel p-5 ${profile.preferred_queue === 'FLEX' ? 'bg-orange-500/5 opacity-60' : 'bg-orange-500/10 border-orange-500/40'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-slate-500">Solo Queue</span>
                  <Star size={12} className="text-orange-400" />
                </div>
                <p className="text-2xl font-bold text-white uppercase italic">{profile.solo_rank || 'Unranked'}</p>
              </div>
              <div className={`modern-panel p-5 ${profile.preferred_queue === 'SOLO' ? 'bg-orange-500/5 opacity-60' : 'bg-orange-500/10 border-orange-500/40'}`}>
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-1">Flex Queue</span>
                <p className="text-xl font-bold text-slate-300 uppercase italic">{profile.flex_rank || 'Unranked'}</p>
              </div>
            </div>
          </section>

          {/* Configuration Form (Right) */}
          <section className="flex-1">
            <div className="flex items-center gap-3 mb-10">
              <Settings size={24} className="text-orange-400" />
              <h3 className="text-2xl font-black uppercase tracking-widest">General Configuration</h3>
            </div>

            <form action={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <UserIcon size={14} /> Game Name
                  </label>
                  <input name="gameName" defaultValue={profile.game_name || ''} placeholder="e.g. Faker" required className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Tag size={14} /> Tagline
                  </label>
                  <input name="tagLine" defaultValue={profile.tag_line || ''} placeholder="e.g. EUW" required className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600" />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Globe size={14} /> Region
                  </label>
                  <select name="region" defaultValue={profile.region || 'EUNE'} className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all appearance-none cursor-pointer">
                    <option value="EUNE">Europe Nordic & East</option>
                    <option value="EUW">Europe West</option>
                    <option value="NA">North America</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Sword size={14} /> Primary Position
                  </label>
                  <select name="role" defaultValue={profile.main_role || 'FILL'} className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all appearance-none cursor-pointer">
                    <option value="TOP">TOP</option>
                    <option value="JUNGLE">JUNGLE</option>
                    <option value="MID">MID</option>
                    <option value="ADC">ADC</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="FILL">FILL</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <LayoutGrid size={14} /> Preferred Queue
                  </label>
                  <select name="preferredQueue" defaultValue={profile.preferred_queue || 'SOLO'} className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all appearance-none cursor-pointer">
                    <option value="SOLO">SOLO / DUO</option>
                    <option value="FLEX">FLEX QUEUE</option>
                  </select>
                </div>
                <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                      <Mic size={14} /> Voice Comms
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        name="hasMic" 
                        defaultChecked={profile.has_mic !== false} 
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 rtl:peer-checked:after:-translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-orange-600 peer-checked:after:bg-white border border-white/5 group-hover:border-white/10"></div>
                      <span className="ms-3 text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        I have a microphone
                      </span>
                    </label>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                      <EyeOff size={14} /> Discovery Status
                    </label>
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        name="isPaused" 
                        defaultChecked={profile.is_paused === true} 
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 rtl:peer-checked:after:-translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:start-[4px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white border border-white/5 group-hover:border-white/10"></div>
                      <span className="ms-3 text-sm font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        Pause showing my card
                      </span>
                    </label>
                  </div>
                  <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Languages size={14} /> Languages you speak
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLang(lang)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                          selectedLangs.includes(lang) 
                            ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                            : 'bg-slate-800/40 border-white/5 text-slate-500 hover:border-white/10'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Player Biography</label>
                <textarea name="bio" defaultValue={profile.bio || ''} placeholder="Looking for competitive duo..." className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-slate-200 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all placeholder:text-zinc-600 h-32 resize-none" />
              </div>

              <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                <button disabled={loading} type="submit" className="btn-modern w-full md:w-auto px-12 py-4">
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Apply Changes
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}