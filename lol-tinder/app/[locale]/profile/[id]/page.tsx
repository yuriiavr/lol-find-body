'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { sendMatchRequest, upsertReview, getReviewsForUser } from '@/app/[locale]/matches/actions'
import { 
  getRanksByPuuid, 
  getTopChampions, 
  getRiotTFTStats, 
  getRiotValorantStats 
} from '@/app/[locale]/profile/actions'
import { useToast } from '@/src/components/ToastProvider'
import { ProfileSidebar } from './components/ProfileSidebar'
import { ProfileIntel } from './components/ProfileIntel'
// import { ProfileReviews } from './components/ProfileReviews'
import { useTranslations } from 'next-intl'

const supabase = createClient()

export default function PublicProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const id = params.id as string
  const router = useRouter()
  const [activeGame, setActiveGame] = useState<'LOL' | 'TFT' | 'VALORANT' | null>(null);
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [requestSent, setRequestStatus] = useState(false)
  const [isMatched, setIsMatched] = useState(false)
  // const [reviews, setReviews] = useState<any[]>([])
  const [riotStats, setRiotStats] = useState<any>(null)
  const [tftStats, setTftStats] = useState<any>(null)
  const [valStats, setValStats] = useState<any>(null)
  const [topChamps, setTopChamps] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  // const [reviewComment, setReviewComment] = useState('')
  // const [behaviorRating, setBehaviorRating] = useState(5)
  // const [skillRating, setSkillRating] = useState(5)
  // const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const { showToast } = useToast()
  const t = useTranslations('ProfilePage.public')

  const enabledGamesList = useMemo((): ("LOL" | "TFT" | "VALORANT")[] => {
    if (!profile?.enabled_games) return [];
    return profile.enabled_games.split(',').map((g: string) => g.trim()) as ('LOL' | 'TFT' | 'VALORANT')[];
  }, [profile?.enabled_games]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        router.push('/login-required')
        return
      }

      setCurrentUser(authUser)

      const [profileRes, matchRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        supabase.from('matches')
          .select('status')
          .or(`and(user_id.eq.${authUser.id},target_id.eq.${id}),and(user_id.eq.${id},target_id.eq.${authUser.id})`)
          .maybeSingle()
      ])

      if (profileRes.data) {
        const prof = profileRes.data;
        const enabled = prof.enabled_games ? prof.enabled_games.split(',').map((g: string) => g.trim()) : [];
        
        const siteTheme = localStorage.getItem('site-game-theme') as any;
        const requestedGame = searchParams.get('game')?.toUpperCase() as any;

        let initialGame: 'LOL' | 'TFT' | 'VALORANT' = 'LOL';
        if (requestedGame && enabled.includes(requestedGame)) {
          initialGame = requestedGame;
        } else if (siteTheme && enabled.includes(siteTheme)) {
          initialGame = siteTheme;
        } else if (enabled.length > 0) {
          initialGame = enabled[0] as any;
        }

        setActiveGame(initialGame);
        setProfile(prof);
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
  }, [id, router])
  useEffect(() => {
    if (!profile || !currentUser || !activeGame) return
    const fetchGameSpecificData = async () => {
      setRiotStats(null)
      setTftStats(null)
      setValStats(null)
      setTopChamps([])

      /**
       * Тимчасово вимкнено запити до Riot API (RSO не активний)
       * 
       * if (activeGame === 'LOL' && profile.puuid) {
       *   const [ranks, champs] = await Promise.all([
       *     getRanksByPuuid(profile.puuid, profile.region),
       *     getTopChampions(profile.puuid, profile.region)
       *   ])
       *   setRiotStats(ranks)
       *   setTopChamps(champs)
       * } else if (activeGame === 'TFT' && (profile.tft_puuid || profile.puuid)) {
       *   const tftRegion = profile.tft_region || profile.region;
       *   const puuid = profile.tft_puuid || profile.puuid;
       *   const tft = await getRiotTFTStats(puuid, tftRegion)
       *   setTftStats(tft)
       * } else if (activeGame === 'VALORANT' && profile.val_puuid) {
       *   const valRegion = profile.val_region || profile.region;
       *   const val = await getRiotValorantStats(profile.val_puuid, valRegion)
       *   setValStats(val)
       * }
       */
      // await refreshReviews(id, activeGame, currentUser.id)
    }
    fetchGameSpecificData()
  }, [activeGame, profile, currentUser, id])

  // const refreshReviews = async (targetId: string, gameType: 'LOL' | 'TFT' | 'VALORANT', authUserId: string) => {
  //   const res = await getReviewsForUser(targetId, gameType)
  //   if (res.data) {
  //     setReviews(res.data)
  //     const myReview = res.data.find((r: any) => r.reviewer_id === authUserId)
  //     if (myReview && authUserId) {
  //       setReviewComment(myReview.comment || '')
  //       setBehaviorRating(myReview.behavior_rating)
  //       setSkillRating(myReview.skill_rating)
  //     } else {
  //       setReviewComment('')
  //       setBehaviorRating(5)
  //       setSkillRating(5)
  //     }
  //   }
  //   if (res.error) setReviews([])
  // }
  const handleMatch = async () => {
    setIsRequesting(true)
    const result = await sendMatchRequest(id)
    setIsRequesting(false)
    
    if (result.success) {
      setRequestStatus(true)
      showToast(t('toasts.requestSent'), 'success')
    } else {
      showToast(result.error || t('toasts.requestError'), 'error')
    }
  }
  // const handleSubmitReview = async () => {
  //   if (!activeGame) return
  //   setIsSubmittingReview(true)
  //   const result = await upsertReview(id, reviewComment, behaviorRating, skillRating, activeGame)
  //   setIsSubmittingReview(false)

  //   if (result.success) {
  //     showToast(t('toasts.reviewSaved'), 'success')
  //     await refreshReviews(id, activeGame, currentUser.id)
  //     localStorage.setItem('lastProfileGame', activeGame)
  //   } else {
  //     showToast(result.error || t('toasts.reviewError'), 'error')
  //   }
  // }
  // const avgBehavior = useMemo(() => reviews.length > 0 
  //   ? reviews.reduce((acc, r) => acc + r.behavior_rating, 0) / reviews.length 
  //   : 0, [reviews])
  // const avgSkill = useMemo(() => reviews.length > 0 
  //   ? reviews.reduce((acc, r) => acc + r.skill_rating, 0) / reviews.length 
  //   : 0, [reviews])
  // const totalAvg = useMemo(() => (avgBehavior + avgSkill) / 2, [avgBehavior, avgSkill])

  if (isLoading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="animate-spin text-[rgb(var(--accent-color))] w-12 h-12" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-2xl font-bold mb-4 bg-gradient-to-r from-[rgb(var(--accent-color))] to-zinc-700 bg-clip-text text-transparent uppercase tracking-tighter">{t('notFound')}</h1>
      <Link 
        href={activeGame === 'TFT' ? '/tft' : activeGame === 'VALORANT' ? '/valorant' : '/league'} 
        className="hover:underline flex items-center gap-2 font-bold text-[rgb(var(--accent-color))]"
      >
        <ArrowLeft size={18} /> {t('back')}
      </Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-8 lg:p-16">
        <div className="flex flex-col lg:flex-row gap-16">
          <ProfileSidebar 
            profile={profile}
            activeGame={activeGame}
            setActiveGame={setActiveGame}
            enabledGamesList={enabledGamesList}
            riotStats={riotStats}
            tftStats={tftStats}
            valStats={valStats}
            // avgBehavior={avgBehavior}
            // avgSkill={avgSkill}
            // totalReviews={reviews.length}
          />

          <section className="flex-1">
            <div className="space-y-8">
              <ProfileIntel 
                profile={profile}
                activeGame={activeGame}
                topChamps={topChamps}
                isMatched={isMatched}
                isRequesting={isRequesting}
                requestSent={requestSent}
                handleMatch={handleMatch}
              />
              {/* <ProfileReviews 
                id={id}
                isMatched={isMatched}
                reviews={reviews}
                reviewComment={reviewComment}
                setReviewComment={setReviewComment}
                behaviorRating={behaviorRating}
                setBehaviorRating={setBehaviorRating}
                skillRating={skillRating}
                setSkillRating={setSkillRating}
                isSubmittingReview={isSubmittingReview}
                handleSubmitReview={handleSubmitReview}
              /> */}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}