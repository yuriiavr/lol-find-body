'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Zap, Users, Globe, ChevronRight, Gamepad } from 'lucide-react'
import { createClient } from '@/src/utils/supabase/client'
import Link from 'next/link'

export default function LandingPage() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }
    checkUser()
  }, [supabase])

  const handleLogin = async () => {
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 overflow-x-hidden">
      {/* Static Glow Background */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-orange-600/[0.02] blur-[150px] rounded-full -z-10" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#121212]/80 backdrop-blur-lg">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-black bg-gradient-to-r from-orange-500 to-zinc-800 bg-clip-text text-transparent tracking-tighter italic hover:opacity-80 transition-opacity cursor-pointer">LoLMatch</h1>
          </Link>
          <div className="flex items-center gap-6">
             <Link href="/league" className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden md:block">
                Browse Discovery
             </Link>
             {!loading && (
               user ? (
                 <Link href="/profile" className="flex items-center gap-3 p-1 pr-4 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-all border border-white/5">
                   <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full border border-orange-500/30" alt="avatar" />
                   <span className="text-sm font-bold">{user.user_metadata.full_name}</span>
                 </Link>
               ) : (
                 <button onClick={handleLogin} className="btn-modern py-2.5 px-8">
                    Get Started
                 </button>
               )
             )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-48 pb-32 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 inline-block">
               Global Duo Finder
            </span>
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase mb-10">
               Stop playing <br/> <span className="bg-gradient-to-r from-orange-500 to-zinc-900 bg-clip-text text-transparent">with randoms.</span>
            </h1>
            <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
               The premier professional platform for finding teammates in League of Legends. <br className="hidden md:block" /> 
               Verify your rank via Riot API and find your perfect Duo partner.
            </p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8">
               {!loading && (
                 user ? (
                   <div className="flex flex-col sm:flex-row gap-6">
                     <Link href="/league">
                       <button className="btn-modern px-10 py-5 text-lg shadow-orange-600/20">
                          <Zap size={20} /> League Discovery
                       </button>
                     </Link>
                     <Link href="/tft">
                       <button className="btn-modern px-10 py-5 text-lg border-blue-500/20 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 shadow-blue-600/20">
                          <Gamepad size={20} /> TFT Discovery
                       </button>
                     </Link>
                   </div>
                 ) : (
                   <button onClick={handleLogin} className="btn-modern px-14 py-6 text-xl scale-110 shadow-orange-600/20">
                      <LogIn size={24} /> Connect via Discord
                   </button>
                 )
               )}
               <Link href="/league" className="group text-lg font-bold flex items-center gap-2 hover:text-orange-400 transition-all">
                  See who's online <ChevronRight className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-[1600px] mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Zap size={28} className="text-orange-400" />}
              title="Real-time Ranks"
              description="Direct integration with Riot Games API. Your Solo and Flex ranks update automatically every time you sync."
            />
            <FeatureCard 
              icon={<Globe size={28} className="text-orange-500" />}
              title="Language Priority"
              description="No more language barriers. Filter players by the languages you actually use in voice chat."
            />
            <FeatureCard 
              icon={<Users size={28} className="text-orange-600" />}
              title="Modern Grid UI"
              description="Forget endless swiping. Use our Discovery Grid to browse dozens of compatible players at a glance."
            />
         </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="modern-panel p-10 bg-slate-900/10 hover:bg-slate-900/30">
       <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5">
          {icon}
       </div>
       <h3 className="text-2xl font-black uppercase tracking-tight mb-4 italic">{title}</h3>
       <p className="text-slate-400 leading-relaxed text-lg">{description}</p>
    </div>
  )
}