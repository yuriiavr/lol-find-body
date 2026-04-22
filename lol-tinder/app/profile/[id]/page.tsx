'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Trophy, Star, Languages, User, Sword, Check, MessageSquare, Send } from 'lucide-react'
import Link from 'next/link'
import { sendMatchRequest, upsertReview, getReviewsForUser } from '@/app/matches/actions'
import { useToast } from '@/src/components/ToastProvider'

export default function PublicProfilePage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSent, setRequestStatus] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Поля для нового відгуку
  const [reviewComment, setReviewComment] = useState('')
  const [behaviorRating, setBehaviorRating] = useState(5)
  const [skillRating, setSkillRating] = useState(5)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const { showToast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()
      
      if (!error && data) {
        setProfile(data)
        
        // Отримуємо відгуки
        const { data: revs } = await getReviewsForUser(id)
        if (revs) {
          setReviews(revs)
          // Якщо юзер вже лишав відгук, заповнюємо форму
          const myReview = revs.find((r: any) => r.reviewer_id === authUser?.id)
          if (myReview) {
            setReviewComment(myReview.comment || '')
            setBehaviorRating(myReview.behavior_rating)
            setSkillRating(myReview.skill_rating)
          }
        }

        // Перевіряємо статус метчу
        if (authUser) {
          const { data: match } = await supabase
            .from('matches')
            .select('status')
            .or(`and(user_id.eq.${authUser.id},target_id.eq.${id}),and(user_id.eq.${id},target_id.eq.${authUser.id})`)
            .single()
          
          if (match?.status === 'ACCEPTED') {
            setIsMatched(true)
          } else if (match?.status === 'PENDING') {
            setRequestStatus(true)
          }
        }
      }
      setIsLoading(false)
    }
    fetchProfile()
  }, [id, supabase])

  const handleMatch = async () => {
    setIsRequesting(true)
    const result = await sendMatchRequest(id)
    setIsRequesting(false)
    
    if (result.success) {
      setRequestStatus(true)
      showToast('Team request sent successfully!', 'success')
    } else {
      showToast(result.error || 'Failed to send request', 'error')
    }
  }

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true)
    const result = await upsertReview(id, reviewComment, behaviorRating, skillRating)
    setIsSubmittingReview(false)

    if (result.success) {
      showToast('Review saved!', 'success')
      const { data: revs } = await getReviewsForUser(id)
      if (revs) setReviews(revs)
    } else {
      showToast(result.error || 'Error saving review', 'error')
    }
  }

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
            <div className="space-y-8">
              <div className="modern-panel p-8 bg-slate-900/20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 border-b border-white/5 pb-4">Summoner Intel</h3>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Biography & Playstyle</p>
                  <p className="text-2xl text-slate-200 leading-relaxed italic font-medium">
                    "{profile.bio || "This summoner prefers to keep a low profile."}"
                  </p>
                </div>

                {!isMatched && (
                  <div className="pt-10">
                     <button 
                      onClick={handleMatch}
                      disabled={isRequesting || requestSent}
                      className={`btn-modern px-12 py-5 text-base transition-all ${requestSent ? 'opacity-50 border-emerald-500 text-emerald-400' : ''}`}
                     >
                        {isRequesting ? <Loader2 className="animate-spin" /> : 
                         requestSent ? <span className="flex items-center gap-2"><Check size={20} /> Request Sent</span> : 
                         "Send Team Request"}
                     </button>
                  </div>
                )}
              </div>

              {/* Review Section */}
              <div className="modern-panel p-8 bg-zinc-950/40">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Player Reviews</h3>
                  <div className="flex gap-4">
                     <div className="text-right">
                        <span className="text-[10px] block text-zinc-600 font-bold uppercase">Avg. Behavior</span>
                        <div className="flex text-orange-400 gap-0.5 mt-1">
                           {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.round(reviews.reduce((acc, r) => acc + r.behavior_rating, 0) / reviews.length || 0) ? "currentColor" : "none"} />)}
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] block text-zinc-600 font-bold uppercase">Avg. Skill</span>
                        <div className="flex text-orange-400 gap-0.5 mt-1">
                           {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < Math.round(reviews.reduce((acc, r) => acc + r.skill_rating, 0) / reviews.length || 0) ? "currentColor" : "none"} />)}
                        </div>
                     </div>
                  </div>
                </div>

                {isMatched && (
                  <div className="mb-12 p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-6">Leave your feedback</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <RatingInput label="Communication & Attitude" value={behaviorRating} onChange={setBehaviorRating} />
                      <RatingInput label="Mechanical Skill" value={skillRating} onChange={setSkillRating} />
                    </div>
                    <div className="relative">
                      <textarea 
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="How was your experience playing together?"
                        className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-sm text-slate-200 outline-none focus:border-orange-500/50 h-24 resize-none mb-4"
                      />
                      <button 
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview}
                        className="btn-modern py-3 px-8 text-xs ml-auto flex items-center gap-2"
                      >
                        {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        Save Review
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div key={rev.id} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <img src={rev.reviewer.avatar_url} className="w-8 h-8 rounded-lg border border-white/10" alt="" />
                            <span className="text-sm font-bold text-zinc-300">{rev.reviewer.game_name}</span>
                          </div>
                          <div className="flex gap-4">
                            <RatingDisplay label="Attitude" score={rev.behavior_rating} />
                            <RatingDisplay label="Skill" score={rev.skill_rating} />
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 italic">"{rev.comment || "No comment left."}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-20">
                      <MessageSquare size={48} className="mx-auto mb-4" />
                      <p className="text-sm font-bold uppercase tracking-tighter">No reviews yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function RatingInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{label}</span>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => onChange(star)} className={`transition-all ${star <= value ? 'text-orange-400' : 'text-zinc-800'}`}>
            <Star size={18} fill={star <= value ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  )
}

function RatingDisplay({ label, score }: { label: string, score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-zinc-600 uppercase">{label}</span>
      <div className="flex text-orange-400/80">
        {[...Array(5)].map((_, i) => <Star key={i} size={8} fill={i < score ? "currentColor" : "none"} />)}
      </div>
    </div>
  )
}