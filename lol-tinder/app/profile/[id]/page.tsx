'use client'

import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Trophy, Star, Languages, User, Sword, Check, MessageSquare, Send, ShieldCheck, MicOff, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { sendMatchRequest, upsertReview, getReviewsForUser, getRiotLeagueStats, getTopChampions } from '@/app/matches/actions'
import { useToast } from '@/src/components/ToastProvider'
import { StarRating } from '@/src/components/StarRating'

// Створюємо клієнт один раз поза компонентом
const supabase = createClient()

export default function PublicProfilePage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSent, setRequestStatus] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  const [reviews, setReviews] = useState<any[]>([])
  const [riotStats, setRiotStats] = useState<any>(null)
  const [topChamps, setTopChamps] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // Поля для нового відгуку
  const [reviewComment, setReviewComment] = useState('')
  const [behaviorRating, setBehaviorRating] = useState(5)
  const [skillRating, setSkillRating] = useState(5)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Ref для запобігання подвійним запитам
  const fetchedRef = useRef(false)

  const { showToast } = useToast()

  useEffect(() => {
    const fetchProfile = async () => {
      if (fetchedRef.current) return
      fetchedRef.current = true

      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push('/login-required')
        return
      }

      setCurrentUser(authUser)

      const [profileRes, reviewsRes, matchRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        getReviewsForUser(id),
        supabase.from('matches')
          .select('status')
          .or(`and(user_id.eq.${authUser.id},target_id.eq.${id}),and(user_id.eq.${id},target_id.eq.${authUser.id})`)
          .maybeSingle()
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        
        // Отримуємо живі дані від Riot паралельно
        const [stats, champs] = await Promise.all([
          getRiotLeagueStats(profileRes.data.puuid, profileRes.data.region),
          getTopChampions(profileRes.data.puuid, profileRes.data.region)
        ])
        setRiotStats(stats)
        setTopChamps(champs)
      }

      if (reviewsRes.data) {
        setReviews(reviewsRes.data)
        const myReview = reviewsRes.data.find((r: any) => r.reviewer_id === authUser.id)
        if (myReview) {
          setReviewComment(myReview.comment || '')
          setBehaviorRating(myReview.behavior_rating)
          setSkillRating(myReview.skill_rating)
        }
      }

      if (matchRes.data) {
        if (matchRes.data.status === 'ACCEPTED') {
          setIsMatched(true)
        } else if (matchRes.data.status === 'PENDING') {
          setRequestStatus(true)
        }
      }

      setIsLoading(false)
    }
    fetchProfile()
  }, [id]) // supabase тепер стабільний, id - єдина важлива залежність

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

  // Мемоізуємо обчислення середніх рейтингів, оскільки вони залежать від масиву reviews
  const avgBehavior = useMemo(() => reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.behavior_rating, 0) / reviews.length 
    : 0, [reviews])
  const avgSkill = useMemo(() => reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.skill_rating, 0) / reviews.length 
    : 0, [reviews])
  const totalAvg = useMemo(() => (avgBehavior + avgSkill) / 2, [avgBehavior, avgSkill])

  // Хелпер для пошуку статсів конкретної черги
  // Немає потреби в useCallback, оскільки вона не передається мемоізованим дочірнім компонентам
  const getQueueData = (type: string) => {
    return riotStats?.find((s: any) => s.queueType === type)
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
              {profile.has_mic === false && (
                <div className="absolute -top-4 -left-4 bg-red-500/10 p-3 rounded-full border border-red-500/30 text-red-500 backdrop-blur-sm shadow-xl shadow-red-900/20"><MicOff size={24} /></div>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                {profile.game_name}
                <span className="text-slate-600 block text-2xl mt-1">#{profile.tag_line}</span>
              </h1>
              
              {isMatched && (
                <a 
                  href={`https://discord.com/channels/@me/${profile.discord_id}`} 
                  target="_blank"
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all w-fit mx-auto lg:mx-0 shadow-lg shadow-indigo-500/20"
                >
                  <MessageSquare size={16} /> Chat on Discord
                </a>
              )}

              {totalAvg > 4.5 && reviews.length >= 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full w-fit mx-auto lg:mx-0 mt-4">
                  <ShieldCheck size={14} className="text-orange-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Verified Teammate</span>
                </div>
              )}
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

            {reviews.length > 0 && (
              <div className="mt-10 w-full flex flex-col gap-2">
                <div className="flex items-center justify-between bg-zinc-900/40 px-5 py-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Behavior</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-400 leading-none">{avgBehavior.toFixed(1)}</span>
                    <StarRating rating={avgBehavior} size={12} />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-zinc-900/40 px-5 py-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Skill</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-orange-400 leading-none">{avgSkill.toFixed(1)}</span>
                    <StarRating rating={avgSkill} size={12} />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 w-full space-y-4">
              <div className={`modern-panel p-5 ${profile.preferred_queue?.split(',').includes('Solo/Duo') ? 'bg-orange-500/10 border-orange-500/40' : 'bg-orange-500/5 opacity-60'}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Solo Queue</span>
                  <Star size={12} className="text-orange-400" />
                </div>
                <p className="text-3xl font-bold text-white uppercase italic">
                  {getQueueData('RANKED_SOLO_5x5')?.tier ? `${getQueueData('RANKED_SOLO_5x5').tier} ${getQueueData('RANKED_SOLO_5x5').rank}` : profile.solo_rank || 'Unranked'}
                </p>
                {getQueueData('RANKED_SOLO_5x5') && (
                  <div className="flex gap-2 mt-1 text-[10px] font-bold text-slate-400">
                    <span className="text-emerald-500">
                      {Math.round((getQueueData('RANKED_SOLO_5x5').wins / (getQueueData('RANKED_SOLO_5x5').wins + getQueueData('RANKED_SOLO_5x5').losses)) * 100)}% WR
                    </span>
                    <span className="text-slate-600">({getQueueData('RANKED_SOLO_5x5').wins + getQueueData('RANKED_SOLO_5x5').losses} games)</span>
                  </div>
                )}
              </div>
              <div className={`modern-panel p-5 ${profile.preferred_queue?.split(',').includes('Flex') ? 'bg-orange-500/10 border-orange-500/40' : 'bg-orange-500/5 opacity-60'}`}>
                <span className="text-[10px] font-black uppercase text-slate-500 block mb-1 tracking-widest">Flex Queue</span>
                <p className="text-2xl font-bold text-slate-300 uppercase italic">
                  {getQueueData('RANKED_FLEX_SR')?.tier ? `${getQueueData('RANKED_FLEX_SR').tier} ${getQueueData('RANKED_FLEX_SR').rank}` : profile.flex_rank || 'Unranked'}
                </p>
                {getQueueData('RANKED_FLEX_SR') && (
                  <div className="flex gap-2 mt-1 text-[10px] font-bold text-slate-400">
                    <span className="text-emerald-500">
                      {Math.round((getQueueData('RANKED_FLEX_SR').wins / (getQueueData('RANKED_FLEX_SR').wins + getQueueData('RANKED_FLEX_SR').losses)) * 100)}% WR
                    </span>
                    <span className="text-slate-600">({getQueueData('RANKED_FLEX_SR').wins + getQueueData('RANKED_FLEX_SR').losses} games)</span>
                  </div>
                )}
              </div>
              {profile.preferred_queue?.split(',').some((q: string) => !['Solo/Duo', 'Flex'].includes(q)) && (
                <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
                  {profile.preferred_queue.split(',').filter((q: string) => !['Solo/Duo', 'Flex'].includes(q)).map((q: string) => (
                    <span key={q} className="text-[9px] bg-orange-500/10 px-3 py-1.5 rounded-full text-orange-400 border border-orange-500/20 font-black uppercase tracking-widest shadow-lg shadow-orange-500/5">
                      {q}
                    </span>
                  ))}
                </div>
              )}
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

                {topChamps.length > 0 && (
                  <div className="mt-10 border-t border-white/5 pt-8">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Champions Mastery</p>
                      <a 
                        href={`https://www.op.gg/summoners/${profile.region.toLowerCase()}/${encodeURIComponent(profile.game_name)}-${encodeURIComponent(profile.tag_line)}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-[#5383e8] hover:bg-[#4066b8] text-white rounded-lg text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-500/10"
                      >
                        <ExternalLink size={12} /> View on OP.GG
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {topChamps.map((champ) => (
                        <div key={champ.id} className="group relative flex flex-col items-center">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 group-hover:border-orange-500/50 transition-all shadow-lg">
                          <img src={champ.icon} alt={champ.name} title={`${champ.name} - ${champ.points.toLocaleString()} pts`} />
                          </div>
                        <div className="absolute -bottom-2 bg-zinc-950 text-orange-400 text-[7px] font-black px-1.5 py-0.5 rounded border border-white/10 shadow-sm">
                          {champ.points >= 1000 ? `${(champ.points / 1000).toFixed(0)}k` : champ.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-10 flex flex-wrap gap-4">
                  {!isMatched && (
                    <button 
                      onClick={handleMatch}
                      disabled={isRequesting || requestSent}
                      className={`btn-modern px-12 py-5 text-base transition-all ${requestSent ? 'opacity-50 border-emerald-500 text-emerald-400' : ''}`}
                    >
                      {isRequesting ? <Loader2 className="animate-spin" /> : 
                       requestSent ? <span className="flex items-center gap-2"><Check size={20} /> Request Sent</span> : 
                       "Send Team Request"}
                    </button>
                  )}
                </div>
              </div>

              {/* Review Section */}
              <div className="modern-panel p-8 bg-zinc-950/40">
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Player Reviews</h3>
                </div>

                {isMatched && (
                  <div className="mb-12 p-6 bg-orange-500/5 rounded-2xl border border-orange-500/10">
                    <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-6">Leave your feedback</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Communication & Attitude</span>
                        <StarRating 
                          rating={behaviorRating} 
                          interactive 
                          onChange={setBehaviorRating} 
                          size={18} 
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Mechanical Skill</span>
                        <StarRating 
                          rating={skillRating} 
                          interactive 
                          onChange={setSkillRating} 
                          size={18} 
                        />
                      </div>
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
                            <RatingItem label="Attitude" rating={rev.behavior_rating} />
                            <RatingItem label="Skill" rating={rev.skill_rating} />
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

// Обертаємо RatingItem в React.memo, щоб запобігти зайвим ре-рендерам,
// якщо його пропси (label, rating) не змінилися.
const RatingItem = memo(function RatingItem({ label, rating }: { label: string, rating: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold text-zinc-600 uppercase">{label}</span>
      <StarRating rating={rating} size={8} className="opacity-80" />
    </div>
  )
})