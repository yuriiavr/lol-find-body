'use client'

import { memo } from 'react'
import { useTranslations } from 'next-intl'
import { MessageSquare, Send, Loader2, MessageCircle } from 'lucide-react'

interface ProfileReviewsProps {
  id: string
  isMatched: boolean
  reviews: any[]
  reviewComment: string
  setReviewComment: (v: string) => void
  isSubmittingReview: boolean
  handleSubmitReview: () => void
}

export const ProfileReviews = memo(({
  isMatched,
  reviews,
  reviewComment,
  setReviewComment,
  isSubmittingReview,
  handleSubmitReview
}: ProfileReviewsProps) => {
  const t = useTranslations('ProfilePage.reviews')

  return (
    <div className="modern-panel p-8 bg-zinc-950/40">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">{t('title')}</h3>
      </div>

      {isMatched && (
        <div className="mb-12 p-6 bg-[rgb(var(--accent-color)/0.05)] rounded-2xl border border-[rgb(var(--accent-color)/0.1)]">
          <h4 className="text-sm font-bold text-[rgb(var(--accent-color))] uppercase tracking-widest mb-4">{t('leaveMessage')}</h4>
          <div className="relative">
            <textarea 
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder={t('commentPlaceholder')}
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 text-sm text-slate-200 outline-none focus:border-[rgb(var(--accent-color)/0.5)] h-24 resize-none mb-4"
            />
            <button 
              onClick={handleSubmitReview}
              disabled={isSubmittingReview || !reviewComment.trim()}
              className="btn-modern py-3 px-8 text-[10px] font-black uppercase tracking-widest ml-auto flex items-center gap-2"
            >
              {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} {t('submit')}
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
                <span className="text-[10px] text-zinc-600">{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-zinc-400">{rev.comment}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-20">
            <MessageCircle size={48} className="mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-tighter">{t('empty')}</p>
          </div>
        )}
      </div>
    </div>
  )
})