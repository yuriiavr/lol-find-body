'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Trophy, Star, Languages, User, Sword } from 'lucide-react'
import Link from 'next/link'

export default function PublicProfilePage() {
  const params = useParams()
  const id = params.id
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) {
        setProfile(data)
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [id, supabase])

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-orange-500 w-12 h-12" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-zinc-700 bg-clip-text text-transparent uppercase tracking-tighter">Player not found</h1>
      <Link href="/" className="text-orange-400 hover:underline flex items-center gap-2 font-bold">
        <ArrowLeft size={18} /> BACK TO RIFT
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 flex flex-col">
      {/* Compact Navbar */}
      <nav className="w-full border-b border-white/5 bg-[#121212]/80 backdrop-blur-lg px-8 py-4 flex items-center sticky top-0 z-50">
        <Link href="/league" className="hover:text-orange-400 transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
          <ArrowLeft size={18} /> Back to Discovery
        </Link>
      </nav>

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 lg:p-16">
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Summary Side (Left) */}
          <section className="w-full lg:w-96 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="relative mb-10 group">
              <div className="w-56 h-56 rounded-[2.5rem] bg-gradient-to-tr from-orange-600 to-amber-500 p-1 shadow-2xl shadow-orange-500/20">
                <div className="w-full h-full rounded-[2.3rem] bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} className="w-full h-full object-cover opacity-90" alt="" />
                  ) : (
                    <User size={120} className="text-slate-800" />
                  )}
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-slate-900 p-4 rounded-2xl border border-white/10 shadow-xl">
                <Trophy size={24} className="text-orange-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                {profile.game_name}
                <span className="text-slate-600 block text-2xl mt-1">#{profile.tag_line}</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 mt-6 justify-center lg:justify-start">
               <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <Sword size={14} /> {profile.main_role}
               </div>
               {profile.language && (
                 <div className="px-4 py-2 bg-white/5 rounded-full border border-white/5 text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                   <Languages size={14} /> {profile.language.replace(/,/g, ', ')}
                 </div>
               )}
            </div>

            <div className="mt-10 w-full space-y-4">
              <div className={`modern-panel p-5 ${profile.preferred_queue === 'FLEX' ? 'bg-orange-500/5 opacity-60' : 'bg-orange-500/10 border-orange-500/40'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Solo Queue</span>
                  <Star size={12} className="text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-white uppercase italic">{profile.solo_rank || 'Unranked'}</p>
              </div>
              <div className={`modern-panel p-5 ${profile.preferred_queue === 'SOLO' ? 'bg-orange-500/5 opacity-60' : 'bg-orange-500/10 border-orange-500/40'}`}>
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-1 tracking-widest">Flex Queue</span>
                <p className="text-2xl font-bold text-slate-300 uppercase italic">{profile.flex_rank || 'Unranked'}</p>
              </div>
            </div>
          </section>

          {/* Content Side (Right) */}
          <section className="flex-1">
            <div className="modern-panel p-8 h-full bg-slate-900/20 min-h-[400px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4">Summoner Intel</h3>
              <div className="space-y-10">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Biography & Playstyle</p>
                  <p className="text-2xl text-slate-200 leading-relaxed italic font-medium">
                    "{profile.bio || "This summoner prefers to keep a low profile."}"
                  </p>
                </div>
                
                <div className="pt-10">
                   <button className="btn-modern px-12 py-5 text-base">
                      Send Team Request
                   </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}