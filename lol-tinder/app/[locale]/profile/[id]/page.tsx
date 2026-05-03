'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/src/utils/supabase/client'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { sendMatchRequest, upsertReview, getReviewsForUser, getMyReviewForUser } from '@/app/[locale]/matches/actions'
import { 
  getRanksByPuuidAction, 
  getTopChampionsAction, 
  getRiotTFTStatsAction
} from '@/app/[locale]/profile/actions';
import { useToast } from '@/src/components/ToastProvider'
import { ProfileSidebar } from './components/ProfileSidebar'
import { ProfileIntel } from './components/ProfileIntel'
import { ProfileReviews } from './components/ProfileReviews'
import { useTranslations } from 'next-intl'

const supabase = createClient()
import { getExtra, getRegion, type GameKey } from '@/src/lib/profile';

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
  const [reviews, setReviews] = useState<any[]>([])
  const [riotStats, setRiotStats] = useState<any>(null)
  const [tftStats, setTftStats] = useState<any>(null)
  const [valStats, setValStats] = useState<any>(null)
  const [topChamps, setTopChamps] = useState<any[]>([])
  const [isLoadingChamps, setIsLoadingChamps] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [myReviewStatus, setMyReviewStatus] = useState<'approved' | 'pending' | 'rejected' | null>(null)

  const { showToast } = useToast()
  const t = useTranslations('ProfilePage.public')

  const enabledGamesList = useMemo((): ("LOL" | "TFT" | "VALORANT")[] => {
    if (!profile?.enabled_games) return [];
    return profile.enabled_games.split(',').map((g: string) => g.trim()) as ('LOL' | 'TFT' | 'VALORANT')[];
  }, [profile?.enabled_games]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)

      const [profileRes, matchRes, authProfRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).single(),
        authUser 
          ? supabase.from('matches')
              .select('status')
              .or(`and(user_id.eq.${authUser.id},target_id.eq.${id}),and(user_id.eq.${id},target_id.eq.${authUser.id})`)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        authUser
          ? supabase.from('profiles').select('display_name').eq('id', authUser.id).maybeSingle()
          : Promise.resolve({ data: null, error: null })
      ])

      if (profileRes.data) {
        const prof = profileRes.data;
        const enabled = prof.enabled_games ? prof.enabled_games.split(',').map((g: string) => g.trim()) : [];
        
        // FIX: ?game= param from search (e.g. from discovery cards) ALWAYS wins.
        // siteTheme is only a fallback when no explicit game is requested.
        const requestedGame = searchParams.get('game')?.toUpperCase() as any;
        const siteTheme = localStorage.getItem('site-game-theme') as any;

        let initialGame: 'LOL' | 'TFT' | 'VALORANT' = 'LOL';
        if (requestedGame && enabled.includes(requestedGame)) {
          // Explicit ?game= param — highest priority
          initialGame = requestedGame;
        } else if (siteTheme && enabled.includes(siteTheme)) {
          // User's preferred game theme — second priority
          initialGame = siteTheme;
        } else if (enabled.length > 0) {
          // First enabled game — fallback
          initialGame = enabled[0] as any;
        }

        setActiveGame(initialGame);
        setProfile(prof);
      }

      if (authProfRes?.data) {
        setCurrentUserProfile(authProfRes.data)
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
    if (!profile || !activeGame) return
    const fetchGameSpecificData = async () => {
      setRiotStats(null)
      setTftStats(null)
      setValStats(null)
      setTopChamps([])
      setIsLoadingChamps(activeGame === 'LOL')
      
      const puuid = getExtra(profile, activeGame.toLowerCase() as GameKey, 'puuid');
      const region = getRegion(profile, activeGame.toLowerCase() as GameKey);

      if (activeGame === 'LOL' && puuid) {
        const [ranks, champs] = await Promise.all([
          getRanksByPuuidAction(puuid, region),
          getTopChampionsAction(puuid, region)
        ])
        setRiotStats(ranks)
        setTopChamps(champs)
        setIsLoadingChamps(false)
      } else if (activeGame === 'TFT' && puuid) {
        const tft = await getRiotTFTStatsAction(puuid, region)
        setTftStats(tft)
        setIsLoadingChamps(false)
      } else {
        setIsLoadingChamps(false)
      }

      if (currentUser) await refreshReviews(id, currentUser.id)
    }
    fetchGameSpecificData()
  }, [activeGame, profile, id])

  const refreshReviews = async (targetId: string, authUserId: string) => {
    const res = await getReviewsForUser(targetId, 'LOL')
    if (res.data) {
      setReviews(res.data)
    }
    if (res.error) setReviews([])

    const myRes = await getMyReviewForUser(targetId, 'LOL')
    if (myRes.data) {
      setReviewComment(myRes.data.comment || '')
      setMyReviewStatus(myRes.data.moderation_status as any)
    } else {
      setReviewComment('')
      setMyReviewStatus(null)
    }
  }

  const handleLogin = async () => {
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/api/auth/callback?next=${window.location.pathname}`
      : undefined;

    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
  };

  const handleMatch = async () => {
    if (!currentUser) {
      showToast(t('toasts.loginRequired'), 'error', {
        label: t('toasts.loginButton'),
        onClick: handleLogin
      })
      return
    }

    if (!currentUserProfile?.display_name) {
      showToast(t('toasts.setupRequired'), 'error', {
        label: t('toasts.setupButton'),
        onClick: () => router.push(`/${params.locale}/profile`)
      })
      return
    }

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

  const handleSubmitReview = async () => {
    setIsSubmittingReview(true)
    const result = await upsertReview(id, reviewComment, 5, 5, 'LOL')
    setIsSubmittingReview(false)

    if (result.moderation === 'rejected') {
      setMyReviewStatus('rejected')
      showToast(t('toasts.reviewRejected'), 'error')
      return
    }

    if (result.success) {
      setMyReviewStatus(result.moderation as any)
      if (result.moderation === 'pending') {
        showToast(t('toasts.reviewPending'), 'info')
      } else {
        showToast(t('toasts.reviewSaved'), 'success')
      }
      if (currentUser) await refreshReviews(id, currentUser.id)
    } else {
      showToast(result.error || t('toasts.reviewError'), 'error')
    }
  }

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
          />

          <section className="flex-1">
            <div className="space-y-8">
              <ProfileIntel 
                profile={profile}
                activeGame={activeGame}
                topChamps={topChamps}
                isLoadingChamps={isLoadingChamps}
                isMatched={isMatched}
                isRequesting={isRequesting}
                requestSent={requestSent}
                handleMatch={handleMatch}
              />
              <ProfileReviews 
                id={id}
                isMatched={isMatched}
                reviews={reviews}
                reviewComment={reviewComment}
                setReviewComment={setReviewComment}
                isSubmittingReview={isSubmittingReview}
                handleSubmitReview={handleSubmitReview}
                myReviewStatus={myReviewStatus}
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}